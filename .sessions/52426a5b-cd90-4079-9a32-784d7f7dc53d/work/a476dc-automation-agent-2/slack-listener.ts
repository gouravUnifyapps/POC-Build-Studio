import { automation, appEvent, branch, and, or, eq, ne, missing, exists, op, stop, RUN, TRIGGER } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Slack listener",
    description: "Hears the Slack new-message event of the POC Studio Live Slack connection. Ignores bots and the bot's own messages. Four branches: the bot joined a channel (link its use case rows and say so), the bot was tagged at the top of a channel (the POC Studio Agent answers in a thread), a reply in a manager question thread (the agent answers in the thread), and an owner's 'approve' reply under a gate post (calls Approve gate).",
    trigger: appEvent(
      "slack",
      "slack_on_new_message",
      {
        triggerInputCondition: and(
          missing(TRIGGER.event.bot_id),
          or(
            ne(TRIGGER.event.user, "U0C9P6MFR62"),
            eq(TRIGGER.event.type, "member_joined_channel"),
          ),
        ),
      },
      { connectionId: "6ad1be602ac9ba64653a9d36" },
    ),
  },
  (t) => {
    // Classify the event
    const ev = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: {
          evType: { type: "string", title: "Event type" },
          evSubtype: { type: "string", title: "Subtype" },
          evUser: { type: "string", title: "User" },
          evBotId: { type: "string", title: "Bot id" },
          evText: { type: "string", title: "Text" },
          evTs: { type: "string", title: "Message ts" },
          evThreadTs: { type: "string", title: "Thread ts" },
          nowMs: { type: "number", title: "Now in epoch ms" },
        },
      },
      output: {
        type: "object",
        properties: {
          kind: { type: "string", title: "Kind" },
          nowTs: { type: "string", title: "Now as a Slack ts" },
          live: { type: "boolean", title: "Slack live flag" },
        },
      },
      parameters: {
        evType: t.event.type,
        evSubtype: t.event.subtype,
        evUser: t.event.user,
        evBotId: t.event.bot_id,
        evText: t.event.text,
        evTs: t.event.ts,
        evThreadTs: t.event.thread_ts,
        nowMs: RUN.currentTime,
      },
      code: [
        "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
        "def str = { String name -> (value(name)?.toString() ?: '').trim() }",
        "def bot = 'U0C9P6MFR62'",
        "def type = str('evType')",
        "def subtype = str('evSubtype')",
        "def user = str('evUser')",
        "def ts = str('evTs')",
        "def threadTs = str('evThreadTs')",
        "def body = (value('evText')?.toString() ?: '')",
        "def kind = 'ignore'",
        "if (str('evBotId')) {",
        "  kind = 'ignore'",
        "} else if (type == 'member_joined_channel') {",
        "  kind = (user == bot) ? 'joined' : 'ignore'",
        "} else if (type == 'message' && user && user != bot && (!subtype || subtype in ['thread_broadcast', 'file_share'])) {",
        "  if (threadTs && threadTs != ts) {",
        "    kind = (body.trim().toLowerCase() == 'approve') ? 'approve' : 'reply'",
        "  } else if (body.contains('<@' + bot + '>')) {",
        "    kind = 'tag'",
        "  }",
        "}",
        "long ms = (value('nowMs') ?: 0) as long",
        "def nowTs = String.format('%d.%06d', ms.intdiv(1000L), (ms % 1000L) * 1000L)",
        "result = [kind: kind, nowTs: nowTs, live: true]",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Route the event
    branch([
      {
        name: "Bot joined a channel",
        when: eq(ev.result.kind, "joined"),
        then: () => {
          // Read the channel name
          const chan = op(
            "slack",
            "slack_get_conversation",
            { channelId: t.event.channel, token_type: "bot_token" },
            { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" },
          );

          // Channel name read?
          if (exists(chan.channel.name)) {
            // Find the use case rows of this channel name
            const linked = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
              object_type: "psl_poc",
              numberOfRecordsToFetch: "MULTIPLE",
              triggerInputCondition: eq("properties_slack_channel", chan.channel.name),
              page: { paginateBy: "OFFSET", limit: 100, offset: 0 },
            });

            // The update form types setValue as text, so slack_live takes the real boolean from the
            // classify step's `live` output (a pill keeps its type), not the literal true.
            // For each use case row of the channel
            for (const row of linked.objects) {
              // Link the row to the channel
              op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
                object_type: "psl_poc",
                recordId: row.id,
                updateFields: [
                  { fieldName: "properties.slack_channel_id", actionType: "SET", setValue: t.event.channel },
                  { fieldName: "properties.slack_live", actionType: "SET", setValue: ev.result.live },
                  { fieldName: "properties.slack_last_ts", actionType: "SET", setValue: ev.result.nowTs },
                ],
              });
            }

            // Write the message to post
            const note = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
              input: {
                type: "object",
                properties: {
                  names: { type: "array", items: { type: "string" }, title: "Use case names" },
                },
              },
              output: {
                type: "object",
                properties: {
                  text: { type: "string", title: "Message" },
                  count: { type: "number", title: "Linked count" },
                },
              },
              parameters: {
                names: linked.objects.map((r) => r.properties.use_case),
              },
              code: [
                "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
                "def names = (value('names') ?: []) as List",
                "def cleaned = names.collect { (it?.toString() ?: '').trim().replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;') }.findAll { it }",
                "def message = cleaned.isEmpty() ? 'Tag me with the use case name to start a POC' : ('Linked ' + cleaned.size() + ' use case(s): ' + cleaned.join(', '))",
                "result = [text: message.toString(), count: cleaned.size()]",
              ].join("\n"),
              compile_static: false,
              captureStdOutput: false,
            });

            // Say what was linked in the channel
            op(
              "slack",
              "slack_post_message_in_channel",
              {
                token_type: "bot_token",
                channel: t.event.channel,
                messageType: "text",
                text: note.result.text,
              },
              { connectionId: "6ad1be602ac9ba64653a9d36" },
            );
          }
        },
      },
      {
        name: "Bot tagged at the top of a channel",
        when: eq(ev.result.kind, "tag"),
        then: () => {
          // Read the thread of the tag message
          const thread = op(
            "slack",
            "slack_list_conversations_replies",
            { token_type: "bot_token", channel: t.event.channel, ts: t.event.ts, limit: 50 },
            { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" },
          );

          // Look for a reply by the bot
          const seen = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
            input: {
              type: "object",
              properties: {
                messages: { type: "array", items: { type: "object" }, title: "Thread messages" },
                eventTs: { type: "string", title: "Message ts" },
              },
            },
            output: {
              type: "object",
              properties: {
                answered: { type: "boolean", title: "Already answered" },
              },
            },
            parameters: {
              messages: thread.messages.map((m) => ({ user: m.user, ts: m.ts })),
              eventTs: t.event.ts,
            },
            code: [
              "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
              "def msgs = (value('messages') ?: []) as List",
              "def eventTs = (value('eventTs')?.toString() ?: '').trim()",
              "def answered = false",
              "if (eventTs) {",
              "  def mine = new BigDecimal(eventTs)",
              "  msgs.each { m ->",
              "    def u = m?.user?.toString()",
              "    def s = m?.ts?.toString()",
              "    if (u == 'U0C9P6MFR62' && s && new BigDecimal(s) > mine) { answered = true }",
              "  }",
              "}",
              "result = [answered: answered]",
            ].join("\n"),
            compile_static: false,
            captureStdOutput: false,
          });

          // Not answered yet?
          if (eq(seen.result.answered, false)) {
            // Read the channel name
            const chan = op(
              "slack",
              "slack_get_conversation",
              { channelId: t.event.channel, token_type: "bot_token" },
              { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" },
            );

            // Ask the POC Studio Agent
            const agent = op(
              "ai_agents_by_unifyapps",
              "ai_agents_by_unifyapps_invoke_agent",
              {
                callableInterfaceId: "__ua__invoke_ai_agent_by_unifyapps",
                defaultFallbackWorkflowId: "68050ca67df58855654804a0",
                triggerWorkflowWithRuntimeType: "IN_MEMORY",
                parameters: {
                  aiAgentId: "e_6ad1ca0bc0f97b3e983d2679",
                  userQuery: `channel id: ${t.event.channel}\nchannel name: ${chan.channel.name}\ntagger slack id: ${t.event.user}\nthread ts: ${t.event.ts}\ntext: ${t.event.text}`,
                },
              },
              { onError: "CONTINUE" },
            );

            // Make the reply safe to post
            const safe = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
              input: {
                type: "object",
                properties: {
                  reply: { type: "string", title: "Agent reply" },
                },
              },
              output: {
                type: "object",
                properties: {
                  text: { type: "string", title: "Reply to post" },
                },
              },
              parameters: {
                reply: agent.publicResponse[0].text,
              },
              code: [
                "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
                "def raw = (value('reply')?.toString() ?: '').trim()",
                "def safe = raw ? raw.replace('<!', '&lt;!') : 'I could not work that out just now. Please tag me again.'",
                "result = [text: safe.toString()]",
              ].join("\n"),
              compile_static: false,
              captureStdOutput: false,
            });

            // Post the reply under the tag message
            op(
              "slack",
              "slack_post_message_in_channel",
              {
                token_type: "bot_token",
                channel: t.event.channel,
                messageType: "text",
                text: safe.result.text,
                thread_ts: t.event.ts,
              },
              { connectionId: "6ad1be602ac9ba64653a9d36" },
            );
          }
        },
      },
      {
        name: "Reply in a manager question thread",
        when: eq(ev.result.kind, "reply"),
        then: () => {
          // Find the row whose manager question thread this is
          const rows = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
            object_type: "psl_poc",
            numberOfRecordsToFetch: "MULTIPLE",
            triggerInputCondition: and(
              eq("properties_slack_channel_id", t.event.channel),
              eq("properties_bot_thread_ts", t.event.thread_ts),
            ),
            page: { paginateBy: "OFFSET", limit: 20, offset: 0 },
          });

          // Pick the row that still has no manager
          const pick = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
            input: {
              type: "object",
              properties: {
                rows: { type: "array", items: { type: "object" }, title: "Rows of the thread" },
              },
            },
            output: {
              type: "object",
              properties: {
                found: { type: "boolean", title: "Found" },
                pocId: { type: "string", title: "POC id" },
                channelName: { type: "string", title: "Channel name" },
              },
            },
            parameters: {
              rows: rows.objects.map((r) => ({
                pocId: r.properties.poc_id,
                managerSlackId: r.properties.manager_slack_id,
                channelName: r.properties.slack_channel,
              })),
            },
            code: [
              "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
              "def rows = (value('rows') ?: []) as List",
              "def hit = rows.find { r -> (r?.pocId?.toString() ?: '').trim() && !((r?.managerSlackId?.toString() ?: '').trim()) }",
              "result = [found: hit != null, pocId: (hit ? hit.pocId.toString() : ''), channelName: (hit ? (hit.channelName?.toString() ?: '') : '')]",
            ].join("\n"),
            compile_static: false,
            captureStdOutput: false,
          });

          // Manager thread with no manager yet?
          if (eq(pick.result.found, true)) {
            // Read the thread
            const thread = op(
              "slack",
              "slack_list_conversations_replies",
              { token_type: "bot_token", channel: t.event.channel, ts: t.event.thread_ts, limit: 200 },
              { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" },
            );

            // Look for a reply by the bot after this message
            const seen = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
              input: {
                type: "object",
                properties: {
                  messages: { type: "array", items: { type: "object" }, title: "Thread messages" },
                  eventTs: { type: "string", title: "Message ts" },
                },
              },
              output: {
                type: "object",
                properties: {
                  answered: { type: "boolean", title: "Already answered" },
                },
              },
              parameters: {
                messages: thread.messages.map((m) => ({ user: m.user, ts: m.ts })),
                eventTs: t.event.ts,
              },
              code: [
                "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
                "def msgs = (value('messages') ?: []) as List",
                "def eventTs = (value('eventTs')?.toString() ?: '').trim()",
                "def answered = false",
                "if (eventTs) {",
                "  def mine = new BigDecimal(eventTs)",
                "  msgs.each { m ->",
                "    def u = m?.user?.toString()",
                "    def s = m?.ts?.toString()",
                "    if (u == 'U0C9P6MFR62' && s && new BigDecimal(s) > mine) { answered = true }",
                "  }",
                "}",
                "result = [answered: answered]",
              ].join("\n"),
              compile_static: false,
              captureStdOutput: false,
            });

            // Not answered yet?
            if (eq(seen.result.answered, false)) {
              // Ask the POC Studio Agent
              const agent = op(
                "ai_agents_by_unifyapps",
                "ai_agents_by_unifyapps_invoke_agent",
                {
                  callableInterfaceId: "__ua__invoke_ai_agent_by_unifyapps",
                  defaultFallbackWorkflowId: "68050ca67df58855654804a0",
                  triggerWorkflowWithRuntimeType: "IN_MEMORY",
                  parameters: {
                    aiAgentId: "e_6ad1ca0bc0f97b3e983d2679",
                    userQuery: `channel id: ${t.event.channel}\nchannel name: ${pick.result.channelName}\ntagger slack id: ${t.event.user}\nthread ts: ${t.event.thread_ts}\npoc id: ${pick.result.pocId}\ntext: ${t.event.text}`,
                  },
                },
                { onError: "CONTINUE" },
              );

              // Make the reply safe to post
              const safe = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
                input: {
                  type: "object",
                  properties: {
                    reply: { type: "string", title: "Agent reply" },
                  },
                },
                output: {
                  type: "object",
                  properties: {
                    text: { type: "string", title: "Reply to post" },
                  },
                },
                parameters: {
                  reply: agent.publicResponse[0].text,
                },
                code: [
                  "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
                  "def raw = (value('reply')?.toString() ?: '').trim()",
                  "def safe = raw ? raw.replace('<!', '&lt;!') : 'I could not work that out just now. Please reply again.'",
                  "result = [text: safe.toString()]",
                ].join("\n"),
                compile_static: false,
                captureStdOutput: false,
              });

              // Post the reply in the thread
              op(
                "slack",
                "slack_post_message_in_channel",
                {
                  token_type: "bot_token",
                  channel: t.event.channel,
                  messageType: "text",
                  text: safe.result.text,
                  thread_ts: t.event.thread_ts,
                },
                { connectionId: "6ad1be602ac9ba64653a9d36" },
              );
            }
          }
        },
      },
      {
        name: "Owner approve reply",
        when: eq(ev.result.kind, "approve"),
        then: () => {
          // Read the post the reply sits under
          const parent = op(
            "slack",
            "slack_list_conversations_replies",
            { token_type: "bot_token", channel: t.event.channel, ts: t.event.thread_ts, limit: 1 },
            { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" },
          );

          // Read the POC id from the first line of the bot post
          const gate = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
            input: {
              type: "object",
              properties: {
                parentText: { type: "string", title: "Parent post text" },
                parentUser: { type: "string", title: "Parent post author" },
              },
            },
            output: {
              type: "object",
              properties: {
                found: { type: "boolean", title: "Found" },
                pocId: { type: "string", title: "POC id" },
              },
            },
            parameters: {
              parentText: parent.messages[0].text,
              parentUser: parent.messages[0].user,
            },
            code: [
              "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
              "def first = (value('parentText')?.toString() ?: '').split(/\\r?\\n/, 2)[0]",
              "def m = (first =~ /\\[(POC-[A-Za-z0-9._-]+)\\]/)",
              "def pocId = m.find() ? m.group(1) : ''",
              "def fromBot = (value('parentUser')?.toString() ?: '') == 'U0C9P6MFR62'",
              "result = [found: (pocId != '' && fromBot), pocId: pocId]",
            ].join("\n"),
            compile_static: false,
            captureStdOutput: false,
          });

          // Bot post that names a POC?
          if (eq(gate.result.found, true)) {
            // Read the POC row
            const row = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
              object_type: "psl_poc",
              numberOfRecordsToFetch: "SINGLE",
              triggerInputCondition: eq("properties_poc_id", gate.result.pocId),
            });

            // Sent by the owner of the row?
            if (and(exists(row.id), eq(row.properties.owner_slack_id, t.event.user))) {
              // Approve the gate as the owner
              op("callables", "callables_call_automation", {
                automationId: "6ad1c75967956c53e38f1a70",
                version: "-1",
                synchronous: true,
                parameters: {
                  poc_id: gate.result.pocId,
                  role: "owner",
                  caller_slack_id: t.event.user,
                },
              });
            }
          }
        },
      },
    ]);

    // Done
    stop();
  },
);
