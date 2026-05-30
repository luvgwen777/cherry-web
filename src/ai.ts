import { getApiKey, getBaseUrl, getModel } from "./settings"
import type { ChatMessage } from "./types"

export async function requestAI(messages: ChatMessage[]) {
  const apiKey = getApiKey()
  const baseUrl = getBaseUrl()
  const model = getModel()

  if (!apiKey) {
    return "你还没有设置 API Key。请点击右上角设置按钮，填写 API Key。"
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      stream: false,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }

  const data = await response.json()

  return data.choices?.[0]?.message?.content || "没有返回内容。"
}