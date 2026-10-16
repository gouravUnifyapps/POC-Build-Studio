# design.md: POC Studio Live, the new and changed regions only (clone mode)

Read with `design-package.md`. This is a **code app that clones the source's screens**, so there is no `app look` line and no `page · create` line
(the three routes exist in the clone; the bridge: a code app takes neither). What follows is one `job` line and one `design` block per page, written for
the `code-app · update` lines (code-app.md: "the regions in order, from design.md"). Every screen region **not listed here stays exactly as cloned**.

How to read a block: regions are in page order; every class is named as it exists in the source's own CSS (`src/orbit/ds/bundle.css`, `src/orbit/orbit.css`);
beats are the numbers of `rulings.md` §1 (1 to 6 walked, **R** a request line built and not walked); each block ends with its states.
No new colour, no radius off the scale, no entrance animation, no Tailwind colour, radius, shadow or type utility. The only CSS a region may add is the four rules in
`port-note.md` §7, copied here under **History** and **Feedback** where they are used.

Two things the code task must know about the cloned CSS (both in `port-note.md` §4, neither edited): `--accent` is re-bound to `--inner` by `orbit.css:22` in light, so any
avatar the History tab draws with `ob-tone-1` has initials at 1.08 to 2.37:1 until **fix P1** is applied; and the "Building" tag, `.tag.ob-tag-brand`, measures 4.27 / 4.38 until
**fix P2** is applied. The moderator decides P1 and P2; this file is written to work with or without them.

---

## Home `/`

**job:** Show every POC use case in one table so a POC owner or manager sees what each row is waiting on, and show a row the bot has just created, with its next action named, without a reload.

**design** (beats 1, 2, 3):

1. **Status column, one derived state** (changed). In the existing `table.tbl.ob-ptable` inside `.tblwrap`, the Status cell's `StatusTag` (`.tag` + `Icon`) gets one rule ahead of the source's own:
   a row whose `status` is `running`, `stage` is `0_kickoff` and `build_run_id` is empty reads `.tag.attention` with icon `pause` and the word **"Waiting on you"** to its owner (the viewer
   matches `owner_email`, name or first name the way `mustApprove` matches the manager) and **"Waiting on {owner first name}"** to everyone else. It is the same tag the source draws for a
   gate waiting on the viewer. A row with a `build_run_id` and no open gate reads `.tag.ob-tag-brand` with icon `spark` and **"Building · {phase label}"** ("Building · Understand"), where the
   source reads "Building". Blocked `.tag.negative`, Stopped `.tag.neutral`, Demo-ready `.tag.positive` and "Waiting on approval" `.tag.attention` are unchanged.
2. **One predicate, three places** (changed): the status `.seg` button "Waiting on you" and its `.ob-seg-n` count; the rail item's `.ct.hot` count (`.ps-nav-item .ct.hot`, the "POCs" badge); and the
   Build button on the POC page. A non-owner's "Waiting on {owner}" row counts in **All** only: the ledger names the owner's filter and the badge, nothing else.
   The Journey column is unchanged: `.ps-mini` with no filled bar and `.ps-mini-lbl` "Understand".
