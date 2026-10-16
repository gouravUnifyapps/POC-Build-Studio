import { automation, callable, op, ENV, RUN, TRIGGER, and, eq, exists, missing } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Approve gate",
    description: "Records the manager's or the owner's approval of a POC's open gate. Called by the app's Approve button (role manager) and by the Slack listener (role owner). When both approvals are in, the gate passes and the POC moves to the next phase; then it tells the owner in Slack and, for the Plan gate of a POC with a build run, starts the build.",
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
          gate_passed: {
            type: "boolean",
            title: "Gate passed",
          },
          warnings: {
            type: "array",
            items: {
              type: "string",
            },
            title: "Warnings",
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
          poc_id: {
            type: "string",
            title: "POC id",
          },
          role: {
            type: "string",
            title: "Role (manager or owner)",
          },
          caller_email: {
            type: "string",
            title: "Caller email",
          },
          caller_name: {
            type: "string",
            title: "Caller name",
          },
          caller_slack_id: {
            type: "string",
            title: "Caller Slack id",
          },
        },
        required: [],
      },
    }),
  },
  (t) => {
    let callable;
    let openTheDirectConversationWithTheOwner;
    let postTheMessageToTheOwner;

    // Normalize and validate the inputs
    const normalizeAndValidateTheInputs = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          valid: {
            type: "string",
            title: "Valid",
          },
          error: {
            type: "string",
            title: "Error",
          },
          pocId: {
            type: "string",
            title: "POC id",
          },
          role: {
            type: "string",
            title: "Role",
          },
          callerEmail: {
            type: "string",
            title: "Caller email",
          },
          callerName: {
            type: "string",
            title: "Caller name",
          },
          callerSlackId: {
            type: "string",
            title: "Caller Slack id",
          },
        },
      },
      input: {
        type: "object",
        properties: {
          pocIdIn: {
            type: "string",
            title: "POC id",
          },
          roleIn: {
            type: "string",
            title: "Role",
          },
          callerEmailIn: {
            type: "string",
            title: "Caller email",
          },
          callerNameIn: {
            type: "string",
            title: "Caller name",
          },
          callerSlackIdIn: {
            type: "string",
            title: "Caller Slack id",
          },
        },
      },
      code: "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }\ndef txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }\ndef slackId = txt('callerSlackIdIn')\nif (slackId.startsWith('<@') && slackId.endsWith('>')) {\n  slackId = slackId.substring(2, slackId.length() - 1)\n  def p = slackId.indexOf('|')\n  if (p >= 0) { slackId = slackId.substring(0, p) }\n}\nslackId = slackId.trim().toUpperCase()\ndef role = txt('roleIn').toLowerCase()\ndef pocId = txt('pocIdIn')\ndef errors = []\nif (!pocId) { errors << 'poc_id is required' }\nif (role != 'manager' && role != 'owner') { errors << 'role must be manager or owner' }\nresult = [valid: (errors ? 'no' : 'yes'), error: errors.join('; '), pocId: pocId, role: role, callerEmail: txt('callerEmailIn'), callerName: txt('callerNameIn'), callerSlackId: slackId]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        pocIdIn: t.poc_id,
        roleIn: t.role,
        callerEmailIn: t.caller_email,
        callerNameIn: t.caller_name,
        callerSlackIdIn: t.caller_slack_id,
      },
    });
    // Answer error when the input is invalid
    if (and(
      eq(normalizeAndValidateTheInputs.result.valid, "no"),
    )) {
      // Callable
      return {
        status: "error",
        gate_passed: false,
        warnings: [],
        message: normalizeAndValidateTheInputs.result.error,
      };
    }
    // Read the POC row
    const readThePocRow = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      triggerInputCondition: and(
        eq("properties_poc_id", normalizeAndValidateTheInputs.result.pocId),
      ),
      shouldSearchInAnalyticsStore: false,
      object_type: "psl_poc",
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
    // Answer error when the row does not exist
    if (and(
      missing(readThePocRow.objects[0].id),
    )) {
      // Callable
      return {
        status: "error",
        gate_passed: false,
        warnings: [],
        message: `No POC has the id ${normalizeAndValidateTheInputs.result.pocId}. Nothing was changed.`,
      };
    }
    // Check who is calling and work out the transition
    const checkWhoIsCallingAndWorkOutTheTransition = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          outcome: {
            type: "string",
            title: "Outcome",
          },
          message: {
            type: "string",
            title: "Message",
          },
          gate: {
            type: "string",
            title: "Gate",
          },
          passed: {
            type: "string",
            title: "Gate passed",
          },
          updates: {
            type: "array",
            title: "Field updates",
            items: {
              type: "object",
              properties: {
                fieldName: {
                  type: "string",
                  title: "Field name",
                },
                value: {
                  type: "string",
                  title: "Value",
                },
              },
            },
          },
          lastActivity: {
            type: "string",
            title: "Last activity",
          },
          activityId: {
            type: "string",
            title: "Activity id",
          },
          activityType: {
            type: "string",
            title: "Activity type",
          },
          activityStage: {
            type: "string",
            title: "Activity stage",
          },
          actorName: {
            type: "string",
            title: "Actor name",
          },
          actorEmail: {
            type: "string",
            title: "Actor email",
          },
          postedTo: {
            type: "string",
            title: "Posted to",
          },
          sendDm: {
            type: "string",
            title: "Send direct message",
          },
          dmSkipped: {
            type: "string",
            title: "Direct message skipped",
          },
          ownerSlackId: {
            type: "string",
            title: "Owner Slack id",
          },
          startBuild: {
            type: "string",
            title: "Start build",
          },
          appLink: {
            type: "string",
            title: "App link",
          },
        },
      },
      input: {
        type: "object",
        properties: {
          pocIdIn: {
            type: "string",
            title: "POC id",
          },
          roleIn: {
            type: "string",
            title: "Role",
          },
          callerEmailIn: {
            type: "string",
            title: "Caller email",
          },
          callerNameIn: {
            type: "string",
            title: "Caller name",
          },
          callerSlackIdIn: {
            type: "string",
            title: "Caller Slack id",
          },
          currentGateIn: {
            type: "string",
            title: "Current gate",
          },
          stageIn: {
            type: "string",
            title: "Stage",
          },
          ownerNameIn: {
            type: "string",
            title: "Owner name",
          },
          ownerEmailIn: {
            type: "string",
            title: "Owner email",
          },
          ownerSlackIdIn: {
            type: "string",
            title: "Owner Slack id",
          },
          managerNameIn: {
            type: "string",
            title: "Manager name",
          },
          managerEmailIn: {
            type: "string",
            title: "Manager email",
          },
          slackChannelIn: {
            type: "string",
            title: "Slack channel",
          },
          gateSummaryIn: {
            type: "string",
            title: "Gate summary",
          },
          buildRunIdIn: {
            type: "string",
            title: "Build run id",
          },
          g1_owner_approved: {
            type: "boolean",
            title: "G1 owner approved",
          },
          g1_manager_approved: {
            type: "boolean",
            title: "G1 manager approved",
          },
          g2_owner_approved: {
            type: "boolean",
            title: "G2 owner approved",
          },
          g2_manager_approved: {
            type: "boolean",
            title: "G2 manager approved",
          },
          g3_owner_approved: {
            type: "boolean",
            title: "G3 owner approved",
          },
          g3_manager_approved: {
            type: "boolean",
            title: "G3 manager approved",
          },
          nowMsIn: {
            type: "integer",
            title: "Now (epoch ms)",
          },
          appUrlIn: {
            type: "string",
            title: "App URL",
          },
        },
      },
      code: "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }\ndef txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }\ndef isTrue = { String n -> val(n) != null && val(n).toString() == 'true' }\ndef same = { String a, String b -> a && b && a.equalsIgnoreCase(b) }\ndef role = txt('roleIn')\ndef pocId = txt('pocIdIn')\ndef gate = txt('currentGateIn')\ndef callerEmail = txt('callerEmailIn')\ndef callerName = txt('callerNameIn')\ndef callerSlackId = txt('callerSlackIdIn')\ndef ownerName = txt('ownerNameIn')\ndef ownerEmail = txt('ownerEmailIn')\ndef ownerSlackId = txt('ownerSlackIdIn')\ndef managerName = txt('managerNameIn')\ndef managerEmail = txt('managerEmailIn')\ndef allowed = role == 'manager' ? (same(callerEmail, managerEmail) || same(callerName, managerName)) : same(callerSlackId, ownerSlackId)\ndef labels = [g1: 'Understand', g2: 'Plan', g3: 'Build']\ndef nexts = [g1: 'Plan', g2: 'Build', g3: 'Deliver']\ndef stages = [g1: '3_scope', g2: '5_build', g3: '7_collaterals']\ndef open = labels.containsKey(gate)\ndef outcome = 'decided'\ndef message = ''\nif (!allowed) {\n  outcome = 'forbidden'\n  message = role == 'manager' ? 'Only the manager of this POC can approve as manager. The approval was not recorded.' : 'Only the owner of this POC can approve as owner. The approval was not recorded.'\n} else if (!open) {\n  outcome = 'already'\n  message = 'No gate is open for approval on this POC.'\n} else if (isTrue(gate + '_' + role + '_approved')) {\n  outcome = 'already'\n  message = 'The ' + role + ' has already approved ' + labels[gate] + '.'\n}\nlong nowMs = val('nowMsIn') == null ? 0L : (val('nowMsIn') as long)\nif (nowMs <= 0L) { nowMs = System.currentTimeMillis() }\ndef appUrl = txt('appUrlIn')\nwhile (appUrl.endsWith('/')) { appUrl = appUrl.substring(0, appUrl.length() - 1) }\ndef appLink = appUrl ? (appUrl + '/pocs/' + pocId) : ''\ndef passed = false\ndef updates = []\ndef lastActivity = ''\ndef activityType = ''\ndef actorName = ''\ndef actorEmail = ''\nif (outcome == 'decided') {\n  def other = role == 'manager' ? 'owner' : 'manager'\n  passed = isTrue(gate + '_' + other + '_approved')\n  def who = role == 'manager' ? (callerName ?: managerName ?: callerEmail ?: 'The manager') : (callerName ?: ownerName ?: 'The owner')\n  actorName = who\n  actorEmail = role == 'manager' ? (callerEmail ?: managerEmail) : ownerEmail\n  updates << [fieldName: 'properties.' + gate + '_' + role + '_approved', value: 'true']\n  if (passed) {\n    updates << [fieldName: 'properties.' + gate + '_status', value: 'approved']\n    updates << [fieldName: 'properties.current_gate', value: 'none']\n    updates << [fieldName: 'properties.stage', value: stages[gate]]\n    updates << [fieldName: 'properties.status', value: 'running']\n    if (txt('gateSummaryIn')) { updates << [fieldName: 'properties.' + gate + '_summary', value: txt('gateSummaryIn')] }\n    lastActivity = who + ' approved ' + labels[gate] + ' · ' + nexts[gate] + ' starts'\n    activityType = 'gate_decided'\n  } else if (role == 'manager') {\n    lastActivity = who + ' approved ' + labels[gate] + ' · waiting on ' + (ownerName ?: 'the owner') + ' in Slack'\n    activityType = 'manager_approved'\n  } else {\n    lastActivity = who + ' approved ' + labels[gate] + ' · waiting on ' + (managerName ?: 'the manager')\n    activityType = 'owner_approved'\n  }\n  message = lastActivity\n}\ndef decided = outcome == 'decided'\ndef sendDm = decided && role == 'manager' && ownerSlackId\ndef dmSkipped = decided && role == 'manager' && !ownerSlackId\ndef startBuild = decided && passed && gate == 'g2' && txt('buildRunIdIn')\nresult = [outcome: outcome, message: message, gate: (open ? gate : ''), passed: (passed ? 'yes' : 'no'), updates: updates, lastActivity: lastActivity, activityId: 'ACT-' + nowMs + '-' + (role == 'manager' ? '1' : '2'), activityType: activityType, activityStage: txt('stageIn'), actorName: actorName, actorEmail: actorEmail, postedTo: txt('slackChannelIn'), sendDm: (sendDm ? 'yes' : 'no'), dmSkipped: (dmSkipped ? 'yes' : 'no'), ownerSlackId: ownerSlackId, startBuild: (startBuild ? 'yes' : 'no'), appLink: appLink]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        pocIdIn: normalizeAndValidateTheInputs.result.pocId,
        roleIn: normalizeAndValidateTheInputs.result.role,
        callerEmailIn: normalizeAndValidateTheInputs.result.callerEmail,
        callerNameIn: normalizeAndValidateTheInputs.result.callerName,
        callerSlackIdIn: normalizeAndValidateTheInputs.result.callerSlackId,
        currentGateIn: readThePocRow.objects[0].properties.current_gate,
        stageIn: readThePocRow.objects[0].properties.stage,
        ownerNameIn: readThePocRow.objects[0].properties.owner_name,
        ownerEmailIn: readThePocRow.objects[0].properties.owner_email,
        ownerSlackIdIn: readThePocRow.objects[0].properties.owner_slack_id,
        managerNameIn: readThePocRow.objects[0].properties.manager_name,
        managerEmailIn: readThePocRow.objects[0].properties.manager_email,
        slackChannelIn: readThePocRow.objects[0].properties.slack_channel,
        gateSummaryIn: readThePocRow.objects[0].properties.gate_summary,
        buildRunIdIn: readThePocRow.objects[0].properties.build_run_id,
        g1_owner_approved: readThePocRow.objects[0].properties.g1_owner_approved,
        g1_manager_approved: readThePocRow.objects[0].properties.g1_manager_approved,
        g2_owner_approved: readThePocRow.objects[0].properties.g2_owner_approved,
        g2_manager_approved: readThePocRow.objects[0].properties.g2_manager_approved,
        g3_owner_approved: readThePocRow.objects[0].properties.g3_owner_approved,
        g3_manager_approved: readThePocRow.objects[0].properties.g3_manager_approved,
        nowMsIn: RUN.currentTime,
        appUrlIn: ENV.POC_STUDIO_APP_URL,
      },
    });
    // Answer forbidden when the caller is not that role of the POC
    if (and(
      eq(checkWhoIsCallingAndWorkOutTheTransition.result.outcome, "forbidden"),
    )) {
      // Callable
      return {
        status: "forbidden",
        gate_passed: false,
        warnings: [],
        message: checkWhoIsCallingAndWorkOutTheTransition.result.message,
      };
    }
    // Answer already_decided when no gate is open or this role has approved
    if (and(
      eq(checkWhoIsCallingAndWorkOutTheTransition.result.outcome, "already"),
    )) {
      // Callable
      return {
        status: "already_decided",
        gate_passed: false,
        warnings: [],
        message: checkWhoIsCallingAndWorkOutTheTransition.result.message,
      };
    }
    // Record the approval and any gate transition on the row
    op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
      recordId: readThePocRow.objects[0].id,
      writeThroughSessionVariables: false,
      object_type: "psl_poc",
      skipIfBlank: false,
      skipPermissionCheck: false,
      updateFields: checkWhoIsCallingAndWorkOutTheTransition.result.updates.map((v) => ({
        fieldName: v.fieldName,
        actionType: "SET",
        setValue: v.value,
      })),
      skipSchemaValidation: true,
      unsetIfNull: false,
    });
    // Stamp last_activity and last_activity_at
    op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
      recordId: readThePocRow.objects[0].id,
      writeThroughSessionVariables: false,
      object_type: "psl_poc",
      skipIfBlank: false,
      skipPermissionCheck: false,
      updateFields: [
        {
          fieldName: "properties.last_activity",
          actionType: "SET",
          setValue: checkWhoIsCallingAndWorkOutTheTransition.result.lastActivity,
        },
        {
          fieldName: "properties.last_activity_at",
          actionType: "SET",
          setValue: RUN.currentTime,
        },
      ],
      skipSchemaValidation: true,
      unsetIfNull: false,
    });
    // Did the gate pass?
    if (and(
      eq(checkWhoIsCallingAndWorkOutTheTransition.result.passed, "yes"),
    )) {
      // Approve the documents that were in review for this gate
      op("storage_by_unifyapps", "storage_by_unifyapps_update_records", {
        numberOfRecordsToUpdate: "MULTIPLE",
        triggerInputCondition: and(
          eq("properties_poc", normalizeAndValidateTheInputs.result.pocId),
          eq("properties_gate_pack", checkWhoIsCallingAndWorkOutTheTransition.result.gate),
          eq("properties_status", "in_review"),
        ),
        object_type: "psl_document",
        skipIfBlank: false,
        skipVersionCapture: false,
        updateFields: [
          {
            fieldName: "properties.status",
            actionType: "SET",
            setValue: "approved",
          },
        ],
        page: {
          offset: 0,
          limit: 500,
        },
        skipSchemaValidation: true,
        unsetIfNull: false,
      });
    }
    // Log the approval as an activity row
    const logTheApprovalAsAnActivityRow = op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
      useRawPayload: false,
      writeThroughSessionVariables: false,
      object_type: "psl_activity",
      skipIfBlank: true,
      inlineRefresh: false,
      record: {
        activity_id: checkWhoIsCallingAndWorkOutTheTransition.result.activityId,
        poc: normalizeAndValidateTheInputs.result.pocId,
        type: checkWhoIsCallingAndWorkOutTheTransition.result.activityType,
        stage: checkWhoIsCallingAndWorkOutTheTransition.result.activityStage,
        gate: checkWhoIsCallingAndWorkOutTheTransition.result.gate,
        decision: "approve",
        actor_type: "person",
        actor_name: checkWhoIsCallingAndWorkOutTheTransition.result.actorName,
        actor_email: checkWhoIsCallingAndWorkOutTheTransition.result.actorEmail,
        message: checkWhoIsCallingAndWorkOutTheTransition.result.lastActivity,
        posted_to: checkWhoIsCallingAndWorkOutTheTransition.result.postedTo,
        created_at: RUN.currentTime,
      },
      useUuid: false,
      batching: false,
    }, { onError: "CONTINUE" });
    // Start the build run when the Plan gate passed on a POC with a build run
    if (and(
      eq(checkWhoIsCallingAndWorkOutTheTransition.result.startBuild, "yes"),
    )) {
      // Callable
      callable = op("callables", "callables_call_automation", {
        automationId: "6ad1c66313ea2c28e645e538",
        synchronous: true,
        version: "-1",
        parameters: {
          poc_id: normalizeAndValidateTheInputs.result.pocId,
          mode: "build",
          approved_prd_link: checkWhoIsCallingAndWorkOutTheTransition.result.appLink,
        },
        executeOnSameVM: false,
      }, { onError: "CONTINUE" });
    }
    // Compose the direct message text
    const composeTheDirectMessageText = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          text: {
            type: "string",
            title: "Text",
          },
          sessionLink: {
            type: "string",
            title: "Session link",
          },
          startWarning: {
            type: "string",
            title: "Start build warning",
          },
        },
      },
      input: {
        type: "object",
        properties: {
          appLinkIn: {
            type: "string",
            title: "App link",
          },
          startRanIn: {
            type: "string",
            title: "Start build ran",
          },
          startStatusIn: {
            type: "string",
            title: "Start build status",
          },
          startRunIn: {
            type: "string",
            title: "Start build run id",
          },
          startMessageIn: {
            type: "string",
            title: "Start build message",
          },
        },
      },
      code: "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }\ndef txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }\ndef nl = String.valueOf((char) 10)\ndef appLink = txt('appLinkIn')\ndef ran = txt('startRanIn') == 'yes'\ndef st = txt('startStatusIn')\ndef sessionLink = (ran && st == 'started') ? txt('startRunIn') : ''\ndef text = 'Manager approved, continue'\nif (appLink) { text = text + nl + appLink }\nif (sessionLink) { text = text + nl + 'New build session: ' + sessionLink }\ndef startWarning = ''\nif (ran && st != 'started') { startWarning = 'Start build did not start a run (' + (st ?: 'no answer') + '): ' + (txt('startMessageIn') ?: 'no message') }\nresult = [text: text, sessionLink: sessionLink, startWarning: startWarning]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        appLinkIn: checkWhoIsCallingAndWorkOutTheTransition.result.appLink,
        startRanIn: checkWhoIsCallingAndWorkOutTheTransition.result.startBuild,
        startStatusIn: callable.status,
        startRunIn: callable.build_run_id,
        startMessageIn: callable.message,
      },
    });
    // Tell the owner in Slack when the manager approved
    if (and(
      eq(checkWhoIsCallingAndWorkOutTheTransition.result.sendDm, "yes"),
    )) {
      // Open the direct conversation with the owner
      openTheDirectConversationWithTheOwner = op("slack", "slack_open_conversation", {
        return_im: false,
        prevent_creation: false,
        token_type: "bot_token",
        users: [
          checkWhoIsCallingAndWorkOutTheTransition.result.ownerSlackId,
        ],
      }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
      // Was the conversation opened?
      if (and(
        exists(openTheDirectConversationWithTheOwner.channel.id),
      )) {
        // Post the message to the owner
        postTheMessageToTheOwner = op("slack", "slack_post_message_in_channel", {
          link_names: true,
          messageType: "text",
          channel: openTheDirectConversationWithTheOwner.channel.id,
          text: composeTheDirectMessageText.result.text,
          token_type: "bot_token",
          mrkdwn: true,
        }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
      }
    }
    // Collect the warnings and the final message
    const collectTheWarningsAndTheFinalMessage = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          warnings: {
            type: "array",
            title: "Warnings",
            items: {
              type: "string",
            },
          },
          hasWarnings: {
            type: "string",
            title: "Has warnings",
          },
          message: {
            type: "string",
            title: "Message",
          },
        },
      },
      input: {
        type: "object",
        properties: {
          dmSkippedIn: {
            type: "string",
            title: "Direct message skipped",
          },
          sendDmIn: {
            type: "string",
            title: "Send direct message",
          },
          dmOk: {
            type: "boolean",
            title: "Conversation opened",
          },
          dmError: {
            type: "string",
            title: "Open error",
          },
          postOk: {
            type: "boolean",
            title: "Message posted",
          },
          startWarningIn: {
            type: "string",
            title: "Start build warning",
          },
          activityIdIn: {
            type: "string",
            title: "Activity row id",
          },
          baseMessageIn: {
            type: "string",
            title: "Message",
          },
          sessionLinkIn: {
            type: "string",
            title: "Session link",
          },
        },
      },
      code: "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }\ndef txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }\ndef isTrue = { String n -> val(n) != null && val(n).toString() == 'true' }\ndef warnings = []\nif (txt('dmSkippedIn') == 'yes') { warnings << 'The owner has no Slack id on the row, so the direct message was not sent' }\nif (txt('sendDmIn') == 'yes') {\n  if (!isTrue('dmOk')) {\n    warnings << ('The direct message to the owner was not sent: Slack could not open the conversation' + (txt('dmError') ? ' (' + txt('dmError') + ')' : ''))\n  } else if (!isTrue('postOk')) {\n    warnings << 'The direct message to the owner was not sent: Slack refused the post'\n  }\n}\nif (txt('startWarningIn')) { warnings << txt('startWarningIn') }\nif (!txt('activityIdIn')) { warnings << 'The activity row was not saved' }\ndef message = txt('baseMessageIn')\nif (txt('sessionLinkIn')) { message = message + ' Build session: ' + txt('sessionLinkIn') }\nresult = [warnings: warnings, hasWarnings: (warnings ? 'yes' : 'no'), message: message]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        dmSkippedIn: checkWhoIsCallingAndWorkOutTheTransition.result.dmSkipped,
        sendDmIn: checkWhoIsCallingAndWorkOutTheTransition.result.sendDm,
        dmOk: openTheDirectConversationWithTheOwner.ok,
        dmError: openTheDirectConversationWithTheOwner.error,
        postOk: postTheMessageToTheOwner.ok,
        startWarningIn: composeTheDirectMessageText.result.startWarning,
        activityIdIn: logTheApprovalAsAnActivityRow.id,
        baseMessageIn: checkWhoIsCallingAndWorkOutTheTransition.result.message,
        sessionLinkIn: composeTheDirectMessageText.result.sessionLink,
      },
    });
    // Did the gate pass?
    if (and(
      eq(checkWhoIsCallingAndWorkOutTheTransition.result.passed, "yes"),
    )) {
      // Are there warnings?
      if (and(
        eq(collectTheWarningsAndTheFinalMessage.result.hasWarnings, "yes"),
      )) {
        // Answer decided, gate passed, with warnings
        return {
          status: "decided",
          gate_passed: true,
          warnings: collectTheWarningsAndTheFinalMessage.result.warnings.map((v) => v),
          message: collectTheWarningsAndTheFinalMessage.result.message,
        };
      }
      // Answer decided, gate passed
      return {
        status: "decided",
        gate_passed: true,
        warnings: [],
        message: collectTheWarningsAndTheFinalMessage.result.message,
      };
    }
    // Are there warnings?
    if (and(
      eq(collectTheWarningsAndTheFinalMessage.result.hasWarnings, "yes"),
    )) {
      // Answer decided, still waiting on the other approval, with warnings
      return {
        status: "decided",
        gate_passed: false,
        warnings: collectTheWarningsAndTheFinalMessage.result.warnings.map((v) => v),
        message: collectTheWarningsAndTheFinalMessage.result.message,
      };
    }
    // Answer decided, still waiting on the other approval
    return {
      status: "decided",
      gate_passed: false,
      warnings: [],
      message: collectTheWarningsAndTheFinalMessage.result.message,
    };
  },
);
