import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
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
      model: 'gemini-2.0-flash',
      contents: "Hello",
      config: {
        responseMimeType: 'application/json',
        responseSchema: ClassificationSchema,
      }
    });
    console.log("Success:", res.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
