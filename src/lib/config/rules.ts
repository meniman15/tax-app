// Israeli Tax Authority (Mas Hachnasa) rules for tax year 2025

export const TAX_YEAR = 2025;

/** Annual value of a single credit point (nekudat zikui) in ILS */
export const CREDIT_POINT_VALUE_ANNUAL = 2904;

/** Monthly value of a single credit point in ILS */
export const CREDIT_POINT_VALUE_MONTHLY = 242;

/**
 * IRS yearly average exchange rate (USD/ILS).
 * Used for converting Israeli income to USD on US tax returns (Form 1040, etc.).
 */
export const IRS_YEARLY_AVERAGE_RATE = 3.451;

/**
 * US Treasury year-end exchange rate (USD/ILS).
 * Used for FBAR / FinCEN 114 balance reporting.
 */
export const TREASURY_YEAR_END_RATE = 3.191;

/**
 * Common exchange rates to ILS for the 2025 tax year.
 * (If a currency is not listed, defaults to 1.0)
 */
export const EXCHANGE_RATES: Record<string, number> = {
  'USD': IRS_YEARLY_AVERAGE_RATE,
  'EUR': 3.45,  // Example rate
  'GBP': 4.5,   // Example rate
  'ILS': 1.0,
};

/** Israeli progressive income tax brackets for 2025 (annual amounts in ILS) */
export const TAX_BRACKETS_ANNUAL: readonly { min: number; max: number; rate: number }[] = [
  { min: 0, max: 84120, rate: 0.10 },
  { min: 84121, max: 120720, rate: 0.14 },
  { min: 120721, max: 193800, rate: 0.20 },
  { min: 193801, max: 269280, rate: 0.31 },
  { min: 269281, max: 560280, rate: 0.35 },
  { min: 560281, max: 721560, rate: 0.47 },
  { min: 721561, max: Infinity, rate: 0.50 },
];

/**
 * Convert an ILS amount to USD, rounded to 2 decimal places.
 * @param ils - Amount in Israeli New Shekels
 * @param useYearEndRate - If true, uses the Treasury year-end rate (for FBAR);
 *                         otherwise uses the IRS yearly average rate (for income).
 */
export function ilsToUsd(ils: number, useYearEndRate = false): number {
  const rate = useYearEndRate ? TREASURY_YEAR_END_RATE : IRS_YEARLY_AVERAGE_RATE;
  return Math.round((ils / rate) * 100) / 100;
}
