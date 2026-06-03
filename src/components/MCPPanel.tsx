import { useState, useEffect } from "react"
import { Plus, Trash2, X } from "lucide-react"
import { Button } from "./Button"
import { mcpManager } from "../mcp"
import type { MCPServerConfig, MCPServerStatus } from "../mcp-types"

interface MCPPanelProps {
  open?: boolean
  onClose: () => void
}

export function MCPPanel({ open = false, onClose }: MCPPanelProps) {
  if (!open) return null
  const [servers, setServers] = useState<MCPServerConfig[]>([])
  const [statuses, setStatuses] = useState<Map<string, MCPServerStatus>>(new Map())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newServer, setNewServer] = useState({
    name: "",
    command: "",
    args: "",
    env: "",
  })

  useEffect(() => {
    setServers(mcpManager.getServers())

    // Subscribe to status updates
    const updateStatus = (status: MCPServerStatus) => {
      setStatuses(prev => {
        const newStatuses = new Map(prev)
        newStatuses.set(status.serverId, status)
        return newStatuses
      })
    }

    servers.forEach(server => {
      mcpManager.onStatusChange(server.id, updateStatus)
    })

    return () => {
      servers.forEach(server => {
        mcpManager.removeStatusListener(server.id, updateStatus)
      })
    }
  }, [])

  const handleAddServer = async () => {
    if (!newServer.name || !newServer.command) return

    const args = newServer.args
      .split(",")
      .map(arg => arg.trim())
      .filter(Boolean)

    const env: Record<string, string> = {}
    if (newServer.env) {
      newServer.env.split(",").forEach(pair => {
        const [key, value] = pair.split(":").map(s => s.trim())
        if (key && value) {
          env[key] = value
        }
      })
    }

    const server = mcpManager.addServer({
      name: newServer.name,
      command: newServer.command,
      args,
      env: Object.keys(env).length > 0 ? env : undefined,
      enabled: true,
    })

    setServers([...servers, server])
    setShowAddForm(false)
    setNewServer({ name: "", command: "", args: "", env: "" })

    // Try to connect the new server
    try {
      await mcpManager.connectServer(server.id)
    } catch (error) {
      console.error("Failed to connect to new server:", error)
    }
  }

  const handleRemoveServer = (id: string) => {
    if (window.confirm("确定要删除这个 MCP 服务器吗？")) {
      mcpManager.removeServer(id)
      setServers(servers.filter(s => s.id !== id))
      setStatuses(prev => {
        const newStatuses = new Map(prev)
        newStatuses.delete(id)
        return newStatuses
      })
    }
  }

  const handleToggleServer = async (id: string, enabled: boolean) => {
    mcpManager.updateServer(id, { enabled })

    if (enabled && !mcpManager.isConnected(id)) {
      try {
        await mcpManager.connectServer(id)
      } catch (error) {
        console.error("Failed to connect server:", error)
      }
    } else if (!enabled && mcpManager.isConnected(id)) {
      mcpManager.disconnectServer(id)
    }

    setServers(mcpManager.getServers())
  }

  const handleConnect = async (id: string) => {
    try {
      await mcpManager.connectServer(id)
      const tools = await mcpManager.listTools(id)
      console.log("Available tools:", tools)
    } catch (error) {
      console.error("Failed to connect:", error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-popover)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <h2 className="text-lg font-semibold">MCP 服务器</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {servers.length === 0 && !showAddForm && (
            <div className="py-12 text-center text-sm text-[var(--color-foreground-muted)]">
              <p className="mb-2">还没有配置 MCP 服务器</p>
              <p className="text-xs">点击下方按钮添加你的第一个 MCP 服务器</p>
            </div>
          )}

          {servers.map(server => {
            const status = statuses.get(server.id)
            const isConnected = status?.connected || false

            return (
              <div
                key={server.id}
                className="mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-1 font-medium">{server.name}</h3>
                    <p className="text-xs text-[var(--color-foreground-muted)]">
                      {server.command} {server.args.join(" ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        isConnected
                          ? "bg-green-500"
                          : server.enabled
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveServer(server.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={server.enabled}
                      onChange={e => handleToggleServer(server.id, e.target.checked)}
                      className="rounded"
                    />
                    启用
                  </label>

                  {server.enabled && !isConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(server.id)}
                    >
                      连接
                    </Button>
                  )}
                </div>

                {status?.tools && status.tools.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1 text-xs font-medium">可用工具:</p>
                    <div className="flex flex-wrap gap-1">
                      {status.tools.map(tool => (
                        <span
                          key={tool.name}
                          className="inline-flex items-center rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-xs"
                        >
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {status?.error && (
                  <p className="mt-2 text-xs text-[var(--color-destructive)]">
                    错误: {status.error}
                  </p>
                )}
              </div>
            )
          })}

          {showAddForm && (
            <div className="mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <h3 className="mb-3 font-medium">添加 MCP 服务器</h3>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm">名称</label>
                  <input
                    type="text"
                    value={newServer.name}
                    onChange={e => setNewServer({ ...newServer, name: e.target.value })}
                    placeholder="例如: 我的搜索服务器"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">命令</label>
                  <input
                    type="text"
                    value={newServer.command}
                    onChange={e => setNewServer({ ...newServer, command: e.target.value })}
                    placeholder="例如: npx"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">参数 (逗号分隔)</label>
                  <input
                    type="text"
                    value={newServer.args}
                    onChange={e => setNewServer({ ...newServer, args: e.target.value })}
                    placeholder="例如: -y, @modelcontextprotocol/server-search"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">环境变量 (key:value, 逗号分隔，可选)</label>
                  <input
                    type="text"
                    value={newServer.env}
                    onChange={e => setNewServer({ ...newServer, env: e.target.value })}
                    placeholder="例如: API_KEY:xxx, SEARCH_ENGINE:google"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddServer}>添加</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    取消
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--color-border)] p-4">
          <div className="flex justify-between">
            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
              <Plus size={16} />
              添加服务器
            </Button>

            <div className="text-xs text-[var(--color-foreground-muted)]">
              MCP 让 AI 能够使用外部工具
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
