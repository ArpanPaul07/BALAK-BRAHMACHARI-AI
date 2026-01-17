
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, User } from './types';
import { chatWithGemini } from './services/geminiService';
import Header from './components/Header';
import ChatBubble from './components/ChatBubble';
import SettingsModal from './components/SettingsModal';
import Auth from './components/Auth';
import { TEACHINGS } from './constants';

const INITIAL_MESSAGE: Message = {
  role: Role.MODEL,
  text: "Ram Narayan Ram. I am the AI Version of Sri Sri Balak Brahmachari. What's in your mind today, my child? Ram Narayan Ram.",
  timestamp: new Date()
};

const App: React.FC = () => {
  const [isGrayscale, setIsGrayscale] = useState(() => localStorage.getItem('grayscale_mode') === 'true');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true');
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('thakur_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(() => localStorage.getItem('search_enabled') === 'true');
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem('selected_language') || 'English');
  
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  const [remindersEnabled, setRemindersEnabled] = useState(() => localStorage.getItem('reminders_enabled') === 'true');
  const [reminderInterval, setReminderInterval] = useState<number>(() => parseInt(localStorage.getItem('reminder_interval') || '15', 10));
  const [showReminder, setShowReminder] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [showBani, setShowBani] = useState(false);
  const [currentBani, setCurrentBani] = useState({ title: '', content: '' });
  const [responseStyle, setResponseStyle] = useState<'concise' | 'detailed'>(() => (localStorage.getItem('response_style') as 'concise' | 'detailed') || 'detailed');
  
  // Requirement: Fresh chat when returning. Always start with INITIAL_MESSAGE.
  // We don't load history from localStorage here anymore.
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Still save messages for current session persistence, but we don't load it on start.
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  // Sadhana Streak logic
  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      if (user.lastVisitDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let newStreak = user.sadhanaStreak || 0;
        if (user.lastVisitDate === yesterdayStr) {
          newStreak += 1;
        } else if (!user.lastVisitDate) {
          newStreak = 1;
        } else {
          newStreak = 1; 
        }
        
        const updatedUser = { 
          ...user, 
          sadhanaStreak: newStreak, 
          lastVisitDate: today,
        };
        setUser(updatedUser);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) localStorage.setItem('thakur_user_session', JSON.stringify(user));
  }, [user]);

  // Reminder Interval Logic
  useEffect(() => {
    let timer: number;
    if (remindersEnabled && reminderInterval > 0) {
      timer = window.setInterval(() => {
        handleTriggerReminder();
      }, reminderInterval * 60 * 1000);
    }
    return () => clearInterval(timer);
  }, [remindersEnabled, reminderInterval]);

  const handleTriggerReminder = () => {
    setShowReminder(true);
    setTimeout(() => setShowReminder(false), 5000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getSadhanaTitle = (streak: number) => {
    if (streak >= 30) return 'Adhikari';
    if (streak >= 15) return 'Sadhak';
    if (streak >= 7) return 'Sevak';
    return 'Santan';
  };

  // Breathing Cycle Logic
  useEffect(() => {
    let timer: number;
    if (isBreathing) {
      const cycle = () => {
        setBreathPhase('Inhale');
        timer = window.setTimeout(() => {
          setBreathPhase('Hold');
          timer = window.setTimeout(() => {
            setBreathPhase('Exhale');
            timer = window.setTimeout(cycle, 4000); 
          }, 2000); 
        }, 4000); 
      };
      cycle();
    }
    return () => clearTimeout(timer);
  }, [isBreathing]);

  const handleSend = async (text: string = input) => {
    if ((!text.trim() && !attachedImage) || isLoading) return;
    
    const userMessage: Message = { 
      role: Role.USER, 
      text: text || "Analyze this environment, Master.", 
      timestamp: new Date(),
      imageUrl: attachedImage || undefined
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);
    
    const aiMessagePlaceholder: Message = { role: Role.MODEL, text: '', timestamp: new Date() };
    setMessages(prev => [...prev, aiMessagePlaceholder]);
    
    try {
      let fullResponseText = "";
      await chatWithGemini(newMessages, isSearchEnabled, selectedLanguage, (chunk, grounding) => {
        fullResponseText += chunk;
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === Role.MODEL) {
            lastMsg.text = fullResponseText;
            lastMsg.groundingChunks = grounding;
          }
          return updated;
        });
      });
    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === Role.MODEL) {
          lastMsg.text = "Ram Narayan Ram. The cosmic channel is flickering. Please try again. Ram Narayan Ram.";
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!user) return <Auth onAuth={setUser} isGrayscale={isGrayscale} isDarkMode={isDarkMode} />;

  const currentTitle = getSadhanaTitle(user.sadhanaStreak);

  const handleShareFeedback = () => {
    window.location.href = 'mailto:arpanpaul335@gmail.com';
  };

  return (
    <div className={`flex flex-col min-h-screen transition-all duration-500 
      ${isGrayscale ? 'grayscale bg-white' : ''} 
      ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}
    `}>
      <Header 
        isGrayscale={isGrayscale} 
        isDarkMode={isDarkMode}
        toggleGrayscale={() => {
            const newState = !isGrayscale;
            setIsGrayscale(newState);
            localStorage.setItem('grayscale_mode', newState.toString());
        }} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={() => { if (window.confirm("Log out?")) setUser(null); }}
        onOpenBani={() => {
          const keys = Object.keys(TEACHINGS);
          const r = keys[Math.floor(Math.random() * keys.length)];
          setCurrentBani({ title: r, content: TEACHINGS[r] });
          setShowBani(true);
        }}
        userTitle={currentTitle}
      />

      <main className="flex-1 overflow-y-auto pt-4 pb-64 px-4 scrollbar-hide">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, index) => (
            <ChatBubble key={index} message={msg} language={selectedLanguage} isDarkMode={isDarkMode} />
          ))}
          {isLoading && <div className="flex justify-start mb-6"><div className={`w-12 h-6 rounded-full animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div></div>}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Breathing Overlay */}
      {isBreathing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className={`w-full max-w-lg p-8 rounded-[3rem] text-center shadow-2xl relative overflow-hidden transition-all duration-1000 ${
            isGrayscale ? 'bg-white border-4 border-black' : isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'
          }`}>
            <button onClick={() => setIsBreathing(false)} className={`absolute top-6 right-6 p-3 ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-black'}`}>
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-12 text-orange-600">Pranayama Session</h3>
            <div className="flex flex-col items-center justify-center h-64">
              <div className={`rounded-full transition-all duration-[4000ms] ease-in-out flex items-center justify-center ${
                breathPhase === 'Inhale' 
                  ? 'w-48 h-48 bg-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.5)]' 
                  : breathPhase === 'Hold' ? 'w-48 h-48 bg-orange-400' : 'w-24 h-24 bg-orange-100'
              }`}>
                <i className={`fa-solid fa-om text-white text-3xl transition-opacity duration-500 ${breathPhase === 'Hold' ? 'opacity-100' : 'opacity-40'}`}></i>
              </div>
              <div className="mt-12">
                <p className={`text-4xl font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>{breathPhase}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bani Modal */}
      {showBani && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
            <button onClick={() => setShowBani(false)} className="absolute top-4 right-4 p-2 text-gray-400"><i className="fa-solid fa-xmark"></i></button>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>{currentBani.title}</h3>
            <p className={`leading-relaxed mb-8 italic ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>"{currentBani.content}"</p>
            <button onClick={() => setShowBani(false)} className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest bg-orange-600 text-white shadow-lg shadow-orange-900/20">Ram Narayan Ram</button>
          </div>
        </div>
      )}

      {/* Reminder Notification */}
      {showReminder && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[150] animate-fade-in">
           <div className={`px-8 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-4 border backdrop-blur-md ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-black border-white/20 text-white'}`}>
              <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center animate-pulse">
                <i className="fa-solid fa-om text-white"></i>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Sacred Moment</p>
                <p className="text-lg font-black uppercase tracking-tight">Ram Narayan Ram</p>
              </div>
           </div>
        </div>
      )}

      {/* Input Bar */}
      <div className={`fixed bottom-0 left-0 right-0 border-t p-4 pb-4 z-40 transition-colors 
        ${isDarkMode ? 'bg-slate-950/90 backdrop-blur-md border-slate-800' : 'bg-white/90 backdrop-blur-md border-gray-200'}
        ${isGrayscale ? 'bg-white border-black' : ''}
      `}>
        <div className="max-w-3xl mx-auto">
          {attachedImage && (
            <div className={`mb-3 flex items-center p-2 rounded-xl border border-dashed animate-fade-in ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-300'}`}>
              <img src={attachedImage} className="w-12 h-12 rounded-lg object-cover mr-3" />
              <button onClick={() => setAttachedImage(null)} className="ml-auto p-2 text-gray-400 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
            </div>
          )}

          <div className={`relative flex items-end border rounded-[2rem] shadow-sm transition-all 
            ${isDarkMode ? 'bg-slate-900 border-slate-700 focus-within:border-orange-500' : 'bg-white border-gray-300 focus-within:border-orange-500'}
            ${isGrayscale ? 'bg-white border-black' : ''}
          `}>
            <textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Ask for guidance..." 
              className={`flex-1 p-5 pr-48 bg-transparent border-none focus:ring-0 resize-none max-h-32 text-sm ${isDarkMode ? 'text-slate-100 placeholder:text-slate-500' : 'text-gray-700 placeholder:text-gray-400'}`} />
            <div className="absolute right-3 bottom-3 flex space-x-1">
              <button onClick={() => fileInputRef.current?.click()} className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}><i className="fa-solid fa-camera"></i></button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button onClick={() => setIsBreathing(true)} className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-orange-950/30 text-orange-500' : 'bg-orange-50 text-orange-600'}`}><i className="fa-solid fa-leaf"></i></button>
              <button onClick={() => {
                  const newState = !isSearchEnabled;
                  setIsSearchEnabled(newState);
                  localStorage.setItem('search_enabled', newState.toString());
              }} className={`p-2.5 rounded-xl ${isSearchEnabled ? 'bg-orange-600 text-white' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'}`}><i className="fa-solid fa-globe"></i></button>
              <button onClick={() => handleSend()} disabled={isLoading} className={`p-2.5 rounded-xl transition-all ${isLoading ? (isDarkMode ? 'bg-slate-800' : 'bg-gray-100') : 'bg-orange-600 text-white hover:bg-orange-700'}`}>{isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-arrow-up"></i>}</button>
            </div>
          </div>

          <div className="mt-2 text-center space-y-1">
            <p className={`text-[7px] font-bold uppercase tracking-widest opacity-60 ${isGrayscale ? 'text-black' : isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              MADE WITH ❤️️ BY ARPAN PAUL ( RAM NARAYAN RAM GLOBAL )
            </p>
            <p className={`text-[7px] font-bold uppercase tracking-widest opacity-40 ${isGrayscale ? 'text-black' : isDarkMode ? 'text-slate-600' : 'text-gray-500'}`}>
              THAKUR BALAK BRAHMACHARI AI is an AI and it can make mistakes.
              <button onClick={handleShareFeedback} className="ml-2 underline hover:opacity-100">Share Feedback</button>
            </p>
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isGrayscale={isGrayscale}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => {
          const newState = !isDarkMode;
          setIsDarkMode(newState);
          localStorage.setItem('dark_mode', newState.toString());
        }}
        messages={messages}
        user={user}
        onClearHistory={() => setMessages([INITIAL_MESSAGE])}
        onLogout={() => {
            if (window.confirm("Are you sure you want to sign out? Your history will remain locally unless cleared.")) {
                setUser(null);
            }
        }}
        onUpdateUser={setUser}
        responseStyle={responseStyle}
        setResponseStyle={setResponseStyle}
        remindersEnabled={remindersEnabled}
        setRemindersEnabled={(val) => {
          setRemindersEnabled(val);
          localStorage.setItem('reminders_enabled', val.toString());
        }}
        reminderInterval={reminderInterval}
        setReminderInterval={(val) => {
          setReminderInterval(val);
          localStorage.setItem('reminder_interval', val.toString());
        }}
        onTriggerManualReminder={handleTriggerReminder}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={(lang) => {
            setSelectedLanguage(lang);
            localStorage.setItem('selected_language', lang);
        }}
        isSearchEnabled={isSearchEnabled}
        setIsSearchEnabled={(val) => {
            setIsSearchEnabled(val);
            localStorage.setItem('search_enabled', val.toString());
        }}
      />
    </div>
  );
};

export default App;
