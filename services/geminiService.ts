import { GoogleGenAI, Type } from "@google/genai";
import { Category, Tweet } from "../types";

interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache to save quota

export class GeminiService {
  private cache = new Map<string, CacheEntry>();

  private getClient() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Gemini API Key is missing!");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  private extractJson(text: string): any[] {
    try {
      // Find the start and end of the JSON array in the text
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
      }
      return [];
    } catch (e) {
      console.error("Failed to parse JSON from response:", e);
      return [];
    }
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 4000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || "";
      const isQuota = errorMsg.includes('429') || error?.status === 429 || errorMsg.includes('RESOURCE_EXHAUSTED');
      
      if (isQuota && retries > 0) {
        const jitter = Math.random() * 2000;
        console.warn(`Quota reached. Retrying in ${delay + jitter}ms... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
        return this.withRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private getCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry && (Date.now() - entry.timestamp) < CACHE_TTL) {
      return entry.data;
    }
    return null;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async fetchViralContent(category: Category, time: string): Promise<Tweet[]> {
    const cacheKey = `viral_${category}_${time}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const ai = this.getClient();
      if (!ai) return [];

      const prompt = `Find 6-8 of the most recent viral tech posts from X.com (Twitter) about ${category === Category.ALL ? 'Software Engineering, AI, and Tech News' : category} from the last ${time}.
      
      Instructions:
      - Use Google Search to find real, live posts.
      - Return ONLY a raw JSON array of objects.
      - Keys: author, handle, content, url, imageUrl, likes, retweets, replies, category.
      - Do not include markdown code blocks or extra text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          // CRITICAL: responseMimeType is NOT allowed with googleSearch tool
        },
      });

      const text = response.text || "";
      const parsedData = this.extractJson(text);
      
      const results = parsedData.map((t: any) => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: 'Trending',
        category: t.category as Category || Category.TECH_INFO,
        isViral: true,
      }));

      if (results.length > 0) this.setCache(cacheKey, results);
      return results;
    });
  }

  async fetchMemeImages(): Promise<Tweet[]> {
    const cacheKey = `memes_trending`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    return this.withRetry(async () => {
      const ai = this.getClient();
      if (!ai) return [];

      const prompt = `Find 10-12 real, visual tech memes trending on X.com right now. 
      Focus on coding humor and AI.
      Return ONLY a raw JSON array of objects with: author, handle, content, url, and imageUrl (must be a pbs.twimg.com link).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const parsedData = this.extractJson(response.text || "");
      const results = parsedData.map((t: any) => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        category: Category.MEME,
        timestamp: 'Hot',
        likes: 0, retweets: 0, replies: 0, isViral: true
      })).filter((t: any) => t.imageUrl);

      if (results.length > 0) this.setCache(cacheKey, results);
      return results;
    });
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
      } catch (e) {
        return { professional: content, casual: content, humorous: content };
      }
    });
  }
}

export const geminiService = new GeminiService();