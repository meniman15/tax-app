import { z } from 'zod';

// ── Document Classification ─────────────────────────────────────────────────

export const DocumentClassificationSchema = z.object({
  documentType: z
    .enum([
      'FORM_106',
      'FORM_867',
      'FORM_856',
      'LIFE_INSURANCE',
      'PENSION_DEPOSIT',
      'ANNUAL_CPA_SUMMARY',
      'DONATION_RECEIPT',
      'CONSULTANT_INVOICE',
      'TEUDAT_ZEHUT',
      'US_FORM_1099',
      'UNKNOWN',
    ])
    .describe('The strict classification of the provided document.'),
  confidenceScore: z.number().min(0).max(100),
  summary: z.string(),
});

export type DocumentClassification = z.infer<typeof DocumentClassificationSchema>;

// ── Form 106 (Annual Employer Tax Certificate) ──────────────────────────────

export const Form106Schema = z.object({
  ownershipType: z.enum(['SHARED', 'MAIN', 'SECONDARY']).describe('Who owns the document (usually MAIN or SECONDARY for 106).'),
  employerName: z.string(),
  year: z.number(),
  grossIncome: z
    .number()
    .describe(
      'Total gross income (box 158/172), MUST include payment differences (הפרשים)',
    ),
  taxWithheld: z.number().describe('Income tax withheld (box 042)'),
  bituachLeumi: z.number().describe('National Insurance deducted'),
  healthTax: z.number().describe('Health tax deducted'),
  monthsWorked: z.number(),
  kerenHishtalmutSalary: z
    .number()
    .default(0)
    .describe('Box 218/219'),
  pensionAllowance: z
    .number()
    .default(0)
    .describe('Box 248/249'),
  pensionInsuredSalary: z
    .number()
    .default(0)
    .describe('Box 244/245'),
  pensionEmployeeDeduction: z
    .number()
    .default(0)
    .describe('Box 045/086'),
  recreationPayDeduction: z
    .number()
    .default(0)
    .describe('Box 011/012'),
  creditPoints: z
    .number()
    .default(0)
    .describe('Total credit points (נקודות זיכוי) on the form, box 029 or equivalent. 0 if absent.'),
  calculationLog: z.array(z.string()).default([]),
});

export type Form106 = z.infer<typeof Form106Schema>;

// ── Form 867 (Annual Securities Report) ─────────────────────────────────────

export const Form867Schema = z.object({
  ownershipType: z.enum(['SHARED', 'MAIN', 'SECONDARY']).describe('Who owns the account (SHARED, MAIN taxpayer, SECONDARY taxpayer).'),
  bankName: z.string(),
  year: z.number(),
  salesTurnover: z.number().default(0),
  capitalGains20: z.number().default(0).describe('Capital gains at 20% rate'),
  capitalGains25: z.number().default(0).describe('Capital gains at 25% rate'),
  taxWithheld: z.number().describe('Tax withheld on capital gains and dividends (Box 040)'),
  totalLosses: z.number().default(0).describe('Total gross capital losses'),
  interest15: z.number().default(0).describe('Interest income at 15% rate'),
  interest20: z.number().default(0).describe('Interest income at 20% rate'),
  interest25: z.number().default(0).describe('Interest income at 25% rate'),
  interestTaxWithheld: z.number().default(0).describe('Tax withheld on interest (Box 043)'),
  dividend15: z.number().default(0).describe('Dividend income at 15% rate'),
  dividend20: z.number().default(0).describe('Dividend income at 20% rate'),
  foreignIncome: z.number().default(0).describe('Foreign income (dividends/capital gains)'),
  foreignTaxWithheld: z.number().default(0).describe('Tax withheld abroad'),
  pficFlag: z.boolean().default(false),
  currency: z.string().default('ILS').describe('The original 3-letter currency code of the document (e.g. ILS, USD, EUR, GBP)'),
  calculationLog: z.array(z.string()).default([]),
});

export type Form867 = z.infer<typeof Form867Schema>;

// ── Donation Receipt ────────────────────────────────────────────────────────

export const DonationReceiptSchema = z.object({
  receipts: z.array(z.object({
    charityName: z.string(),
    receiptNumber: z.string(),
    date: z.string(),
    amount: z.number(),
    isSection46Approved: z.boolean(),
  })),
  calculationLog: z.array(z.string()).default([]),
});

export type DonationReceipt = z.infer<typeof DonationReceiptSchema>;

// ── Consultant / Tax-Prep Invoice ───────────────────────────────────────────

export const ConsultantInvoiceSchema = z.object({
  providerName: z.string(),
  amount: z.number(),
  date: z.string(),
  description: z.string(),
  calculationLog: z.array(z.string()).default([]),
});

export type ConsultantInvoice = z.infer<typeof ConsultantInvoiceSchema>;

// ── Life Insurance / Loss of Working Capacity ───────────────────────────────

export const LifeInsuranceSchema = z.object({
  ownershipType: z.enum(['SHARED', 'MAIN', 'SECONDARY']),
  insuranceCompany: z.string(),
  year: z.number(),
  lifeInsurancePremium: z.number().default(0),
  lossOfWorkingCapacityPremium: z.number().default(0),
  calculationLog: z.array(z.string()).default([]),
});

export type LifeInsurance = z.infer<typeof LifeInsuranceSchema>;

// ── Pension Deposit ─────────────────────────────────────────────────────────

export const PensionDepositSchema = z.object({
  ownershipType: z.enum(['SHARED', 'MAIN', 'SECONDARY']),
  providerName: z.string(),
  year: z.number(),
  amount: z.number().default(0),
  calculationLog: z.array(z.string()).default([]),
});

export type PensionDeposit = z.infer<typeof PensionDepositSchema>;

// ── Annual CPA Summary ──────────────────────────────────────────────────────

export const AnnualSummarySchema = z.object({
  ownershipType: z.enum(['SHARED', 'MAIN', 'SECONDARY']),
  providerName: z.string(),
  year: z.number(),
  rentalIncomeIsrael: z.number().default(0),
  rentalIncomeAbroad: z.number().default(0),
  businessIncome: z.number().default(0),
  currency: z.string().default('ILS').describe('The original 3-letter currency code (e.g. ILS, USD, EUR, GBP)'),
  calculationLog: z.array(z.string()).default([]),
});

export type AnnualSummary = z.infer<typeof AnnualSummarySchema>;

