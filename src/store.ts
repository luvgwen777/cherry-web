import { create } from "zustand"
import type { ChatMessage, ImageAttachment, TokenUsage } from "./types"

interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, content: string) => void
  updateReasoning: (id: string, reasoningContent: string) => void
  updateUsage: (id: string, usage: TokenUsage) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content:
        "你好，我是 Cherry Web。现在支持模型设置、流式输出、Token 显示和图片上传。",
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

  updateReasoning: (id, reasoningContent) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, reasoningContent } : message,
      ),
    })),

  updateUsage: (id, usage) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, usage } : message,
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

export async function fileToImageAttachment(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        dataUrl: String(reader.result),
      })
    }

    reader.onerror = () => {
      reject(new Error("读取图片失败"))
    }

    reader.readAsDataURL(file)
  })
}