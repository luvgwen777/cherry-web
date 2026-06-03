import { useState, useEffect } from "react"
import { mcpManager } from "./mcp"
import type { MCPTool, MCPServerStatus } from "./mcp-types"

interface UseMCPResult {
  tools: MCPTool[]
  connectedServers: MCPServerStatus[]
  isLoading: boolean
  callTool: (toolName: string, args: Record<string, any>) => Promise<any>
  refreshTools: () => Promise<void>
}

export function useMCP(): UseMCPResult {
  const [tools, setTools] = useState<MCPTool[]>([])
  const [connectedServers, setConnectedServers] = useState<MCPServerStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const servers = mcpManager.getServers()
    const enabledServers = servers.filter(s => s.enabled)

    const statuses: MCPServerStatus[] = []
    const allTools: MCPTool[] = []

    enabledServers.forEach(server => {
      if (mcpManager.isConnected(server.id)) {
        mcpManager.listTools(server.id).then(serverTools => {
          allTools.push(...serverTools)
          setTools([...allTools])
        })

        mcpManager.onStatusChange(server.id, status => {
          setConnectedServers(prev => {
            const filtered = prev.filter(s => s.serverId !== status.serverId)
            if (status.connected) {
              return [...filtered, status]
            }
            return filtered
          })
        })
      }
    })

    // Auto-connect enabled servers
    mcpManager.connectAllEnabled()
  }, [])

  const callTool = async (toolName: string, args: Record<string, any>) => {
    const servers = mcpManager.getServers()
    const enabledServers = servers.filter(s => s.enabled && mcpManager.isConnected(s.id))

    for (const server of enabledServers) {
      const serverTools = await mcpManager.listTools(server.id)
      if (serverTools.some(t => t.name === toolName)) {
        const result = await mcpManager.callTool(server.id, {
          tool: toolName,
          arguments: args,
        })

        if (result.success) {
          return result.result
        } else {
          throw new Error(result.error || "Tool execution failed")
        }
      }
    }

    throw new Error(`Tool '${toolName}' not found in any connected server`)
  }

  const refreshTools = async () => {
    setIsLoading(true)
    try {
      const servers = mcpManager.getServers()
      const enabledServers = servers.filter(s => s.enabled && mcpManager.isConnected(s.id))
      const allTools: MCPTool[] = []

      for (const server of enabledServers) {
        const serverTools = await mcpManager.listTools(server.id)
        allTools.push(...serverTools)
      }

      setTools(allTools)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    tools,
    connectedServers,
    isLoading,
    callTool,
    refreshTools,
  }
}

export default useMCP
