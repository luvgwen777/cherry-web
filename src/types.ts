export type MessageRole = "user" | "assistant"

export interface ImageAttachment {
  id: string
  name: string
  type: string
  dataUrl: string
}

export interface TokenUsage {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: number
  images?: ImageAttachment[]
  reasoningContent?: string
  usage?: TokenUsage
}

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}