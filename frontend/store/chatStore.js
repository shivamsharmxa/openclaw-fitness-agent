import { create } from 'zustand';
import { chatApi } from '../lib/api';

const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm FitCoach, your AI personal trainer. I can help you with personalized workout plans, nutrition advice, and tracking your progress.\n\nWhat would you like to work on today?",
  createdAt: new Date().toISOString(),
};

export const useChatStore = create((set, get) => ({
  messages: [],
  isStreaming: false,
  isLoadingHistory: false,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  appendToLastMessage: (chunk) =>
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length === 0) return state;
      const last = { ...msgs[msgs.length - 1] };
      last.content += chunk;
      msgs[msgs.length - 1] = last;
      return { messages: msgs };
    }),

  setStreaming: (val) => set({ isStreaming: val }),

  setMessages: (messages) => set({ messages }),

  clearMessages: () => set({ messages: [] }),

  // Load history from DB; fall back to welcome message for new users
  initChat: async () => {
    const { messages, isLoadingHistory } = get();
    if (messages.length > 0 || isLoadingHistory) return;

    set({ isLoadingHistory: true });
    try {
      const res = await chatApi.getHistory({ limit: 50 });
      const logs = res.data.data.logs ?? [];

      if (logs.length === 0) {
        set({ messages: [WELCOME_MSG] });
        return;
      }

      // Each log has userMessage + agentResponse — expand into message pairs
      const history = logs.flatMap((log) => [
        {
          id: `user-${log.id}`,
          role: 'user',
          content: log.userMessage,
          createdAt: log.createdAt,
        },
        {
          id: `assistant-${log.id}`,
          role: 'assistant',
          content: log.agentResponse,
          createdAt: log.createdAt,
        },
      ]);
      set({ messages: history });
    } catch {
      set({ messages: [WELCOME_MSG] });
    } finally {
      set({ isLoadingHistory: false });
    }
  },
}));
