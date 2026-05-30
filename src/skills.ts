export interface Skill {
  id: string
  name: string
  description: string
  triggers: string[]
  content: string
  enabled: boolean
  createdAt: number
  updatedAt: number
}

const SKILLS_KEY = "cherry-web-skills-v1"

const DEFAULT_SKILLS: Skill[] = [
  {
    id: "xiaohongshu-writer",
    name: "小红书文案专家",
    description: "生成小红书风格标题、正文、标签和种草文案。",
    triggers: ["小红书", "种草", "文案", "标题", "爆款"],
    content:
      "你是一个小红书爆款文案专家。请使用口语化、情绪化、有吸引力的表达。输出时尽量包含：1. 多个标题；2. 正文；3. 标签；4. 适合的 emoji。风格要自然，不要像广告机器。",
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "code-reviewer",
    name: "代码审查助手",
    description: "帮助检查代码问题、优化结构、指出潜在 bug。",
    triggers: ["代码审查", "review", "bug", "优化代码", "重构"],
    content:
      "你是一个严谨的代码审查助手。请从可读性、性能、安全性、边界条件、类型问题、可维护性几个角度分析代码。先指出问题，再给出修改建议，必要时提供修改后的代码。",
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "translator",
    name: "专业翻译助手",
    description: "中英互译、润色、调整语气。",
    triggers: ["翻译", "英文", "中文", "润色", "translate"],
    content:
      "你是一个专业翻译和润色助手。请准确理解原文意思，输出自然、流畅、符合目标语言习惯的译文。如果用户要求润色，请在保持原意的基础上提升表达质量。必要时可以给出多个版本。",
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

function safeParseSkills(raw: string | null): Skill[] | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) return null

    return parsed
      .filter((item) => item && item.id && item.name)
      .map((item) => ({
        id: String(item.id),
        name: String(item.name || ""),
        description: String(item.description || ""),
        triggers: Array.isArray(item.triggers)
          ? item.triggers.map(String).filter(Boolean)
          : [],
        content: String(item.content || ""),
        enabled: Boolean(item.enabled),
        createdAt: Number(item.createdAt || Date.now()),
        updatedAt: Number(item.updatedAt || Date.now()),
      }))
  } catch {
    return null
  }
}

export function getSkills(): Skill[] {
  const stored = safeParseSkills(localStorage.getItem(SKILLS_KEY))

  if (!stored || stored.length === 0) {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(DEFAULT_SKILLS))
    return DEFAULT_SKILLS
  }

  return stored
}

export function saveSkills(skills: Skill[]) {
  localStorage.setItem(SKILLS_KEY, JSON.stringify(skills))
  window.dispatchEvent(new Event("cherry-skills-updated"))
}

export function addSkill(skill: Omit<Skill, "id" | "createdAt" | "updatedAt">) {
  const now = Date.now()

  const newSkill: Skill = {
    ...skill,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }

  saveSkills([newSkill, ...getSkills()])

  return newSkill
}

export function updateSkill(id: string, patch: Partial<Skill>) {
  const nextSkills = getSkills().map((skill) =>
    skill.id === id
      ? {
          ...skill,
          ...patch,
          updatedAt: Date.now(),
        }
      : skill,
  )

  saveSkills(nextSkills)
}

export function removeSkill(id: string) {
  saveSkills(getSkills().filter((skill) => skill.id !== id))
}

export function resetSkills() {
  localStorage.removeItem(SKILLS_KEY)
  window.dispatchEvent(new Event("cherry-skills-updated"))
}

export function matchSkillsFromText(text: string) {
  const lowerText = text.toLowerCase()

  return getSkills().filter((skill) => {
    if (!skill.enabled) return false

    const triggers = skill.triggers.filter(Boolean)

    if (triggers.length === 0) return false

    return triggers.some((trigger) =>
      lowerText.includes(trigger.toLowerCase()),
    )
  })
}

export function buildSkillSystemPromptFromText(text: string) {
  const matchedSkills = matchSkillsFromText(text)

  if (matchedSkills.length === 0) return ""

  const skillBlocks = matchedSkills
    .map((skill, index) => {
      return [
        `## 技能 ${index + 1}：${skill.name}`,
        skill.description ? `描述：${skill.description}` : "",
        "技能内容：",
        skill.content,
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n\n---\n\n")

  return [
    "你现在可以使用以下技能来辅助回答用户问题。",
    "如果技能和用户问题相关，请优先遵循技能内容。",
    "不要告诉用户你正在读取本地技能，直接自然完成任务。",
    "",
    skillBlocks,
  ].join("\n")
}