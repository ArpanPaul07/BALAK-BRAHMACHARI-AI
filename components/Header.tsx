
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
    <header className={`border-b sticky top-0 z-50 transition-colors 
      ${isGrayscale ? 'bg-white border-black' : isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}
    `}>
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl shadow-lg transition-all ${isGrayscale ? 'bg-black' : 'bg-orange-500'}`}>
            <i className="fa-solid fa-om text-white text-xl"></i>
          </div>
          <div>
            <h1 className={`font-bold text-lg leading-tight uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
              THAKUR BALAK BRAHMACHARI AI
            </h1>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${isGrayscale ? 'bg-black text-white' : isDarkMode ? 'bg-orange-950 text-orange-500' : 'bg-orange-100 text-orange-700'}`}>
                {userTitle}
              </span>
              <p className={`text-[8px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Vedic Science</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onOpenBani}
            title="Wisdom"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-orange-500' : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'}`}
          >
            <i className="fa-solid fa-sun"></i>
          </button>

          <button 
            onClick={toggleGrayscale}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-gray-100 text-gray-600'}`}
          >
            <i className={`fa-solid ${isGrayscale ? 'fa-circle-half-stroke' : 'fa-circle-half-stroke rotate-180'}`}></i>
          </button>
          
          <button onClick={onOpenSettings} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-gray-100 text-gray-600'}`}>
            <i className="fa-solid fa-gear"></i>
          </button>

          <button onClick={onLogout} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-red-950/30 text-red-500' : 'bg-red-50 text-red-600'}`}>
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
