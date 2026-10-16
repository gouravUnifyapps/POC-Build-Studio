import { FileText } from 'lucide-react'
import { Artifact } from '@unifyapps/app-builder-sdk/artifact'
// The artifact viewer is design-system-themed (its own scoped root), but it renders through
// the same block components the copilot canvas uses, so it needs their compiled utility layer.
// copilot.css carries it; an app with a copilot already loads this, and an artifact-only app
// gets the classes from here. (A dedicated artifact stylesheet can replace this later.)
import '@unifyapps/app-builder-sdk/copilot.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// The UnifyApps artifact viewer, dropped into this app's own layout.
//
// An "artifact" is a file the agent generated in a chat — a deck (PPTX), a doc (DOCX), a PDF,
// a sheet — saved as an `e_artifact_detail` record. The copilot's publish step hands back that
// record's id; give the id to <Artifact> and it renders the file exactly as the copilot canvas
// does (PPTX/DOCX arrive pre-converted to a PDF preview, with the original behind a download).
//
// This is the SAME viewer the low-code "Artifacts" block uses — not a re-implementation. It
// brings its own providers and paints in the design-system theme, scoped to its own root, so it
// sits inside a Tailwind/shadcn screen without touching the rest of it. Point it at an id and
// it owns loading, the missing/forbidden record, and the file itself.
//
// TYPICAL LAYOUT (mirrors the guided-workspace shape): the chat on one side, this on the other.
//   <div className="flex h-full">
//     <Copilot agentId={agentId} className="w-96 border-e" />
//     <Artifacts artifactId={selectedArtifactId} className="flex-1" />
//   </div>
// The chat surfaces an artifact id (from the reply, or a record the app stored); hold it in
// state and hand it here. When nothing is selected, this shows its own empty state.
//
// NOTE on resolving the id: the viewer reads the record through the platform's
// FETCH_ENTITY_BY_ID automation, so an app user with no entity-type grant still sees the file.
// That automation has to be registered on the environment. Where it is not, the read falls back
// to the entity API and a grant-less viewer gets the "unavailable" state instead of the file.

type ArtifactsProps = {
  /** The artifact record to show — an `e_artifact_detail` id. Empty/undefined renders the
   * empty state, so this is safe to bind to "the currently selected artifact". */
  artifactId?: string
  /** the app's label for this panel, shown only in the empty state */
  title?: string
  /** Fires when the viewer's own close control is used. Wire it to clear the selection (hide
   * the panel); omit it and no close control is shown. */
  onClose?: () => void
  className?: string
}

/** Nothing selected yet. A real empty state, not a blank div — it tells the user where an
 * artifact will come from rather than leaving the panel looking broken. */
function NoArtifact({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <div className="bg-muted mb-2 flex size-9 items-center justify-center rounded-md">
            <FileText className="text-muted-foreground size-5" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Ask the assistant to create a document, deck or sheet — it appears here once it’s
            ready.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  )
}

export function Artifacts({ artifactId, title, onClose, className }: ArtifactsProps) {
  if (!artifactId) {
    return (
      <div className={cn('h-full', className)}>
        <NoArtifact title={title ?? 'No artifact yet'} />
      </div>
    )
  }

  // The viewer fills whatever it is given and owns its own loading/error/empty, so the only job
  // here is a bounded box for it to fill.
  return (
    <div className={cn('h-full min-h-0', className)}>
      <Artifact artifactId={artifactId} onClose={onClose} />
    </div>
  )
}
