
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { Message, Role } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export const chatWithGemini = async (
  history: Message[],
  useSearch: boolean,
  language: string,
  onChunk: (chunk: string, grounding?: any[]) => void
) => {
  // Fixed: Exclusively use process.env.API_KEY for initialization as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents = history.map(msg => {
    const parts: any[] = [{ text: msg.text }];
    
    if (msg.imageUrl) {
      const base64Data = msg.imageUrl.split(',')[1];
      const mimeType = msg.imageUrl.split(',')[0].split(':')[1].split(';')[0];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    return {
      role: msg.role === Role.USER ? "user" : "model",
      parts: parts
    };
  });

  try {
    const languageInstruction = `CRITICAL: You MUST respond exclusively in ${language}. However, the mandatory opening and closing "Ram Narayan Ram" should remain as it is (transliterated if needed for the script), as it is a universal vibrational chant. Ensure the spiritual wisdom and tone are perfectly preserved in ${language}. 
    If the user has provided an image, analyze its vibrations, the environment, or the objects within it through the lens of Vedic Science and suggest how to improve the energy of that space or situation.`;

    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION + "\n\n" + languageInstruction,
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
      // Accessing text as a property
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        // Correctly extract grounding metadata from chunks for display
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

export const generateSpeech = async (text: string, language: string): Promise<string> => {
  // Fixed: Exclusively use process.env.API_KEY for initialization as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak in ${language} as a wise, elder spiritual master with a deep, resonant male voice. Chant the opening and closing 'Ram Narayan Ram' with great devotion. Here is the text: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' }, 
          },
        },
      },
    });

    // Access base64 audio data from candidates
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};
