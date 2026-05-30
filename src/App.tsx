import { useState } from "react"
import { Menu, Moon, Plus, Settings, Trash2 } from "lucide-react"
import { Button } from "./components/Button"
import { Composer } from "./components/Composer"
import { MessageBubble } from "./components/MessageBubble"
import { SettingsPanel } from "./components/SettingsPanel"
import { useChatStore } from "./store"

export default function App() {
  const { messages, clearMessages, loading } = useChatStore()
  const [settingsOpen, setSettingsOpen] = useState(false)

  function toggleDark() {
    document.documentElement.classList.toggle("dark")
  }

  return (
    <>
      <div className="flex h-[100dvh] overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
        <aside className="hidden w-[220px] shrink-0 border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] lg:block">
          <div className="flex h-full flex-col px-2 py-3">
            <div className="mb-2 flex h-8 items-center px-3 text-sm font-medium">
              Cherry Web
            </div>

            <Button
              variant="secondary"
              className="mb-3 w-full justify-start"
              onClick={clearMessages}
              disabled={loading}
            >
              <Plus size={16} />
              新对话
            </Button>

            <div className="px-3 py-2 text-xs text-[var(--color-foreground-muted)]">
              会话列表
            </div>

            <div className="rounded-lg bg-[var(--color-secondary)] px-3 py-2 text-sm">
              当前对话
            </div>

            <div className="mt-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-xs text-[var(--color-foreground-muted)]">
              当前版本：基础增强版
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="safe-top shrink-0 border-b border-[var(--color-border)] bg-[var(--color-background)]">
            <div className="flex h-11 items-center justify-between px-3">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="lg:hidden"
                  aria-label="菜单"
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
                  aria-label="清空对话"
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

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}