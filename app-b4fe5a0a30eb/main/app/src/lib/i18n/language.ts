// Which language to start in, and where that choice is remembered. Pure — no i18next and no
// React — so the negotiation rules stay readable and reusable without booting either.

const STORAGE_KEY = 'app.lang'

/** The best match for a browser's language list among the languages this app ships.
 *  Exact tag first (`pt-BR`), then the base (`pt`), then the default. */
export function negotiate(
  preferred: readonly string[],
  available: readonly string[],
  defaultLang: string,
): string {
  for (const tag of preferred) {
    if (available.includes(tag)) return tag
    const base = tag.split('-')[0]
    if (available.includes(base)) return base
  }
  return defaultLang
}

// localStorage throws in a sandboxed frame and in some private modes. The language is a
// preference, not state the app needs — failing to read or write it must never be fatal.
export function readStoredLang(available: readonly string[]): string | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored && available.includes(stored) ? stored : null
  } catch {
    return null
  }
}

export function storeLang(lang: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* ignored — see readStoredLang */
  }
}

export function detectLanguage(available: readonly string[], defaultLang: string): string {
  const stored = readStoredLang(available)
  if (stored) return stored
  const preferred =
    typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])
  return negotiate(preferred, available, defaultLang)
}
