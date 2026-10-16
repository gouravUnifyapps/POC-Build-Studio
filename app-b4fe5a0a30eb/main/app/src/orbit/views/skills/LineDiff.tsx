// A line-level diff of two texts (LCS), shown unified or side by side. Added and removed
// lines get a tinted background and a +/− gutter sign — no side stripes.
import { useMemo } from 'react'

type Op = { kind: 'same' | 'add' | 'del'; text: string; a?: number; b?: number }

/** Above this many lines on either side the LCS table gets too big; fall back to a block diff. */
const MAX_LINES = 1500

export function diffLines(before: string, after: string): Op[] {
  const a = before.split('\n')
  const b = after.split('\n')
  if (a.length > MAX_LINES || b.length > MAX_LINES) {
    return [...a.map((text, i) => ({ kind: 'del' as const, text, a: i + 1 })), ...b.map((text, i) => ({ kind: 'add' as const, text, b: i + 1 }))]
  }
  const n = a.length
  const m = b.length
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const ops: Op[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ kind: 'same', text: a[i], a: i + 1, b: j + 1 })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ kind: 'del', text: a[i], a: i + 1 })
      i++
    } else {
      ops.push({ kind: 'add', text: b[j], b: j + 1 })
      j++
    }
  }
  while (i < n) ops.push({ kind: 'del', text: a[i], a: ++i })
  while (j < m) ops.push({ kind: 'add', text: b[j], b: ++j })
  return ops
}

const SIGN = { same: ' ', add: '+', del: '−' } as const

export function LineDiff({ before, after, mode, testId }: { before: string; after: string; mode: 'unified' | 'split'; testId: string }) {
  const ops = useMemo(() => diffLines(before, after), [before, after])
  const added = ops.filter((o) => o.kind === 'add').length
  const removed = ops.filter((o) => o.kind === 'del').length

  if (!added && !removed)
    return (
      <p className="ob-sk-muted" data-test-id={`${testId}-nochange`}>
        No line changes.
      </p>
    )

  const summary = (
    <p className="ob-diff-sum" data-test-id={`${testId}-summary`}>
      <span className="ob-diff-add-n">+{added}</span> <span className="ob-diff-del-n">−{removed}</span>
    </p>
  )

  if (mode === 'unified')
    return (
      <div className="ob-diff" data-test-id={testId}>
        {summary}
        <div className="ob-diff-body" role="table" aria-label="Line changes">
          {ops.map((o, k) => (
            <div key={k} role="row" className={`ob-diff-ln is-${o.kind}`} data-test-id={`${testId}-line-${k}`}>
              <span role="cell" className="ob-diff-no">{o.a ?? ''}</span>
              <span role="cell" className="ob-diff-no">{o.b ?? ''}</span>
              <span role="cell" className="ob-diff-sg" aria-label={o.kind === 'add' ? 'added' : o.kind === 'del' ? 'removed' : undefined}>
                {SIGN[o.kind]}
              </span>
              <span role="cell" className="ob-diff-tx">{o.text || ' '}</span>
            </div>
          ))}
        </div>
      </div>
    )

  // split: pair each run of removals with the additions that follow it
  const rows: { l?: Op; r?: Op }[] = []
  for (let k = 0; k < ops.length; ) {
    if (ops[k].kind === 'same') {
      rows.push({ l: ops[k], r: ops[k] })
      k++
      continue
    }
    const dels: Op[] = []
    const adds: Op[] = []
    while (k < ops.length && ops[k].kind === 'del') dels.push(ops[k++])
    while (k < ops.length && ops[k].kind === 'add') adds.push(ops[k++])
    for (let x = 0; x < Math.max(dels.length, adds.length); x++) rows.push({ l: dels[x], r: adds[x] })
  }
  return (
    <div className="ob-diff" data-test-id={testId}>
      {summary}
      <div className="ob-diff-body ob-diff-split" role="table" aria-label="Line changes, side by side">
        {rows.map((r, k) => (
          <div key={k} role="row" className="ob-diff-pair" data-test-id={`${testId}-pair-${k}`}>
            <Half op={r.l} side="a" />
            <Half op={r.r} side="b" />
          </div>
        ))}
      </div>
    </div>
  )
}

function Half({ op, side }: { op?: Op; side: 'a' | 'b' }) {
  if (!op) return <span role="cell" className="ob-diff-ln is-empty" />
  return (
    <span role="cell" className={`ob-diff-ln is-${op.kind}`}>
      <span className="ob-diff-no">{side === 'a' ? op.a : op.b}</span>
      <span className="ob-diff-sg">{SIGN[op.kind]}</span>
      <span className="ob-diff-tx">{op.text || ' '}</span>
    </span>
  )
}
