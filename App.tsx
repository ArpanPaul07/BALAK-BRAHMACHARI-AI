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
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [showBani, setShowBani] = useState(false);
  const [currentBani, setCurrentBani] = useState({ title: '', content: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (text: string = input) => {
    if ((!text.trim() && !attachedImage) || isLoading) return;
    
    const userMessage: Message = { 
      role: Role.USER, 
      text: text || "Analyze this, Master.", 
      timestamp: new Date(),
      imageUrl: attachedImage || undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);
    
    const aiMessagePlaceholder: Message = { role: Role.MODEL, text: '', timestamp: new Date() };
    setMessages(prev => [...prev, aiMessagePlaceholder]);
    
    try {
      let fullResponseText = "";
      await chatWithGemini([...messages, userMessage], isSearchEnabled, selectedLanguage, (chunk, grounding) => {
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
          lastMsg.text = "Ram Narayan Ram. Connectivity with the cosmic grid is low. Try again. Ram Narayan Ram.";
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <Auth onAuth={setUser} isGrayscale={isGrayscale} isDarkMode={isDarkMode} />;

  return (
    <div className={`flex flex-col h-screen transition-all duration-500 fixed inset-0
      ${isGrayscale ? 'grayscale bg-white' : ''} 
      ${isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-gray-50 text-gray-900'}
    `}>
      <Header 
        isGrayscale={isGrayscale} 
        isDarkMode={isDarkMode}
        toggleGrayscale={() => setIsGrayscale(!isGrayscale)} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={() => setUser(null)}
        onOpenBani={() => {
          const keys = Object.keys(TEACHINGS);
          const r = keys[Math.floor(Math.random() * keys.length)];
          setCurrentBani({ title: r, content: TEACHINGS[r] });
          setShowBani(true);
        }}
        userTitle={user.sadhanaStreak >= 7 ? 'Sevak' : 'Santan'}
      />

      <main className="flex-1 overflow-y-auto pt-2 pb-48 px-4 scrollbar-hide">
        <div className="max-w-3xl mx-auto py-4">
          {messages.map((msg, index) => (
            <ChatBubble key={index} message={msg} language={selectedLanguage} isDarkMode={isDarkMode} />
          ))}
          {isLoading && <div className="flex justify-start mb-6"><div className={`w-12 h-6 rounded-full animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div></div>}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Section - Optimized for Mobile Thumb Reach */}
      <div className={`fixed bottom-0 left-0 right-0 border-t z-40 safe-bottom transition-colors 
        ${isDarkMode ? 'bg-[#020617]/95 backdrop-blur-md border-slate-800' : 'bg-white/95 backdrop-blur-md border-gray-200'}
        ${isGrayscale ? 'bg-white border-black' : ''}
      `}>
        <div className="max-w-3xl mx-auto p-3 sm:p-4">
          {attachedImage && (
            <div className="mb-2 flex items-center p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 animate-fade-in">
              <img src={attachedImage} className="w-10 h-10 rounded-lg object-cover mr-2" />
              <button onClick={() => setAttachedImage(null)} className="ml-auto p-2 text-orange-500"><i className="fa-solid fa-xmark"></i></button>
            </div>
          )}

          <div className={`flex flex-col sm:flex-row items-stretch border rounded-[2rem] shadow-sm transition-all overflow-hidden
            ${isDarkMode ? 'bg-slate-900 border-slate-700 focus-within:border-orange-500' : 'bg-white border-gray-300 focus-within:border-orange-500'}
          `}>
            <textarea 
              rows={1} 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ask for guidance..." 
              className={`flex-1 p-4 sm:p-5 bg-transparent border-none focus:ring-0 resize-none max-h-32 text-base ${isDarkMode ? 'text-slate-100 placeholder:text-slate-500' : 'text-gray-700 placeholder:text-gray-400'}`} 
            />
            
            <div className="flex items-center justify-between p-2 px-4 sm:p-0 sm:pr-4 sm:pb-3 sm:justify-end">
              {/* Feature distance increased for mobile - space-x-4 */}
              <div className="flex items-center space-x-4 sm:space-x-2">
                <button onClick={() => fileInputRef.current?.click()} className={`w-10 h-10 flex items-center justify-center rounded-xl ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                  <i className="fa-solid fa-camera"></i>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                
                <button onClick={() => setIsBreathing(true)} className={`w-10 h-10 flex items-center justify-center rounded-xl ${isDarkMode ? 'bg-orange-950/30 text-orange-500' : 'bg-orange-50 text-orange-600'}`}>
                  <i className="fa-solid fa-leaf"></i>
                </button>
                
                <button onClick={() => setIsSearchEnabled(!isSearchEnabled)} className={`w-10 h-10 flex items-center justify-center rounded-xl ${isSearchEnabled ? 'bg-orange-600 text-white' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>
                  <i className="fa-solid fa-globe"></i>
                </button>
              </div>

              <button 
                onClick={() => handleSend()} 
                disabled={isLoading} 
                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ml-4 sm:ml-3 ${isLoading ? 'bg-slate-800' : 'bg-orange-600 text-white hover:scale-105 active:scale-95 shadow-lg shadow-orange-600/20'}`}
              >
                {isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-arrow-up text-lg"></i>}
              </button>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Ram Narayan Ram Global</p>
          </div>
        </div>
      </div>

      {/* Breathing Modal Overlay */}
      {isBreathing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl animate-fade-in">
          <div className={`w-full max-w-lg p-10 rounded-[3rem] text-center shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
            <button onClick={() => setIsBreathing(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-orange-500"><i className="fa-solid fa-xmark text-xl"></i></button>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 text-orange-600">Breathing Exercise</h3>
            <div className="flex flex-col items-center">
              <div className={`w-48 h-48 rounded-full bg-orange-500/20 flex items-center justify-center border-4 border-orange-500 animate-pulse`}>
                <i className="fa-solid fa-om text-white text-4xl"></i>
              </div>
              <p className="mt-12 text-3xl font-black uppercase tracking-widest">Just Breathe</p>
              <button onClick={() => setIsBreathing(false)} className="mt-12 px-8 py-3 bg-orange-600 text-white rounded-full font-bold uppercase tracking-widest">End Session</button>
            </div>
          </div>
        </div>
      )}

      {showBani && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl relative ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <button onClick={() => setShowBani(false)} className="absolute top-5 right-5 text-gray-400"><i className="fa-solid fa-xmark text-lg"></i></button>
            <h3 className="text-xl font-black mb-4 uppercase text-orange-600">{currentBani.title}</h3>
            <p className="text-lg leading-relaxed italic mb-8">"{currentBani.content}"</p>
            <button onClick={() => setShowBani(false)} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-[0.2em]">Ram Narayan Ram</button>
          </div>
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
        isGrayscale={isGrayscale} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        messages={messages} user={user} onClearHistory={() => setMessages([INITIAL_MESSAGE])}
        onLogout={() => setUser(null)} onUpdateUser={setUser}
        responseStyle="detailed" setResponseStyle={() => {}}
        remindersEnabled={false} setRemindersEnabled={() => {}}
        reminderInterval={15} setReminderInterval={() => {}}
        selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage}
        isSearchEnabled={isSearchEnabled} setIsSearchEnabled={setIsSearchEnabled}
      />
    </div>
  );
};

export default App;