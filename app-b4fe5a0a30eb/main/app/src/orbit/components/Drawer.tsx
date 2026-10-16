// The right drawer: header (title + close), a scrolling body, an optional footer.
// Escape, the scrim and the close button dismiss it.
import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './bits'

export function Drawer({
  title,
  meta,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: ReactNode
  meta?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    ref.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener?.focus()
    }
  }, [onClose])
  return (
    <div className="ob-layer">
      <div className="ps-scrim" onClick={onClose} aria-hidden="true" />
      <aside
        className={`ps-drawer ob-drawer ${wide ? 'ob-drawer--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        ref={ref}
      >
        <div className="hd">
          <div className="ob-drawer-t">
            <p className="title">{title}</p>
            {meta ? <div className="ob-drawer-meta">{meta}</div> : null}
          </div>
          <button type="button" className="ps-iconbtn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="bd">{children}</div>
        {footer ? <div className="ft">{footer}</div> : null}
      </aside>
    </div>
  )
}
