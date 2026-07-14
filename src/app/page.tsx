'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { BOX_DESCRIPTIONS } from '@/lib/config/boxDescriptions';

/* ── Types ─────────────────────────────────────────────────── */
interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  classification?: string;
  extractedData?: any;
  error?: string;
}

interface TaxMapEntry {
  value: number;
  description: string;
  breakdown?: { label: string; value: number }[];
}

type TaxMap = Record<string, TaxMapEntry>;
type FormType = 'IL' | 'US';
type Step = 1 | 2 | 3;

/* ── Helpers ───────────────────────────────────────────────── */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IL').format(Math.round(n));
}

function getBadgeClass(cls?: string): string {
  if (!cls) return 'badge-processing';
  if (cls === 'FORM_106') return 'badge-106';
  if (cls === 'FORM_867') return 'badge-867';
  if (cls === 'FORM_856') return 'badge-856';
  if (cls === 'error') return 'badge-error';
  return 'badge-other';
}

function getBadgeLabel(cls?: string): string {
  if (!cls) return 'Processing…';
  const labels: Record<string, string> = {
    FORM_106: 'Form 106',
    FORM_867: 'Form 867',
    FORM_856: 'Form 856',
    DONATION_RECEIPT: 'Donation',
    CONSULTANT_INVOICE: 'Invoice',
    LIFE_INSURANCE: 'Insurance',
    US_FORM_1099: '1099',
    UNKNOWN: 'Unknown',
    error: 'Error',
  };
  return labels[cls] ?? cls;
}

const CATEGORY_META: Record<string, { label: string; dotClass: string }> = {
  salary: { label: 'Salary & Employment', dotClass: 'dot-salary' },
  capital: { label: 'Capital Gains & Losses', dotClass: 'dot-capital' },
  passive: { label: 'Passive Income (Interest & Dividends)', dotClass: 'dot-passive' },
  deductions: { label: 'Deductions & Donations', dotClass: 'dot-deductions' },
  income: { label: 'Business & Rental Income', dotClass: 'dot-salary' },
  tax_withheld: { label: 'Taxes Withheld', dotClass: 'dot-capital' },
};

