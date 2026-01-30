
import React from 'react';

interface HeaderProps {
  activeTab?: 'feed' | 'memes';
  setActiveTab?: (tab: 'feed' | 'memes') => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800 h-14 flex items-center justify-between px-4">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center rotate-3 shadow-lg shadow-blue-500/20">
          <span className="text-white font-black text-xl italic">X</span>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight hidden sm:block">Viral Tech</h1>
      </div>

      {setActiveTab && (
        <nav className="flex bg-gray-900 rounded-full p-1 border border-gray-800">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
              activeTab === 'feed' 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Feed
          </button>
          <button 
            onClick={() => setActiveTab('memes')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
              activeTab === 'memes' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Memes 🔥
          </button>
        </nav>
      )}

      <div className="w-8"></div>
    </header>
  );
};

export default Header;
