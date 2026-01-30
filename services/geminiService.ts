import { GoogleGenAI, Type } from "@google/genai";
import { Category, Tweet } from "../types";

interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache
const SEARCH_THROTTLE = 30 * 1000; // 30 seconds between actual API searches
const STORAGE_PREFIX = 'x_viral_cache_v2_';

export class GeminiService {
  private lastRequestTime = 0;
  private isRequestInProgress = false;

  private getClient() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  private extractJson(text: string): any[] {
    try {
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        return JSON.parse(text.substring(start, end + 1));
      }
      return [];
    } catch (e) {
      console.error("JSON extraction failed:", e);
      return [];
    }
  }

  private async withRetry<T>(fn: () => Promise<T>, cacheKey: string, retries = 3, delay = 10000): Promise<T> {
    // Prevent multiple simultaneous requests
    while (this.isRequestInProgress) {
      await new Promise(r => setTimeout(r, 500));
    }

    try {
      this.isRequestInProgress = true;
      const result = await fn();
      this.lastRequestTime = Date.now();
      return result;
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isQuota = errorMsg.includes('429') || error?.status === 429 || errorMsg.includes('RESOURCE_EXHAUSTED');
      
      const staleData = this.getCache(cacheKey, true);
      if (isQuota && staleData) {
        console.warn("Rate limit reached. Serving stale data.");
        return staleData as T;
      }

      if (isQuota && retries > 0) {
        const jitter = Math.random() * 5000;
        await new Promise(r => setTimeout(r, delay + jitter));
        return this.withRetry(fn, cacheKey, retries - 1, delay * 1.5);
      }
      throw error;
    } finally {
      this.isRequestInProgress = false;
    }
  }

  private getCache(key: string, ignoreTTL = false): any | null {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      if (!item) return null;
      const entry: CacheEntry = JSON.parse(item);
      if (ignoreTTL || (Date.now() - entry.timestamp) < CACHE_TTL) {
        return entry.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  private setCache(key: string, data: any) {
    try {
      const entry: CacheEntry = { data, timestamp: Date.now() };
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      console.warn("LocalStorage failed", e);
    }
  }

  async fetchViralContent(category: Category, time: string): Promise<Tweet[]> {
    const cacheKey = `viral_${category}_${time}`;
    const cached = this.getCache(cacheKey);
    
    // Throttle: If we have a cache and it's too soon since the last API call, just use the cache
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (cached && timeSinceLastRequest < SEARCH_THROTTLE) {
      console.debug("Throttled: Using cache to save quota.");
      return cached;
    }

    return this.withRetry(async () => {
      const ai = this.getClient();
      if (!ai) return [];

      const prompt = `Find 6-8 trending tech posts on X (Twitter) about ${category === Category.ALL ? 'Software & AI' : category} from the last ${time}. 
      Return ONLY a JSON array: author, handle, content, url, imageUrl, likes, retweets, replies. No markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 0 }
        },
      });

      const results = this.extractJson(response.text || "").map(t => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        category: category === Category.ALL ? Category.TECH_INFO : category,
        timestamp: 'Trending',
        isViral: true
      }));

      if (results.length > 0) this.setCache(cacheKey, results);
      return results;
    }, cacheKey);
  }

  async fetchMemeImages(): Promise<Tweet[]> {
    const cacheKey = `memes_trending`;
    const cached = this.getCache(cacheKey);
    
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (cached && timeSinceLastRequest < SEARCH_THROTTLE) {
      return cached;
    }

    return this.withRetry(async () => {
      const ai = this.getClient();
      if (!ai) return [];

      const prompt = `Find 8 hot visual tech memes on X. Return ONLY JSON array: author, handle, content, url, imageUrl (must be pbs.twimg.com).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 0 }
        },
      });

      const results = this.extractJson(response.text || "").map(t => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        category: Category.MEME,
        timestamp: 'Hot',
        isViral: true
      })).filter(t => t.imageUrl);

      if (results.length > 0) this.setCache(cacheKey, results);
      return results;
    }, cacheKey);
  }

  async rewriteTweet(content: string): Promise<{ professional: string; casual: string; humorous: string }> {
    return this.withRetry(async () => {
      const ai = this.getClient();
      if (!ai) return { professional: content, casual: content, humorous: content };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Rewrite this tweet in Professional, Casual, and Humorous styles: "${content}"`,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              professional: { type: Type.STRING },
              casual: { type: Type.STRING },
              humorous: { type: Type.STRING }
            },
            required: ['professional', 'casual', 'humorous']
          }
        }
      });

      try {
        return JSON.parse(response.text || '{}');
      } catch {
        return { professional: content, casual: content, humorous: content };
      }
    }, `rewrite_${content.substring(0, 15)}`);
  }
}

export const geminiService = new GeminiService();