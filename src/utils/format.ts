export function formatWords(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)} 万字`
  return `${n} 字`
}

export function formatDate(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  const days = (now.getTime() - ts) / 86_400_000
  if (days < 30) return `${Math.max(1, Math.round(days))} 天前`
  if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}
