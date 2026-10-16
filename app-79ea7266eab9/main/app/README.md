# App

A Vite + React app. This exact stack is what the **runner** serves natively — no
Dockerfile, no custom server, no build adapter. Building the app produces a static
`dist/`, and the runner hosts it.

## Quick start

Requires [Bun](https://bun.sh) (the package manager and script runner for this project;
npm/pnpm/yarn are not used).

```bash
bun install       # install dependencies
bun run dev       # Vite dev server with HMR
```

Then open the URL Vite prints (`http://localhost:5173` by default).

### Backend calls in dev

The app talks to the platform over same-origin `/api` and `/auth`. In
development there is no platform on `localhost`, so the dev server proxies those paths
to a real backend. The target is read from `API_PROXY_TARGET` in `.env`:

```dotenv
API_PROXY_TARGET=https://<your-platform-host>
```

`API_PROXY_TARGET` has no `VITE_` prefix on purpose — it is read only by
`vite.config.ts` and never reaches the browser bundle.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Dev server, HMR, `/api` + `/auth` proxy |
| `bun run build` | Typecheck (`tsc -b`), lint the rules `.oxlintrc.json` names (`react-hooks/rules-of-hooks`), then production bundle into `dist/` |
| `bun run preview` | Serve the built `dist/` locally |
| `bun run lint` | oxlint (`correctness` rules as errors) |

`bun run build` is the deployment build — it must pass before publishing, since it is
also the typecheck and hooks-lint gate.

## Tech stack

| Area | Choice |
| --- | --- |
| UI framework | React 19 |
| Language | TypeScript 7 (native `tsc`, `tsc -b` typecheck) |
| Build tool | Vite 8 + `@vitejs/plugin-react` v6 (Oxc-based JSX transform) |
| Package manager / runtime | Bun (install, scripts, test runner) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, `tw-animate-css` |
| Components | shadcn (`radix-nova` style) on Radix UI primitives, in `src/components/ui` |
| Icons | lucide-react |
| Routing | react-router-dom 7, `BrowserRouter` (clean URLs) |
| Server state | TanStack Query (mounted by `AppBuilderProvider`) |
| Client state | Zustand |
| Charts | Recharts |
| Toasts / command menu / theming | sonner, cmdk, next-themes |
| Utilities | clsx, tailwind-merge, class-variance-authority, date-fns |
| Linting | oxlint |
| Platform SDK | `@unifyapps/app-builder-sdk` (vendored at `src/@unifyapps/`) |

## Project layout

```
src/
  main.tsx                 root providers (AppBuilderProvider, tooltips, toasts)
  App.tsx                  routes
  index.css                Tailwind entry + design tokens
  routes/                  page components (Login, ForgotPassword, UpdatePassword, …)
  components/ui/           shadcn primitives
  data/                    ALL data hooks — components import from '@/data'
  i18n/                    EVERY user-facing string, one file per page per language
  lib/                     utils, helpers
  lib/i18n/                the t() runtime — read it before writing a screen
  @unifyapps/              vendored platform SDK (do not edit)
public/                    static assets copied verbatim
```

Path aliases: `@/*` → `src/*`, and `@unifyapps/app-builder-sdk` → the vendored copy.
Both are configured in `tsconfig.app.json` and `vite.config.ts`.

### Platform SDK

`@unifyapps/app-builder-sdk` is vendored (a prebuilt drop-in for the private npm
package) so the app builds with no registry access. It provides:

- `AppBuilderProvider` — mounts TanStack Query and resolves the interface; already wired
  in `main.tsx`.
- `hooks/object` — entity CRUD (`useSearchEntities`, `useFindEntityById`, `useCreateEntity`,
  `useUpdateEntity`, `useDeleteEntity`, …).
- `hooks/workflow` — trigger and execute workflows.
- `hooks/auth`, `hooks/user` — login, logout, SSO, user context.
- `hooks/upload` — `useUppy`, the only supported way to upload a file. It stores the file
  and returns a URL to persist; the provider is already mounted and boots lazily on first
  use. See the `file-upload` skill.

Wrap these in `src/data/` rather than calling them from components (`useUppy` is the
exception — it belongs in the upload component itself, next to the file input).

## Strings

**Whether this app translates its strings is the user's decision, taken once, when the app is
planned.** The planner asks it outright, and the answer is recorded in the code, not the plan:
`src/i18n/languages.json`. There are exactly two states and no default-in-between:

