import { automation, eq, ne, op, schedule, scope, stop } from "@ua/automations";

const SLACK = "6ad1be602ac9ba64653a9d36";
const BOT_USER_ID = "U0C9P6MFR62";

export default automation(
  {
    name: "POC Studio Live · Read channels into History",
    description:
      "Every minute, reads the Slack channels of the POC rows that are live, matches each new message to a use case row, and writes it to History as an activity row (and a document row when it carries a file). Then moves each row's Slack cursor. One run at a time; one failing channel never stops the others.",
    trigger: schedule({ cron: "INTERVAL", frequency: "MINUTES", interval: 1, sequential: true }),
  },
  () => {
    // Read the live POC rows
    const live = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      object_type: "psl_poc",
      numberOfRecordsToFetch: "MULTIPLE",
      page: { paginateBy: "OFFSET", limit: 200, offset: 0 },
      triggerInputCondition: eq("properties_slack_live", true),
    });

    // Group the live rows by channel, with the oldest cursor of each channel (a row never read counts as 0)
    const channels = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: { rows: { type: "array", items: { type: "object" } } },
      },
      output: {
        type: "object",
        properties: {
          channels: {
            type: "array",
            items: {
              type: "object",
              properties: {
                channel_id: { type: "string" },
                oldest: { type: "string" },
                rows: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      poc_id: { type: "string" },
                      use_case: { type: "string" },
                      stage: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        required: ["channels"],
      },
      parameters: {
        rows: live.objects.map((r) => ({
          id: r.id,
          poc_id: r.properties.poc_id,
          use_case: r.properties.use_case,
          stage: r.properties.stage,
          slack_channel_id: r.properties.slack_channel_id,
          slack_last_ts: r.properties.slack_last_ts,
        })),
      },
      code: [
        "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
        "def text = { v -> v == null ? '' : v.toString().trim() }",
        "def rows = ((value('rows') ?: []) as List).findAll { it instanceof Map }",
        "def byChannel = new LinkedHashMap()",
        "rows.each { r ->",
        "  def ch = text(r.slack_channel_id)",
        "  if (ch) {",
        "    if (!byChannel.containsKey(ch)) byChannel[ch] = []",
        "    byChannel[ch] << r",
        "  }",
        "}",
        "def channels = []",
        "byChannel.each { ch, list ->",
        "  def cursors = list.collect { text(it.slack_last_ts) }",
        "  def allSet = cursors.every { it && it.isNumber() }",
        "  def oldest = allSet ? cursors.min { new BigDecimal(it) } : '0'",
        "  channels << [",
        "    channel_id: ch,",
        "    oldest: oldest.toString(),",
        "    rows: list.collect { r -> [id: text(r.id), poc_id: text(r.poc_id), use_case: text(r.use_case), stage: text(r.stage)] }",
        "  ]",
        "}",
        "result = [channels: channels]",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Loop over the channels, one at a time
    for (const ch of channels.result.channels) {
      // A channel that fails is logged and skipped; the next channel carries on
      try {
        // Handle the channel as one unit
        scope(op("scope", "scope_trigger_scope", {}), () => {
          // Read the channel's messages newer than the oldest cursor
          const history = op(
            "slack",
            "slack_list_conversation_history",
            {
              token_type: "bot_token",
              channel: ch.channel_id,
              oldest: ch.oldest,
              limit: 200,
            },
            { connectionId: SLACK },
          );

          // Pick the messages that belong to a use case row, oldest first, and convert each Slack time to epoch milliseconds
          const prep = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
            input: {
              type: "object",
              properties: {
                channel_id: { type: "string" },
                bot_user_id: { type: "string" },
                messages: { type: "array", items: { type: "object" } },
                rows: { type: "array", items: { type: "object" } },
              },
            },
            output: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      activity_id: { type: "string" },
                      poc_id: { type: "string" },
                      stage: { type: "string" },
                      ts: { type: "string" },
                      user: { type: "string" },
                      fallback_name: { type: "string" },
                      type: { type: "string" },
                      text: { type: "string" },
                      created_at: { type: "integer" },
                      files: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            document_id: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
                newest_ts: { type: "string" },
                row_updates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      poc_id: { type: "string" },
                      matched: { type: "boolean" },
                      last_activity: { type: "string" },
                      last_activity_at: { type: "integer" },
                    },
                  },
                },
                message_count: { type: "integer" },
                item_count: { type: "integer" },
              },
              required: ["items", "newest_ts", "row_updates"],
            },
            parameters: {
              channel_id: ch.channel_id,
              bot_user_id: BOT_USER_ID,
              messages: history.messages,
              rows: ch.rows.map((r) => ({ id: r.id, poc_id: r.poc_id, use_case: r.use_case, stage: r.stage })),
            },
            code: [
              "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
              "def text = { v -> v == null ? '' : v.toString().trim() }",
              "def slug = { s -> text(s).toLowerCase().replaceAll(/[^a-z0-9]+/, '-').replaceAll(/^-+|-+$/, '') }",
              "def bot = text(value('bot_user_id'))",
              "def channel = text(value('channel_id'))",
              "def rows = ((value('rows') ?: []) as List).findAll { it instanceof Map }",
              "def msgs = ((value('messages') ?: []) as List).findAll { it instanceof Map && text(it.ts).isNumber() }",
              "msgs = msgs.sort(false) { a, b -> new BigDecimal(text(a.ts)) <=> new BigDecimal(text(b.ts)) }",
              "def newest = msgs.isEmpty() ? '' : text(msgs[-1].ts)",
              "def skipSubtypes = ['channel_join', 'channel_leave', 'group_join', 'group_leave']",
              "def items = []",
              "def lastByPoc = [:]",
              "msgs.each { m ->",
              "  def ts = text(m.ts)",
              "  def body = text(m.text)",
              "  def user = text(m.user)",
              "  if (user == bot) return",
              "  if (text(m.subtype) in skipSubtypes) return",
              "  if (body ==~ /^<@[A-Z0-9]+> has (joined|left) the (channel|group|conversation)\\.?$/) return",
              "  if (bot && body.contains('<@' + bot + '>')) return",
              "  def lower = body.toLowerCase()",
              "  def matched = rows.size() == 1 ? [rows[0]] : rows.findAll { r ->",
              "    def uc = text(r.use_case).toLowerCase()",
              "    def pid = text(r.poc_id).toLowerCase()",
              "    (uc && lower.contains(uc)) || (pid && lower.contains(pid))",
              "  }",
              "  if (matched.isEmpty()) return",
              "  def files = ((m.files ?: []) as List).findAll { it instanceof Map }",
              "  def createdAt = (new BigDecimal(ts) * 1000).toBigInteger().longValue()",
              "  def username = text(m.username)",
              "  matched.each { r ->",
              "    def poc = text(r.poc_id)",
              "    def stage = text(r.stage)",
              "    def docs = files.collect { f ->",
              "      def fname = text(f.name) ?: (text(f.title) ?: 'Slack file')",
              "      def fid = text(f.id) ?: ts.replace('.', '')",
              "      [name: fname, document_id: (poc + '__' + stage + '__' + (slug(fname) ?: 'file') + '-' + fid.toLowerCase() + '__v1').toString()]",
              "    }",
              "    items << [",
              "      activity_id: ('SLK-' + channel + '-' + ts + (matched.size() > 1 ? '-' + poc : '')).toString(),",
              "      poc_id: poc, stage: stage, ts: ts, user: user,",
              "      fallback_name: (username ?: (user ?: 'Slack user')),",
              "      type: files.isEmpty() ? 'input_added' : 'document_saved',",
              "      text: body ?: (files.isEmpty() ? '(no text)' : 'Shared a file'),",
              "      created_at: createdAt, files: docs",
              "    ]",
              "    def snippet = body ? (body.length() > 140 ? body.substring(0, 140) : body) : 'shared a file'",
              "    lastByPoc[poc] = [text: ('Slack: ' + snippet).toString(), at: createdAt]",
              "  }",
              "}",
              "def updates = rows.collect { r ->",
              "  def poc = text(r.poc_id)",
              "  def hit = lastByPoc[poc]",
              "  [id: text(r.id), poc_id: poc, matched: hit != null, last_activity: hit ? hit.text : '', last_activity_at: hit ? hit.at : 0L]",
              "}",
              "result = [items: items, newest_ts: newest, row_updates: updates, message_count: msgs.size(), item_count: items.size()]",
            ].join("\n"),
            compile_static: false,
            captureStdOutput: false,
          });

          // Loop over the matched messages, oldest first
          for (const msg of prep.result.items) {
            // Look up the sender
            const sender = op(
              "slack",
              "slack_get_user_info_by_id",
              { user: msg.user },
              { connectionId: SLACK, onError: "CONTINUE" },
            );

            // Get the message permalink
            const link = op(
              "slack",
              "slack_chat_get_permalink",
              { token_type: "bot_token", channel: ch.channel_id, message_ts: msg.ts },
              { connectionId: SLACK, onError: "CONTINUE" },
            );

            // Pick the sender's name
            const who = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
              input: {
                type: "object",
                properties: {
                  real_name: { type: "string" },
                  display_name: { type: "string" },
                  fallback: { type: "string" },
                },
              },
              output: {
                type: "object",
                properties: { actor_name: { type: "string" } },
                required: ["actor_name"],
              },
              parameters: {
                real_name: sender.user.real_name,
                display_name: sender.user.profile.display_name,
                fallback: msg.fallback_name,
              },
              code: [
                "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
                "def text = { v -> v == null ? '' : v.toString().trim() }",
                "def name = text(value('real_name')) ?: (text(value('display_name')) ?: (text(value('fallback')) ?: 'Slack user'))",
                "result = [actor_name: name.toString()]",
              ].join("\n"),
              compile_static: false,
              captureStdOutput: false,
            });

            // Write the activity row; an upsert, so a repeat cannot fail
            op("storage_by_unifyapps", "storage_by_unifyapps_update_record_by_id", {
              object_type: "psl_activity",
              recordId: msg.activity_id,
              upsert: true,
              record: {
                activity_id: msg.activity_id,
                poc: msg.poc_id,
                type: msg.type,
                stage: msg.stage,
                actor_type: "person",
                actor_name: who.result.actor_name,
                actor_email: sender.user.profile.email,
                actor_avatar_url: sender.user.profile.image_72,
                message: msg.text,
                slack_ts: msg.ts,
                slack_ref: link.permalink,
                created_at: msg.created_at,
              },
            });

            // Loop over the files the message carries
            for (const file of msg.files) {
              // Write the document row; an upsert, so a repeat cannot fail
              op("storage_by_unifyapps", "storage_by_unifyapps_update_record_by_id", {
                object_type: "psl_document",
                recordId: file.document_id,
                upsert: true,
                record: {
                  document_id: file.document_id,
                  poc: msg.poc_id,
                  name: file.name,
                  type: "input",
                  stage: msg.stage,
                  gate_pack: "none",
                  version: 1,
                  status: "final",
                  file_link: link.permalink,
                  created_by: who.result.actor_name,
                  saved_at: msg.created_at,
                  format: "link",
                },
              });
            }
          }

          // Any message read?
          if (ne(prep.result.newest_ts, "")) {
            // Loop over the channel's live rows
            for (const upd of prep.result.row_updates) {
              // Move the row's cursor to the newest message read
              op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
                object_type: "psl_poc",
                recordId: upd.id,
                updateFields: [
                  { fieldName: "properties.slack_last_ts", actionType: "SET", setValue: prep.result.newest_ts },
                ],
              });

              // Did a message match this row?
              if (eq(upd.matched, true)) {
                // Stamp the row's last activity
                op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
                  object_type: "psl_poc",
                  recordId: upd.id,
                  updateFields: [
                    { fieldName: "properties.last_activity", actionType: "SET", setValue: upd.last_activity },
                    { fieldName: "properties.last_activity_at", actionType: "SET", setValue: upd.last_activity_at },
                  ],
                });
              }
            }
          }
        });
      } catch {
        // Log the skipped channel
        op("code_by_unifyapps", "code_by_unifyapps_groovy", {
          input: {
            type: "object",
            properties: { channel_id: { type: "string" } },
          },
          output: {
            type: "object",
            properties: { logged: { type: "boolean" } },
            required: ["logged"],
          },
          parameters: { channel_id: ch.channel_id },
          code: [
            "def id = binding.hasVariable('channel_id') ? binding.getVariable('channel_id') : ''",
            "println('Channel ' + id + ' skipped: Slack or storage failed for it; the next channel carries on')",
            "result = [logged: true]",
          ].join("\n"),
          compile_static: false,
          captureStdOutput: true,
        });
      }
    }

    // Done
    stop();
  },
);
