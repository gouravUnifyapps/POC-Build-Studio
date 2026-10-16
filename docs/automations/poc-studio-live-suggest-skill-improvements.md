---
nebula: 3
slug: "poc-studio-live-suggest-skill-improvements"
name: "POC Studio Live · Suggest skill improvements"
summary: "Weekly scheduled automation that drafts a prompt change for each skill with enough open feedback and saves it as a pending suggestion."
entities: [{"kind":"automation","name":"POC Studio Live · Suggest skill improvements"}]
planIds: ["e_6ad1ccf1674d735893a55297"]
updatedAt: "2026-10-16T07:40:35.152Z"
---
## What it does
Runs on a weekly schedule (Monday 09:00 IST), one run at a time. For each skill in `psl_skill` with enough qualifying feedback tickets in `psl_feedback` and no pending suggestion, it asks an LLM (Simple Call LLM) for a summary and a proposed prompt, and writes a `psl_skill_suggestion` row: `suggestion_id` `SUG-<skill_id>-<epoch ms>`, status `pending`, `evidence_tickets` comma-separated in ticket order, `from_version` = current version, `to_version` one higher.

## Known issue (2026-10-16)
Its first run (6ad1cebbd885ae5a4da0dd8b) wrote nothing: the model's JSON answer held unescaped double quotes inside `proposed_prompt`, so the parse failed. Until the parse is made tolerant, no pending suggestion exists on UAT.