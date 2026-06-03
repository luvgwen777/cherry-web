import { create } from "zustand"
import type { ChatMessage, Conversation, ImageAttachment, TokenUsage } from "./types"
import { requestAI } from "./ai"

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
  abortController: AbortController | null

  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, content: string) => void
  updateReasoning: (id: string, reasoningContent: string) => void
  updateUsage: (id: string, usage: TokenUsage) => void
  setLoading: (loading: boolean) => void

  sendUserMessage: (content: string, images?: ImageAttachment[]) => Promise<void>
  stopGeneration: () => void
  createConversation: () => void
  switchConversation: (id: string) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  clearMessages: () => void
}

function createWelcomeMessage(content = "新的对话已开始。") {
  return {
    id: crypto.randomUUID(),
    role: "assistant" as const,
    content,
    createdAt: Date.now(),
  }
}

function createDefaultState(): PersistedChatState {
  const convId = crypto.randomUUID()
  return {
    conversations: [{ id: convId, title: "新对话", createdAt: Date.now(), updatedAt: Date.now() }],
    currentConversationId: convId,
    messagesByConversationId: { [convId]: [createWelcomeMessage("你好，我是 Cherry Web。")] },
  }
}

function loadState(): PersistedChatState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const parsed = JSON.parse(raw)
    if (!parsed.conversations?.length || !parsed.currentConversationId || !parsed.messagesByConversationId) return createDefaultState()
    return parsed
  } catch {
    return createDefaultState()
  }
}

