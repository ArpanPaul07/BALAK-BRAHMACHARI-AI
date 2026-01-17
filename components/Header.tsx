import React from 'react';

interface HeaderProps {
  isGrayscale: boolean;
  isDarkMode: boolean;
  toggleGrayscale: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onOpenBani: () => void;
  userTitle: string;
}

const Header: React.FC<HeaderProps> = ({ isGrayscale, isDarkMode, toggleGrayscale, onOpenSettings, onLogout, onOpenBani, userTitle }) => {
  return (
    <header className={`border-b sticky top-0 z-50 transition-colors safe-bottom 
      ${isGrayscale ? 'bg-white border-black' : isDarkMode ? 'bg-[#020617]/80 backdrop-blur-xl border-slate-800' : 'bg-white border-gray-100'}
    `}>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl shadow-lg transition-all flex items-center justify-center flex-shrink-0 ${isGrayscale ? 'bg-black' : 'bg-orange-600'}`}>
            <i className="fa-solid fa-om text-white text-lg sm:text-2xl"></i>
          </div>
          <div className="min-w-0">
            <h1 className={`font-black text-xs sm:text-base leading-none uppercase tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
              THAKUR BALAK BRAHMACHARI AI
            </h1>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${isDarkMode ? 'bg-orange-950 text-orange-500' : 'bg-orange-100 text-orange-700'}`}>
                {userTitle}
              </span>
              <p className="text-[8px] font-bold tracking-widest uppercase opacity-40">Vedic Science</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button onClick={onOpenBani} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
            <i className="fa-solid fa-sun text-sm"></i>
          </button>
          
          <button onClick={toggleGrayscale} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
            <i className="fa-solid fa-circle-half-stroke text-sm"></i>
          </button>
          
          <button onClick={onOpenSettings} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
            <i className="fa-solid fa-gear text-sm"></i>
          </button>

          <button onClick={onLogout} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
            <i className="fa-solid fa-right-from-bracket text-sm"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;