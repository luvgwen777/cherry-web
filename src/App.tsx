import { useState } from "react"
import {
  Menu,
  Moon,
  MoreHorizontal,
  PenLine,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "./components/Button"
import { Composer } from "./components/Composer"
import { MessageBubble } from "./components/MessageBubble"
import { SettingsPanel } from "./components/SettingsPanel"
import { SkillsPanel } from "./components/SkillsPanel"
import { ModelSelector } from "./components/ModelSelector"
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
        <div className="absolute right-2 top-10 z-20 w-32 rounded-xl border border-[var(--color-border)] bg-[var(--color-popover)] p-1 shadow-md">
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
  onOpenSkills,
}: {
  mobile?: boolean
  onClose?: () => void
  onOpenSkills: () => void
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

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)

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
        className="mb-2 w-full justify-start"
        onClick={() => {
          createConversation()
          onClose?.()
        }}
        disabled={loading}
      >
        <Plus size={16} />
        新对话
      </Button>

      <Button
        variant="ghost"
        className="mb-3 w-full justify-start"
        onClick={() => {
          onOpenSkills()
          onClose?.()
        }}
      >
        <Sparkles size={16} />
        技能
      </Button>

      <div className="px-3 py-2 text-xs text-[var(--color-foreground-muted)]">
        会话列表
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pb-3">
        {sorted.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === currentConversationId}
            disabled={loading}
            onClick={() => {
              switchConversation(conversation.id)
              onClose?.()
            }}
            onRename={() => {
              const title = window.prompt("新名称", conversation.title)

              if (title !== null) {
                renameConversation(conversation.id, title)
              }
            }}
            onDelete={() => {
              if (window.confirm(`删除「${conversation.title}」？`)) {
                deleteConversation(conversation.id)
              }
            }}
          />
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-xs text-[var(--color-foreground-muted)]">
        服务商版本 · 数据存于本机
      </div>
    </aside>
  )
}

export default function App() {
  const { messages, clearMessages, loading } = useChatStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [skillsOpen, setSkillsOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  function toggleDark() {
    document.documentElement.classList.toggle("dark")
  }

  return (
    <>
      <div className="flex h-[100dvh] overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
        <div className="hidden lg:block">
          <Sidebar onOpenSkills={() => setSkillsOpen(true)} />
        </div>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="safe-top shrink-0 border-b border-[var(--color-border)] bg-[var(--color-background)]">
            <div className="flex h-11 items-center justify-between px-3">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="lg:hidden"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <Menu size={18} />
                </Button>

                <div className="hidden sm:block">
                  <h1 className="truncate text-sm font-medium">新对话</h1>

                  {loading && (
                    <div className="text-xs text-[var(--color-foreground-muted)]">
                      AI 正在回复...
                    </div>
                  )}
                </div>

                <ModelSelector />
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSkillsOpen(true)}
                >
                  <Sparkles size={17} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings size={17} />
                </Button>

                <Button variant="ghost" size="icon-sm" onClick={toggleDark}>
                  <Moon size={17} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearMessages}
                  disabled={loading}
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
          <div className="absolute bottom-0 left-0 top-0 w-[82vw] max-w-[320px] bg-[var(--color-sidebar)] shadow-xl">
            <Sidebar
              mobile
              onClose={() => setMobileSidebarOpen(false)}
              onOpenSkills={() => setSkillsOpen(true)}
            />
          </div>

          <button
            className="absolute bottom-0 right-0 top-0 left-[82vw]"
            onClick={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <SkillsPanel open={skillsOpen} onClose={() => setSkillsOpen(false)} />
    </>
  )
}