
import React from 'react';
import { Category, TimeRange } from '../types';

interface FiltersProps {
  category: Category;
  setCategory: (c: Category) => void;
  timeRange: TimeRange;
  setTimeRange: (t: TimeRange) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const Filters: React.FC<FiltersProps> = ({ 
  category, 
  setCategory, 
  timeRange, 
  setTimeRange, 
  onRefresh, 
  isLoading 
}) => {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {Object.values(Category).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              category === cat 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      
      <div className="flex items-center justify-between border-t border-gray-800 pt-2">
        <div className="flex bg-white/5 rounded-lg p-1">
          {Object.values(TimeRange).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                timeRange === range 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
        
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-1 text-blue-500 text-sm font-bold hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default Filters;
