import { create } from "zustand"
import type {
  ChatMessage,
  Conversation,
  ImageAttachment,
  TokenUsage,
} from "./types"

const STORAGE_KEY = "cherry-web-chat-state-v1"

interface PersistedChatState {
  conversations: Conversation[]
  currentConversationId: string
  messagesByConversationId: Record<string, ChatMessage[]>
}

interface ChatState {
  conversations: Conversation[]
  currentConversationId: string
  messagesByConversationId: Record<string, ChatMessage[]>
  messages: ChatMessage[]
  loading: boolean

  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, content: string) => void
  updateReasoning: (id: string, reasoningContent: string) => void
  updateUsage: (id: string, usage: TokenUsage) => void

  setLoading: (loading: boolean) => void

  createConversation: () => void
  switchConversation: (id: string) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  clearMessages: () => void
}

function createWelcomeMessage(content = "新的对话已开始。"): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content,
    createdAt: Date.now(),
  }
}

function createDefaultConversation(): PersistedChatState {
  const now = Date.now()
  const conversationId = crypto.randomUUID()

  return {
    conversations: [
      {
        id: conversationId,
        title: "新对话",
        createdAt: now,
        updatedAt: now,
      },
    ],
    currentConversationId: conversationId,
    messagesByConversationId: {
      [conversationId]: [
        createWelcomeMessage(
          "你好，我是 Cherry Web。现在支持会话历史、模型设置、流式输出、Token 显示和图片上传。",
        ),
      ],
    },
  }
}

function loadPersistedState(): PersistedChatState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return createDefaultConversation()
    }

    const parsed = JSON.parse(raw) as PersistedChatState

    if (
      !parsed.conversations ||
      parsed.conversations.length === 0 ||
      !parsed.currentConversationId ||
      !parsed.messagesByConversationId
    ) {
      return createDefaultConversation()
    }

    const currentExists = parsed.conversations.some(
      (conversation) => conversation.id === parsed.currentConversationId,
    )

    if (!currentExists) {
      parsed.currentConversationId = parsed.conversations[0].id
    }

    return parsed
  } catch {
    return createDefaultConversation()
  }
}

