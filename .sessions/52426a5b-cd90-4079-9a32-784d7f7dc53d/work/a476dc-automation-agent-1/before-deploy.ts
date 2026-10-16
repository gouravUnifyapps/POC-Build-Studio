import { automation, callable, op, RUN, TRIGGER, and, eq, exists, missing, regex } from "@ua/automations";

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
    let slack;

    // Normalize and validate the inputs
    const normalizeAndValidateTheInputs = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            title: "Mode",
          },
          error: {
            type: "string",
            title: "Error",
          },
          channelId: {
            type: "string",
            title: "Channel id",
          },
          channelName: {
            type: "string",
            title: "Channel name",
          },
          taggerId: {
            type: "string",
            title: "Tagger Slack id",
          },
          useCase: {
            type: "string",
            title: "Use case",
          },
          useCaseRegex: {
            type: "string",
            title: "Use case regex",
          },
          threadTs: {
            type: "string",
            title: "Thread ts",
          },
          managerId: {
            type: "string",
            title: "Manager Slack id",
          },
          hasManager: {
            type: "string",
            title: "Has manager",
          },
          pocId: {
            type: "string",
            title: "POC id",
          },
        },
      },
      input: {
        type: "object",
        properties: {
          channelIdIn: {
            type: "string",
            title: "Channel id",
          },
          channelNameIn: {
            type: "string",
            title: "Channel name",
          },
          taggerIdIn: {
            type: "string",
            title: "Tagger Slack id",
          },
          useCaseIn: {
            type: "string",
            title: "Use case",
          },
          threadTsIn: {
            type: "string",
            title: "Thread ts",
          },
          managerIdIn: {
            type: "string",
            title: "Manager Slack id",
          },
          pocIdIn: {
            type: "string",
            title: "POC id",
          },
        },
      },
      code: "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }\ndef txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }\ndef sid = { String n ->\n  def s = txt(n)\n  if (s.startsWith('<@') && s.endsWith('>')) {\n    s = s.substring(2, s.length() - 1)\n    def p = s.indexOf('|')\n    if (p >= 0) { s = s.substring(0, p) }\n  }\n  s.trim().toUpperCase()\n}\ndef channelId = txt('channelIdIn')\ndef channelName = txt('channelNameIn')\nwhile (channelName.startsWith('#')) { channelName = channelName.substring(1) }\nchannelName = channelName.trim()\nif (!channelName) { channelName = channelId }\ndef taggerId = sid('taggerIdIn')\ndef managerId = sid('managerIdIn')\ndef useCase = txt('useCaseIn').replace((char) 10, (char) 32).replace((char) 9, (char) 32).replace((char) 13, (char) 32).split(' ').findAll { it }.join(' ')\ndef pocId = txt('pocIdIn')\ndef threadTs = txt('threadTsIn')\ndef mode = pocId ? 'note' : 'create'\ndef idPattern = '[UW][A-Z0-9]+'\ndef errors = []\nif (mode == 'note') {\n  if (!managerId) {\n    errors << 'manager_slack_id is required with poc_id'\n  } else if (!managerId.matches(idPattern)) {\n    errors << 'manager_slack_id must be a Slack user id such as U012ABCDEF'\n  }\n} else {\n  if (!channelId) { errors << 'channel_id is required' }\n  if (!taggerId) {\n    errors << 'tagger_slack_id is required'\n  } else if (!taggerId.matches(idPattern)) {\n    errors << 'tagger_slack_id must be a Slack user id such as U012ABCDEF'\n  }\n  if (!useCase) {\n    errors << 'use_case is required'\n  } else if (useCase.length() > 200) {\n    errors << 'use_case must be at most 200 characters'\n  }\n  if (managerId && !managerId.matches(idPattern)) { errors << 'manager_slack_id must be a Slack user id such as U012ABCDEF' }\n}\ndef bs = (char) 92\ndef specials = '^$.|?*+()[]{}'\ndef sb = new StringBuilder('^')\nuseCase.each { String ch ->\n  if (ch.length() == 1 && Character.isLetter(ch.charAt(0)) && ch.toLowerCase() != ch.toUpperCase()) {\n    sb.append('[').append(ch.toLowerCase()).append(ch.toUpperCase()).append(']')\n  } else {\n    if (ch.charAt(0) == bs || specials.contains(ch)) { sb.append(bs) }\n    sb.append(ch)\n  }\n}\nsb.append('$')\nresult = [mode: (errors ? 'error' : mode), error: errors.join('; '), channelId: channelId, channelName: channelName, taggerId: taggerId, useCase: useCase, useCaseRegex: sb.toString(), threadTs: threadTs, managerId: managerId, hasManager: (managerId ? 'yes' : 'no'), pocId: pocId]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        channelIdIn: t.channel_id,
        channelNameIn: t.channel_name,
        taggerIdIn: t.tagger_slack_id,
        useCaseIn: t.use_case,
        threadTsIn: t.thread_ts,
        managerIdIn: t.manager_slack_id,
        pocIdIn: t.poc_id,
      },
    });
    // Answer error when the input is invalid
    if (and(
      eq(normalizeAndValidateTheInputs.result.mode, "error"),
    )) {
      // Callable
      return {
        status: "error",
        poc_id: "=\"\"",
        message: normalizeAndValidateTheInputs.result.error,
      };
    }
    // Is this a manager note on a known row?
    if (and(
      eq(normalizeAndValidateTheInputs.result.mode, "note"),
    )) {
      // Read the POC row to note the manager on
      const readThePocRowToNoteTheManagerOn = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
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
        missing(readThePocRowToNoteTheManagerOn.objects[0].id),
      )) {
        // Callable
        return {
          status: "error",
          poc_id: normalizeAndValidateTheInputs.result.pocId,
          message: `No POC row has the id ${normalizeAndValidateTheInputs.result.pocId}. Nothing was changed.`,
        };
      }
      // Look up the manager in Slack
      const lookUpTheManagerInSlack = op("slack", "slack_get_user_info_by_id", {
        include_locale: false,
        user: normalizeAndValidateTheInputs.result.managerId,
      }, { connectionId: "6ad1be602ac9ba64653a9d36", retryConfig: {
        backOffFactor: 2,
        captureRetries: true,
        count: 2,
        enabled: true,
        initialDelay: 1000,
        maxDelay: 4000,
      } });
      // Check the lookup and the row's current manager
      const checkTheLookupAndTheRowSCurrentManager = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
        output: {
          type: "object",
          properties: {
            failed: {
              type: "string",
              title: "Failed",
            },
            error: {
              type: "string",
              title: "Error",
            },
            mgrName: {
              type: "string",
              title: "Manager name",
            },
            mgrEmail: {
              type: "string",
              title: "Manager email",
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
            pocIdIn: {
              type: "string",
              title: "POC id",
            },
            managerIdIn: {
              type: "string",
              title: "Manager Slack id",
            },
            currentManagerIn: {
              type: "string",
              title: "Current manager Slack id",
            },
            mOk: {
              type: "boolean",
              title: "Lookup ok",
            },
            mError: {
              type: "string",
              title: "Lookup error",
            },
            mReal: {
              type: "string",
              title: "Real name",
            },
            mDisplay: {
              type: "string",
              title: "Display name",
            },
            mHandle: {
              type: "string",
              title: "Handle",
            },
            mEmail: {
              type: "string",
              title: "Email",
            },
          },
        },
        code: "def val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }\ndef txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }\ndef isTrue = { String n -> val(n) != null && val(n).toString() == 'true' }\ndef pocId = txt('pocIdIn')\ndef managerId = txt('managerIdIn')\ndef current = txt('currentManagerIn')\ndef errors = []\nif (current && current != managerId) {\n  errors << ('POC ' + pocId + ' already has a manager (' + current + '); it was not changed')\n}\nif (!isTrue('mOk')) {\n  errors << ('Could not look up the manager ' + managerId + ' in Slack' + (txt('mError') ? ' (' + txt('mError') + ')' : ''))\n}\ndef mgrName = txt('mReal') ?: txt('mDisplay') ?: txt('mHandle') ?: managerId\nresult = [failed: (errors ? 'yes' : 'no'), error: errors.join('; '), mgrName: mgrName, mgrEmail: txt('mEmail'), message: 'Noted ' + mgrName + ' as the manager of ' + pocId + '.']",
        compile_static: false,
        captureStdOutput: false,
        parameters: {
          pocIdIn: normalizeAndValidateTheInputs.result.pocId,
          managerIdIn: normalizeAndValidateTheInputs.result.managerId,
          currentManagerIn: readThePocRowToNoteTheManagerOn.objects[0].properties.manager_slack_id,
          mOk: lookUpTheManagerInSlack.ok,
          mError: lookUpTheManagerInSlack.error,
          mReal: lookUpTheManagerInSlack.user.real_name,
          mDisplay: lookUpTheManagerInSlack.user.profile.display_name,
          mHandle: lookUpTheManagerInSlack.user.name,
          mEmail: lookUpTheManagerInSlack.user.profile.email,
        },
      });
      // Answer error when the manager cannot be noted
      if (and(
        eq(checkTheLookupAndTheRowSCurrentManager.result.failed, "yes"),
      )) {
        // Callable
        return {
          status: "error",
          poc_id: normalizeAndValidateTheInputs.result.pocId,
          message: checkTheLookupAndTheRowSCurrentManager.result.error,
        };
      }
      // Write the manager onto the row, field by field
      op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
        recordId: readThePocRowToNoteTheManagerOn.objects[0].id,
        writeThroughSessionVariables: false,
        object_type: "psl_poc",
        skipIfBlank: true,
        skipPermissionCheck: false,
        updateFields: [
          {
            fieldName: "properties.manager_slack_id",
            actionType: "SET",
            setValue: normalizeAndValidateTheInputs.result.managerId,
          },
          {
            fieldName: "properties.manager_name",
            actionType: "SET",
            setValue: checkTheLookupAndTheRowSCurrentManager.result.mgrName,
          },
          {
            fieldName: "properties.manager_email",
            actionType: "SET",
            setValue: checkTheLookupAndTheRowSCurrentManager.result.mgrEmail,
          },
        ],
        skipSchemaValidation: true,
        unsetIfNull: false,
      });
      // Answer noted
      return {
        status: "noted",
        poc_id: normalizeAndValidateTheInputs.result.pocId,
        message: checkTheLookupAndTheRowSCurrentManager.result.message,
      };
    }
    // Look for a POC with the same use case name, ignoring case, in any channel
    const lookForAPocWithTheSameUseCaseNameIgnoringCaseInAnyChannel = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      triggerInputCondition: and(
        regex("properties_use_case", normalizeAndValidateTheInputs.result.useCaseRegex),
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
    // Answer exists when the name is already used
    if (and(
      exists(lookForAPocWithTheSameUseCaseNameIgnoringCaseInAnyChannel.objects[0].id),
    )) {
      // Callable
      return {
        status: "exists",
        poc_id: lookForAPocWithTheSameUseCaseNameIgnoringCaseInAnyChannel.objects[0].properties.poc_id,
        message: `The use case "${normalizeAndValidateTheInputs.result.useCase}" already exists as ${lookForAPocWithTheSameUseCaseNameIgnoringCaseInAnyChannel.objects[0].properties.poc_id} in the channel #${lookForAPocWithTheSameUseCaseNameIgnoringCaseInAnyChannel.objects[0].properties.slack_channel} (${lookForAPocWithTheSameUseCaseNameIgnoringCaseInAnyChannel.objects[0].properties.slack_channel_id}). Nothing was created.`,
      };
    }
    // Look up the tagger in Slack
    const lookUpTheTaggerInSlack = op("slack", "slack_get_user_info_by_id", {
      include_locale: false,
      user: normalizeAndValidateTheInputs.result.taggerId,
    }, { connectionId: "6ad1be602ac9ba64653a9d36", retryConfig: {
      backOffFactor: 2,
      captureRetries: true,
      count: 2,
      enabled: true,
      initialDelay: 1000,
      maxDelay: 4000,
    } });
    // Condition
    if (and(
      eq(normalizeAndValidateTheInputs.result.hasManager, "yes"),
    )) {
      // Slack
      slack = op("slack", "slack_get_user_info_by_id", {
        include_locale: false,
        user: normalizeAndValidateTheInputs.result.managerId,
      }, { connectionId: "6ad1be602ac9ba64653a9d36", retryConfig: {
        backOffFactor: 2,
        captureRetries: true,
        count: 2,
        enabled: true,
        initialDelay: 1000,
        maxDelay: 4000,
      } });
    }
    // Read an existing POC row of the same channel for its client
    const readAnExistingPocRowOfTheSameChannelForItsClient = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      triggerInputCondition: and(
        eq("properties_slack_channel_id", normalizeAndValidateTheInputs.result.channelId),
      ),
      shouldSearchInAnalyticsStore: false,
      object_type: "psl_poc",
      includeRoleMappings: false,
      includeCurrentUserPermissions: false,
      sortBy: [
        {
          field: "properties_started_at",
          order: "ASC",
        },
      ],
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
    // Work out the client, the ids and the texts of the new POC
    const workOutTheClientTheIdsAndTheTextsOfTheNewPoc = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          failed: {
            type: "string",
            title: "Failed",
          },
          error: {
            type: "string",
            title: "Error",
          },
          pocId: {
            type: "string",
            title: "POC id",
          },
          clientName: {
            type: "string",
            title: "Client name",
          },
          clientSlug: {
            type: "string",
            title: "Client slug",
          },
          ownerName: {
            type: "string",
            title: "Owner name",
          },
          ownerEmail: {
            type: "string",
            title: "Owner email",
          },
          ownerAvatar: {
            type: "string",
            title: "Owner picture",
          },
          mgrName: {
            type: "string",
            title: "Manager name",
          },
          mgrEmail: {
            type: "string",
            title: "Manager email",
          },
          managerId: {
            type: "string",
            title: "Manager Slack id",
          },
          botThreadTs: {
            type: "string",
            title: "Bot thread ts",
          },
          slackLastTs: {
            type: "string",
            title: "Slack last ts",
          },
          activityId: {
            type: "string",
            title: "Activity id",
          },
          activityMessage: {
            type: "string",
            title: "Activity message",
          },
          lastActivity: {
            type: "string",
            title: "Last activity",
          },
          postedTo: {
            type: "string",
            title: "Posted to",
          },
          threadTs: {
            type: "string",
            title: "Thread ts",
          },
          hasManager: {
            type: "string",
            title: "Has manager",
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
          useCaseIn: {
            type: "string",
            title: "Use case",
          },
          channelIdIn: {
            type: "string",
            title: "Channel id",
          },
          channelNameIn: {
            type: "string",
            title: "Channel name",
          },
          taggerIdIn: {
            type: "string",
            title: "Tagger Slack id",
          },
          threadTsIn: {
            type: "string",
            title: "Thread ts",
          },
          managerIdIn: {
            type: "string",
            title: "Manager Slack id",
          },
          hasManagerIn: {
            type: "string",
            title: "Has manager",
          },
          nowMsIn: {
            type: "integer",
            title: "Now (epoch ms)",
          },
          tzIn: {
            type: "string",
            title: "Timezone",
          },
          chClientNameIn: {
            type: "string",
            title: "Channel client name",
          },
          chClientSlugIn: {
            type: "string",
            title: "Channel client slug",
          },
          oOk: {
            type: "boolean",
            title: "Tagger lookup ok",
          },
          oError: {
            type: "string",
            title: "Tagger lookup error",
          },
          oReal: {
            type: "string",
            title: "Tagger real name",
          },
          oDisplay: {
            type: "string",
            title: "Tagger display name",
          },
          oHandle: {
            type: "string",
            title: "Tagger handle",
          },
          oEmail: {
            type: "string",
            title: "Tagger email",
          },
          oAvatar: {
            type: "string",
            title: "Tagger picture",
          },
          mOk: {
            type: "boolean",
            title: "Manager lookup ok",
          },
          mError: {
            type: "string",
            title: "Manager lookup error",
          },
          mReal: {
            type: "string",
            title: "Manager real name",
          },
          mDisplay: {
            type: "string",
            title: "Manager display name",
          },
          mHandle: {
            type: "string",
            title: "Manager handle",
          },
          mEmail: {
            type: "string",
            title: "Manager email",
          },
        },
      },
      code: "import java.time.Instant\nimport java.time.ZoneId\nimport java.time.format.DateTimeFormatter\ndef val = { String n -> binding.hasVariable(n) ? binding.getVariable(n) : null }\ndef txt = { String n -> val(n) == null ? '' : val(n).toString().trim() }\ndef isTrue = { String n -> val(n) != null && val(n).toString() == 'true' }\ndef slug = { String s -> s.toLowerCase().replaceAll('[^a-z0-9]+', '-').replaceAll('^-+', '').replaceAll('-+$', '') }\ndef hasManager = txt('hasManagerIn') == 'yes'\ndef taggerId = txt('taggerIdIn')\ndef managerId = txt('managerIdIn')\ndef useCase = txt('useCaseIn')\ndef errors = []\nif (!isTrue('oOk')) {\n  errors << ('Could not look up the tagger ' + taggerId + ' in Slack' + (txt('oError') ? ' (' + txt('oError') + ')' : ''))\n}\nif (hasManager && !isTrue('mOk')) {\n  errors << ('Could not look up the manager ' + managerId + ' in Slack' + (txt('mError') ? ' (' + txt('mError') + ')' : ''))\n}\ndef ownerName = txt('oReal') ?: txt('oDisplay') ?: txt('oHandle') ?: taggerId\ndef mgrName = hasManager ? (txt('mReal') ?: txt('mDisplay') ?: txt('mHandle') ?: managerId) : ''\ndef mgrEmail = hasManager ? txt('mEmail') : ''\ndef zone\ntry { zone = ZoneId.of(txt('tzIn')) } catch (Exception e) { zone = ZoneId.of('UTC') }\nlong nowMs = val('nowMsIn') == null ? 0L : (val('nowMsIn') as long)\nif (nowMs <= 0L) { nowMs = System.currentTimeMillis() }\ndef today = Instant.ofEpochMilli(nowMs).atZone(zone).format(DateTimeFormatter.ofPattern('yyyyMMdd'))\ndef clientName = txt('chClientNameIn')\ndef clientSlug = txt('chClientSlugIn')\nif (!clientName) {\n  def first = useCase ? useCase.split(' ')[0] : ''\n  clientName = first ? first.substring(0, 1).toUpperCase() + first.substring(1) : 'Client'\n  clientSlug = slug(first)\n} else if (!clientSlug) {\n  clientSlug = slug(clientName)\n}\nif (!clientSlug) { clientSlug = 'client' }\ndef ucSlug = slug(useCase)\ndef fullSlug = ucSlug ?: 'use-case'\nif (ucSlug.startsWith(clientSlug + '-')) { ucSlug = ucSlug.substring(clientSlug.length() + 1) }\nif (ucSlug.endsWith('-use-case')) { ucSlug = ucSlug.substring(0, ucSlug.length() - 9) }\nif (!ucSlug) { ucSlug = fullSlug }\ndef pocId = 'POC-' + clientSlug + '-' + ucSlug + '-' + today\ndef threadTs = txt('threadTsIn')\ndef channelId = txt('channelIdIn')\ndef channelName = txt('channelNameIn')\ndef activityId = threadTs ? ('SLK-' + channelId + '-' + threadTs) : ('ACT-' + nowMs + '-1')\ndef lastTs = nowMs.intdiv(1000L).toString() + '.000000'\ndef message\nif (hasManager) {\n  message = 'Created POC ' + pocId + ' for \"' + useCase + '\" (client ' + clientName + ', owner ' + ownerName + ', manager ' + mgrName + ').'\n} else {\n  message = 'Created POC ' + pocId + ' for \"' + useCase + '\" (client ' + clientName + ', owner ' + ownerName + '). No manager yet: ask who the manager is.'\n}\nresult = [failed: (errors ? 'yes' : 'no'), error: errors.join('; '), pocId: pocId, clientName: clientName, clientSlug: clientSlug, ownerName: ownerName, ownerEmail: txt('oEmail'), ownerAvatar: txt('oAvatar'), mgrName: mgrName, mgrEmail: mgrEmail, managerId: (hasManager ? managerId : ''), botThreadTs: (hasManager ? '' : threadTs), slackLastTs: lastTs, activityId: activityId, activityMessage: ownerName + ' started the POC \"' + useCase + '\" from Slack', lastActivity: 'Started from Slack by ' + ownerName, postedTo: '#' + channelName, threadTs: threadTs, hasManager: (hasManager ? 'yes' : 'no'), message: message]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        useCaseIn: normalizeAndValidateTheInputs.result.useCase,
        channelIdIn: normalizeAndValidateTheInputs.result.channelId,
        channelNameIn: normalizeAndValidateTheInputs.result.channelName,
        taggerIdIn: normalizeAndValidateTheInputs.result.taggerId,
        threadTsIn: normalizeAndValidateTheInputs.result.threadTs,
        managerIdIn: normalizeAndValidateTheInputs.result.managerId,
        hasManagerIn: normalizeAndValidateTheInputs.result.hasManager,
        nowMsIn: RUN.currentTime,
        tzIn: RUN.timezone,
        chClientNameIn: readAnExistingPocRowOfTheSameChannelForItsClient.objects[0].properties.client_name,
        chClientSlugIn: readAnExistingPocRowOfTheSameChannelForItsClient.objects[0].properties.client_slug,
        oOk: lookUpTheTaggerInSlack.ok,
        oError: lookUpTheTaggerInSlack.error,
        oReal: lookUpTheTaggerInSlack.user.real_name,
        oDisplay: lookUpTheTaggerInSlack.user.profile.display_name,
        oHandle: lookUpTheTaggerInSlack.user.name,
        oEmail: lookUpTheTaggerInSlack.user.profile.email,
        oAvatar: lookUpTheTaggerInSlack.user.profile.image_72,
        mOk: slack.ok,
        mError: slack.error,
        mReal: slack.user.real_name,
        mDisplay: slack.user.profile.display_name,
        mHandle: slack.user.name,
        mEmail: slack.user.profile.email,
      },
    });
    // Answer error when a Slack lookup failed
    if (and(
      eq(workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.failed, "yes"),
    )) {
      // Callable
      return {
        status: "error",
        poc_id: "=\"\"",
        message: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.error,
      };
    }
    // Look for a row that already holds the generated POC id
    const lookForARowThatAlreadyHoldsTheGeneratedPocId = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      triggerInputCondition: and(
        eq("properties_poc_id", workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.pocId),
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
    // Answer exists when that id is already taken
    if (and(
      exists(lookForARowThatAlreadyHoldsTheGeneratedPocId.objects[0].id),
    )) {
      // Callable
      return {
        status: "exists",
        poc_id: lookForARowThatAlreadyHoldsTheGeneratedPocId.objects[0].properties.poc_id,
        message: `A POC with the id ${lookForARowThatAlreadyHoldsTheGeneratedPocId.objects[0].properties.poc_id} already exists (use case "${lookForARowThatAlreadyHoldsTheGeneratedPocId.objects[0].properties.use_case}", channel #${lookForARowThatAlreadyHoldsTheGeneratedPocId.objects[0].properties.slack_channel}). Nothing was created.`,
      };
    }
    // Create the POC row, leaving out the values that are blank
    op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
      useRawPayload: false,
      writeThroughSessionVariables: false,
      object_type: "psl_poc",
      skipIfBlank: true,
      inlineRefresh: false,
      record: {
        poc_id: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.pocId,
        client_name: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.clientName,
        client_slug: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.clientSlug,
        use_case: normalizeAndValidateTheInputs.result.useCase,
        owner_name: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.ownerName,
        owner_email: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.ownerEmail,
        started_by: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.ownerName,
        started_at: RUN.currentTime,
        stage: "0_kickoff",
        current_gate: "none",
        g1_status: "pending",
        g2_status: "pending",
        g3_status: "pending",
        g4_status: "pending",
        status: "running",
        slack_channel: normalizeAndValidateTheInputs.result.channelName,
        last_activity: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.lastActivity,
        last_activity_at: RUN.currentTime,
        manager_name: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.mgrName,
        manager_email: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.mgrEmail,
        g1_owner_approved: false,
        g2_owner_approved: false,
        g3_owner_approved: false,
        g4_owner_approved: false,
        g1_manager_approved: false,
        g2_manager_approved: false,
        g3_manager_approved: false,
        g4_manager_approved: false,
        slack_channel_id: normalizeAndValidateTheInputs.result.channelId,
        owner_slack_id: normalizeAndValidateTheInputs.result.taggerId,
        manager_slack_id: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.managerId,
        slack_last_ts: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.slackLastTs,
        bot_thread_ts: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.botThreadTs,
        slack_live: true,
      },
      useUuid: false,
      batching: false,
    });
    // Log the poc_started activity
    op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
      useRawPayload: false,
      writeThroughSessionVariables: false,
      object_type: "psl_activity",
      skipIfBlank: true,
      inlineRefresh: false,
      record: {
        activity_id: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.activityId,
        poc: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.pocId,
        type: "poc_started",
        stage: "0_kickoff",
        gate: "none",
        actor_type: "person",
        actor_name: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.ownerName,
        actor_email: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.ownerEmail,
        message: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.activityMessage,
        posted_to: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.postedTo,
        created_at: RUN.currentTime,
        actor_avatar_url: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.ownerAvatar,
        slack_ts: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.threadTs,
      },
      useUuid: false,
      batching: false,
    });
    // Answer created when the manager is known
    if (and(
      eq(workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.hasManager, "yes"),
    )) {
      // Callable
      return {
        status: "created",
        poc_id: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.pocId,
        message: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.message,
      };
    }
    // Answer needs_manager
    return {
      status: "needs_manager",
      poc_id: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.pocId,
      message: workOutTheClientTheIdsAndTheTextsOfTheNewPoc.result.message,
    };
  },
);
