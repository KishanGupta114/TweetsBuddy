import { GoogleGenAI, Type } from "@google/genai";
import { Category, Tweet } from "../types";

interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes persistent cache
const STORAGE_PREFIX = 'x_viral_cache_';

export class GeminiService {
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

  private async withRetry<T>(fn: () => Promise<T>, cacheKey: string, retries = 2, delay = 5000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isQuota = errorMsg.includes('429') || error?.status === 429 || errorMsg.includes('RESOURCE_EXHAUSTED');
      
      // If we hit a rate limit and have cached data (even if expired), return it as a fallback
      const staleData = this.getCache(cacheKey, true);
      if (isQuota && staleData) {
        console.warn("429 Hit. Serving stale data from cache.");
        return staleData as T;
      }

      if (isQuota && retries > 0) {
        const jitter = Math.random() * 2000;
        await new Promise(r => setTimeout(r, delay + jitter));
        return this.withRetry(fn, cacheKey, retries - 1, delay * 2);
      }
      throw error;
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
      console.warn("Storage full or unavailable", e);
    }
  }

  async fetchViralContent(category: Category, time: string): Promise<Tweet[]> {
    const cacheKey = `viral_${category}_${time}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const ai = this.getClient();
      if (!ai) return [];

      const prompt = `Find 6-8 viral tech posts from X (Twitter) about ${category === Category.ALL ? 'Tech' : category} in the last ${time}. 
      Use Google Search. Return ONLY a JSON array of objects with: author, handle, content, url, imageUrl, likes, retweets, replies, category.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 0 } // Optimization: disable thinking to save latency/tokens
        },
      });

      const results = this.extractJson(response.text || "").map(t => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9),
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
    if (cached) return cached;

    return this.withRetry(async () => {
      const ai = this.getClient();
      if (!ai) return [];

      const prompt = `Find 10 trending visual tech memes on X. Return ONLY JSON array: author, handle, content, url, imageUrl (pbs.twimg.com).`;

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
    }, `rewrite_${content.substring(0, 20)}`);
  }
}

export const geminiService = new GeminiService();