function savePersistedState(state: PersistedChatState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function getConversationMessages(
  messagesByConversationId: Record<string, ChatMessage[]>,
  conversationId: string,
) {
  return messagesByConversationId[conversationId] || []
}

function generateTitleFromMessage(message: ChatMessage) {
  const text = message.content.trim()

  if (!text) {
    if (message.images && message.images.length > 0) {
      return "图片对话"
    }

    return "新对话"
  }

  return text.length > 18 ? `${text.slice(0, 18)}...` : text
}

const initialState = loadPersistedState()

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: initialState.conversations,
  currentConversationId: initialState.currentConversationId,
  messagesByConversationId: initialState.messagesByConversationId,
  messages: getConversationMessages(
    initialState.messagesByConversationId,
    initialState.currentConversationId,
  ),
  loading: false,

  addMessage: (message) =>
    set((state) => {
      const conversationId = state.currentConversationId
      const oldMessages = state.messagesByConversationId[conversationId] || []
      const newMessages = [...oldMessages, message]

      const newMessagesByConversationId = {
        ...state.messagesByConversationId,
        [conversationId]: newMessages,
      }

      const now = Date.now()

      const newConversations = state.conversations.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation
        }

        const shouldAutoTitle =
          conversation.title === "新对话" && message.role === "user"

        return {
          ...conversation,
          title: shouldAutoTitle
            ? generateTitleFromMessage(message)
            : conversation.title,
          updatedAt: now,
        }
      })

      savePersistedState({
        conversations: newConversations,
        currentConversationId: conversationId,
        messagesByConversationId: newMessagesByConversationId,
      })

      return {
        conversations: newConversations,
        messagesByConversationId: newMessagesByConversationId,
        messages: newMessages,
      }
    }),

  updateMessage: (id, content) =>
    set((state) => {
      const conversationId = state.currentConversationId

      const newMessages = state.messages.map((message) =>
        message.id === id ? { ...message, content } : message,
      )

      const newMessagesByConversationId = {
        ...state.messagesByConversationId,
        [conversationId]: newMessages,
      }

      const newConversations = state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              updatedAt: Date.now(),
            }
          : conversation,
      )

      savePersistedState({
        conversations: newConversations,
        currentConversationId: conversationId,
        messagesByConversationId: newMessagesByConversationId,
      })

      return {
        conversations: newConversations,
        messages: newMessages,
        messagesByConversationId: newMessagesByConversationId,
      }
    }),

  updateReasoning: (id, reasoningContent) =>
    set((state) => {
      const conversationId = state.currentConversationId

      const newMessages = state.messages.map((message) =>
        message.id === id ? { ...message, reasoningContent } : message,
      )

      const newMessagesByConversationId = {
        ...state.messagesByConversationId,
        [conversationId]: newMessages,
      }

      savePersistedState({
        conversations: state.conversations,
        currentConversationId: conversationId,
        messagesByConversationId: newMessagesByConversationId,
      })

      return {
        messages: newMessages,
        messagesByConversationId: newMessagesByConversationId,
      }
    }),

  updateUsage: (id, usage) =>
    set((state) => {
      const conversationId = state.currentConversationId

      const newMessages = state.messages.map((message) =>
        message.id === id ? { ...message, usage } : message,
      )

      const newMessagesByConversationId = {
        ...state.messagesByConversationId,
        [conversationId]: newMessages,
      }

      savePersistedState({
        conversations: state.conversations,
        currentConversationId: conversationId,
        messagesByConversationId: newMessagesByConversationId,
      })

      return {
        messages: newMessages,
        messagesByConversationId: newMessagesByConversationId,
      }
    }),

  setLoading: (loading) => set({ loading }),

  createConversation: () =>
    set((state) => {
      const now = Date.now()
      const conversationId = crypto.randomUUID()

      const newConversation: Conversation = {
        id: conversationId,
        title: "新对话",
        createdAt: now,
        updatedAt: now,
      }

      const newMessages = [createWelcomeMessage()]

      const newConversations = [newConversation, ...state.conversations]

      const newMessagesByConversationId = {
        ...state.messagesByConversationId,
        [conversationId]: newMessages,
      }

      savePersistedState({
        conversations: newConversations,
        currentConversationId: conversationId,
        messagesByConversationId: newMessagesByConversationId,
      })

      return {
        conversations: newConversations,
        currentConversationId: conversationId,
        messagesByConversationId: newMessagesByConversationId,
        messages: newMessages,
      }
    }),

  switchConversation: (id) =>
    set((state) => {
      if (state.loading) return state

      const messages = state.messagesByConversationId[id] || []

      savePersistedState({
        conversations: state.conversations,
        currentConversationId: id,
        messagesByConversationId: state.messagesByConversationId,
      })

      return {
        currentConversationId: id,
        messages,
      }
    }),

  deleteConversation: (id) =>
    set((state) => {
      if (state.loading) return state

      const remainingConversations = state.conversations.filter(
        (conversation) => conversation.id !== id,
      )

      const newMessagesByConversationId = {
        ...state.messagesByConversationId,
      }

      delete newMessagesByConversationId[id]

      if (remainingConversations.length === 0) {
        const fresh = createDefaultConversation()
        savePersistedState(fresh)

        return {
          conversations: fresh.conversations,
          currentConversationId: fresh.currentConversationId,
          messagesByConversationId: fresh.messagesByConversationId,
          messages: getConversationMessages(
            fresh.messagesByConversationId,
            fresh.currentConversationId,
          ),
        }
      }

      const nextConversationId =
        state.currentConversationId === id
          ? remainingConversations[0].id
          : state.currentConversationId

      const nextMessages =
        newMessagesByConversationId[nextConversationId] || []

      savePersistedState({
        conversations: remainingConversations,
        currentConversationId: nextConversationId,
        messagesByConversationId: newMessagesByConversationId,
      })

      return {
        conversations: remainingConversations,
        currentConversationId: nextConversationId,
        messagesByConversationId: newMessagesByConversationId,
        messages: nextMessages,
      }
    }),

  renameConversation: (id, title) =>
    set((state) => {
      const finalTitle = title.trim() || "未命名对话"

      const newConversations = state.conversations.map((conversation) =>
        conversation.id === id
          ? {
              ...conversation,
              title: finalTitle,
              updatedAt: Date.now(),
            }
          : conversation,
      )

      savePersistedState({
        conversations: newConversations,
        currentConversationId: state.currentConversationId,
        messagesByConversationId: state.messagesByConversationId,
      })

      return {
        conversations: newConversations,
      }
    }),

  clearMessages: () =>
    set((state) => {
      if (state.loading) return state

      const conversationId = state.currentConversationId
      const newMessages = [createWelcomeMessage()]

      const newMessagesByConversationId = {
        ...state.messagesByConversationId,
        [conversationId]: newMessages,
      }

      const newConversations = state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title: "新对话",
              updatedAt: Date.now(),
            }
          : conversation,
      )

      savePersistedState({
        conversations: newConversations,
        currentConversationId: conversationId,
        messagesByConversationId: newMessagesByConversationId,
      })

      return {
        conversations: newConversations,
        messagesByConversationId: newMessagesByConversationId,
        messages: newMessages,
      }
    }),
}))

export async function fileToImageAttachment(
  file: File,
): Promise<ImageAttachment> {
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