import { BOX_DESCRIPTIONS } from '../config/boxDescriptions';
import taxCodes from '../config/taxCodes.json';
import taxTotals from '../config/taxTotals.json';

// ── Types ───────────────────────────────────────────────────────────────────

export interface TaxBoxEntry {
  value: number;
  description: string;
  breakdown?: { label: string; value: number }[];
}

export type TaxMap = Record<string, TaxBoxEntry>;

export interface AggregationLogEntry {
  file: string;
  documentType: string;
  contributions: {
    target: string;
    amount: number;
    ruleApplied: string;
  }[];
  calculationLog: string[];
}

export type AggregationLog = AggregationLogEntry[];

// ── Helpers ─────────────────────────────────────────────────────────────────

function addToMap(map: TaxMap, boxKey: string | null, amount: number, log?: AggregationLogEntry, ruleApplied?: string): void {
  if (!boxKey) return;
  const desc = BOX_DESCRIPTIONS[boxKey]?.en ?? boxKey;
  if (!map[boxKey]) {
    map[boxKey] = { value: 0, description: desc, breakdown: [] };
  }
  map[boxKey].value += amount;

  if (amount !== 0 && ruleApplied) {
    if (!map[boxKey].breakdown) map[boxKey].breakdown = [];
    map[boxKey].breakdown.push({ label: ruleApplied, value: amount });
  }

  if (log && amount !== 0) {
    log.contributions.push({ target: `Box ${boxKey}`, amount, ruleApplied: ruleApplied || '' });
  }
}

// ── Main aggregation ────────────────────────────────────────────────────────

/**
 * Aggregate extracted forms into a unified Israeli tax box map.
 *
 * Rules applied:
 *   - FORM_106 → salary boxes (158, 042, 218, 248, 244, 045, 011)
 *   - FORM_867 → capital / passive boxes (141, 166, 256, 040, 078, 043, 060)
 *   - FORM_856 (ESOP) → mapped to dividendIncome (box 060), NOT capital gains
 *   - DONATION_RECEIPT → box 037
 *   - CONSULTANT_INVOICE → DEDUCTION_TAX_PREP
 *
 * @param extractedForms - Array of extraction results from `extractDocument`
 * @returns Tax map keyed by box number, with zero entries removed
 */
