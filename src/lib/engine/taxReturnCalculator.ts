import { TaxMap } from './taxMath';
import { TAX_BRACKETS_ANNUAL } from '../config/rules';

export interface TaxEstimate {
  grossIncome: number;
  grossTax: number;
  creditPointsValue: number;
  donationCredit: number;
  pensionCredit: number;
  netTaxLiability: number;
  totalTaxWithheld: number;
  refundOrDue: number; // Positive = Refund, Negative = Due
  calculationLog: string[];
}

export function calculateEstimatedReturn(taxMap: TaxMap): TaxEstimate {
  // Helper to sum multiple boxes safely
  const sumBoxes = (boxes: string[]) => boxes.reduce((acc, box) => acc + (taxMap[box]?.value || 0), 0);
  const fmt = (n: number) => new Intl.NumberFormat('en-IL', { maximumFractionDigits: 2 }).format(n);

  // 1. Progressive Income (Salary + Business)
  const progressiveIncome = sumBoxes(['158', '172', '150', '170']);
  
  // 2. Flat Rate Incomes
  const capGainsGross = sumBoxes(['141', '241', '341']);
  const capLosses = sumBoxes(['166']);
  const capGains25 = Math.max(0, capGainsGross - capLosses);
  
  const interest15 = sumBoxes(['078', '217', '317']);
  const interest20 = sumBoxes(['126', '226', '326']);
  const interest25 = sumBoxes(['157', '257', '357']);
  const dividend15 = sumBoxes(['060', '211', '311']);
  const dividend20 = sumBoxes(['173', '275', '325']);
  const rentalIsrael10 = sumBoxes(['222', '284', '344']);
  const rentalAbroad15 = sumBoxes(['225', '285', '345']);
  const foreignIncome25 = sumBoxes(['290']); // Assumed 25% for generic foreign income (1099s etc)

  // Total Gross Income
  const grossIncome = progressiveIncome + capGains25 + interest15 + interest20 + interest25 +
                      dividend15 + dividend20 + rentalIsrael10 + rentalAbroad15 + foreignIncome25;

  const calculationLog: string[] = [];
  calculationLog.push(`Gross Income (₪${fmt(grossIncome)}) = Progressive (₪${fmt(progressiveIncome)}) + Net Capital Gains (₪${fmt(capGainsGross)} - ₪${fmt(capLosses)} = ₪${fmt(capGains25)}) + Interest (₪${fmt(interest15 + interest20 + interest25)}) + Dividends (₪${fmt(dividend15 + dividend20)}) + Rental (₪${fmt(rentalIsrael10 + rentalAbroad15)}) + Foreign (₪${fmt(foreignIncome25)})`);

  // 3. Progressive Tax Calculation
  let progressiveTax = 0;
  let remainingIncome = progressiveIncome;
  let prevLimit = 0;

  for (const bracket of TAX_BRACKETS_ANNUAL) {
    if (remainingIncome <= 0) break;
    const bracketSize = bracket.max - prevLimit;
    const taxableInBracket = Math.min(remainingIncome, bracketSize);
    progressiveTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
    prevLimit = bracket.max;
  }

  // 4. Flat Tax Calculation
  const flatTax = 
    (capGains25 * 0.25) +
    (interest15 * 0.15) +
    (interest20 * 0.20) +
    (interest25 * 0.25) +
    (dividend15 * 0.15) +
    (dividend20 * 0.20) +
    (rentalIsrael10 * 0.10) +
    (rentalAbroad15 * 0.15) +
    (foreignIncome25 * 0.25);

  const grossTax = progressiveTax + flatTax;
  calculationLog.push(`Gross Tax (₪${fmt(grossTax)}) = Progressive Brackets (₪${fmt(progressiveTax)}) + Flat Taxes (₪${fmt(flatTax)})`);

  // 5. Credits
  const creditPointsValue = taxMap['067']?.value || 0;
  const donationCredit = sumBoxes(['037', '237']) * 0.35;
  const pensionCredit = Math.min(sumBoxes(['045']) * 0.35, 2852);

  // 6. Net Tax Liability
  let netTaxLiability = grossTax - creditPointsValue - donationCredit - pensionCredit;
  if (netTaxLiability < 0) netTaxLiability = 0;
  calculationLog.push(`Net Tax Liability (₪${fmt(netTaxLiability)}) = Gross Tax (₪${fmt(grossTax)}) - Credit Points (₪${fmt(creditPointsValue)}) - Donations (₪${fmt(donationCredit)}) - Pension Credit (₪${fmt(pensionCredit)})`);

  // 7. Total Tax Withheld
  const totalTaxWithheld = sumBoxes(['042', '049', '040', '043', '044']);

  // 8. Refund or Due
  const refundOrDue = totalTaxWithheld - netTaxLiability;

  return {
    grossIncome,
    grossTax,
    creditPointsValue,
    donationCredit,
    pensionCredit,
    netTaxLiability,
    totalTaxWithheld,
    refundOrDue,
    calculationLog
  };
}
