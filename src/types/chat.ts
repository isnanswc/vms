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
  selectedModel: string;
  apiKey: string;
  fallbackSlots: [string, string, string]; // [Slot 1: Utama, Slot 2: Cadangan 1, Slot 3: Cadangan 2]
  availableModels?: string[];
  systemPromptPreset: 'fleet-expert' | 'financial-mechanic' | 'casual-assistant';
}
