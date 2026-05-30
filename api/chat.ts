import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const body = req.body

  const baseUrl = (body.baseUrl || "").replace(/\/$/, "")
  const apiKey = body.apiKey || process.env.OPENAI_API_KEY || ""

  if (!baseUrl) {
    return res.status(400).json({ error: "baseUrl is required" })
  }

  if (!apiKey) {
    return res.status(400).json({ error: "apiKey is required" })
  }

  const messages = body.messages || []
  const model = body.model || "gpt-4o-mini"
  const stream = body.stream !== false
  const temperature = body.temperature
  const top_p = body.top_p
  const max_tokens = body.max_tokens

  const requestBody: Record<string, any> = {
    model,
    messages,
    stream,
  }

  if (temperature !== undefined) requestBody.temperature = temperature
  if (top_p !== undefined) requestBody.top_p = top_p
  if (max_tokens !== undefined) requestBody.max_tokens = max_tokens
  if (body.reasoning_effort) requestBody.reasoning_effort = body.reasoning_effort

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream")
      res.setHeader("Cache-Control", "no-cache")
      res.setHeader("Connection", "keep-alive")
      res.setHeader("X-Accel-Buffering", "no")

      if (response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          res.write(decoder.decode(value))
        }

        res.end()
      } else {
        res.status(500).json({ error: "No response body" })
      }

      return
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: String(error) })
  }
}