// Placeholder — REPLACE the model and the rows with this app's own. Keep the SHAPE.
//
// This is the worked example for seed data: demo rows an app ships with, read through
// `useData(id, 'seed', SEED_ITEMS)` (see `@/lib/data`). It compiles, so it is also a
// compile-time check that the pattern below still works.
//
// SEED ROWS ARE DATA, NOT COPY. They stand in for what a backend would return, and they get
// the same treatment. What the FRONTEND authors around these rows — column headers, empty
// states, buttons, badges — is copy. The line is drawn by where a string comes from at
// render time, never by what it says, and it is the line that decides everything else in
// this file:
//
//   string  a value DELIVERED by the data layer (this file, storage, an API): a name, a
//           description, a spec line — and also ids, slugs, urls, codes. Rendered as-is.
//           Wrap one in `dir="auto"` if it may be RTL text.
//
//   number  money (in MINOR units), quantities, measurements. Never a formatted string:
//           `useFormatters()` renders these per locale — `currency()`, `unit()` — and
//           '1,890.5' or '0.4 mi' baked into data is wrong for most of the world. This
//           holds in a single-language app: a locale is not a language.
//
//   label   the ONE thing in a data file that is frontend copy rather than data: a
//           closed-set token's UI LABEL. The token (`'shipped'`) is data; the label a
//           screen shows for it is authored here — see STATUSES below.
//
// IF THIS APP EVER SHIPS A SECOND LANGUAGE, the label map is the piece that changes shape:
// it becomes `Record<Item['status'], TKey>` with `vocab('status.available', 'Available')`,
// and the screen renders `t(STATUSES[item.status])`. The rows themselves do not change —
// content stays untranslated by design. The `localization` skill does that conversion.

export interface Item {
  id: string
  slug: string
  imageUrl: string
  /** Minor units (cents). Formatted at the edge by `useFormatters().currency`. */
  priceMinor: number
  /** Content: delivered as data, rendered as-is. */
  name: string
  tagline: string
  highlights: string[]
  /** A closed-set token. The VALUE is data; its on-screen label is UI — see STATUSES. */
  status: 'available' | 'sold_out'
}

export const SEED_ITEMS: Item[] = [
  {
    id: 'item-1',
    slug: 'example-item',
    imageUrl: 'https://placehold.co/600x400',
    priceMinor: 2400,
    name: 'Example item',
    tagline: 'A short line about it.',
    highlights: ['Something worth knowing', 'Something else worth knowing'],
    status: 'available',
  },
]

/** The boundary, in one table: the token is data, the LABEL the screen shows for it is
 *  frontend vocabulary — declared ONCE, beside the set, never spelled out at a render site.
 *  Render with `STATUSES[item.status]`. */
export const STATUSES: Record<Item['status'], string> = {
  available: 'Available',
  sold_out: 'Sold out',
}

// At the SCREEN:
//
//   const { data: items } = useData('items', 'seed', SEED_ITEMS)
//   const { currency } = useFormatters()
//   <th>Name</th>                                    // column header: frontend copy
//   items?.map((item) => (
//     <tr key={item.id}>
//       <td>{item.name}</td>                         // content: data -> rendered as-is
//       <td>{STATUSES[item.status]}</td>             // token's label: frontend copy
//       <td>{currency(item.priceMinor / 100, 'USD')}</td>  // number: formatted per locale
//     </tr>
//   ))
