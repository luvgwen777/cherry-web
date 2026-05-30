import type { TokenUsage as TokenUsageType } from "../types"

interface Props {
  usage?: TokenUsageType
}

export function TokenUsage({ usage }: Props) {
  if (!usage) {
    return (
      <div className="mt-2 text-xs text-[var(--color-foreground-muted)]">
        Token 未返回
      </div>
    )
  }

  const prompt = usage.promptTokens ?? "-"
  const completion = usage.completionTokens ?? "-"
  const total = usage.totalTokens ?? "-"

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-foreground-muted)]">
      <span>输入 Token：{prompt}</span>
      <span>输出 Token：{completion}</span>
      <span>总 Token：{total}</span>
    </div>
  )
}