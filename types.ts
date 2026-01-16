
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
}

export interface Message {
  role: Role;
  text: string;
  timestamp: Date;
  groundingChunks?: any[];
}

export interface TeachingSnippet {
  title: string;
  content: string;
}
