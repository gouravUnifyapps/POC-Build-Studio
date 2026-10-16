import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'
import { sdkBlockPlugin } from './sdkImportMapBlock'

/**
 * Resolves the UnifyApps SDK at RUNTIME instead of compiling it into the app.
 *
 * Every import in app code stays exactly as it was — `from '@unifyapps/app-builder-sdk/hooks/...'`
 * — but the specifier survives into the bundle and the browser resolves it through an import map
 * in the served document. Whoever serves the app (tensor for a published app, the engine for a
 * preview) swaps that map's SDK urls for the ones ITS deploy currently serves, so an SDK fix
 * reaches an app nobody rebuilt.
 *
 * The map this plugin bakes in is a WORKING one — the urls this build was made against — so a
 * document nothing rewrites still boots, on the SDK it shipped with. That is the freshness the app
 * had before any of this existed, which makes every server-side failure path a safe no-op.
 *
 * Inert unless `UA_SDK_CONFIG` names a readable config file (the engine writes one before each
 * build). Without it the SDK bundles exactly as before — which is what a downloaded app, a
 * standalone `bun run build`, and the kill switch all rely on.
 *
 * `copilot` and `copilot.css` are NEVER externalized: that entry is 7.87 MB in a single chunk, and
 * a bundling consumer tree-shakes it where a CDN consumer cannot. It stays compiled in.
 */

const SDK = '@unifyapps/app-builder-sdk'
const PEER_PREFIX = 'virtual:ua-peer/'

export interface SdkConfig {
  // the bare specifiers this sdk leaves unresolved; a chunk is emitted for each
  peers: string[]
  entries: Record<string, string>
}