| `src/i18n/languages.json` holds | What you write |
|---|---|
| one language (the shipped default) | plain strings, everywhere |
| more than one | every string through `t()` / `vocab()`, per the contract below |

This app ships in the **English-only** state. The three auth routes, `components/copilot.tsx`,
`lib/passwordPolicy.ts` and `data/seed.ts` are the worked examples for it — read them before
you decide the other section applies to you.

### English-only — the shipped default

Write the string where it renders. Nothing else.

```tsx
function Orders({ orders }: { orders: Order[] }) {
  return (
    <section>
      <h1>Orders</h1>
      <input placeholder="Search orders" />
      <p>{orders.length === 1 ? '1 order' : `${orders.length} orders`}</p>
    </section>
  )
}
```

Do not import `useTranslation`, `Trans`, `vocab` or `defineKeys`. Do not add keys to
`src/i18n/`. Do not run `bun run i18n`, `i18n:lint`, `i18n:types`, `i18n:sync`, `i18n:status`
or `i18n:plurals` — they measure a contract this app has not signed, and `i18n:lint` in
particular will report every string on every screen.

Two things still apply, because they are about LOCALE rather than language, and an
English-only app has one either way:

- **`useFormatters()` for dates, numbers, currency, units and sorting** — never a hardcoded
  `'en-US'`, never by hand. The currency CODE comes from the record; only the formatting
  follows the locale.
- **A closed set's labels are declared ONCE, beside the set** — `STATUSES` in `data/seed.ts` is
  the pattern. Not because of translation, but because a label spelled out at three render
  sites drifts at two of them. Content data — names, descriptions, anything a user typed —
  renders as-is.

`I18nProvider` stays mounted in `App.tsx` in this state. It is not translation machinery: it
owns `<html lang>` / `<html dir>`, Radix's direction context and the locale `useFormatters()`
reads.

### Translated

Everything below applies **only** when `languages.json` holds more than one language. In that state, **no
user-facing string is written into a component.** Every one goes through react-i18next's
`useTranslation`, with the English as the second argument — and `i18next-cli` turns those into
the catalogues under `src/i18n/<lang>/<page>.json`:

```tsx
import { useTranslation } from '@/lib/i18n'

function Orders({ orders }: { orders: Order[] }) {
  const { t } = useTranslation('orders')           // -> src/i18n/en/orders.json
  return (
    <section>
      <h1>{t('title', 'Orders')}</h1>
      <input placeholder={t('search', 'Search orders')} />
      <p>
        {t('count', {
          count: orders.length,
          defaultValue_one: '{{count}} order',      // plural forms are picked by
          defaultValue_other: '{{count}} orders',   // Intl.PluralRules, per language
        })}
      </p>
    </section>
  )
}
```

Then `bun run i18n`, which writes:

```jsonc
// src/i18n/en/orders.json — generated; do not hand-edit
{ "count_one": "{{count}} order", "count_other": "{{count}} orders",
  "search": "Search orders", "title": "Orders" }
```

**Nobody edits a catalogue by hand.** The English lives at the call site, where it shows up
in the diff and reads like ordinary code, and extraction is what makes it translatable. It
also means the app is correct before the tool has ever run: a screen whose catalogue does not
exist yet renders its inline English, so a missed extraction costs a translation rather than
putting `orders.title` in front of a user.

#### The rules

- **One catalogue per page**, named after the page component: `pages/Orders.tsx` →
  `useTranslation('orders')` → `i18n/<lang>/orders.json`. Two catalogues in one file is the
  same hook renamed: `const { t: common } = useTranslation('common')`. A string used on more than one page goes in
  `common.json`; duplicating a string between two page catalogues is fine and often better,
  because the same English word can need two different translations in two contexts.
- **Keys are flat and describe the ROLE, not the text.** `emptyState`, not
  `noOrdersYetExclamation` — the key survives a copy change, the text does not. To change
  wording, edit the default at the call site and re-run `bun run i18n -- --sync-primary`;
  without that flag extraction adds keys but never overwrites an existing value.
- **Give plurals their per-form defaults** (`defaultValue_one` / `defaultValue_other`).
  Passing a single default copies it into every form, and "1 orders" ships.
