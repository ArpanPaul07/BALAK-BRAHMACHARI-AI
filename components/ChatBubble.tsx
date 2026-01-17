
import React, { useState, useRef } from 'react';
import { Message, Role } from '../types';
import { generateSpeech } from '../services/geminiService';

interface ChatBubbleProps {
  message: Message;
  language: string;
  isDarkMode: boolean;
}

// Fixed: Manual base64 decoding implementation as per guidelines
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Fixed: Manual raw PCM decoding implementation as per guidelines
async function decodeAudioData(
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

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, language, isDarkMode }) => {
  const isUser = message.role === Role.USER;
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const handleShare = async () => {
    try {
      if (!message.text) return;
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      setIsAudioLoading(true);
      const base64Audio = await generateSpeech(message.text, language);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const decodedBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
      };

      sourceNodeRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (err) {
      console.error('TTS failed:', err);
      alert("Failed to generate Vedic voice. Please try again.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start animate-fade-in'}`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[90%] sm:max-w-[80%]`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
          isUser 
            ? (isDarkMode ? 'bg-orange-950 text-orange-500 ml-2' : 'bg-orange-100 text-orange-600 ml-2') 
            : (isDarkMode ? 'bg-slate-800 text-slate-400 mr-2' : 'bg-gray-100 text-gray-600 mr-2')
        }`}>
          {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-om"></i>}
        </div>
        <div className={`relative px-4 py-3 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed group transition-colors ${
          isUser 
            ? 'bg-orange-600 text-white rounded-br-none' 
            : (isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none' : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none')
        }`}>
          {message.imageUrl && (
            <div className="mb-3 rounded-xl overflow-hidden shadow-sm">
              <img src={message.imageUrl} alt="Spiritual Insight Attachment" className="w-full h-auto max-h-60 object-cover" />
            </div>
          )}
          <div className="whitespace-pre-wrap mb-1">
            {message.text || (
                <div className="flex space-x-1 py-1">
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-75 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-150 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                </div>
            )}
          </div>

          {!isUser && message.groundingChunks && message.groundingChunks.length > 0 && (
            <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Sources of Wisdom:</p>
              <div className="flex flex-wrap gap-2">
                {message.groundingChunks.map((chunk, idx) => {
                  const url = chunk.web?.uri || chunk.maps?.uri;
                  const title = chunk.web?.title || chunk.maps?.title || "Vedic Archive";
                  if (!url) return null;
                  return (
                    <a 
                      key={idx} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`inline-flex items-center space-x-1 text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                        isDarkMode 
                          ? 'text-orange-500 hover:text-orange-400 bg-orange-950/20 border-orange-900/30' 
                          : 'text-orange-600 hover:text-orange-800 bg-orange-50 border-orange-100'
                      }`}
                    >
                      <i className="fa-solid fa-link text-[8px]"></i>
                      <span className="max-w-[120px] truncate font-bold uppercase">{title}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <div className={`flex items-center justify-between mt-2 pt-1 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
            <div className="flex space-x-1">
              <button 
                onClick={handleShare}
                disabled={!message.text}
                className={`flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider transition-all px-2 py-1 rounded-lg ${
                  copied 
                    ? (isUser ? 'bg-white/20 text-white' : (isDarkMode ? 'bg-orange-950/40 text-orange-500' : 'bg-orange-50 text-orange-600')) 
                    : (isUser ? 'text-white/60 hover:text-white hover:bg-white/10' : (isDarkMode ? 'text-slate-500 hover:text-orange-500 hover:bg-slate-800' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'))
                }`}
              >
                <i className={`fa-solid ${copied ? 'fa-check' : 'fa-share-nodes'}`}></i>
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>

              {!isUser && (
                <button 
                  onClick={handlePlayAudio}
                  disabled={isAudioLoading}
                  className={`flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider transition-all px-2 py-1 rounded-lg ${
                    isPlaying 
                      ? 'bg-orange-600 text-white animate-pulse' 
                      : (isDarkMode ? 'text-slate-500 hover:text-orange-500 hover:bg-slate-800' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50')
                  }`}
                >
                  {isAudioLoading ? (
                    <i className="fa-solid fa-spinner animate-spin"></i>
                  ) : (
                    <i className={`fa-solid ${isPlaying ? 'fa-stop' : 'fa-volume-high'}`}></i>
                  )}
                  <span>{isPlaying ? 'Stop' : (isAudioLoading ? 'Loading...' : 'Listen')}</span>
                </button>
              )}
            </div>

            <div className={`text-[9px] opacity-60 font-medium ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
