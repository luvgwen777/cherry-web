export interface ProviderOption {
  id: string
  name: string
  baseUrl: string
  apiKey: string
}

export interface ModelOption {
  id: string
  name: string
  model: string
  providerId: string
  vision?: boolean
  reasoning?: boolean
}

const PROVIDERS_KEY = "providerOptions"
const MODELS_KEY = "modelOptions"
const CURRENT_PROVIDER_KEY = "currentProviderId"

const DEFAULT_PROVIDERS: ProviderOption[] = [
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    apiKey: "",
  },
]

const DEFAULT_MODELS: ModelOption[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    model: "gpt-4o-mini",
    providerId: "openai",
    vision: true,
    reasoning: false,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    model: "gpt-4o",
    providerId: "openai",
    vision: true,
    reasoning: false,
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    model: "deepseek-chat",
    providerId: "deepseek",
    vision: false,
    reasoning: false,
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner",
    model: "deepseek-reasoner",
    providerId: "deepseek",
    vision: false,
    reasoning: true,
  },
]

function emitSettingsUpdated(): void {
  window.dispatchEvent(new Event("cherry-settings-updated"))
}

function getString(key: string, fallback: string): string {
  return localStorage.getItem(key) || fallback
}

function setString(key: string, value: string): void {
  localStorage.setItem(key, value)
  emitSettingsUpdated()
}

function getNumber(key: string, fallback: number): number {
  const value = localStorage.getItem(key)

  if (!value) return fallback

  const numberValue = Number(value)

  if (Number.isNaN(numberValue)) return fallback

  return numberValue
}

function setNumber(key: string, value: number): void {
  localStorage.setItem(key, String(value))
  emitSettingsUpdated()
}

function getBoolean(key: string, fallback: boolean): boolean {
  const value = localStorage.getItem(key)

  if (value === null) return fallback

  return value === "true"
}

function setBoolean(key: string, value: boolean): void {
  localStorage.setItem(key, String(value))
  emitSettingsUpdated()
}

function safeParseArray<T>(raw: string | null): T[] | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return null

    return parsed as T[]
  } catch {
    return null
  }
}

function migrateLegacyProviderValues(providers: ProviderOption[]) {
  const legacyApiKey = localStorage.getItem("apiKey")
  const legacyBaseUrl = localStorage.getItem("baseUrl")

  if (!legacyApiKey && !legacyBaseUrl) return providers

  return providers.map((provider) => {
    if (provider.id !== "openai") return provider

    return {
      ...provider,
      apiKey: provider.apiKey || legacyApiKey || "",
      baseUrl: provider.baseUrl || legacyBaseUrl || "https://api.openai.com/v1",
    }
  })
}

export function getProviderOptions(): ProviderOption[] {
  const stored = safeParseArray<ProviderOption>(
    localStorage.getItem(PROVIDERS_KEY),
  )

  if (!stored || stored.length === 0) {
    return migrateLegacyProviderValues(DEFAULT_PROVIDERS)
  }

  return stored
}

export function saveProviderOptions(providers: ProviderOption[]) {
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers))
  emitSettingsUpdated()
}

export function getProviderById(id: string) {
  return getProviderOptions().find((provider) => provider.id === id)
}

export function getCurrentProviderId() {
  const stored = localStorage.getItem(CURRENT_PROVIDER_KEY)

  if (stored && getProviderById(stored)) {
    return stored
  }

  const currentModel = getModel()
  const modelOption = getModelOptions().find((item) => item.model === currentModel)

  if (modelOption && getProviderById(modelOption.providerId)) {
    return modelOption.providerId
  }

  return getProviderOptions()[0]?.id || "openai"
}

export function setCurrentProviderId(id: string) {
  localStorage.setItem(CURRENT_PROVIDER_KEY, id)
  emitSettingsUpdated()
}

export function getCurrentProvider() {
  const providerId = getCurrentProviderId()
  const provider = getProviderById(providerId)

  if (provider) return provider

  return getProviderOptions()[0]
}

export function addProviderOption(name: string, baseUrl: string, apiKey: string) {
  const finalName = name.trim()
  const finalBaseUrl = baseUrl.trim().replace(/\/$/, "")
  const finalApiKey = apiKey.trim()

  if (!finalName || !finalBaseUrl) return

  const providers = getProviderOptions()

  const newProvider: ProviderOption = {
    id: crypto.randomUUID(),
    name: finalName,
    baseUrl: finalBaseUrl,
    apiKey: finalApiKey,
  }

  saveProviderOptions([...providers, newProvider])
  setCurrentProviderId(newProvider.id)
}

export function updateProviderOption(updatedProvider: ProviderOption) {
  const providers = getProviderOptions()

  const nextProviders = providers.map((provider) =>
    provider.id === updatedProvider.id ? updatedProvider : provider,
  )

  saveProviderOptions(nextProviders)
}

