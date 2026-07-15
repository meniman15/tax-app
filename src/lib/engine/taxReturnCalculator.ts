import { TaxMap } from './taxMath';

export interface TaxEstimate {
  grossIncome: number;
  grossTax: number;
  creditPointsValue: number;
  donationCredit: number;
  pensionCredit: number;
  netTaxLiability: number;
  totalTaxWithheld: number;
  refundOrDue: number; // Positive = Refund, Negative = Due
}

const BRACKETS_2025 = [
  { upTo: 84120, rate: 0.10 },
  { upTo: 120720, rate: 0.14 },
  { upTo: 193800, rate: 0.20 },
  { upTo: 274440, rate: 0.31 },
  { upTo: 560280, rate: 0.35 },
  { upTo: 721560, rate: 0.47 }, // 47% + 3% surtax above 721,560
  { upTo: Infinity, rate: 0.50 }
];

export function calculateEstimatedReturn(taxMap: TaxMap): TaxEstimate {
  // 1. Gross Income (Boxes 158 + 172)
  const salary158 = taxMap['158']?.value || 0;
  const salary172 = taxMap['172']?.value || 0;
  const grossIncome = salary158 + salary172;

  // 2. Gross Tax (Calculate brackets)
  let grossTax = 0;
  let remainingIncome = grossIncome;
  let prevLimit = 0;

  for (const bracket of BRACKETS_2025) {
    if (remainingIncome <= 0) break;
    const taxableInBracket = Math.min(remainingIncome, bracket.upTo - prevLimit);
    grossTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
    prevLimit = bracket.upTo;
  }

  // 3. Credit Points Value (Box 067)
  const creditPointsValue = taxMap['067']?.value || 0;

  // 4. Donation Credit (35% of Boxes 037 + 237)
  const donation037 = taxMap['037']?.value || 0;
  const donation237 = taxMap['237']?.value || 0;
  const donationCredit = (donation037 + donation237) * 0.35;

  // 5. Pension Credit (Box 045 - 35% capped at 2852)
  const pension045 = taxMap['045']?.value || 0;
  const pensionCredit = Math.min(pension045 * 0.35, 2852);

  // 6. Net Tax Liability
  let netTaxLiability = grossTax - creditPointsValue - donationCredit - pensionCredit;
  if (netTaxLiability < 0) netTaxLiability = 0;

  // 7. Total Tax Withheld (Box 042)
  const taxWithheld042 = taxMap['042']?.value || 0;

  // 8. Refund or Due
  const refundOrDue = taxWithheld042 - netTaxLiability;

  return {
    grossIncome,
    grossTax,
    creditPointsValue,
    donationCredit,
    pensionCredit,
    netTaxLiability,
    totalTaxWithheld: taxWithheld042,
    refundOrDue
  };
}
