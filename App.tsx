
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, User } from './types';
import { chatWithGemini } from './services/geminiService';
import Header from './components/Header';
import ChatBubble from './components/ChatBubble';
import SettingsModal from './components/SettingsModal';
import Auth from './components/Auth';
import { SUGGESTED_PROMPTS } from './constants';

const INITIAL_MESSAGE: Message = {
  role: Role.MODEL,
  text: "Ram Narayan Ram. I am the AI Version of Sri Sri Balak Brahmachari. What's in your mind today, my child ? Ram Narayan Ram.",
  timestamp: new Date()
};

const App: React.FC = () => {
  const [isGrayscale, setIsGrayscale] = useState(() => {
    return localStorage.getItem('grayscale_mode') === 'true';
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('thakur_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  const [responseStyle, setResponseStyle] = useState<'concise' | 'detailed'>(() => {
    return (localStorage.getItem('response_style') as 'concise' | 'detailed') || 'detailed';
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        return [INITIAL_MESSAGE];
      }
    }
    return [INITIAL_MESSAGE];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('grayscale_mode', String(isGrayscale));
  }, [isGrayscale]);

  useEffect(() => {
    localStorage.setItem('response_style', responseStyle);
  }, [responseStyle]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('thakur_user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('thakur_user_session');
    }
  }, [user]);

  // Initialize edit fields when user changes
  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditBio(user.bio || '');
    }
  }, [user]);

  // Speech Recognition Initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUpdateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const handleSaveInlineEdit = () => {
    handleUpdateUser({ name: editName, bio: editBio });
    setIsInlineEditing(false);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      setUser(null);
      setIsSettingsOpen(false);
      if (user?.isGuest) {
        setMessages([INITIAL_MESSAGE]);
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your guidance history? This cannot be undone.")) {
      setMessages([INITIAL_MESSAGE]);
      setIsSettingsOpen(false);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    if (isListening) {
      recognitionRef.current?.stop();
    }

    const userMessage: Message = {
      role: Role.USER,
      text: text,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const aiMessagePlaceholder: Message = {
      role: Role.MODEL,
      text: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMessagePlaceholder]);

    try {
      let fullResponseText = "";
      await chatWithGemini(newMessages, isSearchEnabled, (chunk, grounding) => {
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
          lastMsg.text = "Ram Narayan Ram. I encountered a disturbance in the cosmic connection. Please try again, and remember the power of patience. Ram Narayan Ram.";
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGrayscale = () => setIsGrayscale(!isGrayscale);

  if (!user) {
    return <Auth onAuth={setUser} isGrayscale={isGrayscale} />;
  }

  return (
    <div className={`flex flex-col min-h-screen transition-all duration-500 ${isGrayscale ? 'grayscale contrast-115 bg-white' : 'bg-gray-50'}`}>
      <Header 
        isGrayscale={isGrayscale} 
        toggleGrayscale={toggleGrayscale} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto pt-4 pb-56 px-4 scrollbar-hide">
        <div className="max-w-3xl mx-auto">
          {/* Enhanced Inline Profile Editor */}
          <div className="mb-8 flex flex-col items-center">
            {!isInlineEditing ? (
              <button 
                onClick={() => setIsInlineEditing(true)}
                className={`group flex flex-col items-center p-4 rounded-3xl transition-all ${
                  isGrayscale ? 'hover:bg-black/5' : 'hover:bg-orange-50'
                }`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 flex items-center ${isGrayscale ? 'text-black' : 'text-orange-600'}`}>
                  Connected as <i className="fa-solid fa-pen ml-2 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </p>
                <h3 className={`text-xl font-bold ${isGrayscale ? 'text-black' : 'text-gray-800'}`}>
                  {user.name} {user.isGuest && '(Guest)'}
                </h3>
                {user.bio && (
                  <p className={`mt-1 text-xs italic opacity-60 max-w-sm text-center line-clamp-1 ${isGrayscale ? 'text-black' : 'text-gray-500'}`}>
                    "{user.bio}"
                  </p>
                )}
              </button>
            ) : (
              <div className={`w-full max-w-md p-6 rounded-[2rem] border animate-fade-in shadow-xl ${
                isGrayscale ? 'bg-white border-black' : 'bg-white border-orange-100'
              }`}>
                <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${isGrayscale ? 'text-black' : 'text-orange-600'}`}>
                  Update Profile Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Spiritual Name</label>
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 outline-none transition-all ${
                        isGrayscale ? 'border-black focus:ring-black' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-50'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Spiritual Goal / Bio</label>
                    <textarea 
                      rows={2}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="What is your current mental focus?"
                      className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 outline-none transition-all resize-none ${
                        isGrayscale ? 'border-black focus:ring-black' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-50'
                      }`}
                    />
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button 
                      onClick={handleSaveInlineEdit}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isGrayscale ? 'bg-black text-white hover:bg-gray-800' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-100'
                      }`}
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={() => setIsInlineEditing(false)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        isGrayscale ? 'border-black text-black' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {messages.map((msg, index) => (
            <ChatBubble key={index} message={msg} />
          ))}
          {isLoading && isSearchEnabled && (
            <div className="flex justify-start mb-6 animate-pulse">
               <div className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center space-x-2 ${
                 isGrayscale ? 'bg-black text-white' : 'bg-orange-100 text-orange-600'
               }`}>
                 <i className="fa-solid fa-earth-asia animate-spin"></i>
                 <span>Deep Search: Scanning the global web...</span>
               </div>
            </div>
          )}
          {messages.length === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className={`p-4 border transition-all text-sm text-left rounded-xl shadow-sm ${
                    isGrayscale 
                    ? 'bg-white border-black text-black hover:bg-black hover:text-white' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:bg-orange-50'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className={`fixed bottom-0 left-0 right-0 border-t p-4 pb-4 z-40 transition-colors ${
        isGrayscale ? 'bg-white border-black' : 'bg-white/90 backdrop-blur-md border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
      }`}>
        <div className="max-w-3xl mx-auto">
          <div className={`relative flex items-end border rounded-2xl shadow-sm transition-all ${
            isGrayscale 
            ? 'bg-white border-black focus-within:ring-2 focus-within:ring-black' 
            : 'bg-white border-gray-300 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500'
          }`}>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask for guidance..."
              className="flex-1 p-4 pr-32 bg-transparent border-none focus:ring-0 resize-none max-h-32 scrollbar-hide text-gray-700 text-sm sm:text-base"
            />
            <div className="absolute right-2 bottom-2 flex space-x-1.5">
              <button
                onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                title={isSearchEnabled ? "Deep Search Enabled" : "Enable Deep Search (Web Grounding)"}
                className={`p-2 rounded-xl transition-all ${
                  isSearchEnabled 
                    ? (isGrayscale ? 'bg-black text-white' : 'bg-orange-600 text-white shadow-md shadow-orange-100')
                    : (isGrayscale ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : 'bg-gray-100 text-gray-400 hover:bg-orange-50 hover:text-orange-600')
                }`}
              >
                <i className={`fa-solid ${isSearchEnabled ? 'fa-globe' : 'fa-compass'}`}></i>
              </button>
              <button
                onClick={toggleListening}
                title={isListening ? "Stop Listening" : "Start Voice Input"}
                className={`p-2 rounded-xl transition-all ${
                  isListening 
                    ? (isGrayscale ? 'bg-black text-white animate-pulse' : 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200')
                    : (isGrayscale ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : 'bg-gray-100 text-gray-400 hover:bg-orange-50 hover:text-orange-600')
                }`}
              >
                <i className={`fa-solid ${isListening ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
              </button>
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className={`p-2 rounded-xl transition-all ${
                  isLoading || !input.trim() 
                    ? 'bg-gray-100 text-gray-400' 
                    : isGrayscale 
                      ? 'bg-black text-white hover:bg-gray-800 shadow-md'
                      : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-100'
                }`}
              >
                {isLoading ? (
                  <i className="fa-solid fa-spinner animate-spin"></i>
                ) : (
                  <i className="fa-solid fa-arrow-up"></i>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-2 flex flex-col items-center space-y-1">
              <p className={`text-[9px] text-center px-4 max-w-sm ${isGrayscale ? 'text-black/60 italic' : 'text-gray-400'}`}>
                <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                AI Disclaimer: This tool may make mistakes. Seek authentic guidance for serious matters.
              </p>
              <div className="flex flex-col items-center pt-1">
                <p className={`text-[8px] font-bold uppercase tracking-[0.2em] ${isGrayscale ? 'text-black' : 'text-orange-600/80'}`}>
                  MADE WITH ❤️️ BY ARPAN PAUL
                </p>
                <p className={`text-[7px] font-bold tracking-[0.1em] ${isGrayscale ? 'text-black/50' : 'text-gray-400'}`}>
                  ( RAM NARAYAN RAM GLOBAL )
                </p>
              </div>
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isGrayscale={isGrayscale}
        messages={messages}
        user={user}
        onClearHistory={handleClearHistory}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
        responseStyle={responseStyle}
        setResponseStyle={setResponseStyle}
      />
    </div>
  );
};

export default App;
