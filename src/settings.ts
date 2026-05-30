export function getApiKey() {
  return localStorage.getItem("apiKey") || ""
}

export function setApiKey(value: string) {
  localStorage.setItem("apiKey", value)
}

export function getBaseUrl() {
  return localStorage.getItem("baseUrl") || "https://api.openai.com/v1"
}

export function setBaseUrl(value: string) {
  localStorage.setItem("baseUrl", value)
}

export function getModel() {
  return localStorage.getItem("model") || "gpt-4o-mini"
}

export function setModel(value: string) {
  localStorage.setItem("model", value)
}