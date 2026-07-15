# Israeli Tax Aggregation App

A modern web application built with Next.js that automates the extraction and aggregation of Israeli tax documents using AI (Google Gemini 3.1 Flash lite).

The app allows users to upload various financial documents (Form 106, Form 867, Donation Receipts), uses AI to extract structured financial data, and aggregates the results into a unified view mirroring the Israeli Form 1301.

## Features

- **AI-Powered Extraction**: Leverages Google's Gemini 3.1 Flash lite model with Structured Outputs to parse complex, unstructured Hebrew PDF tax forms with extreme precision.
- **Form Support**:
  - **Form 106 (טופס 106)**: Salary, Bituh Leumi, Health Tax, Pension deductions, Keren Hishtalmut, etc.
  - **Form 867 (טופס 867)**: Capital Gains (20%/25%), Dividends (15%/20%), Interest, Real Estate, and complex Tax Withheld aggregation.
  - **Donation Receipts**: Extracts Section 46 approved charitable contributions.
- **Smart Aggregation**: Automatically maps extracted data into the correct Form 1301 tax boxes based on account ownership (Main Taxpayer vs Spouse vs Shared).
- **Calculation Transparency**: The AI provides a detailed step-by-step reasoning log for every extracted value, ensuring auditable and trustworthy math.
- **Interactive Tax Map**: A beautiful UI to view the final Form 1301 box mappings, with bilingual descriptions (Hebrew/English) and manual override capabilities.

## Architecture

- **Frontend**: Next.js 14 App Router, React, Tailwind CSS, Lucide Icons.
- **Backend**: Next.js API Routes (`/api/extract`, `/api/aggregate`).
- **AI Engine**: `@google/genai` SDK using `gemini-3.1-flash-lite` for multimodal document understanding and structured JSON extraction.
- **Tax Engine**: Custom TypeScript engine (`taxMath.ts`) for enforcing Israeli tax aggregation rules and handling offsets/net taxes.

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/meniman15/tax-app.git
   cd tax-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

Contributions are welcome! Please ensure that any changes to the extraction logic in `extractDocument.ts` are accompanied by detailed reasoning instructions for the AI prompt.

## License

MIT
