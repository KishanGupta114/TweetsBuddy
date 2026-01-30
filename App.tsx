
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
  const [rewritingTweet, setRewritingTweet] = useState<Tweet | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    if (activeTab === 'feed') {
      const data = await geminiService.fetchViralContent(category, timeRange);
      setTweets(data);
    } else {
      const data = await geminiService.fetchMemeImages();
      setMemes(data);
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
        {activeTab === 'memes' ? (
          <MemeGallery memes={memes} isLoading={isLoading} />
        ) : (
          <>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium">Scanning X for real-time tech gems...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tweets.length > 0 ? (
                  tweets.map(tweet => (
                    <TweetCard 
                      key={tweet.id} 
                      tweet={tweet} 
                      onRewrite={() => handleRewrite(tweet)}
                    />
                  ))
                ) : (
                  <div className="text-center py-20 text-gray-500 font-medium">
                    No viral content found. Try refreshing or changing filters.
                  </div>
                )}
              </div>
            )}
          </>
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