/** A filesystem-safe rollup entry name for a peer specifier: `react/jsx-runtime` → `react-jsx-runtime`. */
export function peerEntryName(specifier: string): string {
  return `peers/${specifier.replace(/[@/]/g, '-').replace(/^-/, '')}`
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/**
 * The source of one peer chunk: everything the app's own copy of that package exports, re-exported
 * so the SDK can reach it through the import map.
 *
 * Worked out HERE rather than handed over by the SDK. The SDK cannot know which build of a peer a
 * given app resolves; the app can, and re-exporting the whole surface means a later SDK that starts
 * using one more hook finds it already there instead of dying on a chunk built before it asked.
 *
 * Probed with `import()` on purpose — that resolves through the same `import` condition vite
 * bundles with. `require()` picks a package's CJS entry instead, which for @tanstack/react-query is
 * a DIFFERENT module: 58 names and a synthesized `default` that its ESM build does not have.
 * Generating from that produces a chunk which cannot build.
 *
 * And never `export *`: it forwards nothing from a CommonJS package, because CJS has no static
 * export list. The chunk comes out with no exports at all, the import map still resolves, and the
 * SDK dies on a missing export in the browser — measured, and the reason this is a named list.
 */
async function peerSource(specifier: string): Promise<string> {
  const namespace = (await import(specifier)) as Record<string, unknown>
  const names = Object.keys(namespace)
    .filter((name) => name !== 'default' && IDENTIFIER.test(name))
    .sort()

  const lines: string[] = []
  if (names.length > 0) lines.push(`export { ${names.join(', ')} } from '${specifier}'`)
  // Only where one exists: asking an ESM package that has no default for one is a build error.
  if ('default' in namespace) lines.push(`export { default } from '${specifier}'`)
  if (lines.length === 0) lines.push('export {}')
  return `${lines.join('\n')}\n`
}

function readConfig(path: string): SdkConfig | null {
  try {
    const config = JSON.parse(readFileSync(path, 'utf8')) as SdkConfig
    // A pointer that is not the shape this reads is refused rather than guessed at: a field that
    // moved would otherwise produce a map that looks assembled and resolves nothing.
    if (!config?.entries || !Array.isArray(config.peers)) {
      console.warn(`[ua-sdk] ${path} is not a pointer this build reads — bundling the SDK`)
      return null
    }
    if (Object.keys(config.entries).length === 0) return null
    return config
  } catch {
    console.warn(`[ua-sdk] could not read ${path} — bundling the SDK`)
    return null
  }
}

export function uaSdkRuntime(configPath: string | undefined): Plugin[] {
  if (!configPath) return []
  const config = readConfig(configPath)
  if (config === null) return []

  const delivered = new Set(Object.keys(config.entries))
  // WHICH specifiers must be supplied is the sdk's to declare; WHAT each one exports is this
  // build's to discover — see peerSource.
  const peers = config.peers

  // `@unifyapps/app-builder-sdk/hooks/workflow` → `hooks/workflow`, but ONLY for entries this
  // config actually ships. Anything else (copilot, copilot.css) falls through and gets bundled.
  const entryFor = (id: string): string | null => {
    if (id === SDK) return delivered.has('index') ? 'index' : null
    if (!id.startsWith(`${SDK}/`)) return null
    const name = id.slice(SDK.length + 1)
    return delivered.has(name) ? name : null
  }

  return [
    {
      name: 'ua-sdk-runtime',
      enforce: 'pre',

      config() {
        return {
          build: {
            rollupOptions: {
              external: (id: string) => entryFor(id) !== null,
              // Keep component names through minification, in the code-builder preview only.
              //
              // React's component stack is the most useful line in a crash report — it names
              // the components between the SDK's error boundary and the throw. It is built
              // from function NAMES, and the minifier renames every one, so a minified
              // preview reports `at Ke` and a repair prompt built from it points at nothing.
              //
              // It rides HERE, in the plugin the engine re-asserts before every build, rather
              // than in the app's own vite.config.ts: nothing re-asserts that file, so a copy
              // there would only reach apps created after it was written, and the fleet this
              // has to work for is the one that already exists. Riding the plugin also ties
              // it to SDK delivery, which is right — with no delivery there is no boundary
              // producing stacks to keep names for. A deploy build is left alone: nobody
              // reads its stacks, and the bytes are a visitor's to download.
              output:
                process.env.VITE_SELECT_MODE === '1'
                  ? { minify: { compress: true, mangle: { keepNames: true } } }
                  : {},
              // Vite builds an SPA with `preserveEntrySignatures: false` — the html entry
              // exports nothing, so rollup is told to drop entry exports outright. That
              // silently empties the peer chunks (a ~30-byte module with no exports at all),
              // the import map still resolves, and the SDK dies on
              // "does not provide an export named 'useQuery'". These entries exist ONLY for
              // their exports, so the signature has to be kept.
              preserveEntrySignatures: 'allow-extension' as const,
            },
          },
        }
      },

      // Each peer becomes an addressable module of the app's OWN bundle, so the import map can
      // point the SDK's `react` at the very same chunk the app already imports — one React
      // instance, and no second copy from the CDN.
      //
      // Added HERE and not in config(): at config() time vite has not yet derived its own input
      // (index.html), so returning an input there REPLACES the app entry instead of joining it —
      // a build that succeeds and emits no app.
      options(options) {
        const extra = Object.fromEntries(
          peers.map((specifier) => [peerEntryName(specifier), `${PEER_PREFIX}${specifier}`]),
        )
        const existing = options.input
        const input =
          typeof existing === 'string'
            ? { index: existing, ...extra }
            : Array.isArray(existing)
              ? { ...Object.fromEntries(existing.map((one, index) => [`input${index}`, one])), ...extra }
              : { ...existing, ...extra }
        return { ...options, input }
      },

      resolveId(id) {
        return id.startsWith(PEER_PREFIX) ? `\0${id}` : null
      },

      load(id) {
        if (!id.startsWith(`\0${PEER_PREFIX}`)) return null
        return peerSource(id.slice(PEER_PREFIX.length + 1))
      },
    },
    sdkBlockPlugin(config, entryFor, peers),
  ]
}
