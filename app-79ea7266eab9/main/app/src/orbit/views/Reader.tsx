// The document reader: one artifact in a right drawer, read-only.
import { useOrbit } from '@/orbit/lib/context'
import { docById, docTypeLabel, pocOf } from '@/orbit/lib/model'
import { Drawer } from '@/orbit/components/Drawer'
import { DocBody, useDocMeta } from '@/orbit/components/DocView'
import { Empty, Tag } from '@/orbit/components/bits'

export function Reader({ id, onClose }: { id: string; onClose: () => void }) {
  const { snap } = useOrbit()
  const meta = useDocMeta()
  const d = docById(snap, id)
  if (!d) {
    return (
      <Drawer title="Document" onClose={onClose}>
        <Empty title="This document isn't here" desc="It may still be loading, or it was removed." />
      </Drawer>
    )
  }
  const p = pocOf(snap, d.poc)
  return (
    <Drawer
      wide
      title={d.name}
      onClose={onClose}
      meta={
        <>
          {d.type ? <Tag>{docTypeLabel(d.type)}</Tag> : null}
          <span>
            {[p?.client, meta(d)].filter(Boolean).join(' · ')}
            {d.version > 1 ? ` · v${d.version}` : ''}
          </span>
        </>
      }
    >
      <DocBody d={d} />
    </Drawer>
  )
}
