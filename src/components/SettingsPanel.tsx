import { useState } from "react"
import {
  Bot,
  Database,
  Eye,
  Info,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { Button } from "./Button"
import {
  getApiKey,
  getBaseUrl,
  getContextCount,
  getEnableReasoning,
  getMaxTokens,
  getModel,
  getShowReasoning,
  getStreamOutput,
  getTemperature,
  getTopP,
  resetSettings,
  setApiKey,
  setBaseUrl,
  setContextCount,
  setEnableReasoning,
  setMaxTokens,
  setModel,
  setShowReasoning,
  setStreamOutput,
  setTemperature,
  setTopP,
} from "../settings"

interface Props {
  open: boolean
  onClose: () => void
}

type SettingsTab = "model" | "general" | "display" | "data" | "about"

function RowSwitch({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] py-4">
      <div className="pr-4">
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div className="mt-1 text-xs text-[var(--color-foreground-muted)]">
            {description}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-emerald-500" : "bg-neutral-400/40",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block border-b border-[var(--color-border)] py-4">
      <div className="mb-2 text-sm font-medium">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
      />
    </label>
  )
}

export function SettingsPanel({ open, onClose }: Props) {
  const [tab, setTab] = useState<SettingsTab>("model")

  const [apiKeyValue, setApiKeyValue] = useState(getApiKey())
  const [baseUrlValue, setBaseUrlValue] = useState(getBaseUrl())
  const [modelValue, setModelValue] = useState(getModel())

  const [temperatureValue, setTemperatureValue] = useState(getTemperature())
  const [topPValue, setTopPValue] = useState(getTopP())
  const [maxTokensValue, setMaxTokensValue] = useState(getMaxTokens())
  const [contextCountValue, setContextCountValue] = useState(getContextCount())

  const [streamValue, setStreamValue] = useState(getStreamOutput())
  const [enableReasoningValue, setEnableReasoningValue] = useState(
    getEnableReasoning(),
  )
  const [showReasoningValue, setShowReasoningValue] = useState(
    getShowReasoning(),
  )

  if (!open) return null

  function save() {
    setApiKey(apiKeyValue.trim())
    setBaseUrl(baseUrlValue.trim())
    setModel(modelValue.trim())

    setTemperature(Number(temperatureValue))
    setTopP(Number(topPValue))
    setMaxTokens(Number(maxTokensValue))
    setContextCount(Number(contextCountValue))

    setStreamOutput(streamValue)
    setEnableReasoning(enableReasoningValue)
    setShowReasoning(showReasoningValue)

    onClose()
  }

  function resetAll() {
    resetSettings()
    location.reload()
  }

  const menu = [
    {
      id: "model" as const,
      label: "模型设置",
      icon: Bot,
    },
    {
      id: "general" as const,
      label: "常规设置",
      icon: SlidersHorizontal,
    },
    {
      id: "display" as const,
      label: "显示设置",
      icon: Eye,
    },
    {
      id: "data" as const,
      label: "数据设置",
      icon: Database,
    },
    {
      id: "about" as const,
      label: "关于我们",
      icon: Info,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="absolute inset-x-0 bottom-0 top-10 flex overflow-hidden rounded-t-3xl bg-[var(--color-background)] text-[var(--color-foreground)] shadow-[var(--shadow-xl)] md:inset-8 md:rounded-3xl">
        <aside className="hidden w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sidebar)] p-3 md:block">
          <div className="mb-3 flex h-9 items-center px-3 text-sm font-semibold">
            设置
          </div>

          <div className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={[
                    "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors",
                    tab === item.id
                      ? "bg-[var(--color-secondary)] text-[var(--color-foreground)]"
                      : "text-[var(--color-foreground-secondary)] hover:bg-[var(--color-accent)]",
                  ].join(" ")}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Settings size={17} />
              {menu.find((item) => item.id === tab)?.label}
            </div>

            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X size={18} />
            </Button>
          </header>

          <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] px-3 py-2 md:hidden">
            {menu.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={[
                  "shrink-0 rounded-xl px-3 py-2 text-sm",
                  tab === item.id
                    ? "bg-[var(--color-secondary)]"
                    : "text-[var(--color-foreground-muted)]",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>

          <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
            {tab === "model" && (
              <div className="mx-auto max-w-3xl">
                <Field
                  label="API Key"
                  value={apiKeyValue}
                  onChange={setApiKeyValue}
                  placeholder="sk-..."
                />

                <Field
                  label="Base URL"
                  value={baseUrlValue}
                  onChange={setBaseUrlValue}
                  placeholder="https://api.openai.com/v1"
                />

                <Field
                  label="默认模型"
                  value={modelValue}
                  onChange={setModelValue}
                  placeholder="gpt-4o-mini"
                />

                <Field
                  label="模型温度 temperature"
                  value={temperatureValue}
                  type="number"
                  onChange={(value) => setTemperatureValue(Number(value))}
                  placeholder="0.7"
                />

                <Field
                  label="Top P"
                  value={topPValue}
                  type="number"
                  onChange={(value) => setTopPValue(Number(value))}
                  placeholder="1"
                />

                <Field
                  label="最大 Token 数"
                  value={maxTokensValue}
                  type="number"
                  onChange={(value) => setMaxTokensValue(Number(value))}
                  placeholder="2048"
                />

                <Field
                  label="上下文数量"
                  value={contextCountValue}
                  type="number"
                  onChange={(value) => setContextCountValue(Number(value))}
                  placeholder="10"
                />

                <RowSwitch
                  title="流式输出"
                  description="开启后，AI 会边生成边显示。"
                  checked={streamValue}
                  onChange={setStreamValue}
                />

                <RowSwitch
                  title="开启思考"
                  description="仅部分模型支持。若接口报错，请关闭。"
                  checked={enableReasoningValue}
                  onChange={setEnableReasoningValue}
                />

                <RowSwitch
                  title="显示思考内容"
                  description="如果模型返回 reasoning_content，则显示。"
                  checked={showReasoningValue}
                  onChange={setShowReasoningValue}
                />
              </div>
            )}

            {tab === "general" && (
              <div className="mx-auto max-w-3xl space-y-4">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div className="text-sm font-semibold">常规设置</div>
                  <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
                    后续可以在这里加入语言、启动页、默认行为、自动标题等功能。
                  </p>
                </div>
              </div>
            )}

            {tab === "display" && (
              <div className="mx-auto max-w-3xl space-y-4">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div className="text-sm font-semibold">显示设置</div>
                  <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
                    后续可以在这里加入主题、字体大小、消息宽度、代码高亮等功能。
                  </p>
                </div>
              </div>
            )}

            {tab === "data" && (
              <div className="mx-auto max-w-3xl space-y-4">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div className="text-sm font-semibold">数据设置</div>
                  <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
                    这里可以重置本地设置。
                  </p>

                  <Button
                    variant="destructive"
                    className="mt-4"
                    onClick={resetAll}
                  >
                    <RotateCcw size={16} />
                    重置所有设置
                  </Button>
                </div>
              </div>
            )}

            {tab === "about" && (
              <div className="mx-auto max-w-3xl space-y-4">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div className="text-sm font-semibold">Cherry Web</div>
                  <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
                    一个适配 iPhone Safari 和 PWA 的 AI 聊天网页应用。
                  </p>
                </div>
              </div>
            )}
          </section>

          <footer className="flex shrink-0 justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>

            <Button onClick={save}>保存设置</Button>
          </footer>
        </main>
      </div>
    </div>
  )
}