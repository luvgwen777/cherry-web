import { useRef, useState } from "react"
import { Send } from "lucide-react"
import { Button } from "./Button"
import { useChatStore } from "../store"

export function Composer() {
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const { addMessage, setLoading, updateMessage, loading } = useChatStore()

  async function handleSend() {
    const value = text.trim()
    if (!value || loading) return

    setText("")

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: value,
      createdAt: Date.now(),
    }

    const assistantId = crypto.randomUUID()

    addMessage(userMessage)

    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    })

    setLoading(true)

    // 这里先用假回复，后面再接真实 AI API
    const fakeReply =
      "这是一个本地测试回复。\n\n你的消息是：\n\n> " +
      value +
      "\n\n下一步可以接入 OpenAI、Claude、Gemini 或自定义 API。"

    let current = ""

    for (const char of fakeReply) {
      current += char
      updateMessage(assistantId, current)
      await new Promise((resolve) => setTimeout(resolve, 15))
    }

    setLoading(false)
  }

  function handleInput(value: string) {
    setText(value)

    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }

  return (
    <footer className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-background)] px-3 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[var(--color-input)] bg-[var(--color-card)] p-2">
        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          placeholder="输入消息..."
          onChange={(event) => handleInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              handleSend()
            }
          }}
          className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-foreground-muted)]"
        />

        <Button
          size="icon"
          disabled={!text.trim() || loading}
          onClick={handleSend}
          aria-label="发送"
          className="shrink-0 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]"
        >
          <Send size={18} />
        </Button>
      </div>
    </footer>
  )
}