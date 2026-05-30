import { useState } from "react"
import {
  Bot,
  Database,
  Eye,
  Info,
  Plus,
  RotateCcw,
  Server,
  Settings,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "./Button"
import {
  addModelOption,
  addProviderOption,
  getContextCount,
  getCurrentProviderId,
  getEnableReasoning,
  getMaxTokens,
  getModel,
  getModelOptions,
  getProviderOptions,
  getShowReasoning,
  getStreamOutput,
  getTemperature,
  getTopP,
  removeModelOption,
  removeProviderOption,
  resetSettings,
  saveModelOptions,
  saveProviderOptions,
  setContextCount,
  setCurrentModel,
  setCurrentProviderId,
  setEnableReasoning,
  setMaxTokens,
  setShowReasoning,
  setStreamOutput,
  setTemperature,
  setTopP,
  type ModelOption,
  type ProviderOption,
} from "../settings"

interface Props {
  open: boolean
  onClose: () => void
}

type SettingsTab = "provider" | "model" | "general" | "display" | "data" | "about"

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

function getProviderName(providerId: string, providers: ProviderOption[]) {
  return providers.find((item) => item.id === providerId)?.name || "未知服务商"
}

export function SettingsPanel({ open, onClose }: Props) {
  const [tab, setTab] = useState<SettingsTab>("provider")

  const [providers, setProviders] = useState<ProviderOption[]>(
    getProviderOptions(),
  )
  const [models, setModels] = useState<ModelOption[]>(getModelOptions())

  const [currentProviderId, setCurrentProviderIdState] =
    useState(getCurrentProviderId())
  const [modelValue, setModelValue] = useState(getModel())

  const [newProviderName, setNewProviderName] = useState("")
  const [newProviderBaseUrl, setNewProviderBaseUrl] = useState("")
  const [newProviderApiKey, setNewProviderApiKey] = useState("")

  const [newModelName, setNewModelName] = useState("")
  const [newModelId, setNewModelId] = useState("")
  const [newModelProviderId, setNewModelProviderId] =
    useState(getCurrentProviderId())
  const [newModelVision, setNewModelVision] = useState(false)
  const [newModelReasoning, setNewModelReasoning] = useState(false)

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

  function refreshProviderAndModels() {
    setProviders(getProviderOptions())
    setModels(getModelOptions())
  }

  function save() {
    const cleanProviders = providers.map((provider) => ({
      ...provider,
      name: provider.name.trim(),
      baseUrl: provider.baseUrl.trim().replace(/\/$/, ""),
      apiKey: provider.apiKey.trim(),
    }))

    const cleanModels = models.map((model) => ({
      ...model,
      name: model.name.trim(),
      model: model.model.trim(),
    }))

    saveProviderOptions(cleanProviders)
    saveModelOptions(cleanModels)

    setCurrentProviderId(currentProviderId)

    const selectedModel = cleanModels.find((model) => model.model === modelValue)

    if (selectedModel) {
      setCurrentModel(selectedModel.providerId, selectedModel.model)
    } else if (cleanModels[0]) {
      setCurrentModel(cleanModels[0].providerId, cleanModels[0].model)
    }

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
    const confirmed = window.confirm("确定要重置所有设置吗？")

    if (!confirmed) return

    resetSettings()
    location.reload()
  }

  function addProvider() {
    if (!newProviderName.trim()) {
      alert("请填写服务商名称")
      return
    }

    if (!newProviderBaseUrl.trim()) {
      alert("请填写 Base URL")
      return
    }

    addProviderOption(newProviderName, newProviderBaseUrl, newProviderApiKey)

    setNewProviderName("")
    setNewProviderBaseUrl("")
    setNewProviderApiKey("")

    refreshProviderAndModels()
    setCurrentProviderIdState(getCurrentProviderId())
  }

  function updateProvider(id: string, patch: Partial<ProviderOption>) {
    setProviders((current) =>
      current.map((provider) =>
        provider.id === id
          ? {
              ...provider,
              ...patch,
            }
          : provider,
      ),
    )
  }

  function deleteProvider(id: string) {
    if (providers.length <= 1) {
      alert("至少保留一个服务商")
      return
    }

    const provider = providers.find((item) => item.id === id)
    const confirmed = window.confirm(
      `确定删除服务商「${provider?.name || "未知"}」吗？它下面的模型也会删除。`,
    )

    if (!confirmed) return

    removeProviderOption(id)
    refreshProviderAndModels()

    const nextProviders = getProviderOptions()

    if (currentProviderId === id && nextProviders[0]) {
      setCurrentProviderIdState(nextProviders[0].id)
    }
  }

  function addModel() {
    if (!newModelName.trim()) {
      alert("请填写模型显示名称")
      return
    }

    if (!newModelId.trim()) {
      alert("请填写模型 ID")
      return
    }

    if (!newModelProviderId) {
      alert("请选择服务商")
      return
    }

    addModelOption(
      newModelName,
      newModelId,
      newModelProviderId,
      newModelVision,
      newModelReasoning,
    )

    setNewModelName("")
    setNewModelId("")
    setNewModelVision(false)
    setNewModelReasoning(false)

    refreshProviderAndModels()
  }

  function updateModel(id: string, patch: Partial<ModelOption>) {
    setModels((current) =>
      current.map((model) =>
        model.id === id
          ? {
              ...model,
              ...patch,
            }
          : model,
      ),
    )
  }

  function deleteModel(id: string) {
    if (models.length <= 1) {
      alert("至少保留一个模型")
      return
    }

    const model = models.find((item) => item.id === id)
    const confirmed = window.confirm(`确定删除模型「${model?.name || "未知"}」吗？`)

    if (!confirmed) return

    removeModelOption(id)
    refreshProviderAndModels()
  }

  const menu = [
    {
      id: "provider" as const,
      label: "API 服务商",
      icon: Server,
    },
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
            {tab === "provider" && (
              <div className="mx-auto max-w-3xl">
                <div className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div className="text-sm font-semibold">API 服务商</div>
                  <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
                    每个服务商有自己的 API Key 和 Base URL。模型会绑定到某个服务商。
                  </p>
                </div>

                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className={[
                        "rounded-2xl border bg-[var(--color-card)] p-4",
                        currentProviderId === provider.id
                          ? "border-[var(--color-ring)]"
                          : "border-[var(--color-border)]",
                      ].join(" ")}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrentProviderIdState(provider.id)}
                          className="min-w-0 text-left"
                        >
                          <div className="truncate text-sm font-semibold">
                            {provider.name}
                          </div>
                          <div className="truncate text-xs text-[var(--color-foreground-muted)]">
                            {provider.baseUrl}
                          </div>
                        </button>

                        <div className="flex items-center gap-2">
                          {currentProviderId === provider.id && (
                            <span className="rounded-full bg-emerald-500 px-2 py-1 text-xs text-white">
                              当前
                            </span>
                          )}

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteProvider(provider.id)}
                            className="text-[var(--color-foreground-muted)] hover:text-[var(--color-destructive)]"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <label className="block">
                          <div className="mb-1 text-xs text-[var(--color-foreground-muted)]">
                            服务商名称
                          </div>
                          <input
                            value={provider.name}
                            onChange={(event) =>
                              updateProvider(provider.id, {
                                name: event.target.value,
                              })
                            }
                            className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                          />
                        </label>

                        <label className="block">
                          <div className="mb-1 text-xs text-[var(--color-foreground-muted)]">
                            Base URL
                          </div>
                          <input
                            value={provider.baseUrl}
                            onChange={(event) =>
                              updateProvider(provider.id, {
                                baseUrl: event.target.value,
                              })
                            }
                            placeholder="https://api.openai.com/v1"
                            className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                          />
                        </label>

                        <label className="block">
                          <div className="mb-1 text-xs text-[var(--color-foreground-muted)]">
                            API Key
                          </div>
                          <input
                            value={provider.apiKey}
                            onChange={(event) =>
                              updateProvider(provider.id, {
                                apiKey: event.target.value,
                              })
                            }
                            placeholder="sk-..."
                            className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div className="mb-3 text-sm font-semibold">添加服务商</div>

                  <div className="grid gap-3">
                    <input
                      value={newProviderName}
                      onChange={(event) => setNewProviderName(event.target.value)}
                      placeholder="服务商名称，例如 SiliconFlow"
                      className="h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    />

                    <input
                      value={newProviderBaseUrl}
                      onChange={(event) =>
                        setNewProviderBaseUrl(event.target.value)
                      }
                      placeholder="Base URL，例如 https://api.siliconflow.cn/v1"
                      className="h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    />

                    <input
                      value={newProviderApiKey}
                      onChange={(event) =>
                        setNewProviderApiKey(event.target.value)
                      }
                      placeholder="API Key"
                      className="h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    />
                  </div>

                  <Button className="mt-3" onClick={addProvider}>
                    <Plus size={16} />
                    添加服务商
                  </Button>
                </div>
              </div>
            )}

            {tab === "model" && (
              <div className="mx-auto max-w-3xl">
                <div className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div className="text-sm font-semibold">模型设置</div>
                  <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
                    每个模型必须绑定一个 API 服务商。发送消息时会自动使用模型对应的服务商。
                  </p>
                </div>

                <div className="border-b border-[var(--color-border)] py-4">
                  <div className="mb-2 text-sm font-medium">当前默认模型</div>

                  <select
                    value={modelValue}
                    onChange={(event) => setModelValue(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.model}>
                        {model.name} · {getProviderName(model.providerId, providers)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-b border-[var(--color-border)] py-4">
                  <div className="mb-3 text-sm font-medium">模型列表</div>

                  <div className="space-y-3">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        className={[
                          "rounded-2xl border bg-[var(--color-card)] p-4",
                          model.model === modelValue
                            ? "border-[var(--color-ring)]"
                            : "border-[var(--color-border)]",
                        ].join(" ")}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {model.name}
                            </div>
                            <div className="truncate text-xs text-[var(--color-foreground-muted)]">
                              {model.model} ·{" "}
                              {getProviderName(model.providerId, providers)}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteModel(model.id)}
                            className="text-[var(--color-foreground-muted)] hover:text-[var(--color-destructive)]"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            value={model.name}
                            onChange={(event) =>
                              updateModel(model.id, {
                                name: event.target.value,
                              })
                            }
                            placeholder="显示名称"
                            className="h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                          />

                          <input
                            value={model.model}
                            onChange={(event) =>
                              updateModel(model.id, {
                                model: event.target.value,
                              })
                            }
                            placeholder="模型 ID"
                            className="h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                          />

                          <select
                            value={model.providerId}
                            onChange={(event) =>
                              updateModel(model.id, {
                                providerId: event.target.value,
                              })
                            }
                            className="h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                          >
                            {providers.map((provider) => (
                              <option key={provider.id} value={provider.id}>
                                {provider.name}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={Boolean(model.vision)}
                                onChange={(event) =>
                                  updateModel(model.id, {
                                    vision: event.target.checked,
                                  })
                                }
                              />
                              图片
                            </label>

                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={Boolean(model.reasoning)}
                                onChange={(event) =>
                                  updateModel(model.id, {
                                    reasoning: event.target.checked,
                                  })
                                }
                              />
                              思考
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-b border-[var(--color-border)] py-4">
                  <div className="mb-3 text-sm font-medium">添加模型</div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={newModelName}
                      onChange={(event) => setNewModelName(event.target.value)}
                      placeholder="显示名称，例如 Qwen Max"
                      className="h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    />

                    <input
                      value={newModelId}
                      onChange={(event) => setNewModelId(event.target.value)}
                      placeholder="模型 ID，例如 qwen-max"
                      className="h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    />

                    <select
                      value={newModelProviderId}
                      onChange={(event) =>
                        setNewModelProviderId(event.target.value)
                      }
                      className="h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    >
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newModelVision}
                          onChange={(event) =>
                            setNewModelVision(event.target.checked)
                          }
                        />
                        支持图片
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newModelReasoning}
                          onChange={(event) =>
                            setNewModelReasoning(event.target.checked)
                          }
                        />
                        支持思考
                      </label>
                    </div>
                  </div>

                  <Button className="mt-3" onClick={addModel}>
                    <Plus size={16} />
                    添加模型
                  </Button>
                </div>

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
                    后续可以加入自动标题、发送快捷键、启动行为等功能。
                  </p>
                </div>
              </div>
            )}

            {tab === "display" && (
              <div className="mx-auto max-w-3xl space-y-4">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div className="text-sm font-semibold">显示设置</div>
                  <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
                    后续可以加入字体大小、消息宽度、代码高亮等功能。
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

export default SettingsPanel