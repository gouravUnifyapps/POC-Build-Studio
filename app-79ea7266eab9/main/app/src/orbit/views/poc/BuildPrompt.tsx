// The Build prompt: the slash command that starts this POC's build in Claude Code, shown in
// a small panel under the header's buttons with a Copy button. Escape, the close button or a
// click outside `anchor` closes it; focus moves into it on open.
import { useEffect, useRef, type RefObject } from 'react'
import type { Poc } from '@/orbit/lib/model'
import { Icon } from '@/orbit/components/bits'

const COMMAND = '/demo-studio:build'

/** `/demo-studio:build <client name> <use case>`, on one line: the stored client name (else
 *  the shown name, else the POC id) and the whole use case as stored. */
export function buildPrompt(p: Poc): string {
  const client = p.client_name.trim() || p.client.trim() || p.poc_id
  return `${COMMAND} ${client} ${p.use_case}`.replace(/\s+/g, ' ').trim()
}

export function BuildPromptPanel({
  id,
  prompt,
  anchor,
  onCopy,
  onClose,
}: {
  id: string
  prompt: string
  /** the element holding the panel and the button that opens it: a click inside it is not outside */
  anchor: RefObject<HTMLElement | null>
  onCopy: () => void
  /** `refocus`: give focus back to the button that opened the panel */
  onClose: (refocus: boolean) => void
}) {
  const copyBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    copyBtn.current?.focus()
  }, [])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (anchor.current && !anchor.current.contains(e.target as Node)) onClose(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose(true)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchor, onClose])

  return (
    <div className="ob-buildp" id={id} role="dialog" aria-labelledby={`${id}-t`}>
      <div className="ob-buildp-h">
        <p className="micro ob-buildp-t" id={`${id}-t`}>
          Build prompt
        </p>
        <button type="button" className="ps-iconbtn ob-buildp-x" aria-label="Close" onClick={() => onClose(true)}>
          <Icon name="x" size="sm" />
        </button>
      </div>
      <code className="inl ob-buildp-code">{prompt}</code>
      <div className="ob-buildp-f">
        <p className="hint">Run this in Claude Code to start the build.</p>
        <button ref={copyBtn} type="button" className="btn btn-s btn-sm" onClick={onCopy}>
          <Icon name="copy" size="sm" />
          Copy
        </button>
      </div>
    </div>
  )
}
