
import React, { useState, useEffect, useCallback } from 'react';
import { Category, TimeRange, Tweet } from './types';
import { geminiService } from './services/geminiService';
import Header from './components/Header';
import Filters from './components/Filters';
import TweetCard from './components/TweetCard';
import MemeGallery from './components/MemeGallery';
import RewriteModal from './components/RewriteModal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'memes'>('feed');
  const [category, setCategory] = useState<Category>(Category.ALL);
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.H24);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [memes, setMemes] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [rewritingTweet, setRewritingTweet] = useState<Tweet | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsRetrying(false);
    
    try {
      if (activeTab === 'feed') {
        const data = await geminiService.fetchViralContent(category, timeRange);
        setTweets(data);
        if (data.length === 0) {
          setError("No viral content found. Try changing filters.");
        }
      } else {
        const data = await geminiService.fetchMemeImages();
        setMemes(data);
        if (data.length === 0) {
          setError("No memes found at this moment.");
        }
      }
    } catch (e: any) {
      if (e?.message?.includes('429') || e?.status === 429) {
        setError("High traffic: The AI is busy. We tried retrying, but the limit is still active. Please wait a minute.");
      } else {
        setError("Something went wrong. Check your API key or connection.");
      }
      console.error("Fetch Error:", e);
    }
    setIsLoading(false);
  }, [category, timeRange, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRewrite = (tweet: Tweet) => {
    setRewritingTweet(tweet);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-gray-800 relative">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'feed' && (
        <div className="sticky top-[56px] bg-black/80 backdrop-blur-md z-40 border-b border-gray-800 px-4 py-2">
          <Filters 
            category={category} 
            setCategory={setCategory} 
            timeRange={timeRange} 
            setTimeRange={setTimeRange}
            onRefresh={fetchData}
            isLoading={isLoading}
          />
        </div>
      )}

      <main className="flex-1 pb-10 overflow-y-auto custom-scrollbar px-4 pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium animate-pulse text-center px-6">
              {isRetrying ? "Retrying due to high traffic..." : "Gemini is searching X for real-time gems..."}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-20 px-6">
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
              <p className="text-red-400 font-bold mb-4">{error}</p>
              <button 
                onClick={fetchData}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
              >
                Try Again Now
              </button>
            </div>
          </div>
        ) : activeTab === 'memes' ? (
          <MemeGallery memes={memes} isLoading={isLoading} />
        ) : (
          <div className="space-y-4">
            {tweets.map(tweet => (
              <TweetCard 
                key={tweet.id} 
                tweet={tweet} 
                onRewrite={() => handleRewrite(tweet)}
              />
            ))}
          </div>
        )}
      </main>

      {rewritingTweet && (
        <RewriteModal 
          tweet={rewritingTweet} 
          onClose={() => setRewritingTweet(null)} 
        />
      )}
    </div>
  );
};

export default App;
