function getString(key: string, fallback: string) {
  return localStorage.getItem(key) || fallback
}

function setString(key: string, value: string) {
  localStorage.setItem(key, value)
}

function getNumber(key: string, fallback: number) {
  const value = localStorage.getItem(key)

  if (!value) return fallback

  const numberValue = Number(value)

  if (Number.isNaN(numberValue)) return fallback

  return numberValue
}

function setNumber(key: string, value: number) {
  localStorage.setItem(key, String(value))
}

function getBoolean(key: string, fallback: boolean) {
  const value = localStorage.getItem(key)

  if (value === null) return fallback

  return value === "true"
}

function setBoolean(key: string, value: boolean) {
  localStorage.setItem(key, String(value))
}

export function getApiKey() {
  return getString("apiKey", "")
}

export function setApiKey(value: string) {
  setString("apiKey", value)
}

export function getBaseUrl() {
  return getString("baseUrl", "https://api.openai.com/v1")
}

export function setBaseUrl(value: string) {
  setString("baseUrl", value)
}

export function getModel() {
  return getString("model", "gpt-4o-mini")
}

export function setModel(value: string) {
  setString("model", value)
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
}