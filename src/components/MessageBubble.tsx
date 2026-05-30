import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ChatMessage } from "../types"
import { cn } from "../lib/cn"

interface Props {
  message: ChatMessage
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-6",
          isUser
            ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
            : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)]",
        )}
      >
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
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}