import { GeminiModel } from './types';

export const DEFAULT_MODEL = GeminiModel.FLASH;

export const MODEL_OPTIONS = [
  { value: GeminiModel.FLASH, label: 'Gemini 2.5 Flash', description: 'Fast and efficient for most tasks' },
  { value: GeminiModel.PRO, label: 'Gemini 2.5 Pro', description: 'Advanced reasoning and complex tasks' },
] as const;

export const DEFAULT_SYSTEM_INSTRUCTION = 'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and concise responses.';

export const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'model' as const,
  content: "Hello! I'm Gemini, your AI assistant. How can I help you today?",
  timestamp: new Date(),
};

export const EXAMPLE_PROMPTS = [
  'Explain quantum computing in simple terms',
  'Write a Python function to calculate fibonacci numbers',
  'What are the benefits of renewable energy?',
  'Help me brainstorm ideas for a mobile app',
] as const;

export const MAX_MESSAGE_LENGTH = 4000;

export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: '280px',
  HEADER_HEIGHT: '64px',
  INPUT_HEIGHT: '80px',
  ANIMATION_DURATION: 300,
} as const;
