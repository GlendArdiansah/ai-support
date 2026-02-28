export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-2.5-pro',
}

export interface GenerateContentRequest {
  prompt: string;
  model?: GeminiModel;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface ApiError {
  message: string;
  code?: number;
}
