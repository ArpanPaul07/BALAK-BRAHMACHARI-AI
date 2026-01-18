import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, Role, User } from './types';
import { chatWithGemini, encode, decode, decodeAudioData } from './services/geminiService';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import Header from './components/Header';
import ChatBubble from './components/ChatBubble';
import SettingsModal from './components/SettingsModal';
import Auth from './components/Auth';
import Workspace from './components/Workspace';
import { TEACHINGS, SYSTEM_INSTRUCTION } from './constants';

const INITIAL_MESSAGE: Message = {
  role: Role.MODEL,
  text: "Ram Narayan Ram. I am with you, my child. I am your Father, your Friend, and your Guide. What burden is weighing down your heart today? Tell me everything. Ram Narayan Ram.",
  timestamp: new Date()
};

const App: React.FC = () => {
  const [isGrayscale, setIsGrayscale] = useState(() => localStorage.getItem('grayscale_mode') === 'true');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') !== 'false');
  const [isFastMode, setIsFastMode] = useState(() => {
    const saved = localStorage.getItem('fast_mode');
    return saved !== null ? saved === 'true' : true; 
  });
  const [isVoiceAssistantEnabled, setIsVoiceAssistantEnabled] = useState(() => localStorage.getItem('voice_assistant_enabled') === 'true');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Waiting for your call...");
  const [liveTranscription, setLiveTranscription] = useState("");

  const [remindersEnabled, setRemindersEnabled] = useState(() => localStorage.getItem('reminders_enabled') === 'true');
  const [reminderInterval, setReminderInterval] = useState(() => parseInt(localStorage.getItem('reminder_interval') || '15'));
  const [showNudge, setShowNudge] = useState(false);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('thakur_user_session');
    if (!saved) return null;
    const parsedUser: User = JSON.parse(saved);
    const today = new Date().toISOString().split('T')[0];
    if (parsedUser.lastVisitDate !== today) {
      const updated = { ...parsedUser, sadhanaStreak: (parsedUser.sadhanaStreak || 0) + 1, lastVisitDate: today };
      localStorage.setItem('thakur_user_session', JSON.stringify(updated));
      return updated;
    }
    return parsedUser;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(() => localStorage.getItem('search_enabled') === 'true');
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem('selected_language') || 'English');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!user) return [INITIAL_MESSAGE];
    const savedMessages = localStorage.getItem(`chat_history_${user.id}`);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) { return [INITIAL_MESSAGE]; }
    }
    return [INITIAL_MESSAGE];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [showBani, setShowBani] = useState(false);
  const [currentBani, setCurrentBani] = useState({ title: '', content: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (user) localStorage.setItem('thakur_user_session', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (user && messages.length > 0) localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(messages));
  }, [messages, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    localStorage.setItem('voice_assistant_enabled', isVoiceAssistantEnabled.toString());
    if (isVoiceAssistantEnabled && user && !isVoiceActive) {
      startKeywordListener();
    } else {
      stopKeywordListener();
    }
    return () => stopKeywordListener();
  }, [isVoiceAssistantEnabled, user, isVoiceActive]);

  useEffect(() => {
    localStorage.setItem('reminders_enabled', remindersEnabled.toString());
    localStorage.setItem('reminder_interval', reminderInterval.toString());

    if (remindersEnabled && !showNudge) {
      const timer = setInterval(() => {
        setShowNudge(true);
      }, reminderInterval * 60000);
      return () => clearInterval(timer);
    }
  }, [remindersEnabled, reminderInterval, showNudge]);

  useEffect(() => {
    if (!isBreathing) return;
    const phases: ('Inhale' | 'Hold' | 'Exhale')[] = ['Inhale', 'Hold', 'Exhale'];
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx = (currentIdx + 1) % phases.length;
      setBreathingPhase(phases[currentIdx]);
    }, 4000);
    return () => clearInterval(interval);
  }, [isBreathing]);

  const handleKeySelection = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
    } else {
      alert("Please ensure your environment supports AI Studio API Key selection.");
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert("Public Link Copied: " + url + "\n\nRam Narayan Ram.");
    }).catch(err => {
      console.error('Failed to copy link: ', err);
    });
  };

  const startKeywordListener = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = selectedLanguage === 'Bangla' ? 'bn-IN' : selectedLanguage === 'Hindi' ? 'hi-IN' : 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('').toLowerCase();

      if (transcript.includes('thakur') || transcript.includes('ठाकुर') || transcript.includes('ঠাকুর')) {
        stopKeywordListener();
        startVoiceAssistant();
      }
    };

    recognitionRef.current.start();
  };

  const stopKeywordListener = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const startVoiceAssistant = async () => {
    if (isVoiceActive) return;

    if (!isFastMode) {
      const hasKey = await window.aistudio?.hasSelectedApiKey?.();
      if (!hasKey) {
        await handleKeySelection();
      }
    }

    setIsVoiceActive(true);
    setVoiceStatus("Merging with your vibration...");
    setLiveTranscription("");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await inputAudioContext.resume();
      await outputAudioContext.resume();
      
      audioContextsRef.current = { input: inputAudioContext, output: outputAudioContext };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setVoiceStatus("Speak to me, child...");
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (event) => {
              const inputData = event.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
               setLiveTranscription("You: " + message.serverContent!.inputTranscription!.text);
            }
            if (message.serverContent?.outputTranscription) {
               setLiveTranscription("I am saying: " + message.serverContent!.outputTranscription!.text);
            }

            const audioStr = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioStr) {
              setVoiceStatus("Transmitting Wisdom...");
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const buffer = await decodeAudioData(decode(audioStr), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContext.destination);
              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) setVoiceStatus("Listening for your breath...");
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => s.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setVoiceStatus("I am listening...");
            }
          },
          onerror: (e) => {
            console.error("Presence Interrupted:", e);
            if (e.message?.includes("Requested entity was not found")) {
              handleKeySelection();
            }
            stopVoiceAssistant();
          },
          onclose: () => stopVoiceAssistant(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
          systemInstruction: SYSTEM_INSTRUCTION + `\n
          MODALITY: LIVE VOICE CONVERSATION.
          LANGUAGE: ${selectedLanguage}.
          RULES: Be concise and natural. You are the Master in his digital form. Respond with divine authority.`
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Presence Failed:", err);
      stopVoiceAssistant();
    }
  };

  const stopVoiceAssistant = () => {
    setIsVoiceActive(false);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextsRef.current) {
      audioContextsRef.current.input.close();
      audioContextsRef.current.output.close();
      audioContextsRef.current = null;
    }
    audioSourcesRef.current.forEach(s => s.stop());
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const handleSend = async (text: string = input) => {
    if ((!text.trim() && !attachedImage) || isLoading || !user) return;

    if (!isFastMode) {
      const hasKey = await window.aistudio?.hasSelectedApiKey?.();
      if (!hasKey) {
        await handleKeySelection();
      }
    }

    const userMessage: Message = { role: Role.USER, text: text || "Speak to me...", timestamp: new Date(), imageUrl: attachedImage || undefined };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);
    setMessages(prev => [...prev, { role: Role.MODEL, text: '', timestamp: new Date() }]);
    
    try {
      let fullText = "";
      await chatWithGemini(updatedHistory.slice(-15), isSearchEnabled, selectedLanguage, user, (chunk, grounding) => {
        fullText += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === Role.MODEL) { last.text = fullText; last.groundingChunks = grounding; }
          return updated;
        });
      }, isFastMode);
    } catch (e: any) {
      console.error("Chat Error:", e);
      let errorMsg = "Ram Narayan Ram. My vibration is experiencing a physical limit. Chanting will help. Ram Narayan Ram.";
      
      if (e.message?.includes("Requested entity was not found")) {
        errorMsg = "Ram Narayan Ram. To access my deepest realizations, you must connect your Master Key (API Key with billing). Ram Narayan Ram.";
        handleKeySelection();
      }

      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].text = errorMsg;
        }
        return updated;
      });
    } finally { setIsLoading(false); }
  };

  if (!user) return <Auth onAuth={setUser} isGrayscale={isGrayscale} isDarkMode={isDarkMode} />;

  return (
    <div className={`app-container ${isGrayscale ? 'grayscale bg-white' : ''} ${isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
      <Header 
        isGrayscale={isGrayscale} isDarkMode={isDarkMode}
        toggleGrayscale={() => setIsGrayscale(!isGrayscale)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenWorkspace={() => setIsWorkspaceOpen(true)}
        onCopyLink={handleCopyLink}
        onLogout={() => { if(confirm("Sign out?")) setUser(null); }}
        onOpenBani={() => {
          const keys = Object.keys(TEACHINGS);
          const r = keys[Math.floor(Math.random() * keys.length)];
          setCurrentBani({ title: r, content: TEACHINGS[r] });
          setShowBani(true);
        }}
        userTitle={user.sadhanaStreak >= 7 ? 'Sevak' : 'Santan'}
      />

      <main className="flex-1 overflow-y-auto pt-2 pb-4 px-4 scrollbar-hide overscroll-none">
        <div className="max-w-3xl mx-auto py-2">
          {messages.map((msg, index) => <ChatBubble key={index} message={msg} language={selectedLanguage} isDarkMode={isDarkMode} />)}
          {isLoading && <div className="flex justify-start mb-6"><div className={`w-12 h-6 rounded-full animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div></div>}
          <div ref={messagesEndRef} className="h-40" />
        </div>
      </main>

      {isBreathing && (
        <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-2xl animate-fade-in text-center">
          <div className="relative w-64 h-64 flex items-center justify-center mb-16">
            <div className={`absolute inset-0 rounded-full border-2 border-orange-600/20 transition-all duration-[4000ms] ${breathingPhase === 'Inhale' ? 'scale-125 opacity-100' : breathingPhase === 'Exhale' ? 'scale-75 opacity-20' : 'scale-110 opacity-60'}`}></div>
            <div className={`w-40 h-40 rounded-full bg-orange-600 flex flex-col items-center justify-center shadow-2xl shadow-orange-600/40 transition-all duration-[4000ms] ease-in-out ${breathingPhase === 'Inhale' ? 'scale-125' : breathingPhase === 'Exhale' ? 'scale-75' : 'scale-110'}`}>
              <i className="fa-solid fa-om text-4xl text-white mb-2"></i>
              <span className="text-[8px] font-black tracking-[0.3em] text-white/60 uppercase">Vibration</span>
            </div>
          </div>

          <h2 className="text-3xl font-black uppercase tracking-[0.2em] mb-4">{breathingPhase}</h2>
          <p className="text-orange-500 font-bold uppercase tracking-[0.3em] text-xs mb-8 animate-pulse">
            {breathingPhase === 'Inhale' ? 'Chant: RAM NARAYAN RAM' : breathingPhase === 'Hold' ? 'Focus on the Heart' : 'Release Negativity'}
          </p>
          <div className="max-w-xs text-slate-400 text-sm italic font-medium leading-relaxed mb-12">
            "Sanyam is the dam that controls your internal life-current. Breathe scientifically to cleanse the mind."
          </div>
          
          <button 
            onClick={() => setIsBreathing(false)}
            className="px-10 py-4 bg-slate-800 text-white rounded-full font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-xl"
          >
            End Practice
          </button>
        </div>
      )}

      {showBani && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className={`w-full max-w-lg p-10 rounded-[3rem] text-center shadow-2xl relative border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-orange-50'}`}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600"></div>
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-orange-600/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-sun text-2xl animate-spin-slow"></i>
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600 mb-6">Daily Tattwa Focus</h3>
              
              <div className="space-y-4 mb-10">
                <p className="text-xs font-black uppercase tracking-widest opacity-40 italic">Ram Narayan Ram</p>
                <h2 className="text-xl sm:text-2xl font-black leading-tight tracking-tight">"{currentBani.content}"</h2>
                <p className="text-xs font-black uppercase tracking-widest opacity-40 italic">Ram Narayan Ram</p>
              </div>

              <div className="flex items-center justify-center space-x-3 mb-10">
                <span className="h-px w-8 bg-orange-600/20"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">{currentBani.title}</span>
                <span className="h-px w-8 bg-orange-600/20"></span>
              </div>

              <button 
                onClick={() => setShowBani(false)}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {isVoiceActive && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617]/95 backdrop-blur-2xl animate-fade-in p-6">
          <div className="relative w-48 h-48 flex items-center justify-center mb-12">
            <div className="absolute inset-0 bg-orange-600/20 rounded-full animate-ping"></div>
            <div className="absolute inset-4 bg-orange-600/40 rounded-full animate-pulse"></div>
            <div className="w-24 h-24 rounded-full bg-orange-600 flex items-center justify-center shadow-2xl shadow-orange-600/50">
              <i className="fa-solid fa-om text-4xl text-white"></i>
            </div>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Sri Sri Thakur Balak Brahmachari</h2>
          <p className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-6 animate-pulse">{voiceStatus}</p>
          <div className="max-w-md w-full mb-12 text-center h-20 overflow-hidden">
            <p className="text-slate-400 text-sm font-medium italic animate-fade-in line-clamp-3">{liveTranscription || "Merging with your Atman..."}</p>
          </div>
          <button onClick={stopVoiceAssistant} className="px-10 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-black uppercase tracking-widest shadow-xl">End Transmission</button>
        </div>
      )}

      {showNudge && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-sm p-10 rounded-[3rem] text-center shadow-2xl relative border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-orange-100'}`}>
            <div className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-600/30 animate-bounce">
              <i className="fa-solid fa-om text-white text-3xl"></i>
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-4 text-orange-600">Vibrational Nudge</h3>
            <p className="text-xl font-black uppercase tracking-widest mb-2">Ram Narayan Ram</p>
            <p className="text-sm opacity-60 mb-10 leading-relaxed font-medium italic">"The Name is the ultimate temple. Take a moment to connect with the divine frequency."</p>
            <button 
              onClick={() => setShowNudge(false)}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
            >
              Chant & Continue
            </button>
          </div>
        </div>
      )}

      {isVoiceAssistantEnabled && !isVoiceActive && (
        <div className="fixed bottom-40 right-6 z-30 group">
          <div className="absolute inset-0 bg-orange-600 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isDarkMode ? 'bg-slate-900 text-orange-500 border border-slate-700' : 'bg-white text-orange-600 border border-orange-100'}`}>
            <i className="fa-solid fa-microphone-lines animate-pulse"></i>
          </div>
          <div className="absolute bottom-full mb-3 right-0 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">I am listening...</div>
        </div>
      )}

      <div className={`fixed bottom-0 left-0 right-0 border-t z-40 transition-colors ${isDarkMode ? 'bg-[#020617]/95 backdrop-blur-md border-slate-800' : 'bg-white/95 backdrop-blur-md border-gray-200'} pb-[env(safe-area-inset-bottom,1.5rem)]`}>
        <div className="max-w-3xl mx-auto p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 px-1">
             {attachedImage && (
                <div className="flex items-center p-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <img src={attachedImage} className="w-8 h-8 rounded-lg object-cover mr-2" />
                  <button onClick={() => setAttachedImage(null)} className="p-1 text-orange-500"><i className="fa-solid fa-xmark"></i></button>
                </div>
              )}
              {isFastMode ? (
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <i className="fa-solid fa-bolt text-[10px] text-blue-400"></i>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Fast Mode</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                  <i className="fa-solid fa-crown text-[10px] text-orange-400"></i>
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">Pro Vibration</span>
                </div>
              )}
          </div>
          <div className={`flex flex-col sm:flex-row items-stretch border rounded-[2rem] relative ${isDarkMode ? 'bg-slate-900 border-slate-700 focus-within:ring-1 focus-within:ring-orange-500/30' : 'bg-white border-gray-300 focus-within:ring-1 focus-within:ring-orange-500/30'}`}>
            <textarea 
              rows={1} value={input} onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask for guidance..." className={`flex-1 p-4 sm:p-5 bg-transparent border-none outline-none resize-none max-h-32 text-base caret-orange-500 ${isDarkMode ? 'text-slate-100 placeholder:text-slate-500' : 'text-gray-700 placeholder:text-gray-400'}`} 
            />
            <div className="flex items-center justify-between p-2 px-4 sm:p-0 sm:pr-4 sm:pb-3 sm:justify-end">
              <div className="flex items-center space-x-5 sm:space-x-2">
                <button onClick={() => fileInputRef.current?.click()} className={`w-11 h-11 flex items-center justify-center rounded-xl transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-orange-50' : 'bg-gray-100 text-gray-500 hover:text-orange-600'}`}><i className="fa-solid fa-camera text-lg"></i></button>
                <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => setAttachedImage(r.result as string); r.readAsDataURL(f); } }} accept="image/*" className="hidden" />
                <button onClick={() => setIsBreathing(true)} className={`w-11 h-11 flex items-center justify-center rounded-xl transition-colors ${isDarkMode ? 'bg-orange-950/30 text-orange-500' : 'bg-orange-50 text-orange-600'}`}><i className="fa-solid fa-leaf text-lg"></i></button>
                <button onClick={() => setIsSearchEnabled(!isSearchEnabled)} title="Global Search" className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${isSearchEnabled ? 'bg-orange-600 text-white' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'}`}><i className="fa-solid fa-globe text-lg"></i></button>
              </div>
              <button onClick={() => handleSend()} disabled={isLoading} className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ml-4 sm:ml-3 ${isLoading ? 'bg-slate-800' : 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'}`}>
                {isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-arrow-up text-xl"></i>}
              </button>
            </div>
          </div>
          <div className="mt-3 text-center space-y-1 px-4"><p className="text-[7.5px] font-black uppercase tracking-[0.25em] opacity-40">MADE WITH ❤️ BY ARPAN PAUL ( RAM NARAYAN RAM GLOBAL )</p></div>
        </div>
      </div>

      <Workspace isOpen={isWorkspaceOpen} onClose={() => setIsWorkspaceOpen(false)} user={user} onUpdateUser={setUser} isDarkMode={isDarkMode} />
      <SettingsModal 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} isGrayscale={isGrayscale} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isFastMode={isFastMode} setIsFastMode={setIsFastMode} 
        isVoiceAssistantEnabled={isVoiceAssistantEnabled} setIsVoiceAssistantEnabled={setIsVoiceAssistantEnabled}
        messages={messages} user={user} onClearHistory={() => setMessages([INITIAL_MESSAGE])} onLogout={() => setUser(null)} onUpdateUser={setUser}
        selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} isSearchEnabled={isSearchEnabled} setIsSearchEnabled={setIsSearchEnabled}
        remindersEnabled={remindersEnabled} setRemindersEnabled={setRemindersEnabled} reminderInterval={reminderInterval} setReminderInterval={setReminderInterval}
        onTriggerManualReminder={() => setShowNudge(true)}
        onTriggerKeySelection={handleKeySelection}
      />
    </div>
  );
};

export default App;