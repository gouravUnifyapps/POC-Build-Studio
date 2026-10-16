// Small text helpers. Dates and times are formatted at the screen with useFormatters().

export const DAY = 864e5

export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

export function slug(s: string | undefined | null): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Older test records carry a "[Example] " or "[Test] " prefix in the stored name; the
 *  screens show the name without it. */
const SAMPLE_PREFIX = /^\s*\[(example|test)\]\s*/i
export const clientName = (raw: string | undefined | null) => String(raw || '').replace(SAMPLE_PREFIX, '').trim()

export const initials = (s: string | undefined | null) =>
  clientName(s || '?')
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'

export const firstName = (s: string | undefined | null) => String(s || '').trim().split(/\s+/)[0] || ''

/** Avatar tones come from the design system (ob-tone-0..5 in orbit.css); a name always
 *  gets the same one. */
export const TONES = 6
export const toneOf = (s: string | undefined | null) =>
  [...String(s || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES

/** Local calendar day key, for grouping by day. */
export function dayStamp(t: number): string {
  const d = new Date(t)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
