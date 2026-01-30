
export enum Category {
  ALL = 'All',
  MEME = 'Meme',
  TECH_INFO = 'Tech Info',
  THREAD = 'Thread'
}

export enum TimeRange {
  H1 = '1h',
  H6 = '6h',
  H24 = '24h'
}

export interface Tweet {
  id: string;
  author: string;
  handle: string;
  content: string;
  url: string;
  imageUrl?: string; // New field for tweet images
  likes: number;
  retweets: number;
  replies: number;
  timestamp: string;
  category: Category;
  isViral: boolean;
  rewriteHistory?: string[];
}

export interface RewriteOption {
  type: 'Professional' | 'Casual' | 'Humorous';
  text: string;
}
