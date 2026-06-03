import {
  getContextCount,
  getCurrentProvider,
  getEnableReasoning,
  getMaxTokens,
  getModel,
  getStreamOutput,
  getTemperature,
  getTopP,
} from "./settings"
import { buildSkillSystemPromptFromText } from "./skills"
import type { ChatMessage, ImageAttachment, TokenUsage } from "./types"

interface RequestAIOptions {
  messages: ChatMessage[]
  onContent?: (text: string) => void
  onReasoning?: (text: string) => void
  onUsage?: (usage: TokenUsage) => void
  signal?: AbortSignal
}

interface ApiMessageTextContent {
  type: "text"
  text: string
}

interface ApiMessageImageContent {
  type: "image_url"
  image_url: { url: string }
}

type ApiMessageContent = string | (ApiMessageTextContent | ApiMessageImageContent)[]

interface ApiMessage {
  role: "system" | "user" | "assistant"
  content: ApiMessageContent
}

interface ApiUsage {
  prompt_tokens?: number
  input_tokens?: number
  promptTokens?: number
  completion_tokens?: number
  output_tokens?: number
  completionTokens?: number
  total_tokens?: number
  totalTokens?: number
}

interface ApiDelta {
  reasoning_content?: string
  reasoning?: string
  reasoning_summary?: string
  content?: string
}

interface ApiChoice {
  delta?: ApiDelta
  message?: {
    content?: string
    reasoning_content?: string
    reasoning?: string
    reasoning_summary?: string
    reasoning_details?: Array<{ text?: string; content?: string }>
  }
}

interface ApiResponse {
  choices?: ApiChoice[]
  usage?: ApiUsage
}

function buildApiMessages(messages: ChatMessage[]): ApiMessage[] {
  const contextCount = getContextCount()
  const recentMessages = messages.slice(-contextCount)

  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user")

  const skillPrompt = buildSkillSystemPromptFromText(
    latestUserMessage?.content || "",
  )

  const apiMessages: ApiMessage[] = []

  if (skillPrompt) {
    apiMessages.push({
      role: "system",
      content: skillPrompt,
    })
  }

  const normalMessages = recentMessages
    .filter((message) => message.content.trim() || message.images?.length)
    .map((message): ApiMessage => {
      if (
        message.role === "user" &&
        message.images &&
        message.images.length > 0
      ) {
        const contentParts: (ApiMessageTextContent | ApiMessageImageContent)[] = [
          {
            type: "text",
            text: message.content || "请分析这张图片。",
          },
          ...message.images.map((image: ImageAttachment): ApiMessageImageContent => ({
            type: "image_url",
            image_url: {
              url: image.dataUrl,
            },
          })),
        ]
        return {
          role: message.role,
          content: contentParts,
        }
      }

      return {
        role: message.role,
        content: message.content,
      }
    })

  return [...apiMessages, ...normalMessages]
}

function readReasoningFromMessage(message: ApiResponse["choices"][0]["message"]): string {
  if (!message) return ""

  if (typeof message.reasoning_content === "string") {
    return message.reasoning_content
  }

  if (typeof message.reasoning === "string") {
    return message.reasoning
  }

  if (typeof message.reasoning_summary === "string") {
    return message.reasoning_summary
  }

  if (Array.isArray(message.reasoning_details)) {
    return message.reasoning_details
      .map((item) => item.text || item.content || "")
      .filter(Boolean)
      .join("\n")
  }

  return ""
}

function normalizeUsage(usage: ApiUsage): TokenUsage {
  if (!usage) return {}

  return {
    promptTokens:
      usage.prompt_tokens ??
      usage.input_tokens ??
      usage.promptTokens ??
      undefined,
    completionTokens:
      usage.completion_tokens ??
      usage.output_tokens ??
      usage.completionTokens ??
      undefined,
    totalTokens: usage.total_tokens ?? usage.totalTokens ?? undefined,
  }
}

async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  options: RequestAIOptions
): Promise<string> {
  const decoder = new TextDecoder("utf-8")
  let fullContent = ""
  let fullReasoning = ""
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith("data:")) continue

      const dataText = trimmed.replace(/^data:\s*/, "")
      if (dataText === "[DONE]") continue

      try {
        const data: ApiResponse = JSON.parse(dataText)

        if (data.usage) {
          options.onUsage?.(normalizeUsage(data.usage))
        }

        const delta = data.choices?.[0]?.delta
        if (!delta) continue

        const reasoningDelta =
          delta.reasoning_content ||
          delta.reasoning ||
          delta.reasoning_summary ||
          ""
        const contentDelta = delta.content || ""

        if (reasoningDelta) {
          fullReasoning += reasoningDelta
          options.onReasoning?.(fullReasoning)
        }

        if (contentDelta) {
          fullContent += contentDelta
          options.onContent?.(fullContent)
        }
      } catch {
        // 忽略无法解析的流式片段
      }
    }
  }

  return fullContent
}

export async function requestAI(options: RequestAIOptions): Promise<string> {
  const provider = getCurrentProvider()
  const model = getModel()
  const stream = getStreamOutput()
  const enableReasoning = getEnableReasoning()

  if (!provider) {
    throw new Error("你还没有配置 API 服务商。请打开设置添加服务商。")
  }

  const apiKey = provider.apiKey
  const baseUrl = provider.baseUrl.replace(/\/$/, "")

  if (!apiKey) {
    throw new Error(`服务商「${provider.name}」还没有填写 API Key。`)
  }

  if (!baseUrl) {
    throw new Error(`服务商「${provider.name}」还没有填写 Base URL。`)
  }

  const body: Record<string, unknown> = {
    model,
    messages: buildApiMessages(options.messages),
    temperature: getTemperature(),
    top_p: getTopP(),
    max_tokens: getMaxTokens(),
    stream,
  }

  if (enableReasoning) {
    body.reasoning_effort = "medium"
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `服务商：${provider.name}\n模型：${model}\n\n${text || "请求失败"}`,
    )
  }

  if (!stream) {
    const data: ApiResponse = await response.json()

    const message = data.choices?.[0]?.message
    const content = message?.content || ""
    const reasoning = readReasoningFromMessage(message)
    const usage = normalizeUsage(data.usage)

    if (reasoning) {
      options.onReasoning?.(reasoning)
    }

    options.onUsage?.(usage)

    return content
  }

  if (!response.body) {
    throw new Error("当前浏览器不支持流式输出")
  }

  return processStream(response.body.getReader(), options)
}