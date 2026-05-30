import { useEffect, useState } from "react"
import { Check, ChevronDown, Cpu } from "lucide-react"
import {
  getCurrentProviderId,
  getModel,
  getModelOptions,
  getProviderOptions,
  setCurrentModel,
  type ModelOption,
  type ProviderOption,
} from "../settings"

function getModelName(model: string, providerId: string, options: ModelOption[]) {
  const found = options.find(
    (item) => item.model === model && item.providerId === providerId,
  )

  return found?.name || model
}

function getProviderName(providerId: string, providers: ProviderOption[]) {
  return providers.find((item) => item.id === providerId)?.name || "未知服务商"
}

export function ModelSelector() {
  const [open, setOpen] = useState(false)

  const [currentModel, setCurrentModelState] = useState(getModel())
  const [currentProviderId, setCurrentProviderIdState] =
    useState(getCurrentProviderId())

  const [models, setModels] = useState<ModelOption[]>(getModelOptions())
  const [providers, setProviders] = useState<ProviderOption[]>(
    getProviderOptions(),
  )

  function refresh() {
    setCurrentModelState(getModel())
    setCurrentProviderIdState(getCurrentProviderId())
    setModels(getModelOptions())
    setProviders(getProviderOptions())
  }

  useEffect(() => {
    window.addEventListener("cherry-settings-updated", refresh)

    return () => {
      window.removeEventListener("cherry-settings-updated", refresh)
    }
  }, [])

  function chooseModel(item: ModelOption) {
    setCurrentModel(item.providerId, item.model)
    setCurrentModelState(item.model)
    setCurrentProviderIdState(item.providerId)
    setOpen(false)
  }

  const groupedProviders = providers
    .map((provider) => ({
      provider,
      models: models.filter((model) => model.providerId === provider.id),
    }))
    .filter((group) => group.models.length > 0)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          refresh()
          setOpen((value) => !value)
        }}
        className="flex h-8 max-w-[210px] items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-accent)]"
      >
        <Cpu size={15} className="shrink-0 text-[var(--color-foreground-muted)]" />

        <span className="truncate">
          {getModelName(currentModel, currentProviderId, models)}
        </span>

        <ChevronDown size={15} className="shrink-0 text-[var(--color-foreground-muted)]" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20"
            aria-label="关闭模型选择"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 top-10 z-30 w-80 rounded-2xl border border-[var(--color-border)] bg-[var(--color-popover)] p-2 shadow-[var(--shadow-lg)]">
            <div className="px-2 py-2 text-xs text-[var(--color-foreground-muted)]">
              选择模型
            </div>

            <div className="max-h-80 overflow-y-auto">
              {groupedProviders.map((group) => (
                <div key={group.provider.id} className="mb-2">
                  <div className="px-2 py-1 text-xs font-medium text-[var(--color-foreground-muted)]">
                    {group.provider.name}
                  </div>

                  <div className="space-y-1">
                    {group.models.map((item) => {
                      const active =
                        item.model === currentModel &&
                        item.providerId === currentProviderId

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => chooseModel(item)}
                          className={[
                            "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--color-accent)]",
                            active ? "bg-[var(--color-secondary)]" : "",
                          ].join(" ")}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate">{item.name}</div>
                            <div className="truncate text-xs text-[var(--color-foreground-muted)]">
                              {item.model} ·{" "}
                              {getProviderName(item.providerId, providers)}
                            </div>
                          </div>

                          {active && <Check size={16} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}