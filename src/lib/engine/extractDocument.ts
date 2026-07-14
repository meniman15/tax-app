import { GoogleGenAI, Type } from '@google/genai';
import type { Schema } from '@google/genai';
import { BOXES_LLM_KNOWLEDGE } from '../config/boxesConfig';
import {
  DocumentClassificationSchema,
  Form106Schema,
  Form867Schema,
  DonationReceiptSchema,
  ConsultantInvoiceSchema,
  LifeInsuranceSchema,
  PensionDepositSchema,
  AnnualSummarySchema,
  type DocumentClassification,
  type Form106,
  type Form867,
  type DonationReceipt,
  type ConsultantInvoice,
  type LifeInsurance,
} from '../schemas/taxSchemas';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ExtractionResult {
  file: string;
  classification: DocumentClassification;
  data:
    | Form106
    | Form867
    | DonationReceipt
    | ConsultantInvoice
    | null;
}

// ── Client ──────────────────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = 'gemini-3.1-flash-lite';

// ── Structured-output schema definitions (Gemini Schema format) ─────────────

const ClassificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    documentType: { type: Type.STRING },
    confidenceScore: { type: Type.NUMBER },
    summary: { type: Type.STRING },
  },
  required: ['documentType', 'confidenceScore', 'summary'],
};

const Form106ResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ownershipType: { type: Type.STRING, description: "SHARED, MAIN, or SECONDARY based on the account owner" },
    employerName: { type: Type.STRING },
    year: { type: Type.NUMBER },
    grossIncome: { type: Type.NUMBER },
    taxWithheld: { type: Type.NUMBER },
    bituachLeumi: { type: Type.NUMBER },
    healthTax: { type: Type.NUMBER },
    monthsWorked: { type: Type.NUMBER },
    kerenHishtalmutSalary: { type: Type.NUMBER },
    pensionAllowance: { type: Type.NUMBER },
    pensionInsuredSalary: { type: Type.NUMBER },
    pensionEmployeeDeduction: { type: Type.NUMBER },
    recreationPayDeduction: { type: Type.NUMBER },
    calculationLog: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Provide a sentence-by-sentence calculation log explaining your math step-by-step. E.g. 'Added 12505 from page 1 for gross income'." },
  },
  required: [
    'ownershipType', 'employerName', 'year', 'grossIncome', 'taxWithheld',
    'bituachLeumi', 'healthTax', 'monthsWorked', 'calculationLog'
  ],
};

const Form867ResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ownershipType: { type: Type.STRING, description: "SHARED, MAIN, or SECONDARY based on the account owner" },
    bankName: { type: Type.STRING },
    year: { type: Type.NUMBER },
    salesTurnover: { type: Type.NUMBER },
    capitalGains20: { type: Type.NUMBER },
    capitalGains25: { type: Type.NUMBER },
    taxWithheld: { type: Type.NUMBER, description: 'Sum of tax on capital gains, dividends, and real estate. DO NOT rely on the 040 box if the sum is different.' },
    totalLosses: { type: Type.NUMBER },
    interest15: { type: Type.NUMBER },
    interest20: { type: Type.NUMBER },
    interest25: { type: Type.NUMBER },
    interestTaxWithheld: { type: Type.NUMBER },
    dividend15: { type: Type.NUMBER },
    dividend20: { type: Type.NUMBER },
    foreignIncome: { type: Type.NUMBER },
    foreignTaxWithheld: { type: Type.NUMBER },
    pficFlag: { type: Type.BOOLEAN },
    calculationLog: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Provide a sentence-by-sentence calculation log explaining your math step-by-step, prefixed with the account owner. E.g. 'Account Owner: SHARED - Box 166 added 12505 from page 1 for 20% capital gains tax. Added 1902 for oil taxes, so far total Box 166 - 13507'." },
  },
  required: ['ownershipType', 'bankName', 'year', 'taxWithheld', 'calculationLog'],
};

const DonationReceiptResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    charityName: { type: Type.STRING },
    receiptNumber: { type: Type.STRING },
    date: { type: Type.STRING },
    amount: { type: Type.NUMBER },
    isSection46Approved: { type: Type.BOOLEAN },
    calculationLog: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['charityName', 'receiptNumber', 'date', 'amount', 'isSection46Approved'],
};

const ConsultantInvoiceResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    providerName: { type: Type.STRING },
    amount: { type: Type.NUMBER },
    date: { type: Type.STRING },
    description: { type: Type.STRING },
    calculationLog: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['providerName', 'amount', 'date', 'description'],
};

const LifeInsuranceResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ownershipType: { type: Type.STRING, description: "MAIN or SECONDARY based on the account owner" },
    insuranceCompany: { type: Type.STRING },
    year: { type: Type.NUMBER },
    lifeInsurancePremium: { type: Type.NUMBER, description: "פרמיה לביטוח חיים (usually codes 036/081)" },
    lossOfWorkingCapacityPremium: { type: Type.NUMBER, description: "פרמיה לביטוח אבדן כושר עבודה (usually codes 112/113/206/207)" },
    calculationLog: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['ownershipType', 'insuranceCompany', 'year', 'lifeInsurancePremium', 'lossOfWorkingCapacityPremium', 'calculationLog'],
};


const PensionDepositResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ownershipType: { type: Type.STRING },
    providerName: { type: Type.STRING },
    year: { type: Type.NUMBER },
    amount: { type: Type.NUMBER },
    calculationLog: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['ownershipType', 'providerName', 'year', 'amount', 'calculationLog'],
};

const AnnualSummaryResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ownershipType: { type: Type.STRING },
    providerName: { type: Type.STRING },
    year: { type: Type.NUMBER },
    rentalIncomeIsrael: { type: Type.NUMBER },
    rentalIncomeAbroad: { type: Type.NUMBER },
    businessIncome: { type: Type.NUMBER },
    calculationLog: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['ownershipType', 'providerName', 'year', 'rentalIncomeIsrael', 'rentalIncomeAbroad', 'businessIncome', 'calculationLog'],
};

const PensionDepositResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ownershipType: { type: Type.STRING, description: "SHARED, MAIN, or SECONDARY" },
    providerName: { type: Type.STRING },
    year: { type: Type.NUMBER },
    amount: { type: Type.NUMBER },
    calculationLog: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['ownershipType', 'providerName', 'year', 'amount', 'calculationLog'],
};

const AnnualSummaryResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ownershipType: { type: Type.STRING, description: "SHARED, MAIN, or SECONDARY" },
    year: { type: Type.NUMBER },
    businessIncome: { type: Type.NUMBER },
    calculationLog: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['ownershipType', 'year', 'businessIncome', 'calculationLog'],
};

// ── Prompts ─────────────────────────────────────────────────────────────────


const CLASSIFICATION_PROMPT = `You are an Israeli tax document classifier. Classify this document into EXACTLY one enum: ['FORM_106', 'FORM_867', 'FORM_856', 'DONATION_RECEIPT', 'CONSULTANT_INVOICE', 'LIFE_INSURANCE', 'PENSION_DEPOSIT', 'ANNUAL_CPA_SUMMARY', 'US_FORM_1099', 'UNKNOWN']

Rules:
- FORM_106: Annual employer tax certificate (תיאום מס / טופס 106). Contains salary, tax withheld, employer name.
- FORM_867: Annual bank/broker securities report. Contains capital gains, losses, interest, dividends.
- FORM_856: ESOP/stock option exercise report. Contains option grants and exercises.
- LIFE_INSURANCE: Life insurance annual statement.
- DONATION_RECEIPT: Receipt from an approved charity (Section 46).
- CONSULTANT_INVOICE: Invoice for professional services (accountant, tax preparer).
- TEUDAT_ZEHUT: Israeli ID card.
- US_FORM_1099: US 1099-INT, 1099-DIV, 1099-B, etc.
- UNKNOWN: Cannot be classified.

Return the documentType, a confidenceScore (0-100), and a one-line summary.`;

const FORM_106_PROMPT = `You are an expert Israeli tax accountant extracting data from a Form 106 (טופס 106).
${BOXES_LLM_KNOWLEDGE}

Extract the financial data from this Form 106 (Israeli Annual Salary / Employment tax form).

CRITICAL RULES:
0. ownershipType: Determine if the document belongs to the MAIN taxpayer or SECONDARY (spouse). For 106 this is almost always MAIN or SECONDARY, rarely SHARED.
1. grossIncome (box 158/172) MUST include payment differences (הפרשים). If there is a separate line for הפרשים, ADD it to the base salary.
2. taxWithheld is box 042 — income tax only. Do NOT include bituach leumi or health tax here.
3. bituachLeumi and healthTax are separate deductions — report each independently.
4. monthsWorked: count the months of employment shown on the form.
5. kerenHishtalmutSalary (box 218/219): the salary base for keren hishtalmut contributions. 0 if absent.
6. pensionAllowance (box 248/249): employer pension allowance amount. 0 if absent.
7. pensionInsuredSalary (box 244/245): the insured salary for pension. 0 if absent.
8. pensionEmployeeDeduction (box 045/086): employee's own pension deduction. 0 if absent.
9. recreationPayDeduction (box 011/012): recreation pay (דמי הבראה) deduction. 0 if absent.

CRUCIAL: You MUST provide a 'calculationLog' explaining your math step-by-step. Start the first sentence with the account owner (e.g. "Account Owner: MAIN."). For each value you calculate, explain exactly which page and box/line you took it from.

All monetary values in ILS. Return 0 for any field not found.`;

