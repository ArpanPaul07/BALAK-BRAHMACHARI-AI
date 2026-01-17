
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface User {
  id: string;
  email?: string;
  name: string;
  isGuest: boolean;
  bio?: string;
  sadhanaStreak: number;
  lastVisitDate?: string;
}

export interface Message {
  role: Role;
  text: string;
  timestamp: Date;
  groundingChunks?: any[];
  imageUrl?: string;
}

export interface TeachingSnippet {
  title: string;
  content: string;
}
