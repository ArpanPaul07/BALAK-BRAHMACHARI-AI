
import React, { useState, useEffect } from 'react';
import { Message, User } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGrayscale: boolean;
  messages: Message[];
  user: User;
  onClearHistory: () => void;
  onLogout: () => void;
  onUpdateUser: (updates: Partial<User>) => void;
  responseStyle: 'concise' | 'detailed';
  setResponseStyle: (style: 'concise' | 'detailed') => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isGrayscale,
  messages,
  user,
  onClearHistory,
  onLogout,
  onUpdateUser,
  responseStyle,
  setResponseStyle,
}) => {
  const [editingName, setEditingName] = useState(user.name);
  const [editingBio, setEditingBio] = useState(user.bio || '');
  const [isEditing, setIsEditing] = useState(false);

  // Sync state when user changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setEditingName(user.name);
      setEditingBio(user.bio || '');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    onUpdateUser({ name: editingName, bio: editingBio });
    setIsEditing(false);
  };

  const exportHistory = () => {
    const text = messages
      .map((m) => `${m.role.toUpperCase()} (${m.timestamp.toLocaleString()}): ${m.text}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thakur-ai-history-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform scale-100 max-h-[90vh] flex flex-col ${
          isGrayscale ? 'bg-white border-2 border-black' : 'bg-white'
        }`}
      >
        <div className={`px-6 py-4 flex items-center justify-between border-b flex-shrink-0 ${isGrayscale ? 'border-black' : 'border-gray-100'}`}>
          <h2 className={`font-bold text-lg ${isGrayscale ? 'text-black' : 'text-gray-800'}`}>Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto scrollbar-hide">
          {/* Profile Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-bold uppercase tracking-widest ${isGrayscale ? 'text-black' : 'text-orange-600'}`}>
                Your Profile
              </h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-1 rounded transition-colors ${
                    isGrayscale ? 'bg-black text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                  }`}
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            <div className={`p-4 rounded-2xl border transition-all ${isGrayscale ? 'border-black' : 'border-gray-100 bg-gray-50'}`}>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Spiritual Name / Display Name</label>
                    <input 
                      type="text" 
                      value={editingName} 
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Enter your name"
                      className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:ring-2 focus:outline-none transition-all ${
                        isGrayscale ? 'border-black focus:ring-black' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-100'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Your Spiritual Goal / Bio</label>
                    <textarea 
                      rows={2}
                      value={editingBio} 
                      onChange={(e) => setEditingBio(e.target.value)}
                      placeholder="e.g., Seeking mental peace and focus..."
                      className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:ring-2 focus:outline-none transition-all resize-none ${
                        isGrayscale ? 'border-black focus:ring-black' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-100'
                      }`}
                    />
                  </div>
                  <div className="flex space-x-2 pt-1">
                    <button 
                      onClick={handleSaveProfile}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isGrayscale ? 'bg-black text-white' : 'bg-orange-600 text-white hover:bg-orange-700'
                      }`}
                    >
                      Save Profile
                    </button>
                    <button 
                      onClick={() => { setIsEditing(false); setEditingName(user.name); setEditingBio(user.bio || ''); }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isGrayscale ? 'bg-white border border-black text-black' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-inner flex-shrink-0 ${
                    isGrayscale ? 'bg-black text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isGrayscale ? 'text-black' : 'text-gray-800'}`}>{user.name}</p>
                    <p className="text-[10px] text-gray-400 truncate mb-2">{user.email || 'Guest Santan'}</p>
                    {user.bio ? (
                      <p className="text-xs text-gray-600 italic leading-relaxed line-clamp-2">"{user.bio}"</p>
                    ) : (
                      <p className="text-[10px] text-gray-400 italic">No spiritual goal set yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* History Section */}
          <section>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isGrayscale ? 'text-black' : 'text-orange-600'}`}>
              Conversation History
            </h3>
            <div className="space-y-3">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${isGrayscale ? 'border-black bg-gray-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="text-sm">
                  <p className="font-semibold text-gray-700">{messages.length} Messages</p>
                  <p className="text-xs text-gray-400">Stored locally on your device</p>
                </div>
                <button 
                  onClick={onClearHistory}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isGrayscale ? 'bg-black text-white hover:bg-gray-800' : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  Clear All
                </button>
              </div>
              <button 
                onClick={exportHistory}
                className={`w-full py-2.5 rounded-xl border-2 flex items-center justify-center space-x-2 text-sm font-semibold transition-all ${
                  isGrayscale ? 'border-black hover:bg-black hover:text-white' : 'border-gray-100 hover:border-orange-200 hover:bg-orange-50 text-gray-700'
                }`}
              >
                <i className="fa-solid fa-download"></i>
                <span>Export Chat History (.txt)</span>
              </button>
            </div>
          </section>

          {/* Preferences Section */}
          <section>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isGrayscale ? 'text-black' : 'text-orange-600'}`}>
              Guidance Style
            </h3>
            <div className={`flex p-1 rounded-xl border ${isGrayscale ? 'border-black' : 'border-gray-100 bg-gray-50'}`}>
              <button 
                onClick={() => setResponseStyle('concise')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  responseStyle === 'concise' 
                    ? (isGrayscale ? 'bg-black text-white' : 'bg-white shadow-sm text-orange-600 border border-orange-100') 
                    : 'text-gray-400'
                }`}
              >
                Concise
              </button>
              <button 
                onClick={() => setResponseStyle('detailed')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  responseStyle === 'detailed' 
                    ? (isGrayscale ? 'bg-black text-white' : 'bg-white shadow-sm text-orange-600 border border-orange-100') 
                    : 'text-gray-400'
                }`}
              >
                Detailed
              </button>
            </div>
          </section>

          {/* Action Footer */}
          <div className="pt-2 space-y-3">
            <button 
              onClick={onLogout}
              className={`w-full py-3 rounded-2xl font-bold border-2 transition-all ${
                isGrayscale 
                  ? 'border-black text-black hover:bg-black hover:text-white' 
                  : 'border-orange-100 text-orange-600 hover:bg-orange-50'
              }`}
            >
              Sign Out
            </button>
            <button 
              onClick={onClose}
              className={`w-full py-3 rounded-2xl font-bold transition-all ${
                isGrayscale 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-100'
              }`}
            >
              Close Settings
            </button>
          </div>

          {/* Feedback & Disclaimer */}
          <section className={`pt-4 border-t space-y-4 ${isGrayscale ? 'border-black' : 'border-gray-100'}`}>
            <div className={`p-4 rounded-xl text-[10px] leading-relaxed ${isGrayscale ? 'bg-gray-100 border border-black text-black' : 'bg-orange-50 text-gray-600'}`}>
                <h4 className="font-bold uppercase mb-1">AI Disclaimer</h4>
                <p>AI can make mistakes. This tool is for spiritual reference based on Thakur's teachings and should not replace professional medical or mental health advice.</p>
            </div>

            <div className={`flex flex-col items-center space-y-3 ${isGrayscale ? 'text-black' : 'text-gray-500'}`}>
              <div className="flex items-start space-x-3 text-[11px]">
                <i className="fa-solid fa-comments text-lg mt-0.5"></i>
                <div>
                  <p className="font-bold">Share Feedback</p>
                  <a 
                    href="mailto:feedback@thakurai.example" 
                    className={`font-bold underline ${isGrayscale ? 'text-black' : 'text-orange-600'}`}
                  >
                    help us improve
                  </a>
                </div>
              </div>
              
              <div className="pt-4 border-t w-full flex flex-col items-center">
                <p className={`text-[8px] font-bold tracking-[0.2em] mb-1 ${isGrayscale ? 'text-black' : 'text-orange-600'}`}>
                   MADE WITH ❤️️ BY ARPAN PAUL
                </p>
                <p className="text-[7px] opacity-60 font-medium">
                  ( RAM NARAYAN RAM GLOBAL )
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
