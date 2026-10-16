import type Resources from './resources'

// Makes `t()` know this app's namespaces and keys, so a typo is a BUILD error instead of the
// key appearing on screen. `resources.d.ts` beside this file is generated from the default
// language's catalogues by `bun run i18n:types` — regenerate it after adding strings.
//
// The separators must match the runtime options in @/lib/i18n exactly: declared differently,
// the types describe a nesting the runtime does not do, and every key looks wrong.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: Resources
    keySeparator: false
    nsSeparator: false
  }
}
