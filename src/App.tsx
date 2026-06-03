import { useState, useMemo } from "react"
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
  Plug,
  Search,
  Download,
  LogOut,
} from "lucide-react"
import { Button } from "./components/Button"
import { Composer } from "./components/Composer"
import { MessageBubble } from "./components/MessageBubble"
import { SettingsPanel } from "./components/SettingsPanel"
import { SkillsPanel } from "./components/SkillsPanel"
import { MCPPanel } from "./components/MCPPanel"
import { ModelSelector } from "./components/ModelSelector"
import { useChatStore } from "./store"
import { isAuthenticated, clearAuth, getAuthState, verifyCardKey, setAuthState } from "./auth"
import type { ChatMessage, Conversation } from "./types"

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
  onExport,
}: {
  conversation: Conversation
  active: boolean
  disabled: boolean
  onClick: () => void
  onRename: () => void
  onDelete: () => void
  onExport: () => void
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
        <div className="absolute right-2 top-10 z-20 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-popover)] p-1 shadow-md">
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
              onExport()
            }}
            className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm hover:bg-[var(--color-accent)]"
          >
            <Download size={14} />
            导出对话
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
  onExportConversation,
}: {
  mobile?: boolean
  onClose?: () => void
  onOpenSkills: () => void
  onExportConversation: (id: string) => void
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
            onExport={() => {
              onExportConversation(conversation.id)
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
  const {
    messages,
    clearMessages,
    loading,
    sendUserMessage,
    conversations,
    messagesByConversationId,
    currentConversationId,
  } = useChatStore()

  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated())
  const [cardKey, setCardKey] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [showDemoKeys, setShowDemoKeys] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [skillsOpen, setSkillsOpen] = useState(false)
  const [mcpOpen, setMcpOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  const demoKeys = [
    "CHERRY-2024-ABC",
    "CHERRY-2024-XYZ",
    "CHERRY-2024-123",
    "CHERRY-WEB-2024",
    "DEMO-KEY-1234",
  ]

  function toggleDark() {
    document.documentElement.classList.toggle("dark")
  }

  function exportConversation(conversationId: string) {
    const conversation = conversations.find((c) => c.id === conversationId)
    const convMessages = messagesByConversationId[conversationId] || []

    if (!conversation) return

    const content = [
      `# ${conversation.title}`,
      ``,
      `导出时间: ${new Date().toLocaleString("zh-CN")}`,
      ``,
      `---`,
      ``,
      ...convMessages.map((msg) =>
        [
          `## ${msg.role === "user" ? "用户" : "AI"}`,
          ``,
          msg.content,
          ``,
        ].join("\n"),
      ),
    ].join("\n")

    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${conversation.title}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleResend(content: string) {
    sendUserMessage(content)
  }

  function handleLogout() {
    if (window.confirm("确定要登出吗？")) {
      clearAuth()
      setIsLoggedIn(false)
    }
  }

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    const query = searchQuery.toLowerCase()
    return messages.filter((msg) =>
      msg.content?.toLowerCase().includes(query),
    )
  }, [messages, searchQuery])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    setTimeout(() => {
      const trimmedKey = cardKey.trim().toUpperCase()
      
      if (verifyCardKey(trimmedKey)) {
        setAuthState(trimmedKey)
        setIsLoading(false)
        setIsLoggedIn(true)
      } else {
        setError("无效的卡密，请检查后重试")
        setIsLoading(false)
      }
    }, 800)
  }

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key).catch(() => {})
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl shadow-2xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                <div className="h-10 w-10 text-white">🔐</div>
              </div>
              <h1 className="text-3xl font-bold text-white">Cherry Web</h1>
              <p className="mt-2 text-white/80">
                请输入您的专属卡密以继续使用
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="cardKey" className="mb-2 block text-sm font-medium text-white/90">
                  🔑 专属卡密
                </label>
                <div className="relative">
                  <input
                    id="cardKey"
                    type={showKey ? "text" : "password"}
                    value={cardKey}
                    onChange={(e) => setCardKey(e.target.value)}
                    placeholder="请输入卡密 (如: CHERRY-XXXX-XXXX)"
                    className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/50"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showKey ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-red-200">
                  ❌ <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full bg-white text-indigo-700 hover:bg-white/90 font-semibold"
              >
                {isLoading ? "验证中..." : "验证卡密"}
              </Button>
            </form>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowDemoKeys(!showDemoKeys)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20 transition-colors"
              >
                ✨ <span>{showDemoKeys ? "隐藏" : "显示"}演示卡密</span>
              </button>

              {showDemoKeys && (
                <div className="mt-4 space-y-2">
                  {demoKeys.map((key, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-white/90"
                    >
                      <span className="font-mono text-sm">{key}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(key)}
                        className="px-2 py-1 text-white/70 hover:text-white hover:bg-white/10 rounded"
                      >
                        📋
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-white/20 pt-6 text-center text-sm text-white/60">
              <p>卡密有效期：验证后可使用7天</p>
              <p className="mt-1 text-xs text-white/50">
                提示：演示卡密仅用于开发测试
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-white/40 text-xs">
            <p>Cherry Web © 2024</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-[100dvh] overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
        <div className="hidden lg:block">
          <Sidebar
            onOpenSkills={() => setSkillsOpen(true)}
            onExportConversation={exportConversation}
          />
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
                  <h1 className="truncate text-sm font-medium">
                    {
                      conversations.find((c) => c.id === currentConversationId)
                        ?.title || "新对话"
                    }
                  </h1>

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
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Search size={17} />
                </Button>

                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => exportConversation(currentConversationId)}
                    disabled={loading}
                  >
                    <Download size={17} />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setMcpOpen(true)}
                >
                  <Plug size={17} />
                </Button>

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

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleLogout}
                >
                  <LogOut size={17} />
                </Button>
              </div>
            </div>

            {showSearch && (
              <div className="border-t border-[var(--color-border)] p-2">
                <input
                  type="text"
                  placeholder="搜索消息..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                  autoFocus
                />
              </div>
            )}
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onResend={
                      message.role === "user" ? handleResend : undefined
                    }
                  />
                ))
              ) : searchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Search size={40} className="mb-2 text-[var(--color-foreground-muted)]" />
                  <p className="text-sm text-[var(--color-foreground-muted)]">
                    未找到匹配的消息
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onResend={
                      message.role === "user" ? handleResend : undefined
                    }
                  />
                ))
              )}
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
              onExportConversation={exportConversation}
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

      <MCPPanel open={mcpOpen} onClose={() => setMcpOpen(false)} />
    </>
  )
}