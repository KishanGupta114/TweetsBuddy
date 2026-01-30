
import { GoogleGenAI, Type } from "@google/genai";
import { Category, Tweet } from "../types";

export class GeminiService {
  private getClient() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Gemini API Key is missing! Please set API_KEY in your environment variables.");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  private extractJson(text: string): any[] {
    try {
      // Find the first '[' and last ']' to extract the JSON array
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

  private async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || "";
      const isRateLimit = errorMsg.includes('429') || error?.status === 429;
      
      if (isRateLimit && retries > 0) {
        console.warn(`Rate limit hit (429). Retrying in ${delay}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  async fetchViralContent(category: Category, time: string): Promise<Tweet[]> {
    return this.withRetry(async () => {
      const ai = this.getClient();
      if (!ai) return [];

      const prompt = `Find 6-8 of the most recent viral tech posts from X (formerly Twitter) about ${category === Category.ALL ? 'Software Engineering, AI, and Tech News' : category} from the last ${time}.
      
      Instructions:
      1. Use Google Search to find real, existing posts.
      2. Provide a variety of content: news, humor, and threads.
      3. For each item, provide: author name, a handle (no @), the tweet content, and a direct URL to the post.
      4. If you find a direct image URL (pbs.twimg.com), include it in 'imageUrl'. If not, leave it null.
      
      Output the results ONLY as a valid JSON array of objects with keys: author, handle, content, url, imageUrl, likes, retweets, replies, category.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          // NOTE: responseMimeType: "application/json" is NOT supported when using tools like googleSearch
        },
      });

      const text = response.text || "";
      const parsedData = this.extractJson(text);
      
      // Also extract grounding URLs as per guidelines
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((chunk: any) => chunk.web?.uri)
        .filter(Boolean);

      return parsedData.map((t: any) => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: 'Trending',
        category: t.category as Category || Category.TECH_INFO,
        isViral: true,
        // Optional: store sources if needed
        sources: sources.length > 0 ? sources : undefined
      }));
    });
  }

  async fetchMemeImages(): Promise<Tweet[]> {
    return this.withRetry(async () => {
      const ai = this.getClient();
      if (!ai) return [];

      const prompt = `Find 10-12 visual tech memes currently trending on X.com. 
      Focus on coding humor, AI jokes, and developer life.
      Return the data ONLY as a valid JSON array of objects with: author, handle, content, url, and imageUrl (must be a pbs.twimg.com link).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const parsedData = this.extractJson(response.text || "");
      return parsedData.map((t: any) => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        category: Category.MEME,
        timestamp: 'Hot',
        likes: 0, retweets: 0, replies: 0, isViral: true
      })).filter((t: any) => t.imageUrl);
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
