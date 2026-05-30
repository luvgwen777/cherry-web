import { useState } from "react"
import { Menu, Moon, Plus, Settings, Trash2 } from "lucide-react"
import { Button } from "./components/Button"
import { Composer } from "./components/Composer"
import { MessageBubble } from "./components/MessageBubble"
import { useChatStore } from "./store"
import {
  getApiKey,
  getBaseUrl,
  getModel,
  setApiKey,
  setBaseUrl,
  setModel,
} from "./settings"

export default function App() {
  const { messages, clearMessages } = useChatStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiKeyValue, setApiKeyValue] = useState(getApiKey())
  const [baseUrlValue, setBaseUrlValue] = useState(getBaseUrl())
  const [modelValue, setModelValue] = useState(getModel())

  function toggleDark() {
    document.documentElement.classList.toggle("dark")
  }

  function saveSettings() {
    setApiKey(apiKeyValue.trim())
    setBaseUrl(baseUrlValue.trim())
    setModel(modelValue.trim())
    setSettingsOpen(false)
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

                <h1 className="truncate text-sm font-medium">新对话</h1>
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

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 sm:items-center sm:justify-center">
          <div className="w-full rounded-3xl bg-[var(--color-card)] p-5 text-[var(--color-card-foreground)] shadow-[var(--shadow-xl)] sm:max-w-md">
            <div className="mb-4">
              <h2 className="text-base font-semibold">设置</h2>
              <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
                填入 OpenAI 兼容接口信息
              </p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm">API Key</span>
                <input
                  value={apiKeyValue}
                  onChange={(event) => setApiKeyValue(event.target.value)}
                  placeholder="sk-..."
                  className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm">Base URL</span>
                <input
                  value={baseUrlValue}
                  onChange={(event) => setBaseUrlValue(event.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm">Model</span>
                <input
                  value={modelValue}
                  onChange={(event) => setModelValue(event.target.value)}
                  placeholder="gpt-4o-mini"
                  className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                取消
              </Button>

              <Button onClick={saveSettings}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}