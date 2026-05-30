import { useMemo, useRef, useState } from "react"
import {
  Download,
  FileJson,
  FolderOpen,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { Button } from "./Button"
import {
  addSkill,
  exportSkillsToJsonText,
  getSkills,
  importSkillsFromJsonText,
  removeSkill,
  resetSkills,
  saveSkills,
  type Skill,
} from "../skills"

interface Props {
  open: boolean
  onClose: () => void
}

function parseTriggers(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function triggersToText(triggers: string[]) {
  return triggers.join("，")
}

function createEmptySkill(): Skill {
  const now = Date.now()

  return {
    id: "",
    name: "",
    description: "",
    triggers: [],
    content: "",
    enabled: true,
    createdAt: now,
    updatedAt: now,
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("读取文件失败"))

    reader.readAsText(file)
  })
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], {
    type: "application/json;charset=utf-8",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

export function SkillsPanel({ open, onClose }: Props) {
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null)

  const [skills, setSkills] = useState<Skill[]>(getSkills())
  const [selectedId, setSelectedId] = useState(skills[0]?.id || "")
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState<Skill>(
    skills[0] ? { ...skills[0] } : createEmptySkill(),
  )

  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge")

  const filteredSkills = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return skills

    return skills.filter((skill) => {
      return (
        skill.name.toLowerCase().includes(keyword) ||
        skill.description.toLowerCase().includes(keyword) ||
        skill.triggers.join(" ").toLowerCase().includes(keyword)
      )
    })
  }, [skills, search])

  if (!open) return null

  function selectSkill(skill: Skill) {
    setSelectedId(skill.id)
    setDraft({ ...skill })
  }

  function refresh(nextSkills = getSkills()) {
    setSkills(nextSkills)

    if (nextSkills.length === 0) {
      setDraft(createEmptySkill())
      setSelectedId("")
      return
    }

    if (draft.id) {
      const latest = nextSkills.find((item) => item.id === draft.id)

      if (latest) {
        setDraft({ ...latest })
        setSelectedId(latest.id)
        return
      }
    }

    setDraft({ ...nextSkills[0] })
    setSelectedId(nextSkills[0].id)
  }

  function createSkill() {
    const newSkill = addSkill({
      name: "新技能",
      description: "请填写这个技能的用途。",
      triggers: ["新技能"],
      content:
        "请在这里填写技能指令，例如：你是一个专业助手，请按照以下规则完成任务……",
      enabled: true,
    })

    const nextSkills = getSkills()

    setSkills(nextSkills)
    setSelectedId(newSkill.id)
    setDraft({ ...newSkill })
  }

  function saveCurrentSkill() {
    const name = draft.name.trim()
    const content = draft.content.trim()

    if (!name) {
      alert("请填写技能名称")
      return
    }

    if (!content) {
      alert("请填写技能内容")
      return
    }

    if (!draft.id) {
      addSkill({
        name,
        description: draft.description.trim(),
        triggers: draft.triggers,
        content,
        enabled: draft.enabled,
      })

      refresh()
      return
    }

    const nextSkills = skills.map((skill) =>
      skill.id === draft.id
        ? {
            ...draft,
            name,
            description: draft.description.trim(),
            content,
            updatedAt: Date.now(),
          }
        : skill,
    )

    saveSkills(nextSkills)
    refresh(nextSkills)
  }

  function deleteCurrentSkill() {
    if (!draft.id) return

    const confirmed = window.confirm(`确定删除技能「${draft.name}」吗？`)

    if (!confirmed) return

    removeSkill(draft.id)
    refresh()
  }

  function toggleSkill(skill: Skill) {
    const nextSkills = skills.map((item) =>
      item.id === skill.id
        ? {
            ...item,
            enabled: !item.enabled,
            updatedAt: Date.now(),
          }
        : item,
    )

    saveSkills(nextSkills)
    refresh(nextSkills)
  }

  function resetAllSkills() {
    const confirmed = window.confirm(
      "确定恢复默认技能吗？这会删除你自己添加的技能。",
    )

    if (!confirmed) return

    resetSkills()
    refresh(getSkills())
  }

  async function handleJsonFile(file: File | undefined) {
    if (!file) return

    try {
      const text = await readFileAsText(file)
      const importedSkills = importSkillsFromJsonText(text, importMode)

      setImportOpen(false)
      setImportText("")
      refresh(getSkills())

      alert(`导入成功：${importedSkills.length} 个技能`)
    } catch (error) {
      alert(error instanceof Error ? error.message : "导入失败")
    } finally {
      if (jsonFileInputRef.current) {
        jsonFileInputRef.current.value = ""
      }
    }
  }

  function handlePasteImport() {
    if (!importText.trim()) {
      alert("请先粘贴 skill JSON")
      return
    }

    try {
      const importedSkills = importSkillsFromJsonText(importText, importMode)

      setImportOpen(false)
      setImportText("")
      refresh(getSkills())

      alert(`导入成功：${importedSkills.length} 个技能`)
    } catch (error) {
      alert(error instanceof Error ? error.message : "导入失败")
    }
  }

  function handleExport() {
    const jsonText = exportSkillsToJsonText()
    const date = new Date().toISOString().slice(0, 10)

    downloadTextFile(`cherry-web-skills-${date}.json`, jsonText)
  }

  const hasSkills = skills.length > 0

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="absolute inset-x-0 bottom-0 top-10 flex overflow-hidden rounded-t-3xl bg-[var(--color-background)] text-[var(--color-foreground)] shadow-[var(--shadow-xl)] md:inset-8 md:rounded-3xl">
        <aside className="hidden w-72 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sidebar)] p-3 md:flex md:flex-col">
          <div className="mb-3 flex h-9 items-center justify-between px-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={17} />
              技能
            </div>

            <Button variant="ghost" size="icon-sm" onClick={createSkill}>
              <Plus size={17} />
            </Button>
          </div>

          <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3">
            <Search
              size={15}
              className="text-[var(--color-foreground-muted)]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="发现更多技能..."
              className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-foreground-muted)]"
            />
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="justify-center"
              onClick={() => setImportOpen(true)}
            >
              <Upload size={15} />
              导入
            </Button>

            <Button
              variant="outline"
              className="justify-center"
              onClick={handleExport}
            >
              <Download size={15} />
              导出
            </Button>
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {filteredSkills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => selectSkill(skill)}
                className={[
                  "w-full rounded-xl px-3 py-2 text-left transition-colors",
                  selectedId === skill.id
                    ? "bg-[var(--color-secondary)] text-[var(--color-foreground)]"
                    : "text-[var(--color-foreground-secondary)] hover:bg-[var(--color-accent)]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 truncate text-sm font-medium">
                    {skill.name}
                  </div>

                  <span
                    className={[
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px]",
                      skill.enabled
                        ? "bg-emerald-500 text-white"
                        : "bg-neutral-500/30 text-[var(--color-foreground-muted)]",
                    ].join(" ")}
                  >
                    {skill.enabled ? "启用" : "关闭"}
                  </span>
                </div>

                <div className="mt-1 line-clamp-2 text-xs text-[var(--color-foreground-muted)]">
                  {skill.description || "暂无描述"}
                </div>
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            className="mt-3 justify-start"
            onClick={resetAllSkills}
          >
            <RotateCcw size={15} />
            恢复默认技能
          </Button>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={17} />
              技能库
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="hidden md:flex"
                onClick={() => setImportOpen(true)}
              >
                <Upload size={15} />
                从 JSON 安装
              </Button>

              <Button
                variant="outline"
                className="hidden md:flex"
                onClick={handleExport}
              >
                <Download size={15} />
                导出
              </Button>

              <Button className="md:hidden" onClick={createSkill}>
                <Plus size={15} />
                新建
              </Button>

              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X size={18} />
              </Button>
            </div>
          </header>

          <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] px-3 py-2 md:hidden">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="shrink-0 rounded-xl bg-[var(--color-secondary)] px-3 py-2 text-sm"
            >
              导入 JSON
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="shrink-0 rounded-xl bg-[var(--color-secondary)] px-3 py-2 text-sm"
            >
              导出
            </button>

            {skills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => selectSkill(skill)}
                className={[
                  "shrink-0 rounded-xl px-3 py-2 text-sm",
                  selectedId === skill.id
                    ? "bg-[var(--color-secondary)]"
                    : "text-[var(--color-foreground-muted)]",
                ].join(" ")}
              >
                {skill.name}
              </button>
            ))}
          </div>

          <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
            {!hasSkills ? (
              <div className="flex min-h-[70vh] items-center justify-center">
                <div className="mx-auto max-w-md text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-[var(--color-border)] text-[var(--color-foreground-muted)]">
                    <Sparkles size={30} />
                  </div>

                  <div className="text-lg font-semibold">未选择技能</div>

                  <p className="mt-3 text-sm leading-6 text-[var(--color-foreground-muted)]">
                    通过 JSON 文件安装，或粘贴别人分享的 skill JSON 来扩展 Agent 的能力。
                  </p>

                  <div className="mt-6 flex justify-center gap-3">
                    <Button onClick={() => setImportOpen(true)}>
                      <Upload size={16} />
                      从 JSON 安装
                    </Button>

                    <Button variant="outline" onClick={createSkill}>
                      <Plus size={16} />
                      新建技能
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl space-y-4">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div className="text-sm font-semibold">技能说明</div>
                  <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
                    技能会根据用户消息中的触发关键词自动启用，并把技能内容作为隐藏指令发送给 AI。
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <div className="mb-2 text-sm font-medium">技能名称</div>
                    <input
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="例如：小红书文案专家"
                      className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    />
                  </label>

                  <label className="block">
                    <div className="mb-2 text-sm font-medium">触发关键词</div>
                    <input
                      value={triggersToText(draft.triggers)}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          triggers: parseTriggers(event.target.value),
                        }))
                      }
                      placeholder="小红书，文案，种草"
                      className="h-10 w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                    />
                  </label>
                </div>

                <label className="block">
                  <div className="mb-2 text-sm font-medium">描述</div>
                  <textarea
                    value={draft.description}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="这个技能适合什么时候使用？"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-base outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 text-sm font-medium">
                    技能内容 / SKILL.md
                  </div>
                  <textarea
                    value={draft.content}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        content: event.target.value,
                      }))
                    }
                    placeholder="在这里写技能指令。比如：你是一个专业的小红书文案专家，请按照以下规则..."
                    rows={14}
                    className="w-full resize-y rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm leading-6 outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                  />
                </label>

                <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <div>
                    <div className="text-sm font-medium">启用技能</div>
                    <div className="mt-1 text-xs text-[var(--color-foreground-muted)]">
                      关闭后不会自动匹配这个技能。
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        enabled: !current.enabled,
                      }))
                    }
                    className={[
                      "relative h-6 w-11 rounded-full transition-colors",
                      draft.enabled ? "bg-emerald-500" : "bg-neutral-400/40",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                        draft.enabled ? "translate-x-5" : "translate-x-0.5",
                      ].join(" ")}
                    />
                  </button>
                </div>

                <div className="flex flex-wrap justify-between gap-2">
                  <div className="flex gap-2">
                    {draft.id && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const skill = skills.find(
                              (item) => item.id === draft.id,
                            )
                            if (skill) toggleSkill(skill)
                          }}
                        >
                          {draft.enabled ? "关闭技能" : "启用技能"}
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={deleteCurrentSkill}
                        >
                          <Trash2 size={16} />
                          删除技能
                        </Button>
                      </>
                    )}
                  </div>

                  <Button onClick={saveCurrentSkill}>保存技能</Button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {importOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-[var(--shadow-xl)]">
            <header className="flex h-12 items-center justify-between border-b border-[var(--color-border)] px-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileJson size={17} />
                安装 Skill JSON
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setImportOpen(false)}
              >
                <X size={18} />
              </Button>
            </header>

            <div className="space-y-4 p-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <div className="text-sm font-semibold">支持的 JSON 格式</div>

                <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--color-popover)] p-3 text-xs leading-5 text-[var(--color-foreground-secondary)]">
{`{
  "name": "小红书文案专家",
  "description": "生成小红书文案",
  "triggers": ["小红书", "文案", "种草"],
  "content": "你是一个小红书爆款文案专家..."
}`}
                </pre>

                <p className="mt-3 text-xs text-[var(--color-foreground-muted)]">
                  也支持技能数组，或者 {"{ skills: [...] }"} 格式。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={jsonFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(event) => handleJsonFile(event.target.files?.[0])}
                />

                <Button onClick={() => jsonFileInputRef.current?.click()}>
                  <FolderOpen size={16} />
                  从 JSON 文件安装
                </Button>

                <Button variant="outline" onClick={handlePasteImport}>
                  <Upload size={16} />
                  从粘贴内容安装
                </Button>

                <label className="ml-auto flex items-center gap-2 text-sm text-[var(--color-foreground-muted)]">
                  <input
                    type="radio"
                    checked={importMode === "merge"}
                    onChange={() => setImportMode("merge")}
                  />
                  追加
                </label>

                <label className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)]">
                  <input
                    type="radio"
                    checked={importMode === "replace"}
                    onChange={() => setImportMode("replace")}
                  />
                  替换全部
                </label>
              </div>

              <label className="block">
                <div className="mb-2 text-sm font-medium">粘贴 Skill JSON</div>
                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  placeholder="把别人分享给你的 skill JSON 粘贴到这里..."
                  rows={10}
                  className="w-full resize-y rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm leading-6 outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                />
              </label>

              <div className="text-xs leading-5 text-[var(--color-foreground-muted)]">
                提示：选择“追加”会保留当前技能；选择“替换全部”会清空当前技能后再导入。
              </div>
            </div>

            <footer className="flex justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
              <Button variant="outline" onClick={() => setImportOpen(false)}>
                取消
              </Button>

              <Button onClick={handlePasteImport}>
                <Upload size={16} />
                安装
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}