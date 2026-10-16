# Memory
## Decisions
- 2026-10-16 — POC Studio Live: skill-improvement loop — POC Studio Live keeps skill suggestions inline on /feedback (AI Insight card, no diff, no new rail item); the source app's later /skills 'Skills & Feedback' page was deliberately not ported because it conflicts with this app's design.
- 2026-10-16 — session — 2026-10-16: all seeded demo rows (54, incl. the 3 placeholder skills) were deleted at the person's request; only Slack-created rows remain, so psl_skill is empty and the Feedback page's skill loop has nothing to show until real skills are added.
- 2026-10-16 — session — POC Studio Live: a POC started from Slack backfills its channel's whole history on the first ingestion run (Save POC from Slack leaves slack_last_ts empty), so files shared before the POC start reach History and Documents.
- 2026-10-16 — session — 2026-10-16: the POC page's Build button no longer starts a cloud session via Start build; it shows and copies '/demo-studio:build <client_name> <use_case>' for the owner to paste into Claude Code (app v3). Start build automation is left deployed but unused.
- 2026-10-16 — session — 2026-10-16: 'POC Studio Live · Start build' is disabled (always returns status 'disabled', creates no cloud session); builds start only from Claude Code via /demo-studio:build. Original logic saved in session c97fc8f3 work/automation-agent-start-build/start-build.v1-original.ts.
## Corrections
## Errors
- 2026-10-16 — POC Studio Live: skill-improvement loop — Suggest skill improvements: Simple Call LLM with response_format json_object returned a proposed_prompt with unescaped double quotes, so the JSON parse failed and the first run (2026-10-16) wrote no suggestion; the parse must tolerate this before the skill loop can be demoed.
- 2026-10-16 — session — ai_agents_by_unifyapps_invoke_agent returns the agent's answer under agentResponses[].text, not publicResponse; the Slack listener read publicResponse and posted its fallback until 2026-10-16.
## Notes
