import type { ChatSession, AiSettings } from '../types/chat';

export const DEFAULT_AI_SETTINGS: AiSettings = {
  selectedModel: 'gemini-2.5-flash',
  apiKey: '',
  systemPromptPreset: 'fleet-expert',
};

export const INITIAL_CHAT_SESSIONS: ChatSession[] = [
  {
    id: 'session-default',
    title: 'Percakapan Baru',
    lastMessage: 'Siap membantu analisa armada Anda...',
    updatedAt: 'Baru saja',
    messages: [
      {
        id: 'msg-init',
        sender: 'ai',
        text: 'Halo! Saya **Fleet AI Assistant**. Ada yang bisa saya bantu terkait kendaraan, jadwal servis, atau analisis konsumsi BBM?',
        timestamp: 'Baru saja',
      },
    ],
  },
];
