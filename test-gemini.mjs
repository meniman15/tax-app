import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const filePart = {
    inlineData: {
      mimeType: 'image/png',
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
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
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [filePart, { text: "Classify this image." }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: ClassificationSchema,
      }
    });
    console.log("Success with image:", res.text);
  } catch (e) {
    console.error("Error with image:", e);
  }
}
run();
