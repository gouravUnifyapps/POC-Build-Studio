// A document's body by its format: HTML in a sandboxed frame, a link that opens in a new tab,
// or rendered markdown. Plus the artifact row the lists use.
import { useFormatters } from '@/lib/i18n'
import { stageLabel } from '@/orbit/lib/loop'
import { docFormat, docTypeLabel, isUrl, type Doc } from '@/orbit/lib/model'
import { Icon, Markdown } from './bits'

const FORMAT_ICON = { markdown: 'file', html: 'eye', link: 'link' } as const

export function DocBody({ d }: { d: Doc }) {
  const f = docFormat(d)
  if (f === 'html' && d.content.trim()) {
    // no sandbox tokens: the preview runs no scripts and cannot reach the app
    return <iframe className="ob-htmlframe" sandbox="" srcDoc={d.content} title={d.name} />
  }
  if (f === 'link' || (f === 'html' && !d.content.trim())) {
    return (
      <div className="ob-linkdoc">
        {d.summary ? <p>{d.summary}</p> : null}
        {isUrl(d.file_link) ? (
          <a className="btn btn-s btn-sm" href={d.file_link.trim()} target="_blank" rel="noopener noreferrer">
            <Icon name="external" size="sm" />
            Open {docTypeLabel(d.type).toLowerCase() || 'link'}
          </a>
        ) : (
          <p className="ob-muted">No link saved yet.</p>
        )}
        {f === 'link' && d.content.trim() ? <Markdown src={d.content} /> : null}
      </div>
    )
  }
  return <Markdown src={d.content || d.summary || 'This document has no text yet.'} />
}

/** "<stage> · <date>": where the document arrived and when it was saved. */
export function useDocMeta() {
  const fmt = useFormatters()
  return (d: Doc) => [stageLabel(d.stage), d.saved_at ? fmt.date(d.saved_at, { dateStyle: 'medium' }) : ''].filter(Boolean).join(' · ')
}

export function DocRow({ d, onOpen }: { d: Doc; onOpen: (d: Doc) => void }) {
  const meta = useDocMeta()
  const f = docFormat(d)
  return (
    <button type="button" className="ob-docrow" onClick={() => onOpen(d)}>
      <span className="ob-doctype">
        <Icon name={FORMAT_ICON[f]} size="sm" />
        {docTypeLabel(d.type)}
      </span>
      <span className="ob-docrow-name">{d.name}</span>
      <span className="ob-docrow-meta">{meta(d)}</span>
      <Icon name={f === 'link' ? 'external' : 'chev-r'} size="sm" />
    </button>
  )
}
