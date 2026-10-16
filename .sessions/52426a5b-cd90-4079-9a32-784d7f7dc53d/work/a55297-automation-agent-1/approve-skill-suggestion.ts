import { automation, callable, eq, gt, isIn, missing, ne, op, RUN, scope } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Approve skill suggestion",
    description:
      "Called by the Approve button on the Feedback page. For a manager, approves a pending skill suggestion: sets the skill's current version and prompt, marks the evidence tickets resolved and marks the suggestion approved. Answers status approved, already_decided, forbidden, not_found or error.",
    settings: {
      enableNodeLevelLogging: true,
      enableRunLogging: true,
      enableVariableLogging: true,
      route: {
        default: false,
        tierName: "global",
      },
    },
    trigger: callable({
      result: {
        type: "object",
        properties: {
          status: {
            type: "string",
            title: "Status",
          },
          skill_id: {
            type: "string",
            title: "Skill id",
          },
          to_version: {
            type: "integer",
            title: "To version",
          },
          message: {
            type: "string",
            title: "Message",
          },
        },
      },
      setup: {
        type: "object",
        properties: {
          suggestion_id: {
            type: "string",
            title: "Suggestion id",
          },
          caller_email: {
            type: "string",
            title: "Caller email",
          },
          caller_name: {
            type: "string",
            title: "Caller name",
          },
        },
        required: [
          "suggestion_id",
        ],
      },
    }),
  },
  (t) => {
    // Trim the inputs and pick the name that is written as the approver
    const norm = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: {
          suggestion_id: { type: "string" },
          caller_email: { type: "string" },
          caller_name: { type: "string" },
        },
      },
      output: {
        type: "object",
        properties: {
          sid: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          actor: { type: "string" },
          valid: { type: "boolean" },
        },
        required: ["sid", "email", "name", "actor", "valid"],
      },
      parameters: {
        suggestion_id: t.suggestion_id,
        caller_email: t.caller_email,
        caller_name: t.caller_name,
      },
      code: [
        "def val = { String n -> (binding.hasVariable(n) && binding.getVariable(n) != null) ? binding.getVariable(n).toString().trim() : '' }",
        "def sid = val('suggestion_id')",
        "def email = val('caller_email')",
        "def name = val('caller_name')",
        "def actor = name ? name : email",
        "result = [sid: sid, email: email, name: name, actor: actor, valid: sid.length() > 0]",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Is the suggestion id missing?
    if (eq(norm.result.valid, false)) {
      // Answer error: no suggestion id
      return {
        status: "error",
        skill_id: "",
        to_version: 0,
        message: "suggestion_id is required, so nothing was changed.",
      };
    }

    // Fetch the managers of all POCs, manager columns only
    const pocs = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      object_type: "psl_poc",
      numberOfRecordsToFetch: "MULTIPLE",
      page: { paginateBy: "OFFSET", limit: 200, offset: 0 },
      fields: ["properties.manager_email", "properties.manager_name"],
    });

    // Match the caller to a manager, ignoring case and spaces; an empty value never matches
    const manager = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: {
          pocs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                manager_email: { type: "string" },
                manager_name: { type: "string" },
              },
            },
          },
          callerEmail: { type: "string" },
          callerName: { type: "string" },
          hasMore: { type: "boolean" },
        },
      },
      output: {
        type: "object",
        properties: {
          verdict: { type: "string" },
        },
        required: ["verdict"],
      },
      parameters: {
        pocs: pocs.objects.map((v) => ({
          manager_email: v.properties.manager_email,
          manager_name: v.properties.manager_name,
        })),
        callerEmail: norm.result.email,
        callerName: norm.result.name,
        hasMore: pocs.hasMore,
      },
      code: [
        "def norm = { v -> v == null ? '' : v.toString().trim().toLowerCase(Locale.ROOT) }",
        "def cEmail = binding.hasVariable('callerEmail') ? norm(callerEmail) : ''",
        "def cName = binding.hasVariable('callerName') ? norm(callerName) : ''",
        "def match = false",
        "if (binding.hasVariable('pocs') && pocs != null) {",
        "  for (p in pocs) {",
        "    if (cEmail && norm(p.manager_email) == cEmail) { match = true }",
        "    if (cName && norm(p.manager_name) == cName) { match = true }",
        "  }",
        "}",
        "def more = binding.hasVariable('hasMore') && hasMore != null && hasMore.toString() == 'true'",
        "result = [verdict: match ? 'manager' : (more ? 'unknown' : 'not_manager')]",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Could the manager list not be read in full?
    if (eq(manager.result.verdict, "unknown")) {
      // Answer error: nobody can be refused or accepted on a cut-off list
      return {
        status: "error",
        skill_id: "",
        to_version: 0,
        message: "The manager list could not be checked in full, so nothing was changed.",
      };
    }

    // Is the caller not a manager?
    if (ne(manager.result.verdict, "manager")) {
      // Answer forbidden
      return {
        status: "forbidden",
        skill_id: "",
        to_version: 0,
        message: "Only a manager can approve a skill suggestion.",
      };
    }

    // Fetch the suggestion
    const sug = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      object_type: "psl_skill_suggestion",
      numberOfRecordsToFetch: "MULTIPLE",
      page: { paginateBy: "OFFSET", limit: 1, offset: 0 },
      triggerInputCondition: eq("properties_suggestion_id", norm.result.sid),
    });

    // Is there no such suggestion?
    if (missing(sug.objects[0].id)) {
      // Answer not_found
      return {
        status: "not_found",
        skill_id: "",
        to_version: 0,
        message: "No skill suggestion has this id.",
      };
    }

    // Is the suggestion no longer pending?
    if (ne(sug.objects[0].properties.status, "pending")) {
      // Answer already_decided
      return {
        status: "already_decided",
        skill_id: sug.objects[0].properties.skill,
        to_version: sug.objects[0].properties.to_version,
        message: `This suggestion has already been ${sug.objects[0].properties.status}.`,
      };
    }

    // Fetch the skill the suggestion is for
    const skillRow = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      object_type: "psl_skill",
      numberOfRecordsToFetch: "MULTIPLE",
      page: { paginateBy: "OFFSET", limit: 1, offset: 0 },
      triggerInputCondition: eq("properties_skill_id", sug.objects[0].properties.skill),
    });

    // Is the skill gone?
    if (missing(skillRow.objects[0].id)) {
      // Answer error: the skill row does not exist
      return {
        status: "error",
        skill_id: sug.objects[0].properties.skill,
        to_version: sug.objects[0].properties.to_version,
        message: "The skill of this suggestion was not found, so nothing was changed.",
      };
    }

    // List the evidence ticket numbers and write the action text and the answer text
    const prep = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: {
          evidenceTickets: { type: "string" },
          skillName: { type: "string" },
          skillId: { type: "string" },
          toVersion: { type: "integer" },
        },
      },
      output: {
        type: "object",
        properties: {
          tickets: { type: "array", items: { type: "string" } },
          actionTaken: { type: "string" },
          message: { type: "string" },
        },
        required: ["tickets", "actionTaken", "message"],
      },
      parameters: {
        evidenceTickets: sug.objects[0].properties.evidence_tickets,
        skillName: skillRow.objects[0].properties.name,
        skillId: sug.objects[0].properties.skill,
        toVersion: sug.objects[0].properties.to_version,
      },
      code: [
        "def val = { String n -> (binding.hasVariable(n) && binding.getVariable(n) != null) ? binding.getVariable(n).toString() : '' }",
        "def tickets = []",
        "for (s in val('evidenceTickets').split(',')) {",
        "  def tn = s.trim()",
        "  if (tn && !tickets.contains(tn)) { tickets << tn }",
        "}",
        "if (tickets.isEmpty()) { tickets << '__none__' }",
        "def ver = val('toVersion').trim()",
        "try { ver = new BigDecimal(ver).intValue().toString() } catch (Exception e) { }",
        "def label = val('skillName').trim() ? val('skillName').trim() : val('skillId').trim()",
        "result = [tickets: tickets, actionTaken: 'Included in ' + label + ' v' + ver, message: 'Approved. ' + label + ' is now at v' + ver + '.']",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Fetch the evidence tickets that exist
    const existing = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      object_type: "psl_feedback",
      numberOfRecordsToFetch: "MULTIPLE",
      page: { paginateBy: "OFFSET", limit: 100, offset: 0 },
      triggerInputCondition: isIn("properties_ticket_no", prep.result.tickets),
      fields: ["properties.ticket_no"],
    });

    try {
      // Apply the approval as one unit: the skill, then the tickets, then the suggestion
      scope(op("scope", "scope_trigger_scope", {}), () => {
        // Set the skill's current version and prompt
        op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
          object_type: "psl_skill",
          recordId: skillRow.objects[0].id,
          updateFields: [
            { fieldName: "properties.current_version", actionType: "SET", setValue: sug.objects[0].properties.to_version },
            { fieldName: "properties.prompt", actionType: "SET", setValue: sug.objects[0].properties.proposed_prompt },
          ],
        });

        // Loop over the evidence tickets
        for (const ticket of existing.objects) {
          // Mark the ticket resolved
          op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
            object_type: "psl_feedback",
            recordId: ticket.id,
            updateFields: [
              { fieldName: "properties.status", actionType: "SET", setValue: "resolved" },
              { fieldName: "properties.action_taken", actionType: "SET", setValue: prep.result.actionTaken },
              { fieldName: "properties.reviewed_by", actionType: "SET", setValue: norm.result.actor },
              { fieldName: "properties.resolved_at", actionType: "SET", setValue: RUN.currentTime },
            ],
          });
        }

        // Mark the suggestion approved
        op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
          object_type: "psl_skill_suggestion",
          recordId: sug.objects[0].id,
          updateFields: [
            { fieldName: "properties.status", actionType: "SET", setValue: "approved" },
            { fieldName: "properties.approved_by", actionType: "SET", setValue: norm.result.actor },
            { fieldName: "properties.approved_at", actionType: "SET", setValue: RUN.currentTime },
          ],
        });
      });
    } catch {
      // Answer error: the suggestion stays pending when it was not marked approved
      return {
        status: "error",
        skill_id: sug.objects[0].properties.skill,
        to_version: sug.objects[0].properties.to_version,
        message: "The approval did not finish. Try again; the suggestion is approved only when every step has run.",
      };
    }

    // Answer approved
    return {
      status: "approved",
      skill_id: sug.objects[0].properties.skill,
      to_version: sug.objects[0].properties.to_version,
      message: prep.result.message,
    };
  },
);
