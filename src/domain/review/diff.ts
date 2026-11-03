// Paragraph alignment for author-reviewed proposals.

/** 按空行切段（段内单换行是软换行，保留在段内） */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n[ \t]*\n+/)
    .map(p => p.trim())
    .filter(Boolean)
}

export type ParagraphOp = { kind: 'equal' | 'replace'; old?: string; new?: string }

/**
 * 段落级 LCS 对齐：相等段落逐一配对，不相邻的相等段之间的
 * 原文段落与产出段落合并为一个 replace 块（供审阅界面逐块采纳/保留）。
 */
export function alignParagraphs(oldText: string, newText: string): ParagraphOp[] {
  const a = splitParagraphs(oldText)
  const b = splitParagraphs(newText)
  const ops: ParagraphOp[] = []

  // LCS 长度表
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  let pendingOld: string[] = []
  let pendingNew: string[] = []
  const flush = () => {
    if (pendingOld.length || pendingNew.length) {
      ops.push({ kind: 'replace', old: pendingOld.join('\n\n') || undefined, new: pendingNew.join('\n\n') || undefined })
      pendingOld = []
      pendingNew = []
    }
  }

  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      flush()
      ops.push({ kind: 'equal', old: a[i], new: b[j] })
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      pendingOld.push(a[i++])
    } else {
      pendingNew.push(b[j++])
    }
  }
  pendingOld.push(...a.slice(i))
  pendingNew.push(...b.slice(j))
  flush()

  return ops
}
