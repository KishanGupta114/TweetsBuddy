
import { GoogleGenAI, Type } from "@google/genai";
import { Category, Tweet } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async fetchViralContent(category: Category, time: string): Promise<Tweet[]> {
    const prompt = `Find the most VIRAL and RECENT tech tweets and memes from the last ${time} on X (Twitter).
    
    Topic: ${category === Category.ALL ? 'Software engineering, AI, developer humor, and tech hardware news' : category}.

    CRITICAL DATA REQUIREMENTS:
    1. SEARCH: Use Google Search to find actual live posts on x.com.
    2. STATUS URL: Every item MUST have a direct URL: https://x.com/[username]/status/[numeric_id]. 
       If unsure of the ID, use: https://x.com/search?q=from:[handle] [snippet]
    3. MEDIA/IMAGES: Prioritize posts with visual content (memes, charts, code snippets). 
       You MUST find the direct image source URL (typically starting with https://pbs.twimg.com/media/...) and put it in 'imageUrl'.
       Do NOT provide website URLs or page links in the 'imageUrl' field. Only direct image files.
    4. HANDLE: The user handle without @.

    Return 6-8 items as a JSON array.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                author: { type: Type.STRING },
                handle: { type: Type.STRING, description: "Username without @" },
                content: { type: Type.STRING },
                url: { type: Type.STRING, description: "Direct status link or precise search link" },
                imageUrl: { type: Type.STRING, description: "Direct image file URL (e.g. pbs.twimg.com)" },
                likes: { type: Type.NUMBER },
                retweets: { type: Type.NUMBER },
                replies: { type: Type.NUMBER },
                category: { type: Type.STRING },
              },
              required: ['author', 'handle', 'content', 'url', 'category']
            }
          }
        },
      });

      const text = response.text || '[]';
      const parsedData = JSON.parse(text);
      
      return parsedData.map((t: any) => {
        let finalUrl = t.url ? t.url.trim() : '';
        const isDirectStatus = /x\.com\/.+\/status\/\d+/.test(finalUrl);
        
        if (!isDirectStatus) {
          const cleanContent = t.content.replace(/[^\w\s]/gi, '').substring(0, 40);
          finalUrl = `https://x.com/search?q=${encodeURIComponent(`from:${t.handle} ${cleanContent}`)}&f=live`;
        }

        let validatedImageUrl = undefined;
        if (t.imageUrl && typeof t.imageUrl === 'string' && t.imageUrl.startsWith('http')) {
          const isDirectImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(t.imageUrl) || t.imageUrl.includes('twimg.com');
          if (isDirectImage) {
            validatedImageUrl = t.imageUrl;
          }
        }

        return {
          ...t,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: 'Trending Now',
          category: t.category as Category || Category.TECH_INFO,
          isViral: true,
          url: finalUrl,
          imageUrl: validatedImageUrl
        };
      });
    } catch (error) {
      console.error("Error fetching content:", error);
      return [];
    }
  }

  async fetchMemeImages(): Promise<Tweet[]> {
    const prompt = `Search for the latest, most popular visual tech memes on X (Twitter).
    Focus specifically on: Programming humor, IT struggles, Computer Science jokes, and AI memes.
    
    CRITICAL: Only return items that have a direct image URL (pbs.twimg.com). 
    I need visual content only.
    
    Return 12 items as a JSON array.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                author: { type: Type.STRING },
                handle: { type: Type.STRING },
                content: { type: Type.STRING },
                url: { type: Type.STRING },
                imageUrl: { type: Type.STRING, description: "MUST be a direct pbs.twimg.com image URL" },
              },
              required: ['author', 'imageUrl', 'url']
            }
          }
        },
      });

      const parsedData = JSON.parse(response.text || '[]');
      return parsedData.map((t: any) => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        category: Category.MEME,
        timestamp: 'Hot',
        likes: 0, retweets: 0, replies: 0, isViral: true
      })).filter((t: any) => t.imageUrl);
    } catch (error) {
      console.error("Error fetching memes:", error);
      return [];
    }
  }

  async rewriteTweet(content: string): Promise<{ professional: string; casual: string; humorous: string }> {
    const prompt = `Rewrite this tech tweet in 3 styles (Professional, Casual, Humorous): "${content}"`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
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

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Error rewriting tweet:", error);
      return { professional: content, casual: content, humorous: content };
    }
  }
}

export const geminiService = new GeminiService();
