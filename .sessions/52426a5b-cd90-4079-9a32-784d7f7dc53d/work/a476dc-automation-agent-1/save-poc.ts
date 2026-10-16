import { automation, callable, op, and, eq, exists, missing, regex, RUN } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Save POC from Slack",
    description: "Called by the POC Studio Agent as its one tool when a person tags the bot in Slack with a use case name. Starts a POC row and its poc_started activity, or notes the manager on a known row, and always answers status, poc_id and message.",
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
          poc_id: {
            type: "string",
            title: "POC id",
          },
          message: {
            type: "string",
            title: "Message",
          },
        },
        required: [
          "status",
          "poc_id",
          "message",
        ],
      },
      setup: {
        type: "object",
        properties: {
          channel_id: {
            type: "string",
            title: "Channel id",
          },
          channel_name: {
            type: "string",
            title: "Channel name",
          },
          tagger_slack_id: {
            type: "string",
            title: "Tagger Slack id",
          },
          use_case: {
            type: "string",
            title: "Use case",
          },
          thread_ts: {
            type: "string",
            title: "Thread ts",
          },
          manager_slack_id: {
            type: "string",
            title: "Manager Slack id",
          },
          poc_id: {
            type: "string",
            title: "POC id",
          },
        },
        required: [
          "channel_id",
          "tagger_slack_id",
          "use_case",
        ],
      },
    }),
  },
  (t) => {
    // Normalize and validate the inputs
    const prepared = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: {
          channelIdIn: { type: "string", title: "Channel id" },
          channelNameIn: { type: "string", title: "Channel name" },
          taggerIdIn: { type: "string", title: "Tagger Slack id" },
          useCaseIn: { type: "string", title: "Use case" },
          threadTsIn: { type: "string", title: "Thread ts" },
          managerIdIn: { type: "string", title: "Manager Slack id" },
          pocIdIn: { type: "string", title: "POC id" },
        },
      },
      output: {
        type: "object",
        properties: {
          mode: { type: "string", title: "Mode" },
          error: { type: "string", title: "Error" },
          channelId: { type: "string", title: "Channel id" },
          channelName: { type: "string", title: "Channel name" },
          taggerId: { type: "string", title: "Tagger Slack id" },
          useCase: { type: "string", title: "Use case" },
          useCaseRegex: { type: "string", title: "Use case regex" },
          threadTs: { type: "string", title: "Thread ts" },
          managerId: { type: "string", title: "Manager Slack id" },
          hasManager: { type: "string", title: "Has manager" },
          pocId: { type: "string", title: "POC id" },
        },
      },
      parameters: {
        channelIdIn: t.channel_id,
        channelNameIn: t.channel_name,
        taggerIdIn: t.tagger_slack_id,
        useCaseIn: t.use_case,
        threadTsIn: t.thread_ts,
        managerIdIn: t.manager_slack_id,
        pocIdIn: t.poc_id,
      },
      code: [
        "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }",
        "def txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }",
        "def sid = { String n ->",
        "  def s = txt(n)",
        "  if (s.startsWith('<@') && s.endsWith('>')) {",
        "    s = s.substring(2, s.length() - 1)",
        "    def p = s.indexOf('|')",
        "    if (p >= 0) { s = s.substring(0, p) }",
        "  }",
        "  s.trim().toUpperCase()",
        "}",
        "def channelId = txt('channelIdIn')",
        "def channelName = txt('channelNameIn')",
        "while (channelName.startsWith('#')) { channelName = channelName.substring(1) }",
        "channelName = channelName.trim()",
        "if (!channelName) { channelName = channelId }",
        "def taggerId = sid('taggerIdIn')",
        "def managerId = sid('managerIdIn')",
        "def useCase = txt('useCaseIn').replace((char) 10, (char) 32).replace((char) 9, (char) 32).replace((char) 13, (char) 32).split(' ').findAll { it }.join(' ')",
        "def pocId = txt('pocIdIn')",
        "def threadTs = txt('threadTsIn')",
        "def mode = pocId ? 'note' : 'create'",
        "def idPattern = '[UW][A-Z0-9]+'",
        "def errors = []",
        "if (mode == 'note') {",
        "  if (!managerId) {",
        "    errors << 'manager_slack_id is required with poc_id'",
        "  } else if (!managerId.matches(idPattern)) {",
        "    errors << 'manager_slack_id must be a Slack user id such as U012ABCDEF'",
        "  }",
        "} else {",
        "  if (!channelId) { errors << 'channel_id is required' }",
        "  if (!taggerId) {",
        "    errors << 'tagger_slack_id is required'",
        "  } else if (!taggerId.matches(idPattern)) {",
        "    errors << 'tagger_slack_id must be a Slack user id such as U012ABCDEF'",
        "  }",
        "  if (!useCase) {",
        "    errors << 'use_case is required'",
        "  } else if (useCase.length() > 200) {",
        "    errors << 'use_case must be at most 200 characters'",
        "  }",
        "  if (managerId && !managerId.matches(idPattern)) { errors << 'manager_slack_id must be a Slack user id such as U012ABCDEF' }",
        "}",
        "def bs = (char) 92",
        "def specials = '^$.|?*+()[]{}'",
        "def sb = new StringBuilder('^')",
        "useCase.each { String ch ->",
        "  if (ch.length() == 1 && Character.isLetter(ch.charAt(0)) && ch.toLowerCase() != ch.toUpperCase()) {",
        "    sb.append('[').append(ch.toLowerCase()).append(ch.toUpperCase()).append(']')",
        "  } else {",
        "    if (ch.charAt(0) == bs || specials.contains(ch)) { sb.append(bs) }",
        "    sb.append(ch)",
        "  }",
        "}",
        "sb.append('$')",
        "result = [mode: (errors ? 'error' : mode), error: errors.join('; '), channelId: channelId, channelName: channelName, taggerId: taggerId, useCase: useCase, useCaseRegex: sb.toString(), threadTs: threadTs, managerId: managerId, hasManager: (managerId ? 'yes' : 'no'), pocId: pocId]",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Answer error when the input is invalid
    if (eq(prepared.result.mode, "error")) {
      return { status: "error", poc_id: "=\"\"", message: prepared.result.error };
    }

    // Is this a manager note on a known row?
    if (eq(prepared.result.mode, "note")) {
      // Read the POC row to note the manager on
      const row = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
        object_type: "psl_poc",
        numberOfRecordsToFetch: "MULTIPLE",
        triggerInputCondition: and(eq("properties_poc_id", prepared.result.pocId)),
        page: { paginateBy: "OFFSET", limit: 1, offset: 0 },
      });

      // Answer error when the row does not exist
      if (missing(row.objects[0].id)) {
        return { status: "error", poc_id: prepared.result.pocId, message: `No POC row has the id ${prepared.result.pocId}. Nothing was changed.` };
      }

      // Look up the manager in Slack
      const noteMgr = op(
        "slack",
        "slack_get_user_info_by_id",
        { user: prepared.result.managerId },
        {
          connectionId: "6ad1be602ac9ba64653a9d36",
          retryConfig: { enabled: true, count: 2, initialDelay: 1000, maxDelay: 4000, backOffFactor: 2, captureRetries: true },
        },
      );

      // Check the lookup and the row's current manager
      const noteCheck = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
        input: {
          type: "object",
          properties: {
            pocIdIn: { type: "string", title: "POC id" },
            managerIdIn: { type: "string", title: "Manager Slack id" },
            currentManagerIn: { type: "string", title: "Current manager Slack id" },
            mOk: { type: "boolean", title: "Lookup ok" },
            mError: { type: "string", title: "Lookup error" },
            mReal: { type: "string", title: "Real name" },
            mDisplay: { type: "string", title: "Display name" },
            mHandle: { type: "string", title: "Handle" },
            mEmail: { type: "string", title: "Email" },
          },
        },
        output: {
          type: "object",
          properties: {
            failed: { type: "string", title: "Failed" },
            error: { type: "string", title: "Error" },
            mgrName: { type: "string", title: "Manager name" },
            mgrEmail: { type: "string", title: "Manager email" },
            message: { type: "string", title: "Message" },
          },
        },
        parameters: {
          pocIdIn: prepared.result.pocId,
          managerIdIn: prepared.result.managerId,
          currentManagerIn: row.objects[0].properties.manager_slack_id,
          mOk: noteMgr.ok,
          mError: noteMgr.error,
          mReal: noteMgr.user.real_name,
          mDisplay: noteMgr.user.profile.display_name,
          mHandle: noteMgr.user.name,
          mEmail: noteMgr.user.profile.email,
        },
        code: [
          "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }",
          "def txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }",
          "def isTrue = { String n -> val(n) != null && val(n).toString() == 'true' }",
          "def pocId = txt('pocIdIn')",
          "def managerId = txt('managerIdIn')",
          "def current = txt('currentManagerIn')",
          "def errors = []",
          "if (current && current != managerId) {",
          "  errors << ('POC ' + pocId + ' already has a manager (' + current + '); it was not changed')",
          "}",
          "if (!isTrue('mOk')) {",
          "  errors << ('Could not look up the manager ' + managerId + ' in Slack' + (txt('mError') ? ' (' + txt('mError') + ')' : ''))",
          "}",
          "def mgrName = txt('mReal') ?: txt('mDisplay') ?: txt('mHandle') ?: managerId",
          "result = [failed: (errors ? 'yes' : 'no'), error: errors.join('; '), mgrName: mgrName, mgrEmail: txt('mEmail'), message: 'Noted ' + mgrName + ' as the manager of ' + pocId + '.']",
        ].join("\n"),
        compile_static: false,
        captureStdOutput: false,
      });

      // Answer error when the manager cannot be noted
      if (eq(noteCheck.result.failed, "yes")) {
        return { status: "error", poc_id: prepared.result.pocId, message: noteCheck.result.error };
      }

      // Write the manager onto the row, field by field
      op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
        object_type: "psl_poc",
        recordId: row.objects[0].id,
        skipIfBlank: true,
        updateFields: [
          { fieldName: "properties.manager_slack_id", actionType: "SET", setValue: prepared.result.managerId },
          { fieldName: "properties.manager_name", actionType: "SET", setValue: noteCheck.result.mgrName },
          { fieldName: "properties.manager_email", actionType: "SET", setValue: noteCheck.result.mgrEmail },
        ],
      });

      // Answer noted
      return { status: "noted", poc_id: prepared.result.pocId, message: noteCheck.result.message };
    }

    // Look for a POC with the same use case name, ignoring case, in any channel
    const sameName = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      object_type: "psl_poc",
      numberOfRecordsToFetch: "MULTIPLE",
      triggerInputCondition: and(regex("properties_use_case", prepared.result.useCaseRegex)),
      page: { paginateBy: "OFFSET", limit: 1, offset: 0 },
    });

    // Answer exists when the name is already used
    if (exists(sameName.objects[0].id)) {
      return {
        status: "exists",
        poc_id: sameName.objects[0].properties.poc_id,
        message: `The use case "${prepared.result.useCase}" already exists as ${sameName.objects[0].properties.poc_id} in the channel #${sameName.objects[0].properties.slack_channel} (${sameName.objects[0].properties.slack_channel_id}). Nothing was created.`,
      };
    }

    // Look up the tagger in Slack
    const owner = op(
      "slack",
      "slack_get_user_info_by_id",
      { user: prepared.result.taggerId },
      {
        connectionId: "6ad1be602ac9ba64653a9d36",
        retryConfig: { enabled: true, count: 2, initialDelay: 1000, maxDelay: 4000, backOffFactor: 2, captureRetries: true },
      },
    );

    // Look up the manager in Slack when one was given
    let mgr;
    if (eq(prepared.result.hasManager, "yes")) {
      mgr = op(
        "slack",
        "slack_get_user_info_by_id",
        { user: prepared.result.managerId },
        {
          connectionId: "6ad1be602ac9ba64653a9d36",
          retryConfig: { enabled: true, count: 2, initialDelay: 1000, maxDelay: 4000, backOffFactor: 2, captureRetries: true },
        },
      );
    }

    // Read an existing POC row of the same channel for its client
    const channelRows = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      object_type: "psl_poc",
      numberOfRecordsToFetch: "MULTIPLE",
      triggerInputCondition: and(eq("properties_slack_channel_id", prepared.result.channelId)),
      sortBy: [{ field: "properties_started_at", order: "ASC" }],
      page: { paginateBy: "OFFSET", limit: 1, offset: 0 },
    });

    // Work out the client, the ids and the texts of the new POC
    const built = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: {
          useCaseIn: { type: "string", title: "Use case" },
          channelIdIn: { type: "string", title: "Channel id" },
          channelNameIn: { type: "string", title: "Channel name" },
          taggerIdIn: { type: "string", title: "Tagger Slack id" },
          threadTsIn: { type: "string", title: "Thread ts" },
          managerIdIn: { type: "string", title: "Manager Slack id" },
          hasManagerIn: { type: "string", title: "Has manager" },
          nowMsIn: { type: "integer", title: "Now (epoch ms)" },
          tzIn: { type: "string", title: "Timezone" },
          chClientNameIn: { type: "string", title: "Channel client name" },
          chClientSlugIn: { type: "string", title: "Channel client slug" },
          oOk: { type: "boolean", title: "Tagger lookup ok" },
          oError: { type: "string", title: "Tagger lookup error" },
          oReal: { type: "string", title: "Tagger real name" },
          oDisplay: { type: "string", title: "Tagger display name" },
          oHandle: { type: "string", title: "Tagger handle" },
          oEmail: { type: "string", title: "Tagger email" },
          oAvatar: { type: "string", title: "Tagger picture" },
          mOk: { type: "boolean", title: "Manager lookup ok" },
          mError: { type: "string", title: "Manager lookup error" },
          mReal: { type: "string", title: "Manager real name" },
          mDisplay: { type: "string", title: "Manager display name" },
          mHandle: { type: "string", title: "Manager handle" },
          mEmail: { type: "string", title: "Manager email" },
        },
      },
      output: {
        type: "object",
        properties: {
          failed: { type: "string", title: "Failed" },
          error: { type: "string", title: "Error" },
          pocId: { type: "string", title: "POC id" },
          clientName: { type: "string", title: "Client name" },
          clientSlug: { type: "string", title: "Client slug" },
          ownerName: { type: "string", title: "Owner name" },
          ownerEmail: { type: "string", title: "Owner email" },
          ownerAvatar: { type: "string", title: "Owner picture" },
          mgrName: { type: "string", title: "Manager name" },
          mgrEmail: { type: "string", title: "Manager email" },
          managerId: { type: "string", title: "Manager Slack id" },
          botThreadTs: { type: "string", title: "Bot thread ts" },
          slackLastTs: { type: "string", title: "Slack last ts" },
          activityId: { type: "string", title: "Activity id" },
          activityMessage: { type: "string", title: "Activity message" },
          lastActivity: { type: "string", title: "Last activity" },
          postedTo: { type: "string", title: "Posted to" },
          threadTs: { type: "string", title: "Thread ts" },
          hasManager: { type: "string", title: "Has manager" },
          message: { type: "string", title: "Message" },
        },
      },
      parameters: {
        useCaseIn: prepared.result.useCase,
        channelIdIn: prepared.result.channelId,
        channelNameIn: prepared.result.channelName,
        taggerIdIn: prepared.result.taggerId,
        threadTsIn: prepared.result.threadTs,
        managerIdIn: prepared.result.managerId,
        hasManagerIn: prepared.result.hasManager,
        nowMsIn: RUN.currentTime,
        tzIn: RUN.timezone,
        chClientNameIn: channelRows.objects[0].properties.client_name,
        chClientSlugIn: channelRows.objects[0].properties.client_slug,
        oOk: owner.ok,
        oError: owner.error,
        oReal: owner.user.real_name,
        oDisplay: owner.user.profile.display_name,
        oHandle: owner.user.name,
        oEmail: owner.user.profile.email,
        oAvatar: owner.user.profile.image_72,
        mOk: mgr.ok,
        mError: mgr.error,
        mReal: mgr.user.real_name,
        mDisplay: mgr.user.profile.display_name,
        mHandle: mgr.user.name,
        mEmail: mgr.user.profile.email,
      },
      code: [
        "import java.time.Instant",
        "import java.time.ZoneId",
        "import java.time.format.DateTimeFormatter",
        "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }",
        "def txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }",
        "def isTrue = { String n -> val(n) != null && val(n).toString() == 'true' }",
        "def slug = { String s -> s.toLowerCase().replaceAll('[^a-z0-9]+', '-').replaceAll('^-+', '').replaceAll('-+$', '') }",
        "def hasManager = txt('hasManagerIn') == 'yes'",
        "def taggerId = txt('taggerIdIn')",
        "def managerId = txt('managerIdIn')",
        "def useCase = txt('useCaseIn')",
        "def errors = []",
        "if (!isTrue('oOk')) {",
        "  errors << ('Could not look up the tagger ' + taggerId + ' in Slack' + (txt('oError') ? ' (' + txt('oError') + ')' : ''))",
        "}",
        "if (hasManager && !isTrue('mOk')) {",
        "  errors << ('Could not look up the manager ' + managerId + ' in Slack' + (txt('mError') ? ' (' + txt('mError') + ')' : ''))",
        "}",
        "def ownerName = txt('oReal') ?: txt('oDisplay') ?: txt('oHandle') ?: taggerId",
        "def mgrName = hasManager ? (txt('mReal') ?: txt('mDisplay') ?: txt('mHandle') ?: managerId) : ''",
        "def mgrEmail = hasManager ? txt('mEmail') : ''",
        "def zone",
        "try { zone = ZoneId.of(txt('tzIn')) } catch (Exception e) { zone = ZoneId.of('UTC') }",
        "long nowMs = val('nowMsIn') == null ? 0L : (val('nowMsIn') as long)",
        "if (nowMs <= 0L) { nowMs = System.currentTimeMillis() }",
        "def today = Instant.ofEpochMilli(nowMs).atZone(zone).format(DateTimeFormatter.ofPattern('yyyyMMdd'))",
        "def clientName = txt('chClientNameIn')",
        "def clientSlug = txt('chClientSlugIn')",
        "if (!clientName) {",
        "  def first = useCase ? useCase.split(' ')[0] : ''",
        "  clientName = first ? first.substring(0, 1).toUpperCase() + first.substring(1) : 'Client'",
        "  clientSlug = slug(first)",
        "} else if (!clientSlug) {",
        "  clientSlug = slug(clientName)",
        "}",
        "if (!clientSlug) { clientSlug = 'client' }",
        "def ucSlug = slug(useCase)",
        "def fullSlug = ucSlug ?: 'use-case'",
        "if (ucSlug.startsWith(clientSlug + '-')) { ucSlug = ucSlug.substring(clientSlug.length() + 1) }",
        "if (ucSlug.endsWith('-use-case')) { ucSlug = ucSlug.substring(0, ucSlug.length() - 9) }",
        "if (!ucSlug) { ucSlug = fullSlug }",
        "def pocId = 'POC-' + clientSlug + '-' + ucSlug + '-' + today",
        "def threadTs = txt('threadTsIn')",
        "def channelId = txt('channelIdIn')",
        "def channelName = txt('channelNameIn')",
        "def activityId = threadTs ? ('SLK-' + channelId + '-' + threadTs) : ('ACT-' + nowMs + '-1')",
        "def lastTs = nowMs.intdiv(1000L).toString() + '.000000'",
        "def message",
        "if (hasManager) {",
        "  message = 'Created POC ' + pocId + ' for \"' + useCase + '\" (client ' + clientName + ', owner ' + ownerName + ', manager ' + mgrName + ').'",
        "} else {",
        "  message = 'Created POC ' + pocId + ' for \"' + useCase + '\" (client ' + clientName + ', owner ' + ownerName + '). No manager yet: ask who the manager is.'",
        "}",
        "result = [failed: (errors ? 'yes' : 'no'), error: errors.join('; '), pocId: pocId, clientName: clientName, clientSlug: clientSlug, ownerName: ownerName, ownerEmail: txt('oEmail'), ownerAvatar: txt('oAvatar'), mgrName: mgrName, mgrEmail: mgrEmail, managerId: (hasManager ? managerId : ''), botThreadTs: (hasManager ? '' : threadTs), slackLastTs: lastTs, activityId: activityId, activityMessage: ownerName + ' started the POC \"' + useCase + '\" from Slack', lastActivity: 'Started from Slack by ' + ownerName, postedTo: '#' + channelName, threadTs: threadTs, hasManager: (hasManager ? 'yes' : 'no'), message: message]",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Answer error when a Slack lookup failed
    if (eq(built.result.failed, "yes")) {
      return { status: "error", poc_id: "=\"\"", message: built.result.error };
    }

    // Look for a row that already holds the generated POC id
    const sameId = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      object_type: "psl_poc",
      numberOfRecordsToFetch: "MULTIPLE",
      triggerInputCondition: and(eq("properties_poc_id", built.result.pocId)),
      page: { paginateBy: "OFFSET", limit: 1, offset: 0 },
    });

    // Answer exists when that id is already taken
    if (exists(sameId.objects[0].id)) {
      return {
        status: "exists",
        poc_id: sameId.objects[0].properties.poc_id,
        message: `A POC with the id ${sameId.objects[0].properties.poc_id} already exists (use case "${sameId.objects[0].properties.use_case}", channel #${sameId.objects[0].properties.slack_channel}). Nothing was created.`,
      };
    }

    // Create the POC row, leaving out the values that are blank
    op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
      object_type: "psl_poc",
      skipIfBlank: true,
      record: {
        poc_id: built.result.pocId,
        client_name: built.result.clientName,
        client_slug: built.result.clientSlug,
        use_case: prepared.result.useCase,
        owner_name: built.result.ownerName,
        owner_email: built.result.ownerEmail,
        started_by: built.result.ownerName,
        started_at: RUN.currentTime,
        stage: "0_kickoff",
        current_gate: "none",
        g1_status: "pending",
        g2_status: "pending",
        g3_status: "pending",
        g4_status: "pending",
        status: "running",
        slack_channel: prepared.result.channelName,
        last_activity: built.result.lastActivity,
        last_activity_at: RUN.currentTime,
        manager_name: built.result.mgrName,
        manager_email: built.result.mgrEmail,
        g1_owner_approved: false,
        g2_owner_approved: false,
        g3_owner_approved: false,
        g4_owner_approved: false,
        g1_manager_approved: false,
        g2_manager_approved: false,
        g3_manager_approved: false,
        g4_manager_approved: false,
        slack_channel_id: prepared.result.channelId,
        owner_slack_id: prepared.result.taggerId,
        manager_slack_id: built.result.managerId,
        slack_last_ts: built.result.slackLastTs,
        bot_thread_ts: built.result.botThreadTs,
        slack_live: true,
      },
    });

    // Log the poc_started activity
    op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
      object_type: "psl_activity",
      skipIfBlank: true,
      record: {
        activity_id: built.result.activityId,
        poc: built.result.pocId,
        type: "poc_started",
        stage: "0_kickoff",
        gate: "none",
        actor_type: "person",
        actor_name: built.result.ownerName,
        actor_email: built.result.ownerEmail,
        message: built.result.activityMessage,
        posted_to: built.result.postedTo,
        created_at: RUN.currentTime,
        actor_avatar_url: built.result.ownerAvatar,
        slack_ts: built.result.threadTs,
      },
    });

    // Answer created when the manager is known
    if (eq(built.result.hasManager, "yes")) {
      return { status: "created", poc_id: built.result.pocId, message: built.result.message };
    }

    // Answer needs_manager
    return { status: "needs_manager", poc_id: built.result.pocId, message: built.result.message };
  },
);
