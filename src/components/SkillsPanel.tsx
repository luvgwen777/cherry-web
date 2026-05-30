import { useMemo, useState } from "react"
import {
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "./Button"
import {
  addSkill,
  getSkills,
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

export function SkillsPanel({ open, onClose }: Props) {
  const [skills, setSkills] = useState<Skill[]>(getSkills())
  const [selectedId, setSelectedId] = useState(skills[0]?.id || "")
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState<Skill>(
    skills[0] ? { ...skills[0] } : createEmptySkill(),
  )

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

    if (draft.id) {
      const latest = nextSkills.find((item) => item.id === draft.id)

      if (latest) {
        setDraft({ ...latest })
        setSelectedId(latest.id)
        return
      }
    }

    if (nextSkills[0]) {
      setDraft({ ...nextSkills[0] })
      setSelectedId(nextSkills[0].id)
    } else {
      setDraft(createEmptySkill())
      setSelectedId("")
    }
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
              placeholder="搜索技能..."
              className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-foreground-muted)]"
            />
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
          </section>
        </main>
      </div>
    </div>
  )
}