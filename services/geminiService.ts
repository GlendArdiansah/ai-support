import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { GenerateContentRequest, GeminiModel, Message } from '../types';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateContent(request: GenerateContentRequest): Promise<string> {
    const {
      prompt,
      model = GeminiModel.FLASH,
      systemInstruction,
      temperature = 0.7,
      maxOutputTokens,
    } = request;

    const config: Record<string, unknown> = {
      temperature,
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (maxOutputTokens) {
      config.maxOutputTokens = maxOutputTokens;
    }

    const response: GenerateContentResponse = await this.ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });

    return response.text || '';
  }

  async *generateContentStream(request: GenerateContentRequest): AsyncGenerator<string, void, unknown> {
    const {
      prompt,
      model = GeminiModel.FLASH,
      systemInstruction,
      temperature = 0.7,
      maxOutputTokens,
    } = request;

    const config: Record<string, unknown> = {
      temperature,
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (maxOutputTokens) {
      config.maxOutputTokens = maxOutputTokens;
    }

    const response = await this.ai.models.generateContentStream({
      model,
      contents: prompt,
      config,
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  }

  formatMessagesForContext(messages: Message[]): string {
    return messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
  }
}

export const geminiService = new GeminiService();
