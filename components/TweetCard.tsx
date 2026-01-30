
import React, { useState } from 'react';
import { Category, Tweet } from '../types';

interface TweetCardProps {
  tweet: Tweet;
  onRewrite: () => void;
}

const TweetCard: React.FC<TweetCardProps> = ({ tweet, onRewrite }) => {
  const [imgError, setImgError] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tweet.content);
    alert('Copied to clipboard!');
  };

  // Helper to check if URL is likely a valid direct image link
  const isValidDirectImageUrl = (url?: string) => {
    if (!url) return false;
    return url.startsWith('http') && (url.includes('twimg.com') || /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url));
  };

  return (
    <div className="bg-[#111] border border-gray-800 rounded-2xl p-5 transition-all hover:border-blue-500/30 active:scale-[0.99] group overflow-hidden shadow-lg shadow-black/20">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex-shrink-0 flex items-center justify-center font-bold text-xl border border-gray-700 text-gray-300">
          {tweet.author?.[0] || 'X'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="font-bold text-white text-base leading-tight truncate">{tweet.author}</span>
              <span className="text-gray-500 text-sm truncate">{tweet.handle ? `@${tweet.handle}` : `@${tweet.author.toLowerCase().replace(/\s/g, '')}`}</span>
            </div>
          </div>
          
          <p className="text-white text-[16px] leading-relaxed whitespace-pre-wrap mb-4 font-medium">
            {tweet.content}
          </p>

          {tweet.imageUrl && !imgError && isValidDirectImageUrl(tweet.imageUrl) && (
            <div className="mb-4 rounded-xl overflow-hidden border border-gray-800 bg-black/40">
              <img 
                src={tweet.imageUrl} 
                alt="Tweet media" 
                className="w-full h-auto max-h-[450px] object-contain block mx-auto cursor-pointer"
                onClick={() => window.open(tweet.url, '_blank')}
                onError={() => setImgError(true)}
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/50">
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                tweet.category === Category.MEME 
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {tweet.category}
              </span>
              <span className="text-gray-600 text-[10px] font-bold uppercase">{tweet.timestamp}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={onRewrite} 
                className="flex items-center space-x-1 p-2 bg-gray-800/50 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all border border-transparent hover:border-blue-500/30"
                title="AI Rewrite"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                <span className="text-[10px] font-bold uppercase pr-1">Remix</span>
              </button>
              <button 
                onClick={copyToClipboard} 
                className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-xl transition-all border border-transparent" 
                title="Copy Text"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;
