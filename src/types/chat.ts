export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  attachment?: {
    type: 'image' | 'file';
    url: string;
    name?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface AiSettings {
  selectedModel: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-flash-lite';
  apiKey: string;
  systemPromptPreset: 'fleet-expert' | 'financial-mechanic' | 'casual-assistant';
}
