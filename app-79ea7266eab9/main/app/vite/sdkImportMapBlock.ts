import type { Plugin } from 'vite'
import { peerEntryName, type SdkConfig } from './uaSdkRuntime'

/**
 * Writes the `<!-- ua:sdk -->` block into the built `index.html`: a working import map, and
 * nothing else.
 *
 * There is no second half describing this app for a server to check against. Whatever a deploy
 * serves is what every app gets, so there is nothing to negotiate — a server either has a fresher
 * url for a key in this map or it does not.
 *
 * Placed immediately BEFORE the first module script rather than wherever the template's marker sat.
 * An import map has to be in the document before the first module load, and that is a property of
 * document ORDER — a marker that drifted below the entry script would produce a page that looks
 * correctly wired and resolves nothing.
 */
export function sdkBlockPlugin(
  config: SdkConfig,
  entryFor: (id: string) => string | null,
  peers: string[],
): Plugin {
  let base = '/'

  return {
    name: 'ua-sdk-block',
    configResolved(resolved) {
      base = resolved.base
    },
    // Rewrites the EMITTED html rather than going through transformIndexHtml: vite relocates
    // `<script>` tags it finds during html processing, and it moved the import map out from
    // between the markers — correct for the browser, invisible to the server that has to find it
    // again. Editing the asset after vite is done is the only placement that stays put.
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const html = htmlAssetOf(bundle)
        if (html === null) return

        const imports: Record<string, string> = {}

        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue
          // `dynamicImports` as well as `imports`: rollup's `external` predicate is applied to
          // BOTH, so `await import('@unifyapps/app-builder-sdk/…')` is externalized to a bare
          // specifier exactly like a static import — but it lands in a different list. Scanning
          // only the static one emits a map with no key for it, and the failure surfaces as an
          // unresolved specifier at the moment the user reaches that route, not at build time.
          // Matches `assertExternals` in www (unify-apps/www#28614), which reads both for the
          // same reason.
          for (const specifier of [...chunk.imports, ...chunk.dynamicImports]) {
            const entry = entryFor(specifier)
            if (entry === null) continue
            imports[specifier] = config.entries[entry] as string
          }
        }

        if (Object.keys(imports).length === 0) return // this app imports no delivered entry

        for (const specifier of peers) {
          const name = peerEntryName(specifier)
          const chunk = Object.values(bundle).find(
            (candidate) => candidate.type === 'chunk' && candidate.name === name,
          )
          if (chunk === undefined) {
            // Nothing can resolve the SDK's own `react` without this, so stop here rather than
            // emit a map that is missing a key.
            this.error(`[ua-sdk] no chunk was emitted for peer "${specifier}"`)
          }
          imports[specifier] = `${base}${chunk.fileName}`
        }

        const block = [
          '<!-- ua:sdk -->',
          `<script type="importmap">${JSON.stringify({ imports })}</script>`,
          '<!-- /ua:sdk -->',
        ].join('')

        const withoutMarker = html.source.replace(/<!-- ua:sdk -->[\s\S]*?<!-- \/ua:sdk -->/, '')
        const firstModule = withoutMarker.search(/<script[^>]*type="module"/)
        html.asset.source =
          firstModule === -1
            ? withoutMarker.replace('</head>', () => `${block}</head>`)
            : withoutMarker.slice(0, firstModule) + block + withoutMarker.slice(firstModule)
      },
    },
  }
}

/** The single html asset a vite SPA build emits, with its source as text. */
function htmlAssetOf(bundle: Record<string, { type: string; fileName: string; source?: unknown }>) {
  for (const asset of Object.values(bundle)) {
    if (asset.type !== 'asset' || !asset.fileName.endsWith('.html')) continue
    return { asset: asset as { source: unknown }, source: String(asset.source) }
  }
  return null
}

