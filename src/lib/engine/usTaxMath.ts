import { ilsToUsd } from '../config/rules';
import type { AggregationLog, AggregationLogEntry } from './taxMath';

// ── Types ───────────────────────────────────────────────────────────────────

export interface UsLineItem {
  description: string;
  amountILS: number;
  amountUSD: number;
}

export interface UsFormSection {
  [lineLabel: string]: UsLineItem;
}

export interface UsTaxMap {
  'Form 1040': UsFormSection;
  'Form 1116 General': UsFormSection;
  'Form 1116 Passive': UsFormSection;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function lineItem(description: string, ils: number): UsLineItem {
  return {
    description,
    amountILS: ils,
    amountUSD: ilsToUsd(ils),
  };
}

function asNum(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// ── Main aggregation ────────────────────────────────────────────────────────

/**
 * Generate a US tax map from extracted Israeli tax forms.
 *
 * Groups line items by US form:
 *   - **Form 1040**: Wages, capital gains/losses, interest, dividends, deductions
 *   - **Form 1116 General**: Foreign tax credit for employment income
 *   - **Form 1116 Passive**: Foreign tax credit for passive income (interest, dividends, capital gains)
 *
 * All ILS amounts are converted to USD using the IRS yearly average rate.
 *
 * @param extractedForms - Array of extraction results from `extractDocument`
 * @returns Nested US tax map grouped by form
 */
export function generateUsTaxMap(
  extractedForms: {
    file: string;
    classification: { documentType: string };
    data: Record<string, unknown> | null;
  }[],
): { usTaxMap: UsTaxMap; aggregationLog: AggregationLog } {
  const aggregationLog: AggregationLog = [];
  // Accumulators (in ILS)
  let totalWages = 0;
  let totalWagesTaxWithheld = 0;
  let totalBituachLeumi = 0;
  let totalHealthTax = 0;
  let totalCapitalGains = 0;
  let totalCapitalLosses = 0;
  let totalCapitalGainsTax = 0;
  let totalInterest = 0;
  let totalInterestTax = 0;
  let totalDividends = 0;
  let totalDividendTax = 0;
  let totalDonations = 0;
  let totalTaxPrepExpenses = 0;

  for (const form of extractedForms) {
    if (!form.data) continue;

    const docType = form.classification.documentType;
    const d = form.data as Record<string, number | string | boolean | string[]>;
    
    const logEntry: AggregationLogEntry = {
      file: form.file,
      documentType: docType,
      contributions: [],
      calculationLog: (d.calculationLog as string[]) || [],
    };
    
    function log(target: string, amountILS: number, ruleApplied: string) {
      if (amountILS > 0 || amountILS < 0) {
        logEntry.contributions.push({ target, amount: amountILS, ruleApplied });
      }
    }

    switch (docType) {
      case 'FORM_106':
        totalWages += asNum(d.grossIncome);
        log('US Wages', asNum(d.grossIncome), 'Gross Income');
        
        totalWagesTaxWithheld += asNum(d.taxWithheld);
        log('US Foreign Income Tax', asNum(d.taxWithheld), 'Income Tax Withheld');
        
        totalBituachLeumi += asNum(d.bituachLeumi);
        log('US Foreign Social Security Tax', asNum(d.bituachLeumi), 'Bituach Leumi');
        
        totalHealthTax += asNum(d.healthTax);
        log('US Foreign Health Tax', asNum(d.healthTax), 'Health Tax');
        break;

      case 'FORM_867':
        const gainsSum = asNum(d.capitalGains20) + asNum(d.capitalGains25);
        totalCapitalGains += gainsSum;
        log('US Capital Gains', gainsSum, 'Total Capital Gains (20+25)');
        
        totalCapitalLosses += asNum(d.totalLosses);
        log('US Capital Losses', asNum(d.totalLosses), 'Total Capital Losses');
        
        totalCapitalGainsTax += asNum(d.taxWithheld);
        log('US Tax on Capital Gains and Dividends', asNum(d.taxWithheld), 'Tax on Capital Gains and Dividends');
        
        const interestSum = asNum(d.interest15) + asNum(d.interest20) + asNum(d.interest25);
        totalInterest += interestSum;
        log('US Interest Income', interestSum, 'Interest Income (15+20+25)');
        
        totalInterestTax += asNum(d.interestTaxWithheld);
        log('US Tax on Interest', asNum(d.interestTaxWithheld), 'Tax on Interest');
        
        const divSum = asNum(d.dividend15) + asNum(d.dividend25);
        totalDividends += divSum;
        log('US Dividend Income', divSum, 'Dividend Income (15+25)');
        break;

      case 'FORM_856':
        // ESOP exercises → treat as dividend income for US purposes
        const esopDiv = asNum(d.dividend15) + asNum(d.dividend25) + asNum(d.capitalGains25);
        totalDividends += esopDiv;
        log('US Dividend Income', esopDiv, 'ESOP Income mapped to Dividends');
        break;

      case 'DONATION_RECEIPT':
        totalDonations += asNum(d.amount);
        log('US Charitable Contributions', asNum(d.amount), 'Donation');
        break;

      case 'CONSULTANT_INVOICE':
        totalTaxPrepExpenses += asNum(d.amount);
        log('US Tax Prep Expenses', asNum(d.amount), 'Tax Prep Invoice');
        break;

      default:
        break;
    }
    
    if (logEntry.contributions.length > 0) {
      aggregationLog.push(logEntry);
    }
  }

  // Net capital gains (gains minus losses, floor at 0 for separate reporting)
  const netCapitalGains = totalCapitalGains - totalCapitalLosses;

  // Build the US tax map
  const usTaxMap: UsTaxMap = {
    'Form 1040': {},
    'Form 1116 General': {},
    'Form 1116 Passive': {},
  };

  // ── Form 1040 ─────────────────────────────────────────────────────────

  if (totalWages > 0) {
    usTaxMap['Form 1040']['Wages (Line 1)'] = lineItem(
      'Israeli employment income (Form 106)',
      totalWages,
    );
  }

  if (netCapitalGains !== 0) {
    usTaxMap['Form 1040']['Capital Gains (Schedule D)'] = lineItem(
      'Net capital gains from Israeli securities (Form 867)',
      netCapitalGains,
    );
  }

  if (totalCapitalLosses > 0) {
    usTaxMap['Form 1040']['Capital Losses (Schedule D)'] = lineItem(
      'Gross capital losses from Israeli securities',
      totalCapitalLosses,
    );
  }

  if (totalInterest > 0) {
    usTaxMap['Form 1040']['Interest Income (Schedule B)'] = lineItem(
      'Israeli interest income',
      totalInterest,
    );
  }

  if (totalDividends > 0) {
    usTaxMap['Form 1040']['Dividend Income (Schedule B)'] = lineItem(
      'Israeli dividend income (includes ESOP)',
      totalDividends,
    );
  }

  if (totalDonations > 0) {
    usTaxMap['Form 1040']['Charitable Contributions (Schedule A)'] = lineItem(
      'Donations to Israeli Section 46 charities',
      totalDonations,
    );
  }

  if (totalTaxPrepExpenses > 0) {
    usTaxMap['Form 1040']['Tax Preparation Fees'] = lineItem(
      'Accountant / tax preparer expenses',
      totalTaxPrepExpenses,
    );
  }

  // ── Form 1116 General (employment / active income) ────────────────────

  if (totalWages > 0) {
    usTaxMap['Form 1116 General']['Foreign Income'] = lineItem(
      'Israeli wages (general category)',
      totalWages,
    );
  }

  if (totalWagesTaxWithheld > 0) {
    usTaxMap['Form 1116 General']['Income Tax Paid'] = lineItem(
      'Israeli income tax withheld on wages',
      totalWagesTaxWithheld,
    );
  }

  if (totalBituachLeumi > 0) {
    usTaxMap['Form 1116 General']['Social Security Tax (Bituach Leumi)'] = lineItem(
      'Israeli National Insurance — qualifies as foreign tax paid',
      totalBituachLeumi,
    );
  }

  if (totalHealthTax > 0) {
    usTaxMap['Form 1116 General']['Health Tax'] = lineItem(
      'Israeli health tax — qualifies as foreign tax paid',
      totalHealthTax,
    );
  }

  // ── Form 1116 Passive (investment income) ─────────────────────────────

  const totalPassiveIncome = totalCapitalGains + totalInterest + totalDividends;
  const totalPassiveTax = totalCapitalGainsTax + totalInterestTax;

  if (totalPassiveIncome > 0) {
    usTaxMap['Form 1116 Passive']['Foreign Passive Income'] = lineItem(
      'Israeli passive income (capital gains + interest + dividends)',
      totalPassiveIncome,
    );
  }

  if (totalCapitalGainsTax > 0) {
    usTaxMap['Form 1116 Passive']['Tax on Capital Gains & Dividends'] = lineItem(
      'Israeli tax withheld on capital gains and dividends',
      totalCapitalGainsTax,
    );
  }

  if (totalInterestTax > 0) {
    usTaxMap['Form 1116 Passive']['Tax on Interest'] = lineItem(
      'Israeli tax withheld on interest',
      totalInterestTax,
    );
  }

  if (totalPassiveTax > 0) {
    usTaxMap['Form 1116 Passive']['Total Passive Tax Paid'] = lineItem(
      'Total Israeli tax on passive income',
      totalPassiveTax,
    );
  }

  return { usTaxMap, aggregationLog };
}
