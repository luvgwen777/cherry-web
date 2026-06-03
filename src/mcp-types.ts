export interface MCPServerConfig {
  id: string
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
  enabled: boolean
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: any
}

export interface MCPServerStatus {
  serverId: string
  connected: boolean
  tools: MCPTool[]
  error?: string
}

export interface MCPToolCall {
  tool: string
  arguments: Record<string, any>
}

export interface MCPToolResult {
  tool: string
  success: boolean
  result?: any
  error?: string
}
