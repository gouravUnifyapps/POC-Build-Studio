import { automation, schedule, op, RUN, TRIGGER, and, continueIf, each, eq, gt, lt, stop } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Suggest skill improvements",
    description: "Runs every Monday at 09:00 (Asia/Kolkata), one run at a time. For each skill, gathers the open feedback tickets newer than its last approved suggestion and, when there are at least 3 and no pending suggestion, asks the Simple Call LLM automation for an improved prompt and writes one pending skill suggestion.",
    settings: {
      enableNodeLevelLogging: true,
      enableRunLogging: true,
      enableVariableLogging: true,
      route: {
        default: false,
        tierName: "global",
      },
    },
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
    const fetchEverySkill = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      shouldSearchInAnalyticsStore: false,
      object_type: "psl_skill",
      includeRoleMappings: false,
      includeCurrentUserPermissions: false,
      translationsOption: "DEFAULT",
      page: {
        paginateBy: "OFFSET",
        limit: 100,
        offset: 0,
      },
      numberOfRecordsToFetch: "MULTIPLE",
      readThroughSessionVariables: false,
      includeTotalCount: false,
    });
    // Loop over the skills
    for (const loopOverTheSkill of each(fetchEverySkill.objects, {
      captureIterations: true,
    })) {
      // Count the skill's pending suggestions
      const countTheSkillSPendingSuggestions = op("storage_by_unifyapps", "storage_by_unifyapps_count_records", {
        triggerInputCondition: and(
          eq("properties_skill", loopOverTheSkill.properties.skill_id),
          eq("properties_status", "pending"),
        ),
        object_type: "psl_skill_suggestion",
      });
      // Skip a skill that already has a pending suggestion
      continueIf(and(
        gt(countTheSkillSPendingSuggestions.count, 0),
      ));
      // Fetch the skill's approved suggestions, approval time only
      const fetchTheSkillSApprovedSuggestionsApprovalTimeOnly = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
        triggerInputCondition: and(
          eq("properties_skill", loopOverTheSkill.properties.skill_id),
          eq("properties_status", "approved"),
        ),
        shouldSearchInAnalyticsStore: false,
        object_type: "psl_skill_suggestion",
        includeRoleMappings: false,
        includeCurrentUserPermissions: false,
        translationsOption: "DEFAULT",
        page: {
          paginateBy: "OFFSET",
          limit: 100,
          offset: 0,
        },
        numberOfRecordsToFetch: "MULTIPLE",
        readThroughSessionVariables: false,
        fields: [
          "properties.approved_at",
        ],
        includeTotalCount: false,
      });
      // Find the newest approval time, 0 when the skill has no approved suggestion
      const findTheNewestApprovalTime0WhenTheSkillHasNoApprovedSuggestion = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
        output: {
          type: "object",
          properties: {
            cutoff: {
              type: "number",
            },
          },
          required: [
            "cutoff",
          ],
        },
        input: {
          type: "object",
          properties: {
            approvedAts: {
              type: "array",
              items: {
                type: "number",
              },
            },
          },
        },
        code: "def best = 0L\ndef vals = binding.hasVariable('approvedAts') ? approvedAts : null\nif (vals != null) {\n  for (v in vals) {\n    def n = null\n    if (v instanceof Number) {\n      n = v.longValue()\n    } else if (v != null && v.toString().trim()) {\n      try { n = new BigDecimal(v.toString().trim()).longValue() } catch (Exception e) { n = null }\n    }\n    if (n != null && n > best) { best = n }\n  }\n}\nresult = [cutoff: best]",
        compile_static: false,
        captureStdOutput: false,
        parameters: {
          approvedAts: fetchTheSkillSApprovedSuggestionsApprovalTimeOnly.objects.map((v) => v.properties.approved_at),
        },
      });
      // Fetch the skill's open tickets raised after that approval
      const fetchTheSkillSOpenTicketsRaisedAfterThatApproval = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
        triggerInputCondition: and(
          eq("properties_target_skill", loopOverTheSkill.properties.skill_id),
          eq("properties_status", "open"),
          gt("properties_created_at", findTheNewestApprovalTime0WhenTheSkillHasNoApprovedSuggestion.result.cutoff),
        ),
        shouldSearchInAnalyticsStore: false,
        object_type: "psl_feedback",
        includeRoleMappings: false,
        includeCurrentUserPermissions: false,
        translationsOption: "DEFAULT",
        page: {
          paginateBy: "OFFSET",
          limit: 100,
          offset: 0,
        },
        numberOfRecordsToFetch: "MULTIPLE",
        readThroughSessionVariables: false,
        includeTotalCount: false,
      });
      // Count the tickets, list their numbers and write the model content
      const countTheTicketsListTheirNumbersAndWriteTheModelContent = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
        output: {
          type: "object",
          properties: {
            count: {
              type: "integer",
            },
            evidenceTickets: {
              type: "string",
            },
            content: {
              type: "string",
            },
            toVersion: {
              type: "integer",
            },
          },
          required: [
            "count",
            "evidenceTickets",
            "content",
            "toVersion",
          ],
        },
        input: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
            },
            currentVersion: {
              type: "integer",
            },
            tickets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ticket_no: {
                    type: "string",
                  },
                  feedback: {
                    type: "string",
                  },
                  created_at: {
                    type: "number",
                  },
                },
              },
            },
          },
        },
        code: "def nl = String.valueOf((char) 10)\ndef safe = { v -> v == null ? '' : v.toString() }\ndef promptText = binding.hasVariable('prompt') ? safe(prompt) : ''\ndef ver = 0\nif (binding.hasVariable('currentVersion') && currentVersion != null) {\n  ver = new BigDecimal(currentVersion.toString()).intValue()\n}\ndef rows = []\nif (binding.hasVariable('tickets') && tickets != null) {\n  for (t in tickets) {\n    def at = (t.created_at instanceof Number) ? t.created_at.longValue() : 0L\n    rows << [no: safe(t.ticket_no), feedback: safe(t.feedback).trim(), at: at]\n  }\n}\nrows = rows.sort { a, b -> (a.at <=> b.at) ?: (a.no <=> b.no) }\ndef sb = new StringBuilder()\nsb.append('CURRENT PROMPT:').append(nl).append(promptText).append(nl).append(nl)\nsb.append('FEEDBACK TICKETS (').append(rows.size()).append('):').append(nl)\ndef i = 0\nfor (r in rows) {\n  i++\n  sb.append(i).append('. [').append(r.no).append('] ').append(r.feedback).append(nl)\n}\nresult = [count: rows.size(), evidenceTickets: rows.collect { it.no }.join(','), content: sb.toString(), toVersion: ver + 1]",
        compile_static: false,
        captureStdOutput: false,
        parameters: {
          prompt: loopOverTheSkill.properties.prompt,
          currentVersion: loopOverTheSkill.properties.current_version,
          tickets: fetchTheSkillSOpenTicketsRaisedAfterThatApproval.objects.map((v) => ({
            ticket_no: v.properties.ticket_no,
            feedback: v.properties.feedback,
            created_at: v.properties.created_at,
          })),
        },
      });
      // Skip a skill with fewer than 3 such tickets
      continueIf(and(
        lt(countTheTicketsListTheirNumbersAndWriteTheModelContent.result.count, 3),
      ));
      // Ask the model for an improved prompt, JSON answer
      const askTheModelForAnImprovedPromptJsonAnswer = op("callables", "callables_call_automation", {
        automationId: "66dfd76eb70dad256986b784",
        synchronous: true,
        version: "-1",
        parameters: {
          content: countTheTicketsListTheirNumbersAndWriteTheModelContent.result.content,
          response_format: "json_object",
          systemPrompt: "You improve the prompt of one POC-builder skill from the feedback people gave on its output. You are given the skill's current prompt and the open feedback tickets about what the skill produced. Rewrite the whole prompt so that it fixes what the tickets raise, and keep everything in the current prompt that the tickets do not contradict. Answer with one JSON object and nothing else, with exactly two keys: \"summary\" (one sentence saying what you changed) and \"proposed_prompt\" (the whole new prompt as one string).",
          type: "text",
        },
        executeOnSameVM: false,
      }, { onError: "CONTINUE" });
      // Parse the model answer to an object
      const parseTheModelAnswerToAnObject = op("utility_by_unifyapps", "utility_by_unifyapps_to_json_object", {
        jsonSchema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              title: "Summary",
            },
            proposed_prompt: {
              type: "string",
              title: "Proposed prompt",
            },
          },
        },
        jsonString: askTheModelForAnImprovedPromptJsonAnswer.llmResponse,
      }, { onError: "CONTINUE" });
      // Check that summary and proposed_prompt are both non-empty strings
      const checkThatSummaryAndProposedPromptAreBothNonEmptyStrings = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
        output: {
          type: "object",
          properties: {
            valid: {
              type: "boolean",
            },
          },
          required: [
            "valid",
          ],
        },
        input: {
          type: "object",
          properties: {
            summary: {
              type: "string",
            },
            proposed_prompt: {
              type: "string",
            },
          },
        },
        code: "def ok = false\nif (binding.hasVariable('summary') && binding.hasVariable('proposed_prompt')) {\n  ok = (summary instanceof CharSequence) && summary.toString().trim().length() > 0 && (proposed_prompt instanceof CharSequence) && proposed_prompt.toString().trim().length() > 0\n}\nresult = [valid: ok]",
        compile_static: false,
        captureStdOutput: false,
        parameters: {
          summary: parseTheModelAnswerToAnObject.result.summary,
          proposed_prompt: parseTheModelAnswerToAnObject.result.proposed_prompt,
        },
      }, { onError: "CONTINUE" });
      // Both keys present?
      if (and(
        eq(checkThatSummaryAndProposedPromptAreBothNonEmptyStrings.result.valid, true),
      )) {
        // Write one pending suggestion for the skill
        op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
          useRawPayload: false,
          writeThroughSessionVariables: false,
          object_type: "psl_skill_suggestion",
          skipIfBlank: false,
          inlineRefresh: false,
          record: {
            suggestion_id: `SUG-${loopOverTheSkill.properties.skill_id}-${RUN.currentTime}`,
            skill: loopOverTheSkill.properties.skill_id,
            from_version: loopOverTheSkill.properties.current_version,
            to_version: countTheTicketsListTheirNumbersAndWriteTheModelContent.result.toVersion,
            summary: parseTheModelAnswerToAnObject.result.summary,
            proposed_prompt: parseTheModelAnswerToAnObject.result.proposed_prompt,
            evidence_count: countTheTicketsListTheirNumbersAndWriteTheModelContent.result.count,
            evidence_tickets: countTheTicketsListTheirNumbersAndWriteTheModelContent.result.evidenceTickets,
            status: "pending",
            created_at: RUN.currentTime,
          },
          useUuid: false,
          batching: false,
        });
      }
    }
    // Done
    stop();
  },
);
