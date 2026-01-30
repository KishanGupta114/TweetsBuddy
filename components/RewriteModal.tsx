
import React, { useState, useEffect } from 'react';
import { Tweet } from '../types';
import { geminiService } from '../services/geminiService';

interface RewriteModalProps {
  tweet: Tweet;
  onClose: () => void;
}

const RewriteModal: React.FC<RewriteModalProps> = ({ tweet, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<{ professional: string; casual: string; humorous: string } | null>(null);

  useEffect(() => {
    const loadRewrites = async () => {
      setLoading(true);
      const data = await geminiService.rewriteTweet(tweet.content);
      setVariants(data);
      setLoading(false);
    };
    loadRewrites();
  }, [tweet.content]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Variant copied!');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-[#111] w-full max-w-xl rounded-t-3xl sm:rounded-3xl border border-gray-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black">AI Rewrite</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Original</label>
            <div className="p-3 bg-white/5 rounded-xl border border-gray-800 text-sm text-gray-300 italic">
              "{tweet.content}"
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 py-8 flex flex-col items-center">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400 font-medium">Generating viral variants...</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
              {[
                { label: 'Professional', text: variants?.professional, color: 'text-blue-400' },
                { label: 'Casual', text: variants?.casual, color: 'text-emerald-400' },
                { label: 'Viral/Humorous', text: variants?.humorous, color: 'text-orange-400' }
              ].map(v => (
                <div key={v.label} className="group relative bg-[#181818] p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all">
                  <div className={`text-xs font-black uppercase tracking-widest mb-2 ${v.color}`}>
                    {v.label}
                  </div>
                  <p className="text-white text-sm leading-relaxed mb-4">
                    {v.text}
                  </p>
                  <button 
                    onClick={() => copyToClipboard(v.text || '')}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                    <span>Copy Text</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewriteModal;
