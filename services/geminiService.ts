import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { Message, Role, User } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Manual base64 encoding for raw bytes
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Manual base64 decoding to raw bytes
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode raw PCM data into an AudioBuffer
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const chatWithGemini = async (
  history: Message[],
  useSearch: boolean,
  language: string,
  user: User,
  onChunk: (chunk: string, grounding?: any[]) => void,
  isFastMode: boolean = true
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = isFastMode ? 'gemini-flash-lite-latest' : 'gemini-3-pro-preview';
  
  const contents = history.map(msg => {
    const parts: any[] = [{ text: msg.text }];
    if (msg.imageUrl) {
      const base64Data = msg.imageUrl.split(',')[1];
      const mimeType = msg.imageUrl.split(',')[0].split(':')[1].split(';')[0];
      parts.push({ inlineData: { data: base64Data, mimeType: mimeType } });
    }
    return { role: msg.role === Role.USER ? "user" : "model", parts: parts };
  });

  try {
    const userContext = `
    USER PROFILE:
    - Name: ${user.name}
    - Bio/Context: ${user.bio || 'Not provided'}
    - Preferences: ${user.preferences || 'None'}
    `;

    const languageInstruction = `CRITICAL: Respond in ${language}. Start and end with "Ram Narayan Ram".`;

    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION + "\n\n" + userContext + "\n\n" + languageInstruction,
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
    };

    if (useSearch) config.tools = [{ googleSearch: {} }];

    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: config,
    });

    let fullText = "";
    let finalGrounding = undefined;
    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        const grounding = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (grounding) finalGrounding = grounding;
        onChunk(chunkText, finalGrounding);
      }
    }
    return { text: fullText, grounding: finalGrounding };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};