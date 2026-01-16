
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export const chatWithGemini = async (
  history: Message[],
  useSearch: boolean,
  onChunk: (chunk: string, grounding?: any[]) => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  // Format history for the API
  const contents = history.map(msg => ({
    role: msg.role === Role.USER ? "user" : "model",
    parts: [{ text: msg.text }]
  }));

  try {
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: config,
    });

    let fullText = "";
    let finalGrounding = undefined;

    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        // In streaming mode, groundingMetadata usually appears in the last chunk or near the end
        const grounding = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (grounding) {
          finalGrounding = grounding;
        }
        onChunk(chunkText, finalGrounding);
      }
    }
    return { text: fullText, grounding: finalGrounding };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