const FORM_867_PROMPT = `You are an expert Israeli tax accountant extracting data from a Form 867 (טופס 867).
${BOXES_LLM_KNOWLEDGE}

Extract the financial data from this Form 867 (Israeli Capital Gains / Passive Income tax form).

CRITICAL RULES: 
0. ownershipType: Determine if the account is SHARED (joint), MAIN taxpayer, or SECONDARY (spouse). If you see only ONE person's name (e.g. "מנחם גרוסמן"), you MUST classify it as MAIN. The broker's name (e.g. "מיטב דש", "בנק פועלים") does NOT count as a person. ONLY classify as SHARED if you explicitly see TWO people's names.
1. Capital Gains: Do NOT sum values from different percentages. Extract gains separately into capitalGains20 and capitalGains25. Dividends at 25% MUST be combined directly into capitalGains25.
2. Capital Losses: Do NOT sum values from different percentages. Report as a single totalLosses value (e.g. from Box 166).
3. salesTurnover (box 256): total sales proceeds / turnover from securities transactions.
4. taxWithheld: You MUST calculate the true TOTAL tax withheld by SUMMING the tax withheld on Capital Gains + Dividends + Real Estate (REITs). 
- Scan EVERY page (Page 1, 2, 3, 4, etc.) to find the taxes withheld.
- A relevant box for tax calculation will be either part of a table with a row description OR a box with a tax code inside of it next to the value.
- Do NOT blindly copy the number written next to "040" on the first page if the sum is different.
- DO NOT confuse "מספר עסקאות" (Number of Transactions) with tax. For example, if you see 37 as the number of transactions, DO NOT add it to the tax!
5. Interest Income: Extract interest income strictly by percentage into interest15, interest20, interest25. DO NOT mix them.
6. interestTaxWithheld: tax withheld specifically on interest (box 043). Extract the FINAL NET tax after any offsets (e.g., קיזוז / ניכוי בגין הפסדי הון).
7. Dividend Income: Extract dividend income strictly by percentage into dividend15, dividend20. Any 25% dividends must be added directly into capitalGains25. If the percentage is not explicitly written, you MUST calculate it by dividing the tax withheld by the gross dividend amount (e.g. 147 tax / 735 gross = 20%). DO NOT guess.
8. pficFlag: set true if you detect any Passive Foreign Investment Company (PFIC / חברה נשלטת) mention.

IMPORTANT: Interest, dividends, and capital gains are SEPARATE fields. Do NOT mix them.
CRUCIAL: You MUST provide a 'calculationLog' explaining your math step-by-step. The very first sentence MUST state the owner (e.g. "Account Owner: SHARED"). For each value you calculate, write a detailed sentence like: "Box X - added Y from page Z for 20% capital gains tax". For taxWithheld, you MUST list the exact breakdown of the numbers you summed (e.g. "Tax Withheld: 467 (dividend from page 3) + 71 (real estate from page 4) = 538"). If you calculate a dividend percentage, you MUST write the math (e.g. "147 / 735 = 20%").

All monetary values in ILS. Return 0 for any field not found.`;

const DONATION_PROMPT = `You are extracting data from an Israeli donation receipt (קבלה לתרומה).
Determine if this is a Section 46 approved charity (סעיף 46).
All monetary values in ILS.`;

const CONSULTANT_PROMPT = `You are extracting data from a consultant/accountant invoice (חשבונית).
Extract the provider name, total amount (including VAT), date, and a brief description of the service.
All monetary values in ILS.`;

const LIFE_INSURANCE_PROMPT = `Extract the financial data from this Life Insurance / Loss of Working Capacity tax certificate (אישור מס על תשלום פרמיה).
1. ownershipType: If the name is one person (e.g. "מנחם גרוסמן"), classify as MAIN.
2. insuranceCompany: The name of the insurance company (e.g., "הפניקס").
3. lifeInsurancePremium: The amount for פרמיה לביטוח חיים (codes 036/081).
4. lossOfWorkingCapacityPremium: The amount for פרמיה לביטוח אבדן כושר עבודה (codes 112/113/206/207).
5. Provide a calculationLog explaining where you found each number.`;

// ── Schema & prompt mapping ─────────────────────────────────────────────────

const PENSION_DEPOSIT_PROMPT = `Extract the financial data from this independent provident fund / pension deposit certificate (אישור הפקדה לקופת גמל / קרן פנסיה).
1. ownershipType: If one person, classify as MAIN.
2. providerName: The name of the pension company (e.g. "אלטשולר שחם", "הראל").
3. year: The tax year.
4. amount: The total independent deposits made (הפקדות במעמד עצמאי). Do NOT include employer deposits.
5. Provide a calculationLog.`;