export function removeProviderOption(id: string) {
  const providers = getProviderOptions()
  const models = getModelOptions()

  const nextProviders = providers.filter((provider) => provider.id !== id)
  const nextModels = models.filter((model) => model.providerId !== id)

  if (nextProviders.length === 0) return

  saveProviderOptions(nextProviders)
  saveModelOptions(nextModels)

  const currentProviderId = getCurrentProviderId()

  if (currentProviderId === id) {
    setCurrentProviderId(nextProviders[0].id)

    const firstModel = nextModels.find(
      (model) => model.providerId === nextProviders[0].id,
    )

    if (firstModel) {
      setModel(firstModel.model)
    }
  }
}

export function getModelOptions(): ModelOption[] {
  const stored = safeParseArray<ModelOption>(localStorage.getItem(MODELS_KEY))

  if (!stored || stored.length === 0) {
    return DEFAULT_MODELS
  }

  return stored
}

export function saveModelOptions(models: ModelOption[]) {
  localStorage.setItem(MODELS_KEY, JSON.stringify(models))
  emitSettingsUpdated()
}

export function getModel() {
  return getString("model", "gpt-4o-mini")
}

export function setModel(value: string) {
  const models = getModelOptions()
  const found = models.find((item) => item.model === value)

  if (found) {
    setCurrentProviderId(found.providerId)
  }

  setString("model", value)
}

export function setCurrentModel(providerId: string, model: string) {
  setCurrentProviderId(providerId)
  setString("model", model)
}

export function getCurrentModelOption() {
  const model = getModel()
  const providerId = getCurrentProviderId()

  const models = getModelOptions()

  const exact = models.find(
    (item) => item.model === model && item.providerId === providerId,
  )

  if (exact) return exact

  const sameModel = models.find((item) => item.model === model)

  if (sameModel) return sameModel

  return models[0]
}

export function addModelOption(
  name: string,
  model: string,
  providerId: string,
  vision = false,
  reasoning = false,
) {
  const finalName = name.trim()
  const finalModel = model.trim()

  if (!finalName || !finalModel || !providerId) return

  const models = getModelOptions()

  const exists = models.some(
    (item) => item.model === finalModel && item.providerId === providerId,
  )

  if (exists) return

  const newModel: ModelOption = {
    id: crypto.randomUUID(),
    name: finalName,
    model: finalModel,
    providerId,
    vision,
    reasoning,
  }

  saveModelOptions([...models, newModel])
}

export function removeModelOption(id: string) {
  const models = getModelOptions()
  const nextModels = models.filter((item) => item.id !== id)

  if (nextModels.length === 0) return

  saveModelOptions(nextModels)

  const currentModel = getModel()
  const stillExists = nextModels.some((item) => item.model === currentModel)

  if (!stillExists) {
    setCurrentModel(nextModels[0].providerId, nextModels[0].model)
  }
}

/**
 * 兼容旧代码：现在 apiKey/baseUrl 实际保存在当前服务商里。
 */
export function getApiKey() {
  return getCurrentProvider()?.apiKey || ""
}

export function setApiKey(value: string) {
  const provider = getCurrentProvider()

  if (!provider) return

  updateProviderOption({
    ...provider,
    apiKey: value,
  })
}

export function getBaseUrl() {
  return getCurrentProvider()?.baseUrl || "https://api.openai.com/v1"
}

export function setBaseUrl(value: string) {
  const provider = getCurrentProvider()

  if (!provider) return

  updateProviderOption({
    ...provider,
    baseUrl: value.replace(/\/$/, ""),
  })
}

export function getTemperature() {
  return getNumber("temperature", 0.7)
}

export function setTemperature(value: number) {
  setNumber("temperature", value)
}

export function getTopP() {
  return getNumber("topP", 1)
}

export function setTopP(value: number) {
  setNumber("topP", value)
}

export function getMaxTokens() {
  return getNumber("maxTokens", 2048)
}

export function setMaxTokens(value: number) {
  setNumber("maxTokens", value)
}

export function getContextCount() {
  return getNumber("contextCount", 10)
}

export function setContextCount(value: number) {
  setNumber("contextCount", value)
}

export function getStreamOutput() {
  return getBoolean("streamOutput", true)
}

export function setStreamOutput(value: boolean) {
  setBoolean("streamOutput", value)
}

export function getEnableReasoning() {
  return getBoolean("enableReasoning", false)
}

export function setEnableReasoning(value: boolean) {
  setBoolean("enableReasoning", value)
}

export function getShowReasoning() {
  return getBoolean("showReasoning", true)
}

export function setShowReasoning(value: boolean) {
  setBoolean("showReasoning", value)
}

export function resetSettings() {
  localStorage.removeItem("apiKey")
  localStorage.removeItem("baseUrl")
  localStorage.removeItem("model")
  localStorage.removeItem("temperature")
  localStorage.removeItem("topP")
  localStorage.removeItem("maxTokens")
  localStorage.removeItem("contextCount")
  localStorage.removeItem("streamOutput")
  localStorage.removeItem("enableReasoning")
  localStorage.removeItem("showReasoning")
  localStorage.removeItem(PROVIDERS_KEY)
  localStorage.removeItem(MODELS_KEY)
  localStorage.removeItem(CURRENT_PROVIDER_KEY)
  emitSettingsUpdated()
}