3. **Rows follow the data** (changed): the same `<tr>`, no new component. A new row shows on the next refetch (the Judge's refetch interval on the lists) in its sorted place; the default sort
   is status ascending, so a "Waiting on you" row lands first. **No entrance animation, no flash, no highlight.** The `.seg` counts, the footer `.ob-range` ("13 POCs") and the four `.tile.ob-stat`
   tiles recompute with it. A duplicate-name refusal in Slack changes nothing here: the count stays.

**states:** loading `.empty` "Loading POCs…" (`Loading`); first-load error `.empty.ob-empty--error` with Retry (`LoadError`); a refetch that fails with rows on screen: one line `.ob-datanote`
with Retry and the rows stay; empty `.empty` "No POCs yet" / "A POC appears here once it is started from Slack."; filtered-empty `.empty` "No POCs match these filters" with `.btn.btn-s.btn-sm`
"Clear all" (two separate states, as cloned). The page is read-only: no disabled state, no toast.

---

## POC page `/pocs/:pocId`

**job:** Let the POC owner start the cloud build, let the manager read the documents a gate is waiting on and approve it, and let both read what the Slack channel said about this use case, on one page.

**design** (beats 4, 5, 6), regions in order:

1. **Header `.ob-pochead`** (changed, beats 5 and 6).
   - `h1.ob-pochead-h`: "{client} · {use case}" with **a leading client name dropped from `use_case`**: "Pentland · Vulnerability Use Case", never "Pentland · Pentland Vulnerability Use Case"
     (`.ob-pochead-uc` as cloned).
   - The status tag in the slot where the source puts "Waiting on you": the Home rule above, so a fresh row reads `.tag.attention` "Waiting on you" and a started one `.tag.ob-tag-brand` "Building · Understand".
   - At the right end of `.ob-pochead`, after a `.spacer`, a `.row` of actions:
     **Build**, `.btn.btn-p`, shown **only to the owner while the ready-to-build predicate holds** (status `running`, stage `0_kickoff`, empty `build_run_id`); other viewers see nothing, not a disabled button.
     Once `build_run_id` is set, for every viewer, **Claude session**, `.btn.btn-s.btn-sm` anchor with `Icon external`, `href` = `build_run_id`, `target="_blank" rel="noopener noreferrer"`
     (the same pattern as the Reader's "Open …" button; secondary, so the page keeps one `.btn-p`).
   - `.ob-pochead-meta` unchanged.
   - **Build states:** default `.btn-p`; working `disabled` + `aria-busy`, label "Starting…" (kit `.btn:disabled`); success toast `ok("Build started", "Claude is working on Understand. The session link is in the header.")`
     and, after the refetch, the button is gone and the session link is there; refused `warn("A build is already running")` (the automation refuses when `build_run_id` is set); failed `fail("Couldn't start the build")`.
2. **Approval card `.ps-banner.need.ob-approval.ob-approval--gate`** (changed, beat 6, the lean-forward moment). The shape is as cloned (`.ic`, `.tx`, the two `.ob-appr` chips in `.ob-appr-row`, the button in its grid cell).
   - **To review** (new list), inside `.tx` directly under the gate-summary `<span>`, above the Owner/Manager chips: `<p class="micro">To review · {n}</p>` then `.ob-doclist` holding one **`.ob-docrow`** per document
     of the **open gate** whose status is `in_review` (the rows of the Artifacts list: `.ob-doctype` pill, `.ob-docrow-name`, `.ob-docrow-meta` "{stage} · {date}", chevron). A row opens the Reader
     (`.ps-drawer.ob-drawer.ob-drawer--wide`, unchanged) with `DocBody` (the PRD and mockup are HTML in the sandboxed `.ob-htmlframe`). When the gate has no `in_review` document the section is **absent**, not an empty box,
     and the card reads as the source's does today. At narrow widths the card's existing rule drops the button under `.tx`, so the list is above the button either way.
   - `.ob-appr-note` prints the channel with "#": "Suggestions go in #pentland-poc."
   - **Approve {Phase}**, `.btn.btn-p.ob-approval-btn`, manager only, as cloned, now calling the Approve gate automation. **States:** working `disabled` + `aria-busy`, "Approving…";
     success `ok("Plan approved", "Build starts next.")`, or when the owner has not approved yet `ok("Your approval of Plan is saved", "Waiting on {owner} in Slack.")`;
     the DM or the cloud run failed after the approval was saved `warn("Approved, but Slack didn't answer", "The approval itself is saved.")`; **already decided** `warn("Already decided", "This gate was approved a moment ago.")`
     and the card refetches (the button is gone); **forbidden** `fail("Only the manager can approve")` (the button is hidden for non-managers, so this is the stale-session case); error `fail("Couldn't save your approval")`.
     All five are the page's default sonner toasts (`ok`, `warn`, `fail`); no new toast style.
   - After the gate passes, the documents move from "To review" to the phase's list (the automation sets them approved); the card falls to the cloned `Banner` variants (`run`, "Building · Build").
3. **Journey** and **Changes card**: unchanged (beat 4: the "2 iterations" chip and its panel).
4. **Tabs card, label only** (changed, beat 4): the `.tab` "Artifacts" reads **"Documents"**; ids, `aria-controls`, the `.seg` stage filter and the panel are unchanged. The in-panel copy keeps the source's wording.
5. **History tab** (changed, beat 4; the approvals and the build rows of beats 5 and 6 show here as notices). Inside `.tabpanel` > `.ob-history` > `.ob-hday`, the `.micro` date divider (Today, Yesterday, weekday) and the newest-first order are kept.
   - **Slack row** (the activity row has `slack_ts`): `li.ob-hrow.is-bubble`. Column 1 `.ob-hav` with a round `.av` (kit circle): `<img>` from `actor_avatar_url`, or the initials with the source's `ob-tone-N` when the picture is empty; no `.ob-hkind` badge.
     Column 2 `.msg.ai` (left-aligned, tier-2 glass, kit): `.who` (sender name, IBM Plex Mono caps), `.bub` (the text, plain), then under it `<a class="ob-mono-t" href={slack_ref} target="_blank" rel="noopener noreferrer">` with the time
     (`timeStyle: 'short'`); when `slack_ref` is empty the time is a plain `<time class="ob-mono-t">`. **All bubbles left-aligned.**
   - **Every other kind**: `li.ob-hrow.is-notice`, the source's compact line unchanged (avatar with its `.ob-hkind` badge, `.ob-htext`, `time`), **centred**.
   - The CSS this adds (the only CSS in this file, no colour value), placed at the end of `orbit.css`:
     ```css
     .av img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
     .ob-hrow.is-bubble { grid-template-columns: 30px minmax(0, 1fr); }
     .ob-hrow.is-notice { grid-template-columns: auto auto auto; justify-content: center; align-items: center; }
     .ob-hrow.is-bubble::after, .ob-hrow.is-notice::after { display: none; }
     ```
   - **States:** loading and error are the page's (`Loading`, `LoadError`); empty `.empty` "No activity yet" / "Approvals, documents and changes are listed here as they happen."; a failed refetch `.ob-datanote`.
     Read-only: no disabled state, no toast. No entrance animation, no read marks, no right-aligned "mine".
6. **Documents tab body**: unchanged (beat 4: "Documents lists the use case's files").

**Not drawn, on purpose:** a role switcher, a theme toggle, a second primary button, a modal for Approve (the container doctrine: a modal is for irreversible or legal acts; Approve is a one-click action on the record, the cloned behaviour).

---

## Feedback `/feedback`

**job:** Let a manager see which skill each piece of feedback hits, read the suggested prompt change beside the current prompt with its evidence, and approve it so the skill's version moves.

**design** (beat **R**: built, not walked; opened from the Home "Open feedback" tile), per skill group in the cloned `.ob-skills` > `.ob-skillrow` (the sticky `.ps-skill` card beside the `.ob-fbstack` article stack):

1. **Summary card `.ps-skill`** (changed). In `.hd`, under the skill name `b`: `span.ver` "v3 · approved 12 Oct" (the current version; IBM Plex Mono, as the source's `.ps-skill .ver`). When a suggestion is pending, a `.tag.attention`
   with icon `pause` "Suggestion pending" sits under `.hd`. `.nums` is unchanged. **Version list** under `.nums`: the kit's `.feed`, one `.fi` per version newest first: `.fd.pos` with a check when approved, `.fb` >
   `.fh` (`b` "v3", `span` "approved by {name}", `.fw` the date) and `.fp` the reason ("4 tickets"). Three shown; the rest behind a `.chev` "Show all {n} versions" that expands inline (overflow goes behind a chevron, never by truncating).
2. **Pending suggestion**, the **first item of `.ob-fbstack`**, as the kit's **AI Insight card `.ai:not(.msg)`** (doctrine: every system-generated output, and automation 7 writes this one):
   `.hd` with `.micro` "Suggested prompt change" and a `.tag.neutral` "Suggestion only, you decide"; one sentence in `p`; `.ground` "From {n} tickets since v3" followed by the evidence as `code.inl.ob-ticket` links
   to `#fb-{ticket_no}` (the articles below carry those ids); then `.grid.g2c` with two **`.inner`** blocks, each a `.micro` ("Current prompt · v3", "Proposed · v4") over the prompt through the source's `Markdown`
   (no word-level diff: v3.4 keeps the diff view out of the kit); then `.foot` with a `.chev` "Show full prompts" (both blocks clamp to a few lines until opened) and **the one CTA in the same card**:
   **Approve v4**, `.btn.btn-p.btn-sm`, **rendered only for a manager-viewer** (defined by the same matching rule as `mustApprove`, in the code task). Everyone else sees the card with the `.hint` "A manager approves this."
   - **Approve states:** working `disabled` + `aria-busy`, "Approving…"; success `ok("PRD writer v4 approved", "The skill now runs v4.")`, then the group refetches (the version in `.ver` moves, the card goes, the version list gains a row);
     already decided `warn("Already decided", "This suggestion was approved a moment ago.")`; forbidden `fail("Only a manager can approve")`; error `fail("Couldn't save the approval")`.
3. **Feedback articles `.ps-fb.ob-fb`**: unchanged. A group with a pending suggestion keeps its summary card and its AI card when the status filter leaves it no articles, so a filter never hides a decision;
   the filtered-empty `.empty` ("No {status} feedback" with `.btn.btn-s.btn-sm` "Show all") appears only when no group has anything to show.

**states:** loading `Loading what="feedback"`; error `LoadError`; empty `.empty` "No feedback yet" / "Feedback on a POC-builder skill shows up here once it is logged from Slack or a gate."; no suggestion pending: nothing extra
is drawn (no empty card). The page title and sub line keep the source's words.

---

## Paste-ready `code-app · update` fragments (for the moderator's spec; name the beat and keep these in the kit's parts)

- `code-app · update · POC Studio Live: screen Home /: Status cell gains the derived "Waiting on you" / "Waiting on {owner}" tag and "Building · {phase}" (.tag.attention, .tag.ob-tag-brand), one predicate feeding the Waiting-on-you .seg count and the rail .ct.hot badge; rows follow the refetch with no entrance animation; loading, error, empty and filtered-empty as cloned · reads psl_poc`
- `code-app · update · POC Studio Live: screen POC page /pocs/:pocId: header drops a leading client name, shows .btn.btn-p "Build" to the owner under the ready-to-build predicate then a .btn.btn-s.btn-sm "Claude session" link; approval card gains a "To review" .ob-doclist of in_review .ob-docrow rows that open the Reader, "#channel" in the note, Approve through the Approve gate automation with working, already-decided, forbidden toasts; tab "Artifacts" renamed "Documents"; History renders slack_ts rows as left-aligned .msg.ai bubbles in .ob-hrow.is-bubble and every other kind as a centred .ob-hrow.is-notice · reads psl_poc, psl_document, psl_activity · calls Start build on Build, Approve gate on Approve`
- `code-app · update · POC Studio Live: screen Feedback /feedback: each skill group's .ps-skill gains the current version (.ver), a "Suggestion pending" tag and a .feed version list; the pending suggestion is an .ai:not(.msg) card with current prompt beside proposed in two .inner blocks, evidence tickets as links, and one .btn.btn-p.btn-sm Approve shown to a manager-viewer only · reads psl_skill, psl_skill_suggestion, psl_feedback · calls Approve skill suggestion on Approve`
