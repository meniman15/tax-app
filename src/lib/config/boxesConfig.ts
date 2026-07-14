export const BOXES_LLM_KNOWLEDGE = `
Israel Tax Authority Form 1301 Box Reference Knowledge Base:

## Form 106 (Employment Income)
- Box 158: Gross Income from Employment — MAIN taxpayer (MUST include payment differences / הפרשים).
- Box 172: Gross Income from Employment — SECONDARY taxpayer (spouse).
- Box 042: Tax Withheld from Salary — MAIN taxpayer (Income tax ONLY).
- Box 049: Tax Withheld from Salary — SECONDARY taxpayer (spouse).
- Box 218 / 219: Keren Hishtalmut Base Salary (Main / Spouse).
- Box 248 / 249: Pension/Kupat Gemel Allowance (Main / Spouse).
- Box 244 / 245: Pension Insured Salary (Main / Spouse).
- Box 045 / 086: Pension Employee Deduction (Main / Spouse).
- Box 011 / 012: Recreation Pay (דמי הבראה) Deduction (Main / Spouse).

## Form 867 (Securities and Passive Income)
### Capital Gains
- 25% Capital Gains / Dividends: Boxes 341 (Shared), 241 (Spouse), 141 (Main).
- 20% Capital Gains: Boxes 325 (Shared), 275 (Spouse), 173 (Main).
- Box 166: Total offsettable Capital Losses (הפסדי הון ברי קיזוז). DO NOT break losses down by percentage.
- Box 256: Sales Turnover from Securities.
- Box 040: Tax Withheld on Capital Gains AND Dividends (Note: Do NOT confuse "מספר עסקאות" / Number of Transactions with Tax Withheld).

### Interest Income (by tax rate)
- 15% Interest Income: Box 078
- 20% Interest Income: Boxes 326 (Shared), 226 (Spouse), 126 (Main)
- 25% Interest Income: Boxes 357 (Shared), 257 (Spouse), 157 (Main)
- Box 043: Tax Withheld on Interest ONLY.

### Dividend Income (by tax rate)
- 15% Dividend Income: Boxes 311 (Shared), 211 (Spouse), 060 (Main)
- 25% Dividend Income: Same boxes as 25% Capital Gains (341, 241, 141).

## Other Deductions/Credits
- Box 037: Recognized Donations (Section 46).

## IMPORTANT NOTES:
- For Form 106: Each box has a MAIN and SPOUSE variant (e.g., 158 vs 172). Determine which person this document belongs to.
- For Form 867: Most passive income boxes have SHARED, SPOUSE, and MAIN variants (usually following a pattern like 3xx for Shared, 2xx for Spouse, 1xx for Main). 
- ownershipType must be one of: SHARED, MAIN, SECONDARY.
`;
