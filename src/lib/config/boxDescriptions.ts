/**
 * Israeli tax form box numbers mapped to bilingual descriptions.
 * Used for rendering the tax summary map and populating report labels.
 *
 * Categories:
 *   - salary:     Employment income boxes (Form 106)
 *   - capital:    Capital gains / securities boxes (Form 867)
 *   - passive:    Interest, dividends, and other passive income
 *   - deductions: Recognized deductions and credits
 */
export const BOX_DESCRIPTIONS: Record<
  string,
  { he: string; en: string; category: string }
> = {
  // ── Salary (Form 106) — Main Taxpayer ─────────────────────────────────
  '158': { he: 'הכנסה מעבודה - בן הזוג הרשום', en: 'Gross Income from Employment (Main)', category: 'salary' },
  '172': { he: 'הכנסה מעבודה - בן/בת זוג', en: 'Gross Income from Employment (Spouse)', category: 'salary' },
  '042': { he: 'מס שנוכה במקור ממשכורת - בן הזוג הרשום', en: 'Tax Withheld from Salary (Main)', category: 'salary' },
  '049': { he: 'מס שנוכה במקור ממשכורת - בן/בת זוג', en: 'Tax Withheld from Salary (Spouse)', category: 'salary' },
  '218': { he: 'השכר לקרן השתלמות - בן הזוג הרשום', en: 'Keren Hishtalmut Base Salary (Main)', category: 'salary' },
  '219': { he: 'השכר לקרן השתלמות - בן/בת זוג', en: 'Keren Hishtalmut Base Salary (Spouse)', category: 'salary' },
  '248': { he: 'הפרשות לקופ"ג לקצבה - בן הזוג הרשום', en: 'Pension/Kupat Gemel Allowance (Main)', category: 'salary' },
  '249': { he: 'הפרשות לקופ"ג לקצבה - בן/בת זוג', en: 'Pension/Kupat Gemel Allowance (Spouse)', category: 'salary' },
  '244': { he: 'השכר המבוטח לקופ"ג לקצבה - בן הזוג הרשום', en: 'Pension Insured Salary (Main)', category: 'salary' },
  '245': { he: 'השכר המבוטח לקופ"ג לקצבה - בן/בת זוג', en: 'Pension Insured Salary (Spouse)', category: 'salary' },
  '045': { he: 'ניכוי לקופות גמל לקצבה - בן הזוג הרשום', en: 'Pension Employee Deduction (Main)', category: 'salary' },
  '086': { he: 'ניכוי לקופות גמל לקצבה - בן/בת זוג', en: 'Pension Employee Deduction (Spouse)', category: 'salary' },
  '011': { he: 'מחיר יום ההבראה - בן הזוג הרשום', en: 'Recreation Pay Deduction (Main)', category: 'salary' },
  '012': { he: 'מחיר יום ההבראה - בן/בת זוג', en: 'Recreation Pay Deduction (Spouse)', category: 'salary' },

  // ── Capital (Form 867) ───────────────────────────────────────────────
  '141': { he: 'רווח הון / דיבידנד מניירות ערך (25%) - משותף', en: 'Capital Gains / Dividend 25% (Shared)', category: 'capital' },
  '241': { he: 'רווח הון / דיבידנד מניירות ערך (25%) - בן הזוג הרשום', en: 'Capital Gains / Dividend 25% (Main)', category: 'capital' },
  '341': { he: 'רווח הון / דיבידנד מניירות ערך (25%) - בן/בת זוג', en: 'Capital Gains / Dividend 25% (Spouse)', category: 'capital' },
  
  '173': { he: 'הכנסה מדיבידנד (20%) - משותף', en: 'Dividend Income 20% (Shared)', category: 'passive' },
  '275': { he: 'הכנסה מדיבידנד (20%) - בן הזוג הרשום', en: 'Dividend Income 20% (Main)', category: 'passive' },
  '325': { he: 'הכנסה מדיבידנד (20%) - בן/בת זוג', en: 'Dividend Income 20% (Spouse)', category: 'passive' },
  
  '166': { he: 'הפסדי הון ברי קיזוז', en: 'Capital Losses', category: 'capital' },
  '256': { he: 'מחזור עסקאות מניירות ערך', en: 'Sales Turnover from Securities', category: 'capital' },
  '040': { he: 'מס שנוכה מרווח הון ודיבידנד', en: 'Tax Withheld on Capital Gains and Dividends', category: 'capital' },

  // ── Passive Income ───────────────────────────────────────────────────
  '078': { he: 'הכנסה מריבית (15%) - משותף', en: 'Interest Income 15% (Shared)', category: 'passive' },
  '217': { he: 'הכנסה מריבית (15%) - בן הזוג הרשום', en: 'Interest Income 15% (Main)', category: 'passive' },
  '317': { he: 'הכנסה מריבית (15%) - בן/בת זוג', en: 'Interest Income 15% (Spouse)', category: 'passive' },
  
  '126': { he: 'הכנסה מריבית (20%) - משותף', en: 'Interest Income 20% (Shared)', category: 'passive' },
  '226': { he: 'הכנסה מריבית (20%) - בן הזוג הרשום', en: 'Interest Income 20% (Main)', category: 'passive' },
  '326': { he: 'הכנסה מריבית (20%) - בן/בת זוג', en: 'Interest Income 20% (Spouse)', category: 'passive' },
  
  '157': { he: 'הכנסה מריבית (25%) - משותף', en: 'Interest Income 25% (Shared)', category: 'passive' },
  '257': { he: 'הכנסה מריבית (25%) - בן הזוג הרשום', en: 'Interest Income 25% (Main)', category: 'passive' },
  '357': { he: 'הכנסה מריבית (25%) - בן/בת זוג', en: 'Interest Income 25% (Spouse)', category: 'passive' },
  
  '060': { he: 'הכנסה מדיבידנד (15%) - משותף', en: 'Dividend Income 15% (Shared)', category: 'passive' },
  '211': { he: 'הכנסה מדיבידנד (15%) - בן הזוג הרשום', en: 'Dividend Income 15% (Main)', category: 'passive' },
  '311': { he: 'הכנסה מדיבידנד (15%) - בן/בת זוג', en: 'Dividend Income 15% (Spouse)', category: 'passive' },


  '043': { he: 'מס שנוכה מריבית', en: 'Tax Withheld on Interest', category: 'passive' },

  // ── Deductions & Credits ─────────────────────────────────────────────
  '037': { he: 'סך תרומות מוכרות - בן הזוג הרשום', en: 'Recognized Donations (Main)', category: 'deductions' },
  '237': { he: 'סך תרומות מוכרות - בן/בת זוג', en: 'Recognized Donations (Spouse)', category: 'deductions' },
  'DECLINED_DONATIONS': { he: 'תרומות שנדחו (ללא אישור 46)', en: 'Declined Donations (Missing Sec 46)', category: 'deductions' },
  'DEDUCTION_TAX_PREP': { he: 'הוצאות הנהלת חשבונות', en: 'Tax Preparation Expenses', category: 'deductions' },

  '036': { he: 'פרמיה לביטוח חיים לקצבה - בן הזוג הרשום', en: 'Life Insurance Premium (Main)', category: 'deductions' },
  '081': { he: 'פרמיה לביטוח חיים לקצבה - בן/בת זוג', en: 'Life Insurance Premium (Spouse)', category: 'deductions' },
  '112': { he: 'ביטוח אובדן כושר עבודה - בן הזוג הרשום', en: 'Loss of Working Capacity (Main)', category: 'deductions' },
  '113': { he: 'ביטוח אובדן כושר עבודה - בן/בת זוג', en: 'Loss of Working Capacity (Spouse)', category: 'deductions' },

  '222': { he: 'הכנסה משכר דירה בישראל (מסלול 10%) - נישום', en: 'Rental Income Israel (Main)', category: 'income' },
  '284': { he: 'הכנסה משכר דירה בישראל (מסלול 10%) - בן/בת זוג', en: 'Rental Income Israel (Spouse)', category: 'income' },
  '344': { he: 'הכנסה משכר דירה בישראל (מסלול 10%) - משותף', en: 'Rental Income Israel (Shared)', category: 'income' },

  '225': { he: 'הכנסה משכר דירה בחו"ל (מסלול 15%) - נישום', en: 'Rental Income Abroad (Main)', category: 'income' },
  '285': { he: 'הכנסה משכר דירה בחו"ל (מסלול 15%) - בן/בת זוג', en: 'Rental Income Abroad (Spouse)', category: 'income' },
  '345': { he: 'הכנסה משכר דירה בחו"ל (מסלול 15%) - משותף', en: 'Rental Income Abroad (Shared)', category: 'income' },

  '135': { he: 'הפקדות עצמאיות לקופת גמל/פנסיה - בן הזוג הרשום', en: 'Independent Pension Deposit (Main)', category: 'deductions' },
  '180': { he: 'הפקדות עצמאיות לקופת גמל/פנסיה - בן/בת זוג', en: 'Independent Pension Deposit (Spouse)', category: 'deductions' },

  '290': { he: 'הכנסות מחוץ לארץ', en: 'Foreign Income', category: 'income' },
  '044': { he: 'מס ששולם בחוץ לארץ', en: 'Foreign Tax Withheld', category: 'tax_withheld' },

  '067': { he: 'זיכוי אישי (נקודות זיכוי)', en: 'Personal Credit Points', category: 'deductions' },


  '150': { he: 'הכנסה מעסק או משלח יד - בן הזוג הרשום / משותף', en: 'Business Income (Main)', category: 'income' },
  '170': { he: 'הכנסה מעסק או משלח יד - בן/בת זוג', en: 'Business Income (Spouse)', category: 'income' },

};
