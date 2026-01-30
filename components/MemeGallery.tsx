
import React from 'react';
import { Tweet } from '../types';

interface MemeGalleryProps {
  memes: Tweet[];
  isLoading: boolean;
}

const MemeGallery: React.FC<MemeGalleryProps> = ({ memes, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-900 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (memes.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 font-medium">
        No visual memes found at the moment.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 pb-10">
      {memes.map((meme) => (
        <div 
          key={meme.id} 
          className="group relative aspect-square bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer"
          onClick={() => window.open(meme.url, '_blank')}
        >
          <img 
            src={meme.imageUrl} 
            alt={meme.content} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider mb-1">@{meme.handle || meme.author}</p>
            <p className="text-white text-xs font-medium line-clamp-2 leading-tight">
              {meme.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MemeGallery;
