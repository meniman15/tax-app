import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const pdfBytes = fs.readFileSync('/Users/menigrossman/.gemini/antigravity/brain/bfbabd72-6d3e-4912-bc5f-a131a98e8212/.tempmediaStorage/media_bfbabd72-6d3e-4912-bc5f-a131a98e8212_1783344559217.pdf');
  const filePart = {
    inlineData: {
      mimeType: 'application/pdf',
      data: pdfBytes.toString('base64'),
    },
  };
  const ClassificationSchema = {
    type: Type.OBJECT,
    properties: {
      documentType: { type: Type.STRING },
      confidenceScore: { type: Type.NUMBER },
      summary: { type: Type.STRING },
    },
    required: ['documentType', 'confidenceScore', 'summary'],
  };
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [filePart, { text: "Classify this document." }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: ClassificationSchema,
      }
    });
    console.log("Success with real PDF:", res.text);
  } catch (e) {
    console.error("Error with real PDF:", e);
  }
}
run();