function saveState(state: PersistedChatState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function generateTitleFromMessage(msg: ChatMessage) {
  const text = msg.content.trim()
  if (!text) return msg.images?.length ? "图片对话" : "新对话"
  return text.length > 18 ? `${text.slice(0, 18)}...` : text
}

const initial = loadState()

export const useChatStore = create<ChatState>((set, get) => {
  const updateMessageWith = (
    id: string, updater: (msg: ChatMessage) => Partial<ChatMessage>) =>
    set((state) => {
      const convId = state.currentConversationId
      const newMsgs = state.messages.map((m) =>
        m.id === id ? { ...m, ...updater(m) } : m
      )
      const newMap = { ...state.messagesByConversationId, [convId]: newMsgs }
      saveState({ conversations: state.conversations, currentConversationId: convId, messagesByConversationId: newMap })
      return { messages: newMsgs, messagesByConversationId: newMap }
    })

  return {
    conversations: initial.conversations,
    currentConversationId: initial.currentConversationId,
    messagesByConversationId: initial.messagesByConversationId,
    messages: initial.messagesByConversationId[initial.currentConversationId] || [],
    loading: false,
    abortController: null,

    addMessage: (msg) =>
      set((state) => {
        const convId = state.currentConversationId
        const old = state.messagesByConversationId[convId] || []
        const newMsgs = [...old, msg]
        const newMap = { ...state.messagesByConversationId, [convId]: newMsgs }
        const now = Date.now()
        const newConversations = state.conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                title: c.title === "新对话" && msg.role === "user" ? generateTitleFromMessage(msg) : c.title,
                updatedAt: now,
              }
            : c
        )
        saveState({ conversations: newConversations, currentConversationId: convId, messagesByConversationId: newMap })
        return { conversations: newConversations, messagesByConversationId: newMap, messages: newMsgs }
      }),

    updateMessage: (id, content) => updateMessageWith(id, () => ({ content })),

    updateReasoning: (id, reasoningContent) => updateMessageWith(id, () => ({ reasoningContent })),

    updateUsage: (id, usage) => updateMessageWith(id, () => ({ usage })),

    setLoading: (loading) => set({ loading }),

    sendUserMessage: async (content, images) => {
      const state = get()
      if (state.loading) return
      const previousMessages = [...state.messages]

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        images,
        createdAt: Date.now(),
      }
      const assistantId = crypto.randomUUID()
      const abortController = new AbortController()

      get().addMessage(userMsg)
      get().addMessage({ id: assistantId, role: "assistant", content: "", reasoningContent: "", createdAt: Date.now() })

      set({ loading: true, abortController })
      try {
        const finalContent = await requestAI({
          messages: [...previousMessages, userMsg],
          onContent: (c) => get().updateMessage(assistantId, c),
          onReasoning: (r) => get().updateReasoning(assistantId, r),
          onUsage: (u) => get().updateUsage(assistantId, u),
          signal: abortController.signal,
        })
        get().updateMessage(assistantId, finalContent)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          get().updateMessage(assistantId, "已停止生成")
        } else {
          const msg = error instanceof Error ? error.message : "请求失败"
          get().updateMessage(assistantId, msg)
        }
      } finally {
        set({ loading: false, abortController: null })
      }
    },

    stopGeneration: () => {
      const state = get()
      if (state.abortController) {
        state.abortController.abort()
      }
    },

    createConversation: () =>
      set((state) => {
        const convId = crypto.randomUUID()
        const newConv: Conversation = { id: convId, title: "新对话", createdAt: Date.now(), updatedAt: Date.now() }
        const newMsgs = [createWelcomeMessage()]
        const newConversations = [newConv, ...state.conversations]
        const newMap = { ...state.messagesByConversationId, [convId]: newMsgs }
        saveState({ conversations: newConversations, currentConversationId: convId, messagesByConversationId: newMap })
        return { conversations: newConversations, currentConversationId: convId, messagesByConversationId: newMap, messages: newMsgs }
      }),

    switchConversation: (id) =>
      set((state) => {
        if (state.loading) return state
        const msgs = state.messagesByConversationId[id] || []
        saveState({ conversations: state.conversations, currentConversationId: id, messagesByConversationId: state.messagesByConversationId })
        return { currentConversationId: id, messages: msgs }
      }),

    deleteConversation: (id) =>
      set((state) => {
        if (state.loading) return state
        const remaining = state.conversations.filter((c) => c.id !== id)
        const newMap = { ...state.messagesByConversationId }
        delete newMap[id]
        if (remaining.length === 0) {
          const fresh = createDefaultState()
          saveState(fresh)
          return { conversations: fresh.conversations, currentConversationId: fresh.currentConversationId, messagesByConversationId: fresh.messagesByConversationId, messages: fresh.messagesByConversationId[fresh.currentConversationId] }
        }
        const nextId = state.currentConversationId === id ? remaining[0].id : state.currentConversationId
        saveState({ conversations: remaining, currentConversationId: nextId, messagesByConversationId: newMap })
        return { conversations: remaining, currentConversationId: nextId, messagesByConversationId: newMap, messages: newMap[nextId] || [] }
      }),

    renameConversation: (id, title) =>
      set((state) => {
        const finalTitle = title.trim() || "未命名对话"
        const newConversations = state.conversations.map((c) =>
          c.id === id ? { ...c, title: finalTitle, updatedAt: Date.now() } : c
        )
        saveState({ conversations: newConversations, currentConversationId: state.currentConversationId, messagesByConversationId: state.messagesByConversationId })
        return { conversations: newConversations }
      }),

    clearMessages: () =>
      set((state) => {
        if (state.loading) return state
        const convId = state.currentConversationId
        const newMsgs = [createWelcomeMessage()]
        const newMap = { ...state.messagesByConversationId, [convId]: newMsgs }
        const newConversations = state.conversations.map((c) =>
          c.id === convId ? { ...c, title: "新对话", updatedAt: Date.now() } : c
        )
        saveState({ conversations: newConversations, currentConversationId: convId, messagesByConversationId: newMap })
        return { conversations: newConversations, messagesByConversationId: newMap, messages: newMsgs }
      }),
  }
})

export async function fileToImageAttachment(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ id: crypto.randomUUID(), name: file.name, type: file.type, dataUrl: String(reader.result) })
    reader.onerror = () => reject(new Error("读取图片失败"))
    reader.readAsDataURL(file)
  })
}