- **Never split a sentence across `t()` calls** to fit markup around it. Word order differs
  between languages and the pieces cannot be reordered. When a sentence needs markup inside
  it, reach for `<Trans>` — it keeps the sentence whole and numbers the elements so a
  translator can move them:

  ```tsx
  <Trans i18nKey="intro" ns="orders"
         defaults="Read the <0>guide</0> before you start."
         components={[<a href="/guide" key="guide" />]} />
  ```

  The `MissingAgentId` block in `components/copilot.tsx` is the sentence this applies to —
  shipped as plain JSX, and called out there as the one to convert.
- **Code outside React returns a KEY, never a sentence.** `@/lib/passwordPolicy` is where this
  bites: English-only it holds a `label` string, and converting it means `labelKey` +
  `labelVars` with the screen translating them. A string baked at module scope cannot change
  when the user switches language, and nothing warns you.
- **In constant data, name every key with `vocab()`.** A lookup table, an option list or a
  column definition is declared at module scope, so it cannot call `t()` — but a bare string
  key is silent when it is wrong, and shows the user `status.activ` instead of a label.
  `vocab()` is an identity function that makes the key a TYPE (a typo or a rename is a build
  error) and a call site the extractor can SEE, so the key needs no `preservePatterns` entry.
  Its second argument is the English, written where the vocabulary is defined:

  ```ts
  import { defineKeys, vocab } from '@/lib/i18n'

  export const STATUSES = defineKeys([
    { value: 'active',   labelKey: vocab('status.active', 'Active') },
    { value: 'inactive', labelKey: vocab('status.inactive', 'Inactive') },
  ])

  const { t } = useTranslation('common')          // at the screen
  STATUSES.map((s) => ({ ...s, label: t(s.labelKey) }))
  ```

  This is how a STATUS, TYPE, SEVERITY or CATEGORY stored as data becomes translatable —
  a closed set of known values is UI vocabulary that happens to live in data. A free-form
  name somebody typed is not: leave it alone, and say so.
- **Dates, numbers, currency and sorting go through `useFormatters()`**, never a hardcoded
  `'en-US'` and never by hand. The currency CODE is a business fact and comes from the
  record; only its formatting is the language's business.

### Turning translation on

An app built English-only that is later asked for a second language does **not** start with
`i18n:sync`: there is nothing to sync, because no string is a key yet. The retrofit comes
first, and the `localization` skill drives it. In outline:

1. Wrap every frontend-authored string in `t()` with its English at the call site — the app's
   own screens AND the template surfaces it inherited (`routes/Login.tsx`,
   `routes/ForgotPassword.tsx`, `routes/UpdatePassword.tsx`, `components/copilot.tsx`,
   `App.tsx`). Content data stays as it is.
2. Convert the module-scope label maps to `vocab()` + `TKey` (`data/seed.ts` shows both
   shapes), and the out-of-React strings to keys (`lib/passwordPolicy.ts`).
3. Restore the sentence-with-markup blocks to `<Trans>`.
4. `bun run i18n` then `bun run i18n:types` — the catalogues and the key types now exist.
5. Only then add the language, per below.

Skipping to step 5 is the failure this ordering exists to prevent: `sync` scaffolds the
catalogue it can see, so a half-wrapped app gets a language that covers the wrapped tenth and
reports itself 100% translated.

### Adding a language

1. Add it to **both** `src/i18n/languages.json` (its `label` and `dir` — the runtime reads
   this) and `locales` in `i18next.config.mjs` (the tooling reads that one).
2. `bun run i18n:sync` — scaffolds every key into `src/i18n/<lang>/`, with empty values.
3. Translate the values. `bun run i18n:status` reports what is left.

The extra plural forms a new language needs arrive automatically: `allPluralForms` in
`i18next.config.mjs` scaffolds every form any configured locale requires — Arabic six, Polish
four, English two — and `status` counts each locale against the forms *that* locale uses, so
they show up as ordinary untranslated keys. Forms a language never selects are inert and
uncounted.

`bun run i18n:plurals` covers what that cannot: a plural key named only indirectly, such as
`t(rule.labelKey)` with the key from a helper and no `vocab()` naming it. Extraction never
regenerates those, so nothing expands their forms. A key named with `vocab()` is an ordinary
extracted key and needs none of this. The engine runs this check as a BUILD GATE the moment
`languages.json` holds more than one language, so it is not optional and not skippable.

