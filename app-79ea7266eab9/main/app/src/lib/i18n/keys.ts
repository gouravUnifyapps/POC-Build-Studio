// Naming a translation key in CONSTANT DATA, without translating it there.
//
// A lookup table, an enum's option list, a column definition — anything declared at module
// scope — cannot call `t()`. `t()` resolves against the ACTIVE language, so a call that runs at
// import time freezes whatever language loaded first into a value the screen can never re-read,
// and nothing warns you. So constant data names the key, and the SCREEN translates it.
//
// Written as a bare string, that key is exactly as silent when it is wrong: a typo, a rename, or
// a key extraction dropped as unused all read as a plausible string and fail at runtime by
// rendering `status.activ` at a user. `vocab()` closes both ends — an identity function at
// runtime, a constraint at compile time, and a call site the extractor can see.

import type { ParseKeys } from 'i18next'

/**
 * Every key this app actually has.
 *
 * `ParseKeys` resolves against the module augmentation in `src/i18n/i18next.d.ts`, whose
 * `resources` come from `src/i18n/resources.d.ts` — generated from the ENGLISH catalogues by
 * `bun run i18n:types`. So the type follows the catalogue: a key that stops existing stops
 * compiling. It also strips plural suffixes, so the call passes the base name (`itemCount`) and
 * i18next picks `_one` / `_other` at runtime, exactly as `t()` is typed.
 *
 * It is the DEFAULT namespace (`common`), which is where a vocabulary belongs anyway: a set of
 * labels rendered from data is used across pages by definition, and <strings> already sends a
 * string used on more than one page to common.json.
 */
export type TKey = ParseKeys

/**
 * Name a translation key in constant data.
 *
 * Returns the key untouched — there is no runtime behaviour here at all. What it adds sits at
 * the two ends of the build:
 *
 *   TYPE     `T extends TKey` rejects a key this app does not have, so a typo, a rename, or a
 *            key lost to extraction is a BUILD error rather than a raw key on screen.
 *   EXTRACT  `vocab` is listed in `extract.functions` (i18next.config.mjs), so `i18next-cli`
 *            harvests these call sites like `t()` ones. That is what keeps these keys out of
 *            `preservePatterns`: they are genuinely used, so `removeUnusedKeys` leaves them.
 *
 * ```ts
 * export const STATUSES = defineKeys([
 *   { value: 'active',   labelKey: vocab('status.active', 'Active') },
 *   { value: 'inactive', labelKey: vocab('status.inactive', 'Inactive') },
 * ])
 *
 * // at the screen, where `t` follows the active language:
 * const { t } = useTranslation('common')
 * STATUSES.map((s) => ({ ...s, label: t(s.labelKey) }))
 * ```
 *
 * The second argument is the ENGLISH, and it exists for the same reason `t()`'s does: extraction
 * writes it into `i18n/en/common.json`, and `--sync-primary` keeps it in step when you reword it.
 * Omit it and the key is still kept alive, but a NEW key arrives with an empty value and renders
 * as itself — so write the English here, where the vocabulary is defined. It is never read at
 * runtime; this function returns the key and nothing else — hence the `_` prefix, which is how
 * `no-unused-vars` is told a parameter is unused ON PURPOSE. The name is invisible to extraction:
 * `i18next-cli` reads the ARGUMENTS at each call site, never this signature.
 */
export const vocab = <const T extends TKey>(key: T, _english?: string): T => key

/**
 * Keep a constant's literal types instead of widening them.
 *
 * Without it, `labelKey` infers as `string` on the objects above and the screen's `t()` loses the
 * key checking `vocab` just bought. `as const` does the same job; this reads better on a literal
 * that is already several lines long, and it cannot be forgotten halfway down one.
 */
export const defineKeys = <const T>(value: T): T => value
