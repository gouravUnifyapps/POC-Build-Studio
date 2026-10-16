import { automation, callable, op, and, eq, exists, missing, ENV, RUN } from "@ua/automations";

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
    let started;
    let dm;
    let post;

    // Normalize and validate the inputs
    const prepared = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: {
          pocIdIn: { type: "string", title: "POC id" },
          roleIn: { type: "string", title: "Role" },
          callerEmailIn: { type: "string", title: "Caller email" },
          callerNameIn: { type: "string", title: "Caller name" },
          callerSlackIdIn: { type: "string", title: "Caller Slack id" },
        },
      },
      output: {
        type: "object",
        properties: {
          valid: { type: "string", title: "Valid" },
          error: { type: "string", title: "Error" },
          pocId: { type: "string", title: "POC id" },
          role: { type: "string", title: "Role" },
          callerEmail: { type: "string", title: "Caller email" },
          callerName: { type: "string", title: "Caller name" },
          callerSlackId: { type: "string", title: "Caller Slack id" },
        },
      },
      parameters: {
        pocIdIn: t.poc_id,
        roleIn: t.role,
        callerEmailIn: t.caller_email,
        callerNameIn: t.caller_name,
        callerSlackIdIn: t.caller_slack_id,
      },
      code: [
        "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }",
        "def txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }",
        "def slackId = txt('callerSlackIdIn')",
        "if (slackId.startsWith('<@') && slackId.endsWith('>')) {",
        "  slackId = slackId.substring(2, slackId.length() - 1)",
        "  def p = slackId.indexOf('|')",
        "  if (p >= 0) { slackId = slackId.substring(0, p) }",
        "}",
        "slackId = slackId.trim().toUpperCase()",
        "def role = txt('roleIn').toLowerCase()",
        "def pocId = txt('pocIdIn')",
        "def errors = []",
        "if (!pocId) { errors << 'poc_id is required' }",
        "if (role != 'manager' && role != 'owner') { errors << 'role must be manager or owner' }",
        "result = [valid: (errors ? 'no' : 'yes'), error: errors.join('; '), pocId: pocId, role: role, callerEmail: txt('callerEmailIn'), callerName: txt('callerNameIn'), callerSlackId: slackId]",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Answer error when the input is invalid
    if (eq(prepared.result.valid, "no")) {
      return { status: "error", gate_passed: false, warnings: [], message: prepared.result.error };
    }

    // Read the POC row
    const row = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      object_type: "psl_poc",
      numberOfRecordsToFetch: "MULTIPLE",
      triggerInputCondition: and(eq("properties_poc_id", prepared.result.pocId)),
      page: { paginateBy: "OFFSET", limit: 1, offset: 0 },
    });

    // Answer error when the row does not exist
    if (missing(row.objects[0].id)) {
      return { status: "error", gate_passed: false, warnings: [], message: `No POC has the id ${prepared.result.pocId}. Nothing was changed.` };
    }

    // Check who is calling and work out the transition
    const decision = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: {
          pocIdIn: { type: "string", title: "POC id" },
          roleIn: { type: "string", title: "Role" },
          callerEmailIn: { type: "string", title: "Caller email" },
          callerNameIn: { type: "string", title: "Caller name" },
          callerSlackIdIn: { type: "string", title: "Caller Slack id" },
          currentGateIn: { type: "string", title: "Current gate" },
          stageIn: { type: "string", title: "Stage" },
          ownerNameIn: { type: "string", title: "Owner name" },
          ownerEmailIn: { type: "string", title: "Owner email" },
          ownerSlackIdIn: { type: "string", title: "Owner Slack id" },
          managerNameIn: { type: "string", title: "Manager name" },
          managerEmailIn: { type: "string", title: "Manager email" },
          slackChannelIn: { type: "string", title: "Slack channel" },
          gateSummaryIn: { type: "string", title: "Gate summary" },
          buildRunIdIn: { type: "string", title: "Build run id" },
          g1_owner_approved: { type: "boolean", title: "G1 owner approved" },
          g1_manager_approved: { type: "boolean", title: "G1 manager approved" },
          g2_owner_approved: { type: "boolean", title: "G2 owner approved" },
          g2_manager_approved: { type: "boolean", title: "G2 manager approved" },
          g3_owner_approved: { type: "boolean", title: "G3 owner approved" },
          g3_manager_approved: { type: "boolean", title: "G3 manager approved" },
          nowMsIn: { type: "integer", title: "Now (epoch ms)" },
          appUrlIn: { type: "string", title: "App URL" },
        },
      },
      output: {
        type: "object",
        properties: {
          outcome: { type: "string", title: "Outcome" },
          message: { type: "string", title: "Message" },
          gate: { type: "string", title: "Gate" },
          passed: { type: "string", title: "Gate passed" },
          updates: {
            type: "array",
            title: "Field updates",
            items: {
              type: "object",
              properties: {
                fieldName: { type: "string", title: "Field name" },
                value: { type: "string", title: "Value" },
              },
            },
          },
          lastActivity: { type: "string", title: "Last activity" },
          activityId: { type: "string", title: "Activity id" },
          activityType: { type: "string", title: "Activity type" },
          activityStage: { type: "string", title: "Activity stage" },
          actorName: { type: "string", title: "Actor name" },
          actorEmail: { type: "string", title: "Actor email" },
          postedTo: { type: "string", title: "Posted to" },
          sendDm: { type: "string", title: "Send direct message" },
          dmSkipped: { type: "string", title: "Direct message skipped" },
          ownerSlackId: { type: "string", title: "Owner Slack id" },
          startBuild: { type: "string", title: "Start build" },
          appLink: { type: "string", title: "App link" },
        },
      },
      parameters: {
        pocIdIn: prepared.result.pocId,
        roleIn: prepared.result.role,
        callerEmailIn: prepared.result.callerEmail,
        callerNameIn: prepared.result.callerName,
        callerSlackIdIn: prepared.result.callerSlackId,
        currentGateIn: row.objects[0].properties.current_gate,
        stageIn: row.objects[0].properties.stage,
        ownerNameIn: row.objects[0].properties.owner_name,
        ownerEmailIn: row.objects[0].properties.owner_email,
        ownerSlackIdIn: row.objects[0].properties.owner_slack_id,
        managerNameIn: row.objects[0].properties.manager_name,
        managerEmailIn: row.objects[0].properties.manager_email,
        slackChannelIn: row.objects[0].properties.slack_channel,
        gateSummaryIn: row.objects[0].properties.gate_summary,
        buildRunIdIn: row.objects[0].properties.build_run_id,
        g1_owner_approved: row.objects[0].properties.g1_owner_approved,
        g1_manager_approved: row.objects[0].properties.g1_manager_approved,
        g2_owner_approved: row.objects[0].properties.g2_owner_approved,
        g2_manager_approved: row.objects[0].properties.g2_manager_approved,
        g3_owner_approved: row.objects[0].properties.g3_owner_approved,
        g3_manager_approved: row.objects[0].properties.g3_manager_approved,
        nowMsIn: RUN.currentTime,
        appUrlIn: ENV.POC_STUDIO_APP_URL,
      },
      code: [
        "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }",
        "def txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }",
        "def isTrue = { String n -> val(n) != null && val(n).toString() == 'true' }",
        "def same = { String a, String b -> a && b && a.equalsIgnoreCase(b) }",
        "def role = txt('roleIn')",
        "def pocId = txt('pocIdIn')",
        "def gate = txt('currentGateIn')",
        "def callerEmail = txt('callerEmailIn')",
        "def callerName = txt('callerNameIn')",
        "def callerSlackId = txt('callerSlackIdIn')",
        "def ownerName = txt('ownerNameIn')",
        "def ownerEmail = txt('ownerEmailIn')",
        "def ownerSlackId = txt('ownerSlackIdIn')",
        "def managerName = txt('managerNameIn')",
        "def managerEmail = txt('managerEmailIn')",
        "def allowed = role == 'manager' ? (same(callerEmail, managerEmail) || same(callerName, managerName)) : same(callerSlackId, ownerSlackId)",
        "def labels = [g1: 'Understand', g2: 'Plan', g3: 'Build']",
        "def nexts = [g1: 'Plan', g2: 'Build', g3: 'Deliver']",
        "def stages = [g1: '3_scope', g2: '5_build', g3: '7_collaterals']",
        "def open = labels.containsKey(gate)",
        "def outcome = 'decided'",
        "def message = ''",
        "if (!allowed) {",
        "  outcome = 'forbidden'",
        "  message = role == 'manager' ? 'Only the manager of this POC can approve as manager. The approval was not recorded.' : 'Only the owner of this POC can approve as owner. The approval was not recorded.'",
        "} else if (!open) {",
        "  outcome = 'already'",
        "  message = 'No gate is open for approval on this POC.'",
        "} else if (isTrue(gate + '_' + role + '_approved')) {",
        "  outcome = 'already'",
        "  message = 'The ' + role + ' has already approved ' + labels[gate] + '.'",
        "}",
        "long nowMs = val('nowMsIn') == null ? 0L : (val('nowMsIn') as long)",
        "if (nowMs <= 0L) { nowMs = System.currentTimeMillis() }",
        "def appUrl = txt('appUrlIn')",
        "while (appUrl.endsWith('/')) { appUrl = appUrl.substring(0, appUrl.length() - 1) }",
        "def appLink = appUrl ? (appUrl + '/pocs/' + pocId) : ''",
        "def passed = false",
        "def updates = []",
        "def lastActivity = ''",
        "def activityType = ''",
        "def actorName = ''",
        "def actorEmail = ''",
        "if (outcome == 'decided') {",
        "  def other = role == 'manager' ? 'owner' : 'manager'",
        "  passed = isTrue(gate + '_' + other + '_approved')",
        "  def who = role == 'manager' ? (callerName ?: managerName ?: callerEmail ?: 'The manager') : (callerName ?: ownerName ?: 'The owner')",
        "  actorName = who",
        "  actorEmail = role == 'manager' ? (callerEmail ?: managerEmail) : ownerEmail",
        "  updates << [fieldName: 'properties.' + gate + '_' + role + '_approved', value: 'true']",
        "  if (passed) {",
        "    updates << [fieldName: 'properties.' + gate + '_status', value: 'approved']",
        "    updates << [fieldName: 'properties.current_gate', value: 'none']",
        "    updates << [fieldName: 'properties.stage', value: stages[gate]]",
        "    updates << [fieldName: 'properties.status', value: 'running']",
        "    if (txt('gateSummaryIn')) { updates << [fieldName: 'properties.' + gate + '_summary', value: txt('gateSummaryIn')] }",
        "    lastActivity = who + ' approved ' + labels[gate] + ' · ' + nexts[gate] + ' starts'",
        "    activityType = 'gate_decided'",
        "  } else if (role == 'manager') {",
        "    lastActivity = who + ' approved ' + labels[gate] + ' · waiting on ' + (ownerName ?: 'the owner') + ' in Slack'",
        "    activityType = 'manager_approved'",
        "  } else {",
        "    lastActivity = who + ' approved ' + labels[gate] + ' · waiting on ' + (managerName ?: 'the manager')",
        "    activityType = 'owner_approved'",
        "  }",
        "  message = lastActivity",
        "}",
        "def decided = outcome == 'decided'",
        "def sendDm = decided && role == 'manager' && ownerSlackId",
        "def dmSkipped = decided && role == 'manager' && !ownerSlackId",
        "def startBuild = decided && passed && gate == 'g2' && txt('buildRunIdIn')",
        "result = [outcome: outcome, message: message, gate: (open ? gate : ''), passed: (passed ? 'yes' : 'no'), updates: updates, lastActivity: lastActivity, activityId: 'ACT-' + nowMs + '-' + (role == 'manager' ? '1' : '2'), activityType: activityType, activityStage: txt('stageIn'), actorName: actorName, actorEmail: actorEmail, postedTo: txt('slackChannelIn'), sendDm: (sendDm ? 'yes' : 'no'), dmSkipped: (dmSkipped ? 'yes' : 'no'), ownerSlackId: ownerSlackId, startBuild: (startBuild ? 'yes' : 'no'), appLink: appLink]",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Answer forbidden when the caller is not that role of the POC
    if (eq(decision.result.outcome, "forbidden")) {
      return { status: "forbidden", gate_passed: false, warnings: [], message: decision.result.message };
    }

    // Answer already_decided when no gate is open or this role has approved
    if (eq(decision.result.outcome, "already")) {
      return { status: "already_decided", gate_passed: false, warnings: [], message: decision.result.message };
    }

    // Record the approval and any gate transition on the row
    op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
      object_type: "psl_poc",
      recordId: row.objects[0].id,
      skipIfBlank: false,
      updateFields: decision.result.updates.map((u) => ({
        fieldName: u.fieldName,
        actionType: "SET",
        setValue: u.value,
      })),
    });

    // Stamp last_activity and last_activity_at
    op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
      object_type: "psl_poc",
      recordId: row.objects[0].id,
      skipIfBlank: false,
      updateFields: [
        { fieldName: "properties.last_activity", actionType: "SET", setValue: decision.result.lastActivity },
        { fieldName: "properties.last_activity_at", actionType: "SET", setValue: RUN.currentTime },
      ],
    });

    // Did the gate pass?
    if (eq(decision.result.passed, "yes")) {
      // Approve the documents that were in review for this gate
      op("storage_by_unifyapps", "storage_by_unifyapps_update_records", {
        object_type: "psl_document",
        numberOfRecordsToUpdate: "MULTIPLE",
        triggerInputCondition: and(
          eq("properties_poc", prepared.result.pocId),
          eq("properties_gate_pack", decision.result.gate),
          eq("properties_status", "in_review"),
        ),
        updateFields: [{ fieldName: "properties.status", actionType: "SET", setValue: "approved" }],
        page: { limit: 500, offset: 0 },
      });
    }

    // Log the approval as an activity row
    const activity = op(
      "storage_by_unifyapps",
      "storage_by_unifyapps_create_record",
      {
        object_type: "psl_activity",
        skipIfBlank: true,
        record: {
          activity_id: decision.result.activityId,
          poc: prepared.result.pocId,
          type: decision.result.activityType,
          stage: decision.result.activityStage,
          gate: decision.result.gate,
          decision: "approve",
          actor_type: "person",
          actor_name: decision.result.actorName,
          actor_email: decision.result.actorEmail,
          message: decision.result.lastActivity,
          posted_to: decision.result.postedTo,
          created_at: RUN.currentTime,
        },
      },
      { onError: "CONTINUE" },
    );

    // Start the build run when the Plan gate passed on a POC with a build run
    if (eq(decision.result.startBuild, "yes")) {
      started = op(
        "callables",
        "callables_call_automation",
        {
          automationId: "6ad1c66313ea2c28e645e538",
          version: "-1",
          synchronous: true,
          parameters: {
            poc_id: prepared.result.pocId,
            mode: "build",
            approved_prd_link: decision.result.appLink,
          },
        },
        { onError: "CONTINUE" },
      );
    }

    // Compose the direct message text
    const dmText = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: {
          appLinkIn: { type: "string", title: "App link" },
          startRanIn: { type: "string", title: "Start build ran" },
          startStatusIn: { type: "string", title: "Start build status" },
          startRunIn: { type: "string", title: "Start build run id" },
          startMessageIn: { type: "string", title: "Start build message" },
        },
      },
      output: {
        type: "object",
        properties: {
          text: { type: "string", title: "Text" },
          sessionLink: { type: "string", title: "Session link" },
          startWarning: { type: "string", title: "Start build warning" },
        },
      },
      parameters: {
        appLinkIn: decision.result.appLink,
        startRanIn: decision.result.startBuild,
        startStatusIn: started.status,
        startRunIn: started.build_run_id,
        startMessageIn: started.message,
      },
      code: [
        "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }",
        "def txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }",
        "def nl = String.valueOf((char) 10)",
        "def appLink = txt('appLinkIn')",
        "def ran = txt('startRanIn') == 'yes'",
        "def st = txt('startStatusIn')",
        "def sessionLink = (ran && st == 'started') ? txt('startRunIn') : ''",
        "def text = 'Manager approved, continue'",
        "if (appLink) { text = text + nl + appLink }",
        "if (sessionLink) { text = text + nl + 'New build session: ' + sessionLink }",
        "def startWarning = ''",
        "if (ran && st != 'started') { startWarning = 'Start build did not start a run (' + (st ?: 'no answer') + '): ' + (txt('startMessageIn') ?: 'no message') }",
        "result = [text: text, sessionLink: sessionLink, startWarning: startWarning]",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Tell the owner in Slack when the manager approved
    if (eq(decision.result.sendDm, "yes")) {
      // Open the direct conversation with the owner
      dm = op(
        "slack",
        "slack_open_conversation",
        { users: [decision.result.ownerSlackId] },
        { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" },
      );

      // Was the conversation opened?
      if (exists(dm.channel.id)) {
        // Post the message to the owner
        post = op(
          "slack",
          "slack_post_message_in_channel",
          { channel: dm.channel.id, messageType: "text", text: dmText.result.text },
          { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" },
        );
      }
    }

    // Collect the warnings and the final message
    const summary = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: {
          dmSkippedIn: { type: "string", title: "Direct message skipped" },
          sendDmIn: { type: "string", title: "Send direct message" },
          dmOk: { type: "boolean", title: "Conversation opened" },
          dmError: { type: "string", title: "Open error" },
          postOk: { type: "boolean", title: "Message posted" },
          startWarningIn: { type: "string", title: "Start build warning" },
          activityIdIn: { type: "string", title: "Activity row id" },
          baseMessageIn: { type: "string", title: "Message" },
          sessionLinkIn: { type: "string", title: "Session link" },
        },
      },
      output: {
        type: "object",
        properties: {
          warnings: { type: "array", title: "Warnings", items: { type: "string" } },
          hasWarnings: { type: "string", title: "Has warnings" },
          message: { type: "string", title: "Message" },
        },
      },
      parameters: {
        dmSkippedIn: decision.result.dmSkipped,
        sendDmIn: decision.result.sendDm,
        dmOk: dm.ok,
        dmError: dm.error,
        postOk: post.ok,
        startWarningIn: dmText.result.startWarning,
        activityIdIn: activity.id,
        baseMessageIn: decision.result.message,
        sessionLinkIn: dmText.result.sessionLink,
      },
      code: [
        "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }",
        "def txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }",
        "def isTrue = { String n -> val(n) != null && val(n).toString() == 'true' }",
        "def warnings = []",
        "if (txt('dmSkippedIn') == 'yes') { warnings << 'The owner has no Slack id on the row, so the direct message was not sent' }",
        "if (txt('sendDmIn') == 'yes') {",
        "  if (!isTrue('dmOk')) {",
        "    warnings << ('The direct message to the owner was not sent: Slack could not open the conversation' + (txt('dmError') ? ' (' + txt('dmError') + ')' : ''))",
        "  } else if (!isTrue('postOk')) {",
        "    warnings << 'The direct message to the owner was not sent: Slack refused the post'",
        "  }",
        "}",
        "if (txt('startWarningIn')) { warnings << txt('startWarningIn') }",
        "if (!txt('activityIdIn')) { warnings << 'The activity row was not saved' }",
        "def message = txt('baseMessageIn')",
        "if (txt('sessionLinkIn')) { message = message + ' Build session: ' + txt('sessionLinkIn') }",
        "result = [warnings: warnings, hasWarnings: (warnings ? 'yes' : 'no'), message: message]",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Did the gate pass?
    if (eq(decision.result.passed, "yes")) {
      // Are there warnings?
      if (eq(summary.result.hasWarnings, "yes")) {
        // Answer decided, gate passed, with warnings
        return { status: "decided", gate_passed: true, warnings: summary.result.warnings, message: summary.result.message };
      }
      // Answer decided, gate passed
      return { status: "decided", gate_passed: true, warnings: [], message: summary.result.message };
    }

    // Are there warnings?
    if (eq(summary.result.hasWarnings, "yes")) {
      // Answer decided, still waiting on the other approval, with warnings
      return { status: "decided", gate_passed: false, warnings: summary.result.warnings, message: summary.result.message };
    }

    // Answer decided, still waiting on the other approval
    return { status: "decided", gate_passed: false, warnings: [], message: summary.result.message };
  },
);