/* ── Icons ─────────────────────────────────────────────────── */
const UploadIcon = () => (
  <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 16.5V9.75m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.74 9-.346 9m-4.788 0-.346-9m9.938 2.143L19.5 4.5l-1.5-1.5H6L4.5 4.5l-.252 2.143M3 6h18" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

/* ── Main Component ─────────────────────────────────────────── */
export default function TaxAssistantPage() {
  const [step, setStep] = useState<Step>(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [taxMap, setTaxMap] = useState<TaxMap>({});
  const [formType, setFormType] = useState<FormType>('IL');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personalDetails, setPersonalDetails] = useState({ gender: 'M', maritalStatus: 'SINGLE', childrenCount: 0 });
  const [aggregationLog, setAggregationLog] = useState<any[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [showAiReasoning, setShowAiReasoning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function computeCreditPoints(details: typeof personalDetails) {
    let points = 2.25;
    if (details.gender === 'F') points += 0.5;
    if (details.maritalStatus === 'MARRIED') points += 0.5;
    points += details.childrenCount * 1.5;
    const creditValue = Math.round(points * 2904); // Official ITA 2025: ₪242/month × 12
    return { points, creditValue };
  }

  useEffect(() => {
    const { points, creditValue } = computeCreditPoints(personalDetails);
    setTaxMap(prev => ({
      ...prev,
      '067': {
        value: creditValue,
        description: `Personal Credit Points (${points} pts)`,
      }
    }));
  }, [personalDetails]);

  /* ── File Handling ─────────────────────────────────────────── */
  const addFiles = useCallback((newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      status: 'pending',
    }));
    setFiles(prev => [...prev, ...uploadedFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'application/pdf' || f.type.startsWith('image/')
    );
    if (droppedFiles.length) addFiles(droppedFiles);
  }, [addFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  }, [addFiles]);

  /* ── Process Documents ─────────────────────────────────────── */
  const processDocuments = useCallback(async () => {
    if (!files.length) return;
    setIsProcessing(true);
    setError(null);

    const filesToProcess = files.filter(f => f.status !== 'done');

    // Mark only pending files as processing
    setFiles(prev => prev.map(f => f.status !== 'done' ? { ...f, status: 'processing' } : f));

    try {
      let newResults: any[] = [];

      if (filesToProcess.length > 0) {
        const formData = new FormData();
        filesToProcess.forEach(f => formData.append('files', f.file));

        const extractRes = await fetch('/api/extract', { method: 'POST', body: formData });
        if (!extractRes.ok) {
          const err = await extractRes.json();
          throw new Error(err.error || 'Extraction failed');
        }
        const { results } = await extractRes.json();
        newResults = results;
      }

      let newResultIndex = 0;

      // Update files with results
      setFiles(prev => prev.map(f => {
        if (f.status === 'done') return f;
        const result = newResults[newResultIndex++];
        if (!result) return { ...f, status: 'error' as const, error: 'No result' };
        return {
          ...f,
          status: 'done' as const,
          classification: result.classification?.documentType,
          extractedData: result.data,
        };
      }));

      // Gather all results for aggregation
      // Since we just dispatched setFiles, we must use the current `files` array combined with `newResults`
      // to get the total extractedForms
      let resultCursor = 0;
      const allExtractedForms = files.map(f => {
        if (f.status === 'done') {
          return {
            file: f.file.name,
            classification: { documentType: f.classification },
            data: f.extractedData
          };
        }
        return newResults[resultCursor++];
      }).filter(Boolean);

      // Now aggregate
      const aggRes = await fetch('/api/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedForms: allExtractedForms, formType }),
      });
      if (!aggRes.ok) {
        const err = await aggRes.json();
        throw new Error(err.error || 'Aggregation failed');
      }
      const { taxMap: map, aggregationLog: log } = await aggRes.json();
      // Re-inject personal credit points so aggregation doesn't overwrite them
      const { points, creditValue } = computeCreditPoints(personalDetails);
      map['067'] = { value: creditValue, description: `Personal Credit Points (${points} pts)` };
      setTaxMap(map);
      setAggregationLog(log || []);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Processing failed. Please try again.');
      setFiles(prev => prev.map(f => f.status === 'processing' ? { ...f, status: 'error' as const, error: 'Processing failed' } : f));
    } finally {
      setIsProcessing(false);
    }
  }, [files, formType]);

  /* ── Edit Tax Map Value ────────────────────────────────────── */
  const updateValue = useCallback((box: string, value: string) => {
    const num = parseFloat(value.replace(/,/g, '')) || 0;
    setTaxMap(prev => ({
      ...prev,
      [box]: { ...prev[box]!, value: num },
    }));
  }, []);

  /* ── Generate PDF ──────────────────────────────────────────── */
  const generatePdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxMap, formType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'PDF generation failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tax_Summary_2025_${formType}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'PDF generation failed');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [taxMap, formType]);

  /* ── Aggregate by category for table display ────────────────── */
  const groupedEntries = Object.entries(taxMap).reduce<Record<string, [string, TaxMapEntry][]>>(
    (acc, [box, entry]) => {
      const desc = BOX_DESCRIPTIONS[box];
      const cat = desc?.category ?? 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push([box, entry]);
      return acc;
    },
    {}
  );

  const categories = ['salary', 'income', 'capital', 'passive', 'deductions', 'tax_withheld', 'other'];

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <main className="page-wrapper">

      {/* Header */}
      <header className="header">
        <div className="header-badge">
          <span>✦</span>
          <span>AI-Powered · 2025 Tax Year</span>
        </div>
        <h1>Tax Assistant</h1>
        <p>Upload your Israeli & US tax documents. Our AI extracts every box number and value, aggregates them, and fills in your forms automatically.</p>
      </header>

      {/* Step Indicator */}
      <nav className="steps">
        <div className={`step ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
          <div className="step-bubble">{step > 1 ? <CheckIcon /> : '1'}</div>
          <span className="step-label">Upload</span>
        </div>
        <div className={`step-connector ${step > 1 ? 'done' : ''}`} />
        <div className={`step ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}`}>
          <div className="step-bubble">{step > 2 ? <CheckIcon /> : '2'}</div>
          <span className="step-label">Review</span>
        </div>
        <div className={`step-connector ${step > 2 ? 'done' : ''}`} />
        <div className={`step ${step === 3 ? 'active' : ''}`}>
          <div className="step-bubble">3</div>
          <span className="step-label">Download</span>
        </div>
      </nav>

      {/* Global Error */}
      {error && (
        <div className="alert alert-error w-full mb-16" style={{ maxWidth: 780 }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: Upload ──────────────────────────────────────── */}
      {step === 1 && (
        <div className="glass-card" style={{ maxWidth: 780 }}>
          {/* Drop Zone */}
          <div
            className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon />
            <h3>Drop your tax documents here</h3>
            <p>Supports PDF, JPG, PNG · Form 106, 867, 856, Donation Receipts, Invoices</p>
            <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="file-list">
              {files.map(f => (
                <div key={f.id} className="file-card">
                  <div className="file-icon">PDF</div>
                  <div className="file-info">
                    <div className="file-name">{f.file.name}</div>
                    <div className="file-size">{formatBytes(f.file.size)}</div>
                  </div>
                  <span className={`file-badge ${getBadgeClass(f.status === 'error' ? 'error' : f.classification)}`}>
                    {f.status === 'processing' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                        Processing
                      </span>
                    ) : getBadgeLabel(f.status === 'error' ? 'error' : f.classification)}
                  </span>
                  {f.status === 'pending' && (
                    <button className="file-remove" onClick={() => removeFile(f.id)} title="Remove">
                      <TrashIcon />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Processing overlay */}
          {isProcessing && (
            <div className="processing-overlay">
              <div className="spinner spinner-lg" />
              <p>Sending documents to AI for extraction…<br />This may take a few moments per document.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-24 gap-12" style={{ flexWrap: 'wrap' }}>
            <p className="text-muted">{files.length} document{files.length !== 1 ? 's' : ''} selected</p>
            <button
              className="btn btn-primary btn-lg"
              disabled={files.length === 0 || isProcessing}
              onClick={processDocuments}
            >
              {isProcessing ? (
                <><span className="spinner" /> Extracting…</>
              ) : (
                '✦ Process Documents'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Review Tax Map ──────────────────────────────── */}
      {step === 2 && (
        <div className="glass-card" style={{ maxWidth: 900 }}>
          <div className="flex items-center justify-between mb-32" style={{ flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>Tax Map Review</h2>
              <p className="text-muted">AI extracted {Object.keys(taxMap).length} box values. Edit any value before generating.</p>
            </div>
            <div className="form-toggle">
              <button className={`toggle-btn ${formType === 'IL' ? 'active' : ''}`} onClick={() => setFormType('IL')}>
                🇮🇱 Israeli 1301
              </button>
              <button className={`toggle-btn ${formType === 'US' ? 'active' : ''}`} onClick={() => setFormType('US')}>
                🇺🇸 US 1040
              </button>
            </div>
          </div>


          {/* Personal Details Panel */}
          <div className="tax-map-section" style={{ borderColor: 'rgba(0, 209, 255, 0.2)' }}>
            <div className="section-header">
              <span className="section-dot dot-salary" style={{ backgroundColor: '#00D1FF' }} />
              <h3>Personal Details (Credit Points)</h3>
            </div>
            <div className="flex gap-12" style={{ flexWrap: 'wrap', marginTop: 12, marginBottom: 24 }}>
              <div className="flex flex-col" style={{ gap: 4 }}>
                <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Gender</label>
                <select className="value-input" value={personalDetails.gender} onChange={e => setPersonalDetails(p => ({ ...p, gender: e.target.value }))} style={{ width: 120 }}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div className="flex flex-col" style={{ gap: 4 }}>
                <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Marital Status</label>
                <select className="value-input" value={personalDetails.maritalStatus} onChange={e => setPersonalDetails(p => ({ ...p, maritalStatus: e.target.value }))} style={{ width: 140 }}>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                </select>
              </div>
              <div className="flex flex-col" style={{ gap: 4 }}>
                <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Number of Children</label>
                <input className="value-input" type="number" min="0" value={personalDetails.childrenCount} onChange={e => setPersonalDetails(p => ({ ...p, childrenCount: parseInt(e.target.value) || 0 }))} style={{ width: 120 }} />
              </div>
            </div>
          </div>

          {/* Grouped tables */}
          {categories.map(cat => {
            const entries = groupedEntries[cat];
            if (!entries?.length) return null;
            const meta = CATEGORY_META[cat] ?? { label: cat, dotClass: 'dot-salary' };
            return (
              <div key={cat} className="tax-map-section">
                <div className="section-header">
                  <span className={`section-dot ${meta.dotClass}`} />
                  <h3>{meta.label}</h3>
                </div>
                <table className="tax-table">
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Box #</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right', width: 160 }}>Value (₪)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(([box, entry]) => {
                      const desc = BOX_DESCRIPTIONS[box];
                      return (
                        <tr key={box}>
                          <td><span className="box-number">{box}</span></td>
                          <td>
                            <div className="box-desc-he">{desc?.he ?? entry.description.split('(')[0]}</div>
                            <div className="box-desc-en">{desc?.en ?? entry.description}</div>
                            {entry.breakdown && entry.breakdown.length > 1 && (
                              <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '0.85rem', color: '#666', listStyleType: 'circle' }}>
                                {entry.breakdown.map((b, idx) => (
                                  <li key={idx}>
                                    {b.label}: ₪{formatNumber(b.value)}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input
                              className="value-input"
                              type="text"
                              value={formatNumber(entry.value)}
                              onChange={e => updateValue(box, e.target.value)}
                              onFocus={e => e.target.select()}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex items-center justify-between mt-24 gap-12" style={{ flexWrap: 'wrap' }}>
            <div>
              <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ marginRight: 12 }}>
                ← Back to Upload
              </button>
              <button className="btn btn-secondary" onClick={() => setIsLogModalOpen(true)}>
                View Calculation Log
              </button>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={generatePdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <><span className="spinner" /> Generating PDF…</>
              ) : (
                <><DownloadIcon /> Generate & Download</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ────────────────────────────────────────── */}
      {step === 3 && (
        <div className="glass-card" style={{ maxWidth: 600, textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>
            Your Tax Summary is Ready!
          </h2>
          <p className="text-muted mb-32">
            Your {formType === 'IL' ? 'Israeli 1301' : 'US 1040'} tax summary PDF has been downloaded.<br />
            Review all values carefully before filing.
          </p>

          <div className="download-card">
            <div className="download-info">
              <h4>Tax_Summary_2025_{formType}.pdf</h4>
              <p>Contains all {Object.keys(taxMap).length} extracted box values</p>
            </div>
            <button className="btn btn-outline" onClick={generatePdf} disabled={isGeneratingPdf}>
              <DownloadIcon />
              Re-download
            </button>
          </div>

          <div className="flex gap-12 mt-24" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => {
              setStep(1);
              setFiles([]);
              setTaxMap({});
              setError(null);
            }}>
              Start New Session
            </button>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              ← Back to Tax Map
            </button>
          </div>

          <p className="text-muted text-small mt-24" style={{ fontStyle: 'italic' }}>
            ⚠ For informational purposes only. Please verify with a certified accountant before filing.
          </p>
        </div>
      )}

      {/* ── Log Modal ──────────────────────────────────────────── */}
      {isLogModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div className="glass-card" style={{ maxWidth: 800, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Calculation Audit Log</h2>
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={showAiReasoning} onChange={e => setShowAiReasoning(e.target.checked)} />
                    Show AI Reasoning Log
                  </label>
                </div>
              </div>
              <button onClick={() => setIsLogModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', alignSelf: 'flex-start' }}>&times;</button>
            </div>

            {aggregationLog.length === 0 ? (
              <p className="text-muted">No calculations recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {aggregationLog.map((log, i) => (
                  <div key={i} style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <strong>📄 {log.file}</strong>
                      <span className={getBadgeClass(log.documentType)} style={{ padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>{getBadgeLabel(log.documentType)}</span>
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {log.contributions.map((c: any, j: number) => (
                        <li key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                          <div>
                            <span style={{ color: '#00D1FF' }}>→ {c.target}</span>
                            <span className="text-muted" style={{ marginLeft: 8 }}>({c.ruleApplied})</span>
                          </div>
                          <strong style={{ whiteSpace: 'nowrap' }}>₪ {formatNumber(c.amount)}</strong>
                        </li>
                      ))}
                    </ul>
                    {showAiReasoning && log.calculationLog && log.calculationLog.length > 0 && (
                      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Reasoning</h4>
                        <ul style={{ listStyle: 'disc', paddingLeft: 20, margin: 0, fontSize: '0.85rem', color: '#ccc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {log.calculationLog.map((reason: string, k: number) => (
                            <li key={k}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
