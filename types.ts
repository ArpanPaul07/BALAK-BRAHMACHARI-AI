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
  preferences?: string;
  sadhanaStreak: number;
  lastVisitDate?: string;
  notes?: string;
  sankalpa?: { id: string; text: string; completed: boolean }[];
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