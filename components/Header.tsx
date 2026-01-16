
import React from 'react';

interface HeaderProps {
  isGrayscale: boolean;
  toggleGrayscale: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isGrayscale, toggleGrayscale, onOpenSettings, onLogout }) => {
  return (
    <header className={`border-b sticky top-0 z-50 transition-colors ${isGrayscale ? 'bg-white border-black' : 'bg-white border-gray-200'}`}>
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl shadow-lg transition-all ${isGrayscale ? 'bg-black shadow-black/20' : 'bg-orange-500 shadow-orange-200'}`}>
            <i className="fa-solid fa-om text-white text-xl"></i>
          </div>
          <div>
            <h1 className={`font-bold text-lg leading-tight uppercase tracking-tight ${isGrayscale ? 'text-black' : 'text-gray-800'}`}>
              Thakur Balak Brahmachari AI
            </h1>
            <p className={`text-[10px] font-bold tracking-widest uppercase ${isGrayscale ? 'text-black/70' : 'text-orange-600'}`}>Vedic Science Guide</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleGrayscale}
            title="Toggle Black & White Mode"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isGrayscale 
              ? 'bg-black text-white hover:bg-gray-800' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <i className={`fa-solid ${isGrayscale ? 'fa-circle-half-stroke' : 'fa-circle-half-stroke rotate-180'}`}></i>
          </button>
          
          <button 
            onClick={onOpenSettings}
            title="Settings"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isGrayscale 
              ? 'bg-white border-2 border-black text-black hover:bg-gray-50' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <i className="fa-solid fa-gear"></i>
          </button>

          <button 
            onClick={onLogout}
            title="Sign Out"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isGrayscale 
              ? 'bg-white border-2 border-black text-black hover:bg-gray-50' 
              : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
