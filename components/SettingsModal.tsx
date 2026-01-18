import React, { useState, useEffect } from 'react';
import { Message, User } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGrayscale: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isFastMode: boolean;
  setIsFastMode: (enabled: boolean) => void;
  isVoiceAssistantEnabled: boolean;
  setIsVoiceAssistantEnabled: (enabled: boolean) => void;
  messages: Message[];
  user: User;
  onClearHistory: () => void;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  responseStyle: 'concise' | 'detailed';
  setResponseStyle: (style: 'concise' | 'detailed') => void;
  remindersEnabled: boolean;
  setRemindersEnabled: (enabled: boolean) => void;
  reminderInterval: number;
  setReminderInterval: (interval: number) => void;
  onTriggerManualReminder?: () => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  isSearchEnabled: boolean;
  setIsSearchEnabled: (enabled: boolean) => void;
}

const LANGUAGES = [
  "English", "Hindi", "Bangla", "Arabic", "Chinese", "French", 
  "Russian", "Spanish", "Portuguese", "Swahili", "Hausa"
];

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, isGrayscale, isDarkMode, toggleDarkMode, isFastMode, setIsFastMode, 
  isVoiceAssistantEnabled, setIsVoiceAssistantEnabled,
  user, onClearHistory, onLogout, onUpdateUser, 
  selectedLanguage, setSelectedLanguage,
  isSearchEnabled, setIsSearchEnabled,
  remindersEnabled, setRemindersEnabled, reminderInterval, setReminderInterval, onTriggerManualReminder
}) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');

  useEffect(() => {
    setName(user.name);
    setBio(user.bio || '');
  }, [user]);

  const handleSaveProfile = () => {
    onUpdateUser({ ...user, name, bio });
    alert("Profile context updated. Thakur will remember this.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors 
        ${isDarkMode ? 'bg-slate-900 text-slate-100 border border-slate-800' : 'bg-white text-black'}`}>
        <div className={`px-6 py-5 flex items-center justify-between border-b flex-shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <h2 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-black'}`}>Settings & Sadhan</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-black hover:bg-gray-100'}`}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto scrollbar-hide">
          <section className="space-y-6">
              {/* Profile Section */}
              <div className="space-y-4">
                <h3 className={`text-xs font-black uppercase tracking-[0.3em] text-orange-600`}>Personal Context</h3>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Your Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-white' : 'bg-gray-50 border-gray-100 text-black focus:border-black'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Life Bio / Spiritual Context</label>
                  <textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="E.g. Seeking peace..."
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border outline-none transition-all resize-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-white' : 'bg-gray-50 border-gray-100 text-black focus:border-black'}`}
                  />
                </div>
                <button 
                  onClick={handleSaveProfile}
                  className="w-full py-2.5 rounded-xl bg-orange-600/10 text-orange-600 text-xs font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all"
                >
                  Save Profile Context
                </button>
              </div>

              {/* Voice Assistant Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Voice Assistant</p>
                    <i className="fa-solid fa-microphone-lines text-orange-500 text-xs"></i>
                  </div>
                  <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Say "THAKUR" to activate</p>
                </div>
                <button 
                  onClick={() => setIsVoiceAssistantEnabled(!isVoiceAssistantEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isVoiceAssistantEnabled ? 'bg-orange-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isVoiceAssistantEnabled ? 'translate-x-6' : ''}`}></div>
                </button>
              </div>

              {/* Rama-Nama Nudge Section */}
              <div className={`flex flex-col space-y-4 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Rama-Nama Nudge</p>
                      <i className="fa-solid fa-bell text-orange-500 text-xs"></i>
                    </div>
                    <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Regular vibrational checks</p>
                  </div>
                  <button 
                    onClick={() => setRemindersEnabled(!remindersEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${remindersEnabled ? 'bg-orange-600' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${remindersEnabled ? 'translate-x-6' : ''}`}></div>
                  </button>
                </div>

                {remindersEnabled && (
                  <div className="animate-fade-in space-y-4 px-1">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Interval (Minutes)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="1440"
                        value={reminderInterval}
                        onChange={(e) => setReminderInterval(parseInt(e.target.value) || 1)}
                        className={`w-full px-4 py-2 rounded-xl text-sm font-bold border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-white' : 'bg-gray-50 border-gray-100 text-black focus:border-black'}`}
                      />
                    </div>
                    <button 
                      onClick={onTriggerManualReminder}
                      className={`w-full py-2.5 rounded-xl border-2 border-dashed font-black text-[10px] uppercase tracking-[0.2em] transition-colors ${isDarkMode ? 'border-slate-700 text-slate-500 hover:bg-slate-800' : 'border-orange-200 text-orange-600 hover:bg-orange-50'}`}
                    >
                      Trigger Manual Nudge
                    </button>
                  </div>
                )}
              </div>

              {/* Fast Responses Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Fast AI Responses</p>
                    <i className="fa-solid fa-bolt text-blue-400 text-xs"></i>
                  </div>
                  <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Low-latency Flash model</p>
                </div>
                <button 
                  onClick={() => setIsFastMode(!isFastMode)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isFastMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isFastMode ? 'translate-x-6' : ''}`}></div>
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Dark Mode</p>
                </div>
                <button onClick={toggleDarkMode} className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isDarkMode ? 'bg-orange-600' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isDarkMode ? 'translate-x-6' : ''}`}></div>
                </button>
              </div>

              <div>
                <label className={`block text-sm font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-slate-400' : 'text-black'}`}>Primary Language</label>
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl text-base font-bold border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-100 text-black'}`}
                >
                  {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
              </div>
          </section>

          <section className="space-y-4">
            <div className="flex space-x-3">
              <button 
                onClick={() => { if(confirm("Clear Archive?")) onClearHistory(); onClose(); }} 
                className="flex-1 py-3.5 border border-red-100 text-red-600 hover:bg-red-50 rounded-2xl text-sm font-bold uppercase tracking-wider transition-colors"
              >
                Clear History
              </button>
              <button onClick={onLogout} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-wider transition-colors ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-gray-50 text-black hover:bg-gray-100'}`}>
                Sign Out
              </button>
            </div>
          </section>

          <button onClick={onClose} className="w-full py-4 bg-orange-600 text-white hover:bg-orange-700 rounded-2xl font-bold text-base uppercase tracking-widest shadow-lg transition-all">
            Return to Sadhana
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;