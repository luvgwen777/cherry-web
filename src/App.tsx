import { useState } from "react"
import {
  Menu,
  Moon,
  MoreHorizontal,
  PenLine,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "./components/Button"
import { Composer } from "./components/Composer"
import { MessageBubble } from "./components/MessageBubble"
import { SettingsPanel } from "./components/SettingsPanel"
import { useChatStore } from "./store"
import type { Conversation } from "./types"

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  const now = new Date()

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  })
}

function ConversationItem({
  conversation,
  active,
  disabled,
  onClick,
  onRename,
  onDelete,
}: {
  conversation: Conversation
  active: boolean
  disabled: boolean
  onClick: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={[
          "group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors disabled:opacity-50",
          active
            ? "bg-[var(--color-secondary)] text-[var(--color-foreground)]"
            : "text-[var(--color-foreground-secondary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm">{conversation.title}</div>
          <div className="mt-0.5 text-xs text-[var(--color-foreground-muted)]">
            {formatTime(conversation.updatedAt)}
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setMenuOpen((value) => !value)
          }}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg opacity-70 hover:bg-[var(--color-accent)] hover:opacity-100"
        >
          <MoreHorizontal size={16} />
        </button>
      </button>

      {menuOpen && (
        <div className="absolute right-2 top-10 z-20 w-32 rounded-xl border border-[var(--color-border)] bg-[var(--color-popover)] p-1 shadow-[var(--shadow-md)]">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              onRename()
            }}
            className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm hover:bg-[var(--color-accent)]"
          >
            <PenLine size={14} />
            重命名
          </button>

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              onDelete()
            }}
            className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-[var(--color-destructive)] hover:bg-[var(--color-accent)]"
          >
            <Trash2 size={14} />
            删除
          </button>
        </div>
      )}
    </div>
  )
}

function Sidebar({
  mobile = false,
  onClose,
}: {
  mobile?: boolean
  onClose?: () => void
}) {
  const {
    conversations,
    currentConversationId,
    loading,
    createConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
  } = useChatStore()

  const sortedConversations = [...conversations].sort(
    (a, b) => b.updatedAt - a.updatedAt,
  )

  function handleRename(conversation: Conversation) {
    const title = window.prompt("请输入新的会话名称", conversation.title)

    if (title === null) return

    renameConversation(conversation.id, title)
  }

  function handleDelete(conversation: Conversation) {
    const confirmed = window.confirm(`确定删除「${conversation.title}」吗？`)

    if (!confirmed) return

    deleteConversation(conversation.id)
  }

  return (
    <aside
      className={[
        "flex h-full w-[260px] shrink-0 flex-col border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] px-2 py-3",
        mobile ? "w-full border-r-0" : "",
      ].join(" ")}
    >
      <div className="mb-2 flex h-9 items-center justify-between px-3">
        <div className="text-sm font-semibold">Cherry Web</div>

        {mobile && (
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X size={18} />
          </Button>
        )}
      </div>

      <Button
        variant="secondary"
        className="mb-3 w-full justify-start"
        onClick={() => {
          createConversation()
          onClose?.()
        }}
        disabled={loading}
      >
        <Plus size={16} />
        新对话
      </Button>

      <div className="px-3 py-2 text-xs text-[var(--color-foreground-muted)]">
        会话列表
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-3">
        {sortedConversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === currentConversationId}
            disabled={loading}
            onClick={() => {
              switchConversation(conversation.id)
              onClose?.()
            }}
            onRename={() => handleRename(conversation)}
            onDelete={() => handleDelete(conversation)}
          />
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-xs text-[var(--color-foreground-muted)]">
        <div>当前版本：会话增强版</div>
        <div className="mt-1">会话会保存在本机浏览器中。</div>
      </div>
    </aside>
  )
}

export default function App() {
  const { messages, clearMessages, loading } = useChatStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  function toggleDark() {
    document.documentElement.classList.toggle("dark")
  }

  return (
    <>
      <div className="flex h-[100dvh] overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="safe-top shrink-0 border-b border-[var(--color-border)] bg-[var(--color-background)]">
            <div className="flex h-11 items-center justify-between px-3">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="lg:hidden"
                  aria-label="菜单"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <Menu size={18} />
                </Button>

                <div className="min-w-0">
                  <h1 className="truncate text-sm font-medium">新对话</h1>

                  {loading && (
                    <div className="text-xs text-[var(--color-foreground-muted)]">
                      AI 正在回复...
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="设置"
                >
                  <Settings size={17} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleDark}
                  aria-label="切换深色模式"
                >
                  <Moon size={17} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearMessages}
                  disabled={loading}
                  aria-label="清空当前对话"
                >
                  <Trash2 size={17} />
                </Button>
              </div>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          </section>

          <Composer />
        </main>
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden">
          <div className="absolute bottom-0 left-0 top-0 w-[82vw] max-w-[320px] bg-[var(--color-sidebar)] shadow-[var(--shadow-xl)]">
            <Sidebar mobile onClose={() => setMobileSidebarOpen(false)} />
          </div>

          <button
            type="button"
            aria-label="关闭菜单"
            className="absolute inset-y-0 right-0 left-[82vw]"
            onClick={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}