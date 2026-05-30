import { create } from "zustand"
import type { ChatMessage } from "./types"

interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, content: string) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content: "你好，我是 Cherry Web。现在已经可以在 iPhone Safari 上运行。",
      createdAt: Date.now(),
    },
  ],
  loading: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, content } : message,
      ),
    })),

  setLoading: (loading) => set({ loading }),

  clearMessages: () =>
    set({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "新的对话已开始。",
          createdAt: Date.now(),
        },
      ],
    }),
}))