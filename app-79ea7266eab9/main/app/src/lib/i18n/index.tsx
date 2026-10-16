import * as React from 'react'
import i18next from 'i18next'
import { Direction } from 'radix-ui'
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next'
import manifest from '@/i18n/languages.json'
import { detectLanguage, storeLang } from './language'

export { Trans, useTranslation } from 'react-i18next'
// Naming a translation key in constant data — see ./keys.ts for why it is not a t() call.
export { vocab, defineKeys, type TKey } from './keys'

/**
 * The app's strings.
 *
 * EVERY user-facing string lives in `src/i18n/<lang>/<page>.json` and reaches the screen
 * through `useTranslation`, with the English written at the CALL SITE as the second argument:
 *
 *   const { t } = useTranslation('orders')      // -> src/i18n/<lang>/orders.json
 *   <h1>{t('title', 'Orders')}</h1>
 *   <p>{t('count', { count: n, defaultValue_one: '{{count}} order',
 *                              defaultValue_other: '{{count}} orders' })}</p>
 *
 * `i18next-cli extract` harvests those defaults into the catalogues (`bun run i18n`), so
 * nobody edits JSON by hand. It also means a screen whose catalogue has not been generated
 * yet still renders correctly in English — a missed extraction costs a translation, never a
 * page showing `orders.title` at a user.
 */

export type Direction = 'ltr' | 'rtl'
export interface LanguageMeta {
  label: string
  dir: Direction
}

// Every catalogue in the tree, resolved at BUILD time and handed to i18next as `resources`.
// This is what keeps the whole async half of i18next out of the app: no backend plugin, no
// Suspense, no loading state, no flash of untranslated text — the strings are in the bundle.
const MODULES = import.meta.glob<Record<string, string>>('../../i18n/*/*.json', {
  eager: true,
  import: 'default',
})

const resources: Record<string, Record<string, Record<string, string>>> = {}
for (const [path, catalog] of Object.entries(MODULES)) {
  const match = /\/i18n\/([^/]+)\/([^/]+)\.json$/.exec(path)
  if (!match) continue
  const [, lang, ns] = match
  resources[lang] ??= {}
  resources[lang][ns] = catalog
}

export const LANGUAGES = manifest.languages as Record<string, LanguageMeta>
export const DEFAULT_LANG: string = manifest.default
export const LANGUAGE_CODES: string[] = Object.keys(LANGUAGES)
/** True once this app ships more than one language — gate a switcher on it rather than on a
 *  hardcoded list, so adding a language lights the switcher up. */
export const IS_MULTILINGUAL = LANGUAGE_CODES.length > 1

void i18next.use(initReactI18next).init({
  resources,
  lng: detectLanguage(LANGUAGE_CODES, DEFAULT_LANG),
  fallbackLng: DEFAULT_LANG,
  supportedLngs: LANGUAGE_CODES,
  defaultNS: 'common',

  // Keys are FLAT and live in a per-page file, so neither separator applies: left on, a key
  // like `user.name` would be read as a path into a nested object that does not exist.
  keySeparator: false,
  nsSeparator: false,

  // `i18next-cli sync` scaffolds a new language by writing every key with a value of "".
  // Without this, those empty strings count as translations and render as blank screens —
  // the one outcome worse than showing the default language.
  returnEmptyString: false,

  // React escapes for us; letting i18next escape too double-encodes every apostrophe.
  interpolation: { escapeValue: false },
  // Resources are already in memory, so there is nothing to suspend on.
  react: { useSuspense: false },
})

/** Change the app's language and remember it. */
export async function setLanguage(lang: string): Promise<void> {
  if (!(lang in LANGUAGES)) return
  await i18next.changeLanguage(lang)
  storeLang(lang)
}

/** The active language code, re-rendering the caller when it changes. */
export function useLanguage(): string {
  const { i18n } = useTranslation()
  return i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LANG
}

/**
 * The active language's writing direction.
 *
 * For the rare prop that CANNOT be logical. Tailwind's `ps-`/`pe-`/`start-`/`end-` follow
 * `<html dir>` on their own and are always the better answer; this is for the handful of
 * component APIs that take a physical side — a Sheet's `side`, a chart's axis orientation —
 * where there is nothing to flip and the value itself has to change.
 */
