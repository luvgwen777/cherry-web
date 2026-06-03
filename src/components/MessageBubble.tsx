import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Copy, RefreshCw, Check } from "lucide-react"
import type { ChatMessage } from "../types"
import { cn } from "../lib/cn"
import { TokenUsage } from "./TokenUsage"
import { getShowReasoning } from "../settings"

interface Props {
  message: ChatMessage
  onResend?: (content: string) => void
}

export function MessageBubble({ message, onResend }: Props) {
  const isUser = message.role === "user"
  const showReasoning = getShowReasoning()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("复制失败:", error)
    }
  }

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className="group relative max-w-[88%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-[15px] leading-6",
            isUser
              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
              : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)]",
          )}
        >
          {message.images && message.images.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {message.images.map((image) => (
                <img
                  key={image.id}
                  src={image.dataUrl}
                  alt={image.name}
                  className="max-h-48 rounded-xl object-cover"
                />
              ))}
            </div>
          )}

          {!isUser && showReasoning && message.reasoningContent && (
            <details className="mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3">
              <summary className="cursor-pointer text-sm font-medium">
                思考过程
              </summary>

              <div className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-foreground-secondary)]">
                {message.reasoningContent}
              </div>
            </details>
          )}

          {message.content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                code: ({ children }) => (
                  <code className="rounded bg-[var(--color-secondary)] px-1 py-0.5 text-sm">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="my-3 overflow-x-auto rounded-xl bg-[var(--color-popover)] p-3 text-sm">
                    {children}
                  </pre>
                ),
                ul: ({ children }) => (
                  <ul className="mb-2 list-disc pl-5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-2 list-decimal pl-5">{children}</ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-2 border-l-4 border-[var(--color-border)] pl-3 text-[var(--color-foreground-secondary)]">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            !isUser && (
              <div className="text-sm text-[var(--color-foreground-muted)]">
                正在生成...
              </div>
            )
          )}

          {!isUser && message.content && <TokenUsage usage={message.usage} />}
        </div>

        {/* 操作按钮 */}
        <div
          className={cn(
            "absolute -top-2 flex gap-1 opacity-0 transition-opacity",
            isUser ? "-right-1" : "-left-1",
            "group-hover:opacity-100",
          )}
        >
          {message.content && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground-secondary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
              title={copied ? "已复制" : "复制消息"}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}
          {isUser && onResend && message.content && (
            <button
              type="button"
              onClick={() => onResend(message.content)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground-secondary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
              title="重新发送"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}