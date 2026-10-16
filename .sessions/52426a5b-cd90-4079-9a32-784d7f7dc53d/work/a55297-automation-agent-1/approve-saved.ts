import { automation, callable, op, RUN, TRIGGER, and, each, eq, isIn, missing, ne, scope } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Approve skill suggestion",
    description: "Called by the Approve button on the Feedback page. For a manager, approves a pending skill suggestion: sets the skill's current version and prompt, marks the evidence tickets resolved and marks the suggestion approved. Answers status approved, already_decided, forbidden, not_found or error.",
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
    const trimTheInputsAndPickTheNameThatIsWrittenAsTheApprover = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          sid: {
            type: "string",
          },
          email: {
            type: "string",
          },
          name: {
            type: "string",
          },
          actor: {
            type: "string",
          },
          valid: {
            type: "boolean",
          },
        },
        required: [
          "sid",
          "email",
          "name",
          "actor",
          "valid",
        ],
      },
      input: {
        type: "object",
        properties: {
          suggestion_id: {
            type: "string",
          },
          caller_email: {
            type: "string",
          },
          caller_name: {
            type: "string",
          },
        },
      },
      code: "def val = { String n -> (binding.hasVariable(n) && binding.getVariable(n) != null) ? binding.getVariable(n).toString().trim() : '' }\ndef sid = val('suggestion_id')\ndef email = val('caller_email')\ndef name = val('caller_name')\ndef actor = name ? name : email\nresult = [sid: sid, email: email, name: name, actor: actor, valid: sid.length() > 0]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        suggestion_id: t.suggestion_id,
        caller_email: t.caller_email,
        caller_name: t.caller_name,
      },
    });
    // Is the suggestion id missing?
    if (and(
      eq(trimTheInputsAndPickTheNameThatIsWrittenAsTheApprover.result.valid, false),
    )) {
      // Answer error: no suggestion id
      return {
        status: "error",
        skill_id: "=\"\"",
        to_version: 0,
        message: "suggestion_id is required, so nothing was changed.",
      };
    }
    // Fetch the managers of all POCs, manager columns only
    const fetchTheManagersOfAllPocsManagerColumnsOnly = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      shouldSearchInAnalyticsStore: false,
      object_type: "psl_poc",
      includeRoleMappings: false,
      includeCurrentUserPermissions: false,
      translationsOption: "DEFAULT",
      page: {
        paginateBy: "OFFSET",
        limit: 200,
        offset: 0,
      },
      numberOfRecordsToFetch: "MULTIPLE",
      readThroughSessionVariables: false,
      fields: [
        "properties.manager_email",
        "properties.manager_name",
      ],
      includeTotalCount: false,
    });
    // Match the caller to a manager, ignoring case and spaces; an empty value never matches
    const matchTheCallerToAManagerIgnoringCaseAndSpacesAnEmptyValueNeverMatches = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          verdict: {
            type: "string",
          },
        },
        required: [
          "verdict",
        ],
      },
      input: {
        type: "object",
        properties: {
          pocs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                manager_email: {
                  type: "string",
                },
                manager_name: {
                  type: "string",
                },
              },
            },
          },
          callerEmail: {
            type: "string",
          },
          callerName: {
            type: "string",
          },
          hasMore: {
            type: "boolean",
          },
        },
      },
      code: "def norm = { v -> v == null ? '' : v.toString().trim().toLowerCase(Locale.ROOT) }\ndef cEmail = binding.hasVariable('callerEmail') ? norm(callerEmail) : ''\ndef cName = binding.hasVariable('callerName') ? norm(callerName) : ''\ndef match = false\nif (binding.hasVariable('pocs') && pocs != null) {\n  for (p in pocs) {\n    if (cEmail && norm(p.manager_email) == cEmail) { match = true }\n    if (cName && norm(p.manager_name) == cName) { match = true }\n  }\n}\ndef more = binding.hasVariable('hasMore') && hasMore != null && hasMore.toString() == 'true'\nresult = [verdict: match ? 'manager' : (more ? 'unknown' : 'not_manager')]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        pocs: fetchTheManagersOfAllPocsManagerColumnsOnly.objects.map((v) => ({
          manager_email: v.properties.manager_email,
          manager_name: v.properties.manager_name,
        })),
        callerEmail: trimTheInputsAndPickTheNameThatIsWrittenAsTheApprover.result.email,
        callerName: trimTheInputsAndPickTheNameThatIsWrittenAsTheApprover.result.name,
        hasMore: fetchTheManagersOfAllPocsManagerColumnsOnly.hasMore,
      },
    });
    // Could the manager list not be read in full?
    if (and(
      eq(matchTheCallerToAManagerIgnoringCaseAndSpacesAnEmptyValueNeverMatches.result.verdict, "unknown"),
    )) {
      // Answer error: nobody can be refused or accepted on a cut-off list
      return {
        status: "error",
        skill_id: "=\"\"",
        to_version: 0,
        message: "The manager list could not be checked in full, so nothing was changed.",
      };
    }
    // Is the caller not a manager?
    if (and(
      ne(matchTheCallerToAManagerIgnoringCaseAndSpacesAnEmptyValueNeverMatches.result.verdict, "manager"),
    )) {
      // Answer forbidden
      return {
        status: "forbidden",
        skill_id: "=\"\"",
        to_version: 0,
        message: "Only a manager can approve a skill suggestion.",
      };
    }
    // Fetch the suggestion
    const fetchTheSuggestion = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      triggerInputCondition: and(
        eq("properties_suggestion_id", trimTheInputsAndPickTheNameThatIsWrittenAsTheApprover.result.sid),
      ),
      shouldSearchInAnalyticsStore: false,
      object_type: "psl_skill_suggestion",
      includeRoleMappings: false,
      includeCurrentUserPermissions: false,
      translationsOption: "DEFAULT",
      page: {
        paginateBy: "OFFSET",
        limit: 1,
        offset: 0,
      },
      numberOfRecordsToFetch: "MULTIPLE",
      readThroughSessionVariables: false,
      includeTotalCount: false,
    });
    // Is there no such suggestion?
    if (and(
      missing(fetchTheSuggestion.objects[0].id),
    )) {
      // Answer not_found
      return {
        status: "not_found",
        skill_id: "=\"\"",
        to_version: 0,
        message: "No skill suggestion has this id.",
      };
    }
    // Is the suggestion no longer pending?
    if (and(
      ne(fetchTheSuggestion.objects[0].properties.status, "pending"),
    )) {
      // Answer already_decided
      return {
        status: "already_decided",
        skill_id: fetchTheSuggestion.objects[0].properties.skill,
        to_version: fetchTheSuggestion.objects[0].properties.to_version,
        message: `This suggestion has already been ${fetchTheSuggestion.objects[0].properties.status}.`,
      };
    }
    // Fetch the skill the suggestion is for
    const fetchTheSkillTheSuggestionIsFor = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      triggerInputCondition: and(
        eq("properties_skill_id", fetchTheSuggestion.objects[0].properties.skill),
      ),
      shouldSearchInAnalyticsStore: false,
      object_type: "psl_skill",
      includeRoleMappings: false,
      includeCurrentUserPermissions: false,
      translationsOption: "DEFAULT",
      page: {
        paginateBy: "OFFSET",
        limit: 1,
        offset: 0,
      },
      numberOfRecordsToFetch: "MULTIPLE",
      readThroughSessionVariables: false,
      includeTotalCount: false,
    });
    // Is the skill gone?
    if (and(
      missing(fetchTheSkillTheSuggestionIsFor.objects[0].id),
    )) {
      // Answer error: the skill row does not exist
      return {
        status: "error",
        skill_id: fetchTheSuggestion.objects[0].properties.skill,
        to_version: fetchTheSuggestion.objects[0].properties.to_version,
        message: "The skill of this suggestion was not found, so nothing was changed.",
      };
    }
    // List the evidence ticket numbers and write the action text and the answer text
    const listTheEvidenceTicketNumbersAndWriteTheActionTextAndTheAnswerText = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          tickets: {
            type: "array",
            items: {
              type: "string",
            },
          },
          actionTaken: {
            type: "string",
          },
          message: {
            type: "string",
          },
        },
        required: [
          "tickets",
          "actionTaken",
          "message",
        ],
      },
      input: {
        type: "object",
        properties: {
          evidenceTickets: {
            type: "string",
          },
          skillName: {
            type: "string",
          },
          skillId: {
            type: "string",
          },
          toVersion: {
            type: "integer",
          },
        },
      },
      code: "def val = { String n -> (binding.hasVariable(n) && binding.getVariable(n) != null) ? binding.getVariable(n).toString() : '' }\ndef tickets = []\nfor (s in val('evidenceTickets').split(',')) {\n  def tn = s.trim()\n  if (tn && !tickets.contains(tn)) { tickets << tn }\n}\nif (tickets.isEmpty()) { tickets << '__none__' }\ndef ver = val('toVersion').trim()\ntry { ver = new BigDecimal(ver).intValue().toString() } catch (Exception e) { }\ndef label = val('skillName').trim() ? val('skillName').trim() : val('skillId').trim()\nresult = [tickets: tickets, actionTaken: 'Included in ' + label + ' v' + ver, message: 'Approved. ' + label + ' is now at v' + ver + '.']",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        evidenceTickets: fetchTheSuggestion.objects[0].properties.evidence_tickets,
        skillName: fetchTheSkillTheSuggestionIsFor.objects[0].properties.name,
        skillId: fetchTheSuggestion.objects[0].properties.skill,
        toVersion: fetchTheSuggestion.objects[0].properties.to_version,
      },
    });
    // Fetch the evidence tickets that exist
    const fetchTheEvidenceTicketsThatExist = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      triggerInputCondition: and(
        isIn("properties_ticket_no", listTheEvidenceTicketNumbersAndWriteTheActionTextAndTheAnswerText.result.tickets),
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
      fields: [
        "properties.ticket_no",
      ],
      includeTotalCount: false,
    });
    try {
      // Apply the approval as one unit: the skill, then the tickets, then the suggestion
      scope(op("scope", "scope_trigger_scope", {}), () => {
        // Set the skill's current version and prompt
        op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
          recordId: fetchTheSkillTheSuggestionIsFor.objects[0].id,
          writeThroughSessionVariables: false,
          object_type: "psl_skill",
          skipIfBlank: false,
          skipPermissionCheck: false,
          updateFields: [
            {
              fieldName: "properties.current_version",
              actionType: "SET",
              setValue: fetchTheSuggestion.objects[0].properties.to_version,
            },
            {
              fieldName: "properties.prompt",
              actionType: "SET",
              setValue: fetchTheSuggestion.objects[0].properties.proposed_prompt,
            },
          ],
          skipSchemaValidation: true,
          unsetIfNull: false,
        });
        // Loop over the evidence tickets
        for (const loopOverTheEvidenceTicket of each(fetchTheEvidenceTicketsThatExist.objects, {
          captureIterations: true,
        })) {
          // Mark the ticket resolved
          op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
            recordId: loopOverTheEvidenceTicket.id,
            writeThroughSessionVariables: false,
            object_type: "psl_feedback",
            skipIfBlank: false,
            skipPermissionCheck: false,
            updateFields: [
              {
                fieldName: "properties.status",
                actionType: "SET",
                setValue: "resolved",
              },
              {
                fieldName: "properties.action_taken",
                actionType: "SET",
                setValue: listTheEvidenceTicketNumbersAndWriteTheActionTextAndTheAnswerText.result.actionTaken,
              },
              {
                fieldName: "properties.reviewed_by",
                actionType: "SET",
                setValue: trimTheInputsAndPickTheNameThatIsWrittenAsTheApprover.result.actor,
              },
              {
                fieldName: "properties.resolved_at",
                actionType: "SET",
                setValue: RUN.currentTime,
              },
            ],
            skipSchemaValidation: true,
            unsetIfNull: false,
          });
        }
        // Mark the suggestion approved
        op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
          recordId: fetchTheSuggestion.objects[0].id,
          writeThroughSessionVariables: false,
          object_type: "psl_skill_suggestion",
          skipIfBlank: false,
          skipPermissionCheck: false,
          updateFields: [
            {
              fieldName: "properties.status",
              actionType: "SET",
              setValue: "approved",
            },
            {
              fieldName: "properties.approved_by",
              actionType: "SET",
              setValue: trimTheInputsAndPickTheNameThatIsWrittenAsTheApprover.result.actor,
            },
            {
              fieldName: "properties.approved_at",
              actionType: "SET",
              setValue: RUN.currentTime,
            },
          ],
          skipSchemaValidation: true,
          unsetIfNull: false,
        });
      });
    } catch {
      // Answer error: the suggestion stays pending when it was not marked approved
      return {
        status: "error",
        skill_id: fetchTheSuggestion.objects[0].properties.skill,
        to_version: fetchTheSuggestion.objects[0].properties.to_version,
        message: "The approval did not finish. Try again; the suggestion is approved only when every step has run.",
      };
    }
    // Answer approved
    return {
      status: "approved",
      skill_id: fetchTheSuggestion.objects[0].properties.skill,
      to_version: fetchTheSuggestion.objects[0].properties.to_version,
      message: listTheEvidenceTicketNumbersAndWriteTheActionTextAndTheAnswerText.result.message,
    };
  },
);
