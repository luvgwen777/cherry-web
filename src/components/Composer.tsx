import { useRef, useState } from "react"
import { ImagePlus, Send, X } from "lucide-react"
import { Button } from "./Button"
import { fileToImageAttachment, useChatStore } from "../store"
import { requestAI } from "../ai"
import type { ImageAttachment } from "../types"
import { ImagePreview } from "./ImagePreview"

export function Composer() {
  const [text, setText] = useState("")
  const [images, setImages] = useState<ImageAttachment[]>([])

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    addMessage,
    setLoading,
    updateMessage,
    updateReasoning,
    updateUsage,
    loading,
  } = useChatStore()

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    )

    if (imageFiles.length === 0) return

    const attachments = await Promise.all(
      imageFiles.map((file) => fileToImageAttachment(file)),
    )

    setImages((current) => [...current, ...attachments])
  }

  function removeImage(id: string) {
    setImages((current) => current.filter((image) => image.id !== id))
  }

  async function handleSend() {
    const value = text.trim()

    if ((!value && images.length === 0) || loading) return

    const previousMessages = useChatStore.getState().messages

    setText("")

    const sendingImages = images

    setImages([])

    const textarea = textareaRef.current

    if (textarea) {
      textarea.style.height = "auto"
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: value,
      images: sendingImages,
      createdAt: Date.now(),
    }

    const assistantId = crypto.randomUUID()

    addMessage(userMessage)

    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      reasoningContent: "",
      createdAt: Date.now(),
    })

    setLoading(true)

    try {
      const finalContent = await requestAI({
        messages: [...previousMessages, userMessage],

        onContent: (content) => {
          updateMessage(assistantId, content)
        },

        onReasoning: (reasoning) => {
          updateReasoning(assistantId, reasoning)
        },

        onUsage: (usage) => {
          updateUsage(assistantId, usage)
        },
      })

      updateMessage(assistantId, finalContent)
    } catch (error) {
      updateMessage(
        assistantId,
        error instanceof Error ? error.message : "请求失败",
      )
    } finally {
      setLoading(false)
    }
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
      <div className="mx-auto max-w-3xl">
        <ImagePreview images={images} onRemove={removeImage} />

        <div className="flex items-end gap-2 rounded-2xl border border-[var(--color-input)] bg-[var(--color-card)] p-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="上传图片"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-xl text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
          >
            <ImagePlus size={19} />
          </Button>

          <textarea
            ref={textareaRef}
            value={text}
            rows={1}
            placeholder="输入消息，或上传图片..."
            onChange={(event) => handleInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                handleSend()
              }
            }}
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-base leading-6 text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-foreground-muted)]"
          />

          {text || images.length > 0 ? (
            <Button
              size="icon"
              disabled={loading}
              onClick={handleSend}
              aria-label="发送"
              className="shrink-0 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]"
            >
              <Send size={18} />
            </Button>
          ) : (
            <Button
              size="icon"
              disabled
              aria-label="无法发送"
              className="shrink-0 rounded-xl"
            >
              <X size={18} />
            </Button>
          )}
        </div>

        <div className="mt-2 text-center text-xs text-[var(--color-foreground-muted)]">
          Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </footer>
  )
}