export function useDirection(): Direction {
  const lang = useLanguage()
  return LANGUAGES[lang]?.dir ?? 'ltr'
}

/**
 * Mounts i18next and keeps `<html lang>` / `<html dir>` in step with it.
 *
 * That `dir` write is the load-bearing line for RTL: the design system's `ltr:` / `rtl:`
 * Tailwind variants compile to `:where([dir="…"])`, so they read the DOCUMENT rather than any
 * prop — every direction-aware rule in the app, and the SDK copilot's own layout, hangs off
 * it. Written for LTR too, so index.html's static attributes can never disagree with runtime.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useLanguage()
  const dir = LANGUAGES[lang]?.dir ?? 'ltr'

  React.useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir = dir
  }, [lang, dir])

  return (
    <I18nextProvider i18n={i18next}>
      {/*
        Two direction systems have to agree, and only one of them reads <html dir>.

        CSS follows the document: Tailwind's `ltr:`/`rtl:` variants and the logical
        utilities (ps-/pe-, ms-/me-, start-/end-) compile to `:where([dir="…"])`, so the
        effect above is all they need.

        Radix primitives do NOT read it. Tabs, Select, DropdownMenu, Popover, Sheet and
        everything built on them take their direction from this provider and default to
        `ltr` when it is absent — so without it an Arabic app keeps LTR tab order,
        dropdown alignment, popover side and keyboard arrow direction while the text and
        spacing around them mirror correctly. That splits the layout in a way users feel
        and cannot name, and no check reports it.

        `Direction` is re-exported by the `radix-ui` package the template already depends
        on — do NOT `bun add @radix-ui/react-direction`, which installs a second copy of a
        module that is already here.
      */}
      <Direction.Provider dir={dir}>{children}</Direction.Provider>
    </I18nextProvider>
  )
}

/**
 * Dates, numbers and sorting in the active language.
 *
 * Never format by hand and never pass a hardcoded 'en-US'. Currency is the exception that
 * proves it: the CODE is a business fact (a French user may still be billed in USD), so it
 * comes from the record — only the formatting is the language's business.
 */
export function useFormatters() {
  const lang = useLanguage()
  return React.useMemo(
    () => ({
      date: (value: Date | number, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
        new Intl.DateTimeFormat(lang, options).format(value),
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        new Intl.NumberFormat(lang, options).format(value),
      currency: (value: number, currency: string, options?: Intl.NumberFormatOptions) =>
        new Intl.NumberFormat(lang, { style: 'currency', currency, ...options }).format(value),
      /** A HEADLINE figure — stat card, KPI tile, map legend, chart axis: "1.2K", "$14.2B",
       *  never "$14,186,954,828.00". Every digit of a ten-figure total is noise at a glance,
       *  and a string that long overflows the card it sits in. Money passes its code through:
       *  `compact(total, { style: 'currency', currency })`. Tables and detail panels keep
       *  full precision (`number` / `currency`), and a compact figure carries its exact value
       *  in a `title` so nothing is lost — the locale picks the suffix ("1,2 Mrd." in German). */
      compact: (value: number, options?: Intl.NumberFormatOptions) =>
        new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1, ...options }).format(value),
      relative: (value: number, unit: Intl.RelativeTimeFormatUnit) =>
        new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(value, unit),
      /** A measurement, with its unit localized alongside the number: `unit(0.6, 'kilometer')`
       *  is "0.6 km" in English and "٠٫٦ كم"-style per locale. Store metric and format with
       *  this — never bake "0.4 mi" into copy, where translation renders the unit's WORD
       *  while leaving the measurement wrong for every metric reader. `unit` takes the
       *  sanctioned Intl identifiers ('kilometer', 'liter', 'celsius', …, and pairs like
       *  'liter-per-kilometer'); an unknown one throws at the call site, loudly. */
      unit: (value: number, unit: string, options?: Intl.NumberFormatOptions) =>
        new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'short', ...options }).format(value),
      compare: (a: string, b: string) => new Intl.Collator(lang).compare(a, b),
    }),
    [lang],
  )
}

export default i18next
