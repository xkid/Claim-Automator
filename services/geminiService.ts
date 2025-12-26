
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiAnalysisResponse } from "../types";

// Note: process.env.API_KEY is provided by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeReceipt = async (base64Image: string, categories: string[]): Promise<GeminiAnalysisResponse> => {
  // Extract base64 content
  const data = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: data,
          },
        },
        {
          text: `Analyze this receipt. Extract the total amount (numeric), merchant name, and date. 
                 Also, suggest which category from this list it fits best: ${categories.join(', ')}. 
                 If none fit well, choose 'Misc'. Return the data in valid JSON format.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER, description: "Total amount found on receipt" },
          merchant: { type: Type.STRING, description: "Name of the merchant" },
          date: { type: Type.STRING, description: "Date of the transaction" },
          suggestedCategory: { type: Type.STRING, description: "Matching category name" },
        },
        required: ["amount", "merchant", "date", "suggestedCategory"],
      },
    },
  });

  const resultText = response.text;
  
  if (!resultText) {
    throw new Error("AI returned an empty response.");
  }

  try {
    return JSON.parse(resultText);
  } catch (e) {
    console.error("Failed to parse Gemini response", resultText);
    throw new Error("Invalid response from AI model");
  }
};