const ANNUAL_CPA_SUMMARY_PROMPT = `Extract the financial data from this annual CPA summary or tax income report (ריכוז הכנסות / דוח רואה חשבון).
1. ownershipType: MAIN or SHARED.
2. providerName: The name of the CPA or the business name.
3. year: The tax year.
4. rentalIncomeIsrael: Total gross rental income in Israel (usually 10% track).
5. rentalIncomeAbroad: Total gross rental income from abroad (usually 15% track).
6. businessIncome: Total net business income (הכנסה חייבת מעסק).
7. Provide a calculationLog.`;


const US_FORM_1099_PROMPT = `Extract the financial data from this US Form 1099 Consolidated Tax Statement (e.g. Morgan Stanley, E*TRADE, Fidelity).
CRITICAL RULES:
1. ownershipType: MAIN or SHARED.
2. bankName: The broker name (e.g. "E*TRADE", "Fidelity", "Morgan Stanley").
3. foreignIncome: SUM the total Ordinary Dividends, total Interest Income, and total Proceeds/Gains. ALL income on this form is foreign income (Box 290). DO NOT use dividend15, capitalGains25, etc.
4. foreignTaxWithheld: The total Federal Income Tax Withheld.
5. All other fields (taxWithheld, dividend20, capitalGains20, etc.) MUST be 0.
6. Provide a calculationLog.`;

const EXTRACTION_CONFIG: Record<
  string,
  { prompt: string; responseSchema: Schema; zodSchema: { parse: (data: unknown) => unknown } }
> = {
  FORM_106: { prompt: FORM_106_PROMPT, responseSchema: Form106ResponseSchema, zodSchema: Form106Schema },
  FORM_867: { prompt: FORM_867_PROMPT, responseSchema: Form867ResponseSchema, zodSchema: Form867Schema },
  DONATION_RECEIPT: { prompt: DONATION_PROMPT, responseSchema: DonationReceiptResponseSchema, zodSchema: DonationReceiptSchema },
  CONSULTANT_INVOICE: { prompt: CONSULTANT_PROMPT, responseSchema: ConsultantInvoiceResponseSchema, zodSchema: ConsultantInvoiceSchema },
  LIFE_INSURANCE: { prompt: LIFE_INSURANCE_PROMPT, responseSchema: LifeInsuranceResponseSchema, zodSchema: LifeInsuranceSchema },
  PENSION_DEPOSIT: { prompt: PENSION_DEPOSIT_PROMPT, responseSchema: PensionDepositResponseSchema, zodSchema: PensionDepositSchema },
  ANNUAL_CPA_SUMMARY: { prompt: ANNUAL_CPA_SUMMARY_PROMPT, responseSchema: AnnualSummaryResponseSchema, zodSchema: AnnualSummarySchema },
  US_FORM_1099: { prompt: US_FORM_1099_PROMPT, responseSchema: Form867ResponseSchema, zodSchema: Form867Schema },
};

// ── Main extraction function ────────────────────────────────────────────────

/**
 * Classify and extract structured data from an Israeli tax document.
 *
 * @param fileBuffer - The raw file bytes (PDF or image)
 * @param fileName  - Original filename, used for MIME type inference
 * @returns Classification + extracted form data (or null for unsupported types)
 */
export async function extractDocument(
  fileBuffer: Buffer,
  fileName: string,
): Promise<ExtractionResult> {
  const mimeType = inferMimeType(fileName);
  const base64Data = fileBuffer.toString('base64');

  const filePart = {
    inlineData: { mimeType, data: base64Data },
  };

  // Step 1: Classify the document
  const classificationResponse = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [filePart, { text: CLASSIFICATION_PROMPT }],
      },
    ],
    config: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: ClassificationSchema,
    },
  });

  const classificationRaw = JSON.parse(classificationResponse.text ?? '{}');
  const classification = DocumentClassificationSchema.parse(classificationRaw);

  // Step 2: Extract structured data based on classification
  const config = EXTRACTION_CONFIG[classification.documentType];

  if (!config) {
    // Unsupported or unknown document type — return classification only
    return { file: fileName, classification, data: null };
  }

  // Handle FORM_856 (ESOP): extract using Form867 schema but map to dividends downstream
  const extractionDocType =
    classification.documentType === 'FORM_856'
      ? 'FORM_867'
      : classification.documentType;

  const extractionConfig = EXTRACTION_CONFIG[extractionDocType] ?? config;

  const extractionResponse = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [filePart, { text: extractionConfig.prompt }],
      },
    ],
    config: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: extractionConfig.responseSchema,
    },
  });

  const extractedRaw = JSON.parse(extractionResponse.text ?? '{}');
  const data = extractionConfig.zodSchema.parse(extractedRaw);

  return {
    file: fileName,
    classification,
    data: data as ExtractionResult['data'],
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function inferMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    default:
      return 'application/pdf';
  }
}
