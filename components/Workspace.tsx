import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { TEACHINGS } from '../constants';

interface WorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (user: User) => void;
  isDarkMode: boolean;
}

const Workspace: React.FC<WorkspaceProps> = ({ isOpen, onClose, user, onUpdateUser, isDarkMode }) => {
  const [notes, setNotes] = useState(user.notes || '');
  const [newTaskText, setNewTaskText] = useState('');
  const [sankalpa, setSankalpa] = useState(user.sankalpa || [
    { id: '1', text: '5 mins Rama-Nama Chanting', completed: false },
    { id: '2', text: 'Read one chapter of E-Book', completed: false },
    { id: '3', text: 'Maintain mental calm during work', completed: false }
  ]);

  // Sync state if user prop changes externally
  useEffect(() => {
    if (user.sankalpa) setSankalpa(user.sankalpa);
  }, [user.sankalpa]);

  // Daily teaching selection
  const dailyTeachingKey = Object.keys(TEACHINGS)[new Date().getDate() % Object.keys(TEACHINGS).length];
  const dailyTeaching = TEACHINGS[dailyTeachingKey];

  const handleSaveNotes = () => {
    onUpdateUser({ ...user, notes });
  };

  const toggleSankalpa = (id: string) => {
    const updated = sankalpa.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    setSankalpa(updated);
    onUpdateUser({ ...user, sankalpa: updated });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    };

    const updated = [...sankalpa, newTask];
    setSankalpa(updated);
    onUpdateUser({ ...user, sankalpa: updated });
    setNewTaskText('');
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sankalpa.filter(s => s.id !== id);
    setSankalpa(updated);
    onUpdateUser({ ...user, sankalpa: updated });
  };

  if (!isOpen) return null;

  const streakPercent = Math.min((user.sadhanaStreak / 7) * 100, 100);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/50 backdrop-blur-xl animate-fade-in">
      <div className={`flex-1 w-full max-w-5xl mx-auto flex flex-col shadow-2xl overflow-hidden sm:my-8 sm:rounded-[3rem] transition-colors ${isDarkMode ? 'bg-[#020617] text-white border border-slate-800' : 'bg-white text-gray-900'}`}>
        
        {/* Workspace Header */}
        <div className={`px-6 py-6 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
              <i className="fa-solid fa-scroll text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Sadhana Workspace</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Your Personal Spiritual Lab</p>
            </div>
          </div>
          <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scrollbar-hide">
          
          {/* Top Grid: Progress & Teaching */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-[2.5rem] border transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-orange-50/50 border-orange-100'}`}>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-orange-600">Sadhana Status</h3>
              <div className="flex items-end justify-between mb-2">
                <span className="text-4xl font-black">{user.sadhanaStreak} <span className="text-sm font-bold opacity-40">Days</span></span>
                <span className="text-xs font-black uppercase tracking-widest text-orange-600">{user.sadhanaStreak >= 7 ? 'Sevak' : 'Santan'}</span>
              </div>
              <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${streakPercent}%` }}></div>
              </div>
              <p className="mt-4 text-[10px] font-bold opacity-50 uppercase tracking-widest">
                {user.sadhanaStreak >= 7 ? 'Milestone Reached!' : `${7 - user.sadhanaStreak} days until Sevak status`}
              </p>
            </div>

            <div className={`md:col-span-2 p-6 rounded-[2.5rem] border transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-gray-50 border-gray-100'}`}>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-orange-600">Daily Tattwa Focus</h3>
              <p className="text-base font-bold italic leading-relaxed">"{dailyTeaching}"</p>
              <div className="mt-4 flex items-center space-x-2">
                <span className="px-3 py-1 bg-orange-600/10 text-orange-600 text-[9px] font-black rounded-full uppercase tracking-widest">{dailyTeachingKey}</span>
              </div>
            </div>
          </div>

          {/* Main Grid: Journal & Sankalpa */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Journal Area */}
            <div className="lg:col-span-3 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">Daily Nivedan (Journal)</h3>
                <button 
                  onClick={handleSaveNotes}
                  className="text-[10px] font-black uppercase tracking-widest bg-orange-600 text-white px-4 py-1.5 rounded-full hover:scale-105 transition-all"
                >
                  Save Entry
                </button>
              </div>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record your spiritual realizations or prayers here..."
                className={`w-full flex-1 min-h-[300px] p-6 rounded-[2.5rem] border outline-none resize-none text-base leading-relaxed transition-all shadow-inner focus:ring-2 focus:ring-orange-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-slate-700' : 'bg-white border-gray-100 text-gray-700 focus:border-orange-200'}`}
              />
            </div>

            {/* Checklist Area */}
            <div className="lg:col-span-2 flex flex-col space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">Today's Sankalpa</h3>
              
              {/* Add Task Input */}
              <form onSubmit={handleAddTask} className="flex space-x-2">
                <input 
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="New Resolution..."
                  className={`flex-1 px-4 py-3 rounded-2xl border outline-none text-sm font-bold tracking-tight transition-all focus:ring-2 focus:ring-orange-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-slate-700' : 'bg-gray-50 border-gray-100 text-gray-700 focus:border-orange-200'}`}
                />
                <button 
                  type="submit"
                  className="w-11 h-11 rounded-2xl bg-orange-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-600/20"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </form>

              <div className="space-y-3 pt-2">
                {sankalpa.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => toggleSankalpa(item.id)}
                    className={`group w-full p-4 rounded-2xl border flex items-center space-x-4 transition-all text-left cursor-pointer ${item.completed ? 'opacity-50 line-through scale-[0.98]' : 'hover:scale-[1.01]'} ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-100 shadow-sm'}`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${item.completed ? 'bg-orange-600 border-orange-600' : 'border-orange-500/30'}`}>
                      {item.completed && <i className="fa-solid fa-check text-white text-xs"></i>}
                    </div>
                    <span className="flex-1 text-sm font-bold uppercase tracking-tight">{item.text}</span>
                    <button 
                      onClick={(e) => deleteTask(item.id, e)}
                      className="opacity-0 group-hover:opacity-40 hover:!opacity-100 text-red-500 transition-opacity p-1"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                ))}
                
                {sankalpa.length === 0 && (
                  <div className={`p-8 rounded-2xl border border-dashed text-center opacity-30 ${isDarkMode ? 'border-slate-700' : 'border-gray-300'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest">No active resolutions</p>
                  </div>
                )}
              </div>

              {/* Inspiration Quote */}
              <div className={`mt-auto p-6 rounded-[2rem] text-center border ${isDarkMode ? 'bg-orange-950/20 border-orange-900/30' : 'bg-orange-50 border-orange-100'}`}>
                <i className="fa-solid fa-quote-left text-orange-600/30 text-2xl mb-2"></i>
                <p className="text-xs font-bold leading-relaxed opacity-70 italic">
                  "One should chant and spread this vibration anywhere and everywhere, at any time."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className={`px-8 py-4 border-t text-center ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
           <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30">Ram Narayan Ram • Workspace • Ram Narayan Ram</p>
        </div>
      </div>
    </div>
  );
};

export default Workspace;