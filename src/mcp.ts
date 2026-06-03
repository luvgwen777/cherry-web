import type { MCPServerConfig, MCPServerStatus, MCPTool, MCPToolCall, MCPToolResult } from "./mcp-types"

type ServerStatusCallback = (status: MCPServerStatus) => void

class MCPServerManager {
  private servers: Map<string, MCPServerConfig> = new Map()
  private connections: Map<string, WebSocket | null> = new Map()
  private statusListeners: Map<string, ServerStatusCallback[]> = new Map()
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map()
  private requestId = 0

  constructor() {
    this.loadServers()
  }

  private loadServers() {
    try {
      const stored = localStorage.getItem("mcpServers")
      if (stored) {
        const configs: MCPServerConfig[] = JSON.parse(stored)
        configs.forEach(config => {
          this.servers.set(config.id, config)
        })
      }
    } catch (error) {
      console.error("Failed to load MCP servers:", error)
    }
  }

  private saveServers() {
    const configs = Array.from(this.servers.values())
    localStorage.setItem("mcpServers", JSON.stringify(configs))
  }

  getServers(): MCPServerConfig[] {
    return Array.from(this.servers.values())
  }

  addServer(config: Omit<MCPServerConfig, "id">): MCPServerConfig {
    const id = crypto.randomUUID()
    const newServer: MCPServerConfig = {
      ...config,
      id,
      enabled: true,
    }
    this.servers.set(id, newServer)
    this.saveServers()
    return newServer
  }

  updateServer(id: string, updates: Partial<MCPServerConfig>): void {
    const server = this.servers.get(id)
    if (server) {
      this.servers.set(id, { ...server, ...updates })
      this.saveServers()
    }
  }

  removeServer(id: string): void {
    this.disconnectServer(id)
    this.servers.delete(id)
    this.saveServers()
  }

  private notifyStatus(serverId: string, status: MCPServerStatus) {
    const listeners = this.statusListeners.get(serverId) || []
    listeners.forEach(callback => callback(status))
  }

  onStatusChange(serverId: string, callback: ServerStatusCallback) {
    if (!this.statusListeners.has(serverId)) {
      this.statusListeners.set(serverId, [])
    }
    this.statusListeners.get(serverId)!.push(callback)
  }

  removeStatusListener(serverId: string, callback: ServerStatusCallback) {
    const listeners = this.statusListeners.get(serverId) || []
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  async connectServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId)
    if (!server || !server.enabled) {
      throw new Error("Server not found or disabled")
    }

    // For browser environment, we use a simple WebSocket-based communication
    // In a real implementation, this would communicate with a local MCP server
    try {
      // Simulate connection for demo - in production, this would use proper MCP transport
      this.notifyStatus(serverId, {
        serverId,
        connected: true,
        tools: this.getMockTools(server.name),
      })
      this.connections.set(serverId, null)
    } catch (error) {
      this.notifyStatus(serverId, {
        serverId,
        connected: false,
        tools: [],
        error: error instanceof Error ? error.message : "Connection failed",
      })
      throw error
    }
  }

  disconnectServer(serverId: string): void {
    const connection = this.connections.get(serverId)
    if (connection) {
      connection.close()
      this.connections.delete(serverId)
    }
    this.notifyStatus(serverId, {
      serverId,
      connected: false,
      tools: [],
    })
  }

  isConnected(serverId: string): boolean {
    return this.connections.has(serverId) && this.connections.get(serverId) !== undefined
  }

  async listTools(serverId: string): Promise<MCPTool[]> {
    const server = this.servers.get(serverId)
    if (!server || !this.isConnected(serverId)) {
      return []
    }
    // Return mock tools for demo
    return this.getMockTools(server.name)
  }

  async callTool(serverId: string, toolCall: MCPToolCall): Promise<MCPToolResult> {
    try {
      // Simulate tool call - in production, this would use proper MCP protocol
      await this.simulateToolExecution(toolCall.arguments)

      return {
        tool: toolCall.tool,
        success: true,
        result: { message: "Tool executed successfully" },
      }
    } catch (error) {
      return {
        tool: toolCall.tool,
        success: false,
        error: error instanceof Error ? error.message : "Tool execution failed",
      }
    }
  }

  private getMockTools(serverName: string): MCPTool[] {
    // Return some example tools
    return [
      {
        name: "search",
        description: `Search the web using ${serverName}`,
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        },
      },
      {
        name: "fetch",
        description: `Fetch content from a URL using ${serverName}`,
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "URL to fetch" },
          },
          required: ["url"],
        },
      },
    ]
  }

  private async simulateToolExecution(args: Record<string, any>): Promise<void> {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500))

    // Basic validation
    if (!args || Object.keys(args).length === 0) {
      throw new Error("No arguments provided")
    }
  }

  async connectAllEnabled(): Promise<void> {
    const servers = Array.from(this.servers.values()).filter(s => s.enabled)
    await Promise.all(servers.map(server => this.connectServer(server.id)))
  }

  disconnectAll(): void {
    Array.from(this.servers.keys()).forEach(serverId => {
      this.disconnectServer(serverId)
    })
  }
}

export const mcpManager = new MCPServerManager()
export default mcpManager
