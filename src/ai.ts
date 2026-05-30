import {
  getApiKey,
  getBaseUrl,
  getContextCount,
  getEnableReasoning,
  getMaxTokens,
  getModel,
  getStreamOutput,
  getTemperature,
  getTopP,
} from "./settings"
import type { ChatMessage, TokenUsage } from "./types"

interface RequestAIOptions {
  messages: ChatMessage[]
  onContent?: (text: string) => void
  onReasoning?: (text: string) => void
  onUsage?: (usage: TokenUsage) => void
}

function buildApiMessages(messages: ChatMessage[]) {
  const contextCount = getContextCount()
  const recentMessages = messages.slice(-contextCount)

  return recentMessages
    .filter((message) => message.content.trim() || message.images?.length)
    .map((message) => {
      if (message.role === "user" && message.images && message.images.length > 0) {
        return {
          role: message.role,
          content: [
            {
              type: "text",
              text: message.content || "请分析这张图片。",
            },
            ...message.images.map((image) => ({
              type: "image_url",
              image_url: {
                url: image.dataUrl,
              },
            })),
          ],
        }
      }

      return {
        role: message.role,
        content: message.content,
      }
    })
}

function readReasoningFromMessage(message: any) {
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

function normalizeUsage(usage: any): TokenUsage {
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
    totalTokens:
      usage.total_tokens ??
      usage.totalTokens ??
      undefined,
  }
}

export async function requestAI(options: RequestAIOptions) {
  const apiKey = getApiKey()
  const baseUrl = getBaseUrl().replace(/\/$/, "")
  const model = getModel()
  const stream = getStreamOutput()
  const enableReasoning = getEnableReasoning()

  if (!apiKey) {
    throw new Error("你还没有设置 API Key。请点击右上角设置按钮填写。")
  }

  const body: Record<string, any> = {
    model,
    messages: buildApiMessages(options.messages),
    temperature: getTemperature(),
    top_p: getTopP(),
    max_tokens: getMaxTokens(),
    stream,
  }

  /**
   * 有些 OpenAI 兼容接口支持 reasoning_effort。
   * 不支持的接口可能会报错。
   * 如果你的接口报“不支持 reasoning_effort”，就在设置里关闭“开启思考”。
   */
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
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || "请求失败")
  }

  if (!stream) {
    const data = await response.json()

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

  const reader = response.body.getReader()
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

      if (!trimmed) continue
      if (!trimmed.startsWith("data:")) continue

      const dataText = trimmed.replace(/^data:\s*/, "")

      if (dataText === "[DONE]") {
        continue
      }

      try {
        const data = JSON.parse(dataText)

        if (data.usage) {
          options.onUsage?.(normalizeUsage(data.usage))
        }

        const delta = data.choices?.[0]?.delta

        const reasoningDelta =
          delta?.reasoning_content ||
          delta?.reasoning ||
          delta?.reasoning_summary ||
          ""

        const contentDelta = delta?.content || ""

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