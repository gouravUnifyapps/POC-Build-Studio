import { and, automation, continueIf, eq, gt, lt, op, RUN, schedule, stop } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Suggest skill improvements",
    description:
      "Runs every Monday at 09:00 (Asia/Kolkata), one run at a time. For each skill, gathers the open feedback tickets newer than its last approved suggestion and, when there are at least 3 and no pending suggestion, asks the Simple Call LLM automation for an improved prompt and writes one pending skill suggestion.",
    trigger: schedule({
      cron: "EXPRESSION",
      expression: "0 9 * * 1",
      timezone: "Asia/Kolkata",
      sequential: true,
      maxWaitTime: 30,
      sequentialRunTimeUnit: "MINUTES",
    }),
  },
  () => {
    // Fetch every skill
    const skills = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      object_type: "psl_skill",
      numberOfRecordsToFetch: "MULTIPLE",
      page: { paginateBy: "OFFSET", limit: 100, offset: 0 },
    });

    // Loop over the skills
    for (const skill of skills.objects) {
      // Count the skill's pending suggestions
      const pending = op("storage_by_unifyapps", "storage_by_unifyapps_count_records", {
        object_type: "psl_skill_suggestion",
        triggerInputCondition: and(
          eq("properties_skill", skill.properties.skill_id),
          eq("properties_status", "pending"),
        ),
      });

      // Skip a skill that already has a pending suggestion
      continueIf(gt(pending.count, 0));

      // Fetch the skill's approved suggestions, approval time only
      const approved = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
        object_type: "psl_skill_suggestion",
        numberOfRecordsToFetch: "MULTIPLE",
        page: { paginateBy: "OFFSET", limit: 100, offset: 0 },
        triggerInputCondition: and(
          eq("properties_skill", skill.properties.skill_id),
          eq("properties_status", "approved"),
        ),
        fields: ["properties.approved_at"],
      });

      // Find the newest approval time, 0 when the skill has no approved suggestion
      const cutoff = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
        input: {
          type: "object",
          properties: {
            approvedAts: { type: "array", items: { type: "number" } },
          },
        },
        output: {
          type: "object",
          properties: {
            cutoff: { type: "number" },
          },
          required: ["cutoff"],
        },
        parameters: {
          approvedAts: approved.objects.map((v) => v.properties.approved_at),
        },
        code: [
          "def best = 0L",
          "def vals = binding.hasVariable('approvedAts') ? approvedAts : null",
          "if (vals != null) {",
          "  for (v in vals) {",
          "    def n = null",
          "    if (v instanceof Number) {",
          "      n = v.longValue()",
          "    } else if (v != null && v.toString().trim()) {",
          "      try { n = new BigDecimal(v.toString().trim()).longValue() } catch (Exception e) { n = null }",
          "    }",
          "    if (n != null && n > best) { best = n }",
          "  }",
          "}",
          "result = [cutoff: best]",
        ].join("\n"),
        compile_static: false,
        captureStdOutput: false,
      });

      // Fetch the skill's open tickets raised after that approval
      const tickets = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
        object_type: "psl_feedback",
        numberOfRecordsToFetch: "MULTIPLE",
        page: { paginateBy: "OFFSET", limit: 100, offset: 0 },
        triggerInputCondition: and(
          eq("properties_target_skill", skill.properties.skill_id),
          eq("properties_status", "open"),
          gt("properties_created_at", cutoff.result.cutoff),
        ),
      });

      // Count the tickets, list their numbers and write the model content
      const prep = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
        input: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            currentVersion: { type: "integer" },
            tickets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ticket_no: { type: "string" },
                  feedback: { type: "string" },
                  created_at: { type: "number" },
                },
              },
            },
          },
        },
        output: {
          type: "object",
          properties: {
            count: { type: "integer" },
            evidenceTickets: { type: "string" },
            content: { type: "string" },
            toVersion: { type: "integer" },
          },
          required: ["count", "evidenceTickets", "content", "toVersion"],
        },
        parameters: {
          prompt: skill.properties.prompt,
          currentVersion: skill.properties.current_version,
          tickets: tickets.objects.map((v) => ({
            ticket_no: v.properties.ticket_no,
            feedback: v.properties.feedback,
            created_at: v.properties.created_at,
          })),
        },
        code: [
          "def nl = String.valueOf((char) 10)",
          "def safe = { v -> v == null ? '' : v.toString() }",
          "def promptText = binding.hasVariable('prompt') ? safe(prompt) : ''",
          "def ver = 0",
          "if (binding.hasVariable('currentVersion') && currentVersion != null) {",
          "  ver = new BigDecimal(currentVersion.toString()).intValue()",
          "}",
          "def rows = []",
          "if (binding.hasVariable('tickets') && tickets != null) {",
          "  for (t in tickets) {",
          "    def at = (t.created_at instanceof Number) ? t.created_at.longValue() : 0L",
          "    rows << [no: safe(t.ticket_no), feedback: safe(t.feedback).trim(), at: at]",
          "  }",
          "}",
          "rows = rows.sort { a, b -> (a.at <=> b.at) ?: (a.no <=> b.no) }",
          "def sb = new StringBuilder()",
          "sb.append('CURRENT PROMPT:').append(nl).append(promptText).append(nl).append(nl)",
          "sb.append('FEEDBACK TICKETS (').append(rows.size()).append('):').append(nl)",
          "def i = 0",
          "for (r in rows) {",
          "  i++",
          "  sb.append(i).append('. [').append(r.no).append('] ').append(r.feedback).append(nl)",
          "}",
          "result = [count: rows.size(), evidenceTickets: rows.collect { it.no }.join(','), content: sb.toString(), toVersion: ver + 1]",
        ].join("\n"),
        compile_static: false,
        captureStdOutput: false,
      });

      // Skip a skill with fewer than 3 such tickets
      continueIf(lt(prep.result.count, 3));

      // Ask the model for an improved prompt, JSON answer
      const llm = op(
        "callables",
        "callables_call_automation",
        {
          automationId: "66dfd76eb70dad256986b784",
          version: "-1",
          synchronous: true,
          parameters: {
            systemPrompt:
              'You improve the prompt of one POC-builder skill from the feedback people gave on its output. You are given the skill\'s current prompt and the open feedback tickets about what the skill produced. Rewrite the whole prompt so that it fixes what the tickets raise, and keep everything in the current prompt that the tickets do not contradict. Answer with one JSON object and nothing else, with exactly two keys: "summary" (one sentence saying what you changed) and "proposed_prompt" (the whole new prompt as one string).',
            content: prep.result.content,
            type: "text",
            response_format: "json_object",
          },
        },
        { onError: "CONTINUE" },
      );

      // Parse the model answer to an object
      const answer = op(
        "utility_by_unifyapps",
        "utility_by_unifyapps_to_json_object",
        {
          jsonString: llm.llmResponse,
          jsonSchema: {
            type: "object",
            properties: {
              summary: { type: "string", title: "Summary" },
              proposed_prompt: { type: "string", title: "Proposed prompt" },
            },
          },
        },
        { onError: "CONTINUE" },
      );

      // Check that summary and proposed_prompt are both non-empty strings
      const check = op(
        "code_by_unifyapps",
        "code_by_unifyapps_groovy",
        {
          input: {
            type: "object",
            properties: {
              summary: { type: "string" },
              proposed_prompt: { type: "string" },
            },
          },
          output: {
            type: "object",
            properties: {
              valid: { type: "boolean" },
            },
            required: ["valid"],
          },
          parameters: {
            summary: answer.result.summary,
            proposed_prompt: answer.result.proposed_prompt,
          },
          code: [
            "def ok = false",
            "if (binding.hasVariable('summary') && binding.hasVariable('proposed_prompt')) {",
            "  ok = (summary instanceof CharSequence) && summary.toString().trim().length() > 0 && (proposed_prompt instanceof CharSequence) && proposed_prompt.toString().trim().length() > 0",
            "}",
            "result = [valid: ok]",
          ].join("\n"),
          compile_static: false,
          captureStdOutput: false,
        },
        { onError: "CONTINUE" },
      );

      // Both keys present?
      if (eq(check.result.valid, true)) {
        // Write one pending suggestion for the skill
        op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
          object_type: "psl_skill_suggestion",
          record: {
            suggestion_id: `SUG-${skill.properties.skill_id}-${RUN.currentTime}`,
            skill: skill.properties.skill_id,
            from_version: skill.properties.current_version,
            to_version: prep.result.toVersion,
            summary: answer.result.summary,
            proposed_prompt: answer.result.proposed_prompt,
            evidence_count: prep.result.count,
            evidence_tickets: prep.result.evidenceTickets,
            status: "pending",
            created_at: RUN.currentTime,
          },
        });
      }
    }

    // Done
    stop();
  },
);