An untranslated or empty key falls back to the default language, and then to the English at
the call site, so a half-translated app is readable rather than blank. `I18nProvider` writes
`<html lang>` and `<html dir>` on every language change, which is what makes Tailwind's
`ltr:` / `rtl:` variants work. It also supplies Radix's `DirectionProvider`, because Radix
primitives (Tabs, Select, DropdownMenu, Popover, Sheet) do **not** read `<html dir>` and would
otherwise stay left-to-right inside an otherwise-mirrored page. What that cannot reach is a
prop taking a side as a value — a Sheet's `side` — which needs `useDirection()` by hand.
For an RTL language, build the layout with logical utilities
(`ps-`/`pe-`, `ms-`/`me-`, `start-`/`end-`, `text-start`/`text-end`) rather than
`pl-`/`pr-`/`left-`/`right-`.

### Key safety

`src/i18n/resources.d.ts` is generated from the default language's catalogues and wired into
i18next's types by `src/i18n/i18next.d.ts`. It makes a **bare** `t('typo')` a build error.
A typo that carries an inline default — `t('typo', 'Some text')` — is deliberately allowed,
because the default still renders and nothing is broken. So the types police exactly the case
nothing else can catch: a key with no English beside it. Regenerate with `bun run i18n:types`
after adding or removing keys. In the English-only state this file is an empty `common`
namespace, which is correct: there are no keys.

### The toolchain

`i18next-cli` is installed in the **sandbox image** the builder runs commands in, alongside
bun — not as a dependency of this app. Nothing the app ships depends on it, and it never
enters the bundle or the install.

The distinction that matters: it is NOT in the engine image. Every command the builder runs
executes inside uacode's `ai-bubblewrap-sandbox`, with its own PATH, so a tool installed
anywhere else is on a machine no command ever runs on.

On a clone, install it yourself:

```bash
npm i -g i18next-cli
```

`i18next.config.mjs` documents what each command does and why each option is set.

## Environment variables

Only `VITE_`-prefixed keys reach the browser. Anything you add to `.env` **overrides**
what the builder injects, and `.env` values may reference injected env with `${VAR}`.

| Variable | Set by | Purpose |
| --- | --- | --- |
| `API_PROXY_TARGET` | build / you | Dev-server proxy target for `/api` and `/auth`. Dev only |
| `VITE_APPLICATION_ID` | build | Interface id the SDK resolves the app against |
| `VITE_ENTITY_API_BASE` | build | Backend origin, when the bundle is not same-origin with the platform |
| `VITE_APP_BASE` | build | Vite `base`; also the router basename. `/` for a deployed build, or `/c/<appId>/` when the app is path-hosted |
| `VITE_OUT_DIR` | build | Overrides the output directory |
| `VITE_SELECT_MODE` | build | Preview only — visual select/edit bridge. Never set in a deploy build |
| `VITE_IS_PREVIEW` | build | Preview only — the bundle runs inside the authed builder |

`VITE_OUT_DIR`, `VITE_APP_BASE` and `VITE_SELECT_MODE` are build-machine values and are
deliberately stripped before the client env is inlined.

## Deployment

The runner supports this stack natively. Publishing does the whole thing:

1. Runs `bun run build` with `VITE_APP_BASE=/` (or `/c/<appId>/` for a path-hosted app,
   read off the interface record's `basePath`) and no preview flags — a clean bundle
   rooted at the app's domain.
2. The runner serves the resulting `dist/` statically, answering every unmatched route
   with `index.html`, so `BrowserRouter` deep links and hard refreshes
   work at any depth.
3. `/api` and `/auth` are same-origin in production, so the SDK's relative calls need no
   proxy — the dev proxy exists only to reproduce that locally. On a path-hosted app the SDK
   prefixes those calls with the record's `basePath` itself; the app never spells the prefix.

Nothing else is required: no server process, no serverless adapter, no runtime
configuration. Any host that serves a static directory and rewrites unmatched routes to
`index.html` will also work (a `vercel.json` with the same contract ships in the repo).

### Engine-owned files

These are managed by the builder and re-synced; edits to them may be overwritten:

- `vite.config.ts` — base path, proxy, preview instrumentation
- `src/main.tsx` — root providers and build-flag wiring
- `src/@unifyapps/` — the vendored SDK

Do not start a long-lived dev server or install packages from inside a builder session —
the preview is produced by `bun run build` and served by the platform.
