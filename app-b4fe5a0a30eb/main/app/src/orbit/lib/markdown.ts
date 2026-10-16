// Markdown to HTML.
// mdHtml escapes every input character before adding its own tags, so its output is safe
// to render as HTML.

export const esc = (s: unknown) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )

const inl = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`(.+?)`/g, '<code>$1</code>')

export function mdHtml(src: string | undefined | null): string {
  const L = String(src || '').split('\n')
  let out = ''
  let i = 0
  while (i < L.length) {
    const l = L[i]
    if (/^\s*$/.test(l)) {
      i++
      continue
    }
    if (/^---\s*$/.test(l)) {
      out += '<hr>'
      i++
      continue
    }
    const m = l.match(/^(#{1,3})\s+(.*)/)
    if (m) {
      out += `<h${m[1].length}>${inl(m[2])}</h${m[1].length}>`
      i++
      continue
    }
    if (/^\|/.test(l)) {
      const rows: string[] = []
      while (i < L.length && /^\|/.test(L[i])) {
        rows.push(L[i])
        i++
      }
      const cells = (r: string) =>
        r
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim())
      const body = rows.filter((r) => !/^\|\s*-/.test(r))
      out += `<table>${body
        .map(
          (r, k) =>
            `<tr>${cells(r)
              .map((c) => (k === 0 ? `<th>${inl(c)}</th>` : `<td>${inl(c)}</td>`))
              .join('')}</tr>`,
        )
        .join('')}</table>`
      continue
    }
    if (/^\s*[-*]\s+/.test(l)) {
      let h = '<ul>'
      while (i < L.length && /^\s*[-*]\s+/.test(L[i])) {
        h += `<li>${inl(L[i].replace(/^\s*[-*]\s+/, ''))}</li>`
        i++
      }
      out += h + '</ul>'
      continue
    }
    if (/^\s*\d+\.\s+/.test(l)) {
      let h = '<ol>'
      while (i < L.length && /^\s*\d+\.\s+/.test(L[i])) {
        h += `<li>${inl(L[i].replace(/^\s*\d+\.\s+/, ''))}</li>`
        i++
      }
      out += h + '</ol>'
      continue
    }
    if (/^>\s?/.test(l)) {
      let h = ''
      while (i < L.length && /^>\s?/.test(L[i])) {
        h += inl(L[i].replace(/^>\s?/, '')) + ' '
        i++
      }
      out += `<blockquote>${h}</blockquote>`
      continue
    }
    const para: string[] = []
    while (i < L.length && !/^\s*$/.test(L[i]) && !/^(#|\||\s*[-*]\s|\s*\d+\.\s|>|---)/.test(L[i])) {
      para.push(L[i])
      i++
    }
    if (para.length === 0) {
      // a line no block rule accepted (e.g. "#tag"): keep it as text rather than loop forever
      para.push(L[i])
      i++
    }
    out += `<p>${para.map(inl).join('<br>')}</p>`
  }
  return out
}
