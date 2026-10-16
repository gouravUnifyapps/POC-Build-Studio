# Replace Feedback with Skills & Feedback

The Feedback page becomes "Skills & Feedback": one place to run the skill analysis, review the changes it proposes to skills, approve or reject them, and browse each skill's version history. The rest of Orbit Studio stays exactly as it is.

## What gets built

**1. Page header**
- The title "Skills & Feedback" and the time of the last analysis run, read from the newest analysis-run record. If no run exists yet it says "No analysis run yet".
- A **Run analysis** button. While the run is in progress it shows a spinner and is disabled. When it finishes, a success toast shows the automation's own `message` plus the `proposals_created` and `feedback_new` it returned, and the data on the page refreshes. A `success: false` result or a network failure shows an error toast with the reason.

**2. Four KPI tiles**
- Pending proposals, Active skills, New feedback, Approved changes in the last 30 days.
- Every tile is counted from real records. If its source field doesn't exist, the tile shows "—" and a "Not available" note instead of a made-up number.

**3. Tabs: Review queue | Skills | Feedback inbox | Changelog** (keyboard-navigable tabs; the selected tab is stored in the URL)
- **Review queue**: a list of proposals filtered by status (pending is the default). Each row shows the skill, a summary, the number of feedback items behind it and how old it is. Selecting a row opens the proposal drawer.
- **Skills**: a list of skills showing the current version, when it was last updated and how many proposals are open. Selecting a skill opens Skill detail.
- **Feedback inbox**: the existing `orbit_studio_feedback` records, using the current board's cards and filters, now inside this tab. Each item shows whether a proposal has already used it.
- **Changelog**: a reverse-chronological timeline of decisions and restores. Each entry shows the skill, the version change, who decided and the note.
- Every tab has skeleton rows while loading, an empty state that explains what will appear there (for example "Run analysis to generate proposals"), and an error message with a Retry button.

**4. Proposal detail drawer**
- A line-level diff of the current skill text against the proposed text: added and removed lines get a tinted background and a +/− sign in the gutter, with no coloured side stripes. Users can switch between unified and split views.
- An **Edit** button turns the proposed text into an editable textarea. That edited text is what gets sent if the proposal is approved.
- The feedback items that triggered the proposal.
- A sticky action bar with **Approve**, **Request changes** and **Reject**, plus a note field. The note is required for Request changes and Reject. Each button calls "Decide skill proposal". The toast shows the returned `message`, `new_version` and `incorporated_count`, then the drawer closes and the lists refresh. Once a proposal has been decided, the bar is hidden.

**5. Skill detail**
- The current content of the skill and a vertical version timeline (version number, date, source, note).
- **Compare**: pick any two versions to see the same line diff.
- **Restore**: available on any older version. A confirmation dialog appears first, then "Restore skill version" runs and the toast shows the returned `message` and `new_version`.

## Technical notes
- **Route and nav**: `/feedback` is replaced by `/skills` (redirect `/feedback` → `/skills`). The nav label is "Skills & Feedback". Edit `orbit/lib/nav.ts`, `Shell.tsx` and `App.tsx` routes. Replace `orbit/views/FeedbackBoard.tsx` with `orbit/views/skills/*` (the page, the tabs, `ProposalDrawer`, `SkillDetail`, `LineDiff`). Reuse the existing `Drawer` component and the feedback card parts.
- **Automations**: the bindings already exist in `src/data/callables.ts` (`RUN_SKILL_ANALYSIS`, `DECIDE_SKILL_PROPOSAL`, `RESTORE_SKILL_VERSION`), and their types are in `src/data/automationTypes.ts`. Send `{...X.storedInputs, parameters:{…}}` using the declared types (`version` is a number). Always check `success === false`. Toasts may show only the values the automation returns.
  - Run skill analysis (6ad1bb4142133b6ddd8d04cf): no inputs. Returns success, message, run_id, proposals_created, feedback_new, feedback_total.
  - Decide skill proposal (6ad1bb4042133b6ddd8d0439): takes proposal_id, decision (`approve`|`request_changes`|`reject`), note and edited_content. Returns success, message, proposal_status, new_version, incorporated_count.
  - Restore skill version (6ad1bb4042133b6ddd8d0488): takes skill_key and version (number). Returns success, message, new_version.
- **Objects**: `orbit_studio_feedback` (existing) plus the new obj_w8ukz, obj_p50bw, obj_g8y4m, obj_8rauo and obj_343xd. Add all five to `ENTITY` in `bindings.ts` and put their reads and writes in a new `src/data/skills.ts`. Reads only; every write goes through the automations.
- **IMPORTANT — the obj_ field schemas are not in the workspace.** I searched the workspace and couldn't find the stored brief or manifest: no file mentions these ids. Only the automation contracts are on disk. I won't invent field keys. Before writing `skills.ts`, the builder must fetch each obj_ id's schema with its object-schema tool. It then maps each id to exactly one role: **skill** (key, name, current content, current version), **skill version** (skill_key, version number, content, created time, source/note), **proposal** (id, skill_key, status, current/proposed content, summary, linked feedback), **analysis run** (run time, counts) and **changelog** (skill_key, action, from/to version, actor, note, time). The automation inputs `skill_key`/`version`/`proposal_id` are the join keys. Record the resolved id → role → field list as a comment at the top of `skills.ts`.
- If a role's field can't be found, that UI element shows "Not available — needs <field>" and is not filled with an invented value. A KPI that can't be counted shows "—".
- Leave all seed data alone and create no new objects: these objects belong to the solution.
- **Assumptions (unattended run)**:
  - The admin action bar is shown to every signed-in user. Real role gating belongs to the solution's own users and permissions.
  - The diff is a line-level LCS computed on the client. No new dependency.
  - Mobile: the drawer becomes a full-screen sheet and the action bar stays pinned to the bottom.
- **Styling**: keep the existing serif headings, muted surfaces, olive accent and Orbit `ds` tokens. Colours come only from theme tokens; diff tints use the success-subtle and destructive-subtle tokens. No left or right border stripes. Give everything visible focus rings and make every action reachable by keyboard; the drawer traps focus and closes on Esc. Dates are formatted with `useFormatters()`. Status labels are declared once as a `Record` in `skills.ts`.
- theme.json, PRODUCT.md, PLAN.md and every other page are unchanged.
