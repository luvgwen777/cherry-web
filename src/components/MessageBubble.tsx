import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Copy, RefreshCw, Check, Star, Clock } from "lucide-react"
import type { ChatMessage } from "../types"
import { cn } from "../lib/cn"
import { TokenUsage } from "./TokenUsage"
import { getShowReasoning } from "../settings"

interface Props {
  message: ChatMessage
  onResend?: (content: string) => void
  onToggleStar?: (id: string) => void
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()

  if (isToday) {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  }

  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

function CodeBlock({ className, children, ...props }: any) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || "")
  const language = match ? match[1] : ""

  const handleCopy = async () => {
    try {
      const textToCopy = typeof children === "string" ? children : Array.isArray(children) ? children.join("") : ""
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("复制失败:", error)
    }
  }

  if (!match) {
    return (
      <code className="rounded bg-[var(--color-secondary)] px-1 py-0.5 text-sm" {...props}>
        {children}
      </code>
    )
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-popover)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-secondary)] px-3 py-1.5">
        <span className="text-xs font-medium text-[var(--color-foreground-muted)]">{language || "代码"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--color-foreground-muted)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)] transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-sm">
        <code className={className} {...props}>{children}</code>
      </pre>
    </div>
  )
}

export function MessageBubble({ message, onResend, onToggleStar }: Props) {
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
          {/* 收藏标记 - 在消息角落 */}
          {message.isStarred && !isUser && (
            <div className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-yellow-900 shadow-md">
              <Star size={12} fill="currentColor" />
            </div>
          )}
          {message.isStarred && isUser && (
            <div className="absolute -top-3 -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-yellow-900 shadow-md">
              <Star size={12} fill="currentColor" />
            </div>
          )}

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
                code: CodeBlock,
                pre: ({ children }) => children,
                ul: ({ children }) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
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

        {/* 时间显示 */}
        <div className={cn(
          "mt-1 flex items-center gap-1 text-xs text-[var(--color-foreground-muted)]",
          isUser ? "justify-end" : "justify-start"
        )}>
          <Clock size={10} />
          <span>{formatTime(message.createdAt)}</span>
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
          {onToggleStar && message.content && (
            <button
              type="button"
              onClick={() => onToggleStar(message.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground-secondary)] hover:bg-[var(--color-secondary)] hover:text-yellow-500"
              title={message.isStarred ? "取消收藏" : "收藏消息"}
            >
              <Star size={14} fill={message.isStarred ? "currentColor" : "none"} />
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
