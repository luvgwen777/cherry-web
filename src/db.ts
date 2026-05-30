import Dexie, { type Table } from "dexie"
import type { ChatMessage } from "./types"

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

class AppDB extends Dexie {
  conversations!: Table<Conversation, string>
  messages!: Table<ChatMessage & { conversationId: string }, string>

  constructor() {
    super("cherry-web-db")

    this.version(1).stores({
      conversations: "id, updatedAt",
      messages: "id, conversationId, createdAt",
    })
  }
}

export const db = new AppDB()