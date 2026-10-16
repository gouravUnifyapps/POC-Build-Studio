// The page an app made through `POST /agent-api/apps` starts with: built and shown at once,
// so the app's first preview is this rather than a loader. Replace it with the app's own
// home page.
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Hello World</h1>
        <p className="mt-3 text-muted-foreground">
          This is a template app — you can start working on it now.
        </p>
      </div>
    </main>
  )
}