export function aggregateToTaxMap(
  extractedForms: {
    file: string;
    classification: { documentType: string };
    data: Record<string, unknown> | null;
  }[],
): { taxMap: TaxMap; aggregationLog: AggregationLog } {
  const map: TaxMap = {};
  const aggregationLog: AggregationLog = [];

  for (const form of extractedForms) {
    if (!form.data) continue;

    const docType = form.classification.documentType;
    const d = form.data as Record<string, number | string | boolean | string[]>;

    // Determine ownership index (0: Shared, 1: Main, 2: Secondary)
    // Default to MAIN (1) to avoid null salary boxes when ownership is missing
    let ownIdx = 1;
    if (d.ownershipType === 'SHARED') ownIdx = 0;
    if (d.ownershipType === 'SECONDARY') ownIdx = 2;

      const logEntry: AggregationLogEntry = {
      file: form.file,
      documentType: docType,
      contributions: [],
      calculationLog: (d.calculationLog as string[]) || [],
    };

    const sourceName = 
      docType === 'FORM_106' ? d.employerName :
      docType === 'FORM_867' || docType === 'FORM_856' ? d.bankName :
      docType === 'DONATION_RECEIPT' ? d.charityName :
      docType === 'CONSULTANT_INVOICE' ? d.providerName :
      docType === 'LIFE_INSURANCE' ? d.insuranceCompany :
      '';
    const suffix = sourceName ? ` - ${sourceName}` : '';

    switch (docType) {
      case 'FORM_106':
        addToMap(map, taxCodes.salary.boxes[ownIdx], asNum(d.grossIncome), logEntry, `Gross Income${suffix}`);
        addToMap(map, taxTotals.salaryTax.box, asNum(d.taxWithheld), logEntry, `Income Tax Withheld${suffix}`);
        addToMap(map, taxCodes.kerenHishtalmut.boxes[ownIdx], asNum(d.kerenHishtalmutSalary), logEntry, `Keren Hishtalmut Base${suffix}`);
        addToMap(map, taxCodes.pensionAllowance.boxes[ownIdx], asNum(d.pensionAllowance), logEntry, `Pension Allowance${suffix}`);
        addToMap(map, taxCodes.pensionInsured.boxes[ownIdx], asNum(d.pensionInsuredSalary), logEntry, `Pension Insured Salary${suffix}`);
        addToMap(map, taxCodes.pensionDeduction.boxes[ownIdx], asNum(d.pensionEmployeeDeduction), logEntry, `Pension Employee Deduction${suffix}`);
        addToMap(map, taxCodes.recreationPay.boxes[ownIdx], asNum(d.recreationPayDeduction), logEntry, `Recreation Pay Deduction${suffix}`);
        break;

      case 'FORM_867':
        addToMap(map, taxCodes.capitalGains25.boxes[ownIdx], asNum(d.capitalGains25), logEntry, `Capital Gains (25%)${suffix}`);
        addToMap(map, taxTotals.capitalLosses.box, asNum(d.totalLosses), logEntry, `Total Capital Losses${suffix}`);
        addToMap(map, taxTotals.salesTurnover.box, asNum(d.salesTurnover), logEntry, `Sales Turnover${suffix}`);
        
        addToMap(map, taxTotals.capitalGainsTax.box, asNum(d.taxWithheld), logEntry, `Tax on Capital Gains and Dividends${suffix}`);

        addToMap(map, taxCodes.interest15.boxes[ownIdx], asNum(d.interest15), logEntry, `Interest Income (15%)${suffix}`);
        addToMap(map, taxCodes.interest20.boxes[ownIdx], asNum(d.interest20), logEntry, `Interest Income (20%)${suffix}`);
        addToMap(map, taxCodes.interest25.boxes[ownIdx], asNum(d.interest25), logEntry, `Interest Income (25%)${suffix}`);
        addToMap(map, taxTotals.interestTax.box, asNum(d.interestTaxWithheld), logEntry, `Tax on Interest${suffix}`);
        addToMap(map, taxCodes.dividend15.boxes[ownIdx], asNum(d.dividend15), logEntry, `Dividend Income (15%)${suffix}`);
        addToMap(map, taxCodes.dividend20.boxes[ownIdx], asNum(d.dividend20), logEntry, `Dividend Income (20%)${suffix}`);
        break;

      case 'FORM_856':
        addToMap(map, taxCodes.dividend15.boxes[ownIdx], asNum(d.dividend15), logEntry, `ESOP Dividend (15%)${suffix}`);
        addToMap(map, taxCodes.capitalGains25.boxes[ownIdx], asNum(d.capitalGains25), logEntry, `ESOP Gains (25%)${suffix}`);
        break;

      case 'DONATION_RECEIPT':
        addToMap(map, taxCodes.donations.boxes[ownIdx], asNum(d.amount), logEntry, `Section 46 Donation${suffix}`);
        break;

      case 'CONSULTANT_INVOICE':
        addToMap(map, taxTotals.taxPrep.box, asNum(d.amount), logEntry, `Tax Prep Expense${suffix}`);
        break;

      case 'LIFE_INSURANCE':
        addToMap(map, taxCodes.lifeInsurance.boxes[ownIdx], asNum(d.lifeInsurancePremium), logEntry, `Life Insurance${suffix}`);
        addToMap(map, taxCodes.lossOfWorkingCapacity.boxes[ownIdx], asNum(d.lossOfWorkingCapacityPremium), logEntry, `Loss of Working Capacity${suffix}`);
        break;

      default:
        break;
    }

    if (logEntry.contributions.length > 0) {
      aggregationLog.push(logEntry);
    }
  }

  // Remove zero-value entries
  for (const key of Object.keys(map)) {
    if (map[key].value === 0) {
      delete map[key];
    }
  }

  return { taxMap: map, aggregationLog };
}

// ── Utility ─────────────────────────────────────────────────────────────────

function asNum(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}
