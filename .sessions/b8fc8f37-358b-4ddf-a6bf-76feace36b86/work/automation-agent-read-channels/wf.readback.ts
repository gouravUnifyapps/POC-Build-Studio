import { automation, schedule, op, TRIGGER, and, each, eq, ne, scope, stop } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Read channels into History",
    description: "Every minute, reads the Slack channels of the POC rows that are live, matches each new message to a use case row, and writes it to History as an activity row (and a document row when it carries a file). Then moves each row's Slack cursor. One run at a time; one failing channel never stops the others.",
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
      cron: "INTERVAL",
      sequential: true,
      maxWaitTime: 30,
      interval: 1,
      sequentialRunTimeUnit: "MINUTES",
      frequency: "MINUTES",
    }),
  },
  () => {
    // Read the live POC rows
    const readTheLivePocRows = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      triggerInputCondition: and(
        eq("properties_slack_live", true),
      ),
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
      includeTotalCount: false,
    });
    // Group the live rows by channel, with the oldest cursor of each channel (a row never read counts as 0)
    const groupTheLiveRowsByChannelWithTheOldestCursorOfEachChannelARowNeverReadCountsAs0 = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          channels: {
            type: "array",
            items: {
              type: "object",
              properties: {
                channel_id: {
                  type: "string",
                },
                oldest: {
                  type: "string",
                },
                rows: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                      },
                      poc_id: {
                        type: "string",
                      },
                      use_case: {
                        type: "string",
                      },
                      stage: {
                        type: "string",
                      },
                      last_activity_at: {
                        type: "integer",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        required: [
          "channels",
        ],
      },
      input: {
        type: "object",
        properties: {
          rows: {
            type: "array",
            items: {
              type: "object",
            },
          },
        },
      },
      code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef text = { v -> v == null ? '' : v.toString().trim() }\ndef num = { v -> def sv = text(v); sv.isNumber() ? new BigDecimal(sv).longValue() : 0L }\ndef rows = ((value('rows') ?: []) as List).findAll { it instanceof Map }\ndef byChannel = new LinkedHashMap()\nrows.each { r ->\n  def ch = text(r.slack_channel_id)\n  if (ch) {\n    if (!byChannel.containsKey(ch)) byChannel[ch] = []\n    byChannel[ch] << r\n  }\n}\ndef channels = []\nbyChannel.each { ch, list ->\n  def cursors = list.collect { text(it.slack_last_ts) }\n  def allSet = cursors.every { it && it.isNumber() }\n  def oldest = allSet ? cursors.min { new BigDecimal(it) } : '0'\n  channels << [\n    channel_id: ch,\n    oldest: oldest.toString(),\n    rows: list.collect { r -> [id: text(r.id), poc_id: text(r.poc_id), use_case: text(r.use_case), stage: text(r.stage), last_activity_at: num(r.last_activity_at)] }\n  ]\n}\nresult = [channels: channels]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        rows: readTheLivePocRows.objects.map((v) => ({
          id: v.id,
          poc_id: v.properties.poc_id,
          use_case: v.properties.use_case,
          stage: v.properties.stage,
          slack_channel_id: v.properties.slack_channel_id,
          slack_last_ts: v.properties.slack_last_ts,
          last_activity_at: v.properties.last_activity_at,
        })),
      },
    });
    // Loop over the channels, one at a time
    for (const loopOverTheChannelsOneAtATime of each(groupTheLiveRowsByChannelWithTheOldestCursorOfEachChannelARowNeverReadCountsAs0.result.channels, {
      captureIterations: true,
    })) {
      try {
        // Handle the channel as one unit
        scope(op("scope", "scope_trigger_scope", {}), () => {
          // Read the channel's messages newer than the oldest cursor
          const readTheChannelSMessagesNewerThanTheOldestCursor = op("slack", "slack_list_conversation_history", {
            oldest: loopOverTheChannelsOneAtATime.oldest,
            channel: loopOverTheChannelsOneAtATime.channel_id,
            limit: 200,
            token_type: "bot_token",
          }, { connectionId: "6ad1be602ac9ba64653a9d36" });
          // Pick the messages that belong to a use case row, oldest first, and convert each Slack time to epoch milliseconds
          const pickTheMessagesThatBelongToAUseCaseRowOldestFirstAndConvertEachSlackTimeToEpochMilliseconds = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
            output: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      activity_id: {
                        type: "string",
                      },
                      poc_id: {
                        type: "string",
                      },
                      stage: {
                        type: "string",
                      },
                      ts: {
                        type: "string",
                      },
                      user: {
                        type: "string",
                      },
                      fallback_name: {
                        type: "string",
                      },
                      type: {
                        type: "string",
                      },
                      text: {
                        type: "string",
                      },
                      created_at: {
                        type: "integer",
                      },
                      files: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: {
                              type: "string",
                            },
                            document_id: {
                              type: "string",
                            },
                          },
                        },
                      },
                    },
                  },
                },
                newest_ts: {
                  type: "string",
                },
                row_updates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                      },
                      poc_id: {
                        type: "string",
                      },
                      matched: {
                        type: "boolean",
                      },
                      last_activity: {
                        type: "string",
                      },
                      last_activity_at: {
                        type: "integer",
                      },
                      current_last_activity_at: {
                        type: "integer",
                      },
                    },
                  },
                },
                message_count: {
                  type: "integer",
                },
                item_count: {
                  type: "integer",
                },
              },
              required: [
                "items",
                "newest_ts",
                "row_updates",
              ],
            },
            input: {
              type: "object",
              properties: {
                channel_id: {
                  type: "string",
                },
                bot_user_id: {
                  type: "string",
                },
                messages: {
                  type: "array",
                  items: {
                    type: "object",
                  },
                },
                rows: {
                  type: "array",
                  items: {
                    type: "object",
                  },
                },
              },
            },
            code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef text = { v -> v == null ? '' : v.toString().trim() }\ndef num = { v -> def sv = text(v); sv.isNumber() ? new BigDecimal(sv).longValue() : 0L }\ndef slug = { s -> text(s).toLowerCase().replaceAll(/[^a-z0-9]+/, '-').replaceAll(/^-+|-+$/, '') }\ndef bot = text(value('bot_user_id'))\ndef channel = text(value('channel_id'))\ndef rows = ((value('rows') ?: []) as List).findAll { it instanceof Map }\ndef msgs = ((value('messages') ?: []) as List).findAll { it instanceof Map && text(it.ts).isNumber() }\nmsgs = msgs.sort(false) { a, b -> new BigDecimal(text(a.ts)) <=> new BigDecimal(text(b.ts)) }\ndef newest = msgs.isEmpty() ? '' : text(msgs[-1].ts)\ndef skipSubtypes = ['channel_join', 'channel_leave', 'group_join', 'group_leave']\ndef items = []\ndef lastByPoc = [:]\nmsgs.each { m ->\n  def ts = text(m.ts)\n  def body = text(m.text)\n  def user = text(m.user)\n  if (user == bot) return\n  if (text(m.subtype) in skipSubtypes) return\n  if (body ==~ /^<@[A-Z0-9]+> has (joined|left) the (channel|group|conversation)\\.?$/) return\n  if (bot && body.contains('<@' + bot + '>')) return\n  def lower = body.toLowerCase()\n  def matched = rows.size() == 1 ? [rows[0]] : rows.findAll { r ->\n    def uc = text(r.use_case).toLowerCase()\n    def pid = text(r.poc_id).toLowerCase()\n    (uc && lower.contains(uc)) || (pid && lower.contains(pid))\n  }\n  if (matched.isEmpty()) return\n  def files = ((m.files ?: []) as List).findAll { it instanceof Map }\n  def createdAt = (new BigDecimal(ts) * 1000).toBigInteger().longValue()\n  def username = text(m.username)\n  matched.each { r ->\n    def poc = text(r.poc_id)\n    def stage = text(r.stage)\n    def docs = files.collect { f ->\n      def fname = text(f.name) ?: (text(f.title) ?: 'Slack file')\n      def fid = text(f.id) ?: ts.replace('.', '')\n      [name: fname, document_id: (poc + '__' + stage + '__' + (slug(fname) ?: 'file') + '-' + fid.toLowerCase() + '__v1').toString()]\n    }\n    items << [\n      activity_id: ('SLK-' + channel + '-' + ts + (matched.size() > 1 ? '-' + poc : '')).toString(),\n      poc_id: poc, stage: stage, ts: ts, user: user,\n      fallback_name: (username ?: (user ?: 'Slack user')),\n      type: files.isEmpty() ? 'input_added' : 'document_saved',\n      text: body ?: (files.isEmpty() ? '(no text)' : 'Shared a file'),\n      created_at: createdAt, files: docs\n    ]\n    def snippet = body ? (body.length() > 140 ? body.substring(0, 140) : body) : 'shared a file'\n    lastByPoc[poc] = [text: ('Slack: ' + snippet).toString(), at: createdAt]\n  }\n}\ndef updates = rows.collect { r ->\n  def poc = text(r.poc_id)\n  def hit = lastByPoc[poc]\n  def current = num(r.last_activity_at)\n  [id: text(r.id), poc_id: poc, matched: hit != null && hit.at > current, last_activity: hit ? hit.text : '', last_activity_at: hit ? hit.at : 0L, current_last_activity_at: current]\n}\nresult = [items: items, newest_ts: newest, row_updates: updates, message_count: msgs.size(), item_count: items.size()]",
            compile_static: false,
            captureStdOutput: false,
            parameters: {
              channel_id: loopOverTheChannelsOneAtATime.channel_id,
              bot_user_id: "U0C9P6MFR62",
              messages: readTheChannelSMessagesNewerThanTheOldestCursor.messages.map((v) => v),
              rows: loopOverTheChannelsOneAtATime.rows.map((v) => ({
                id: v.id,
                poc_id: v.poc_id,
                use_case: v.use_case,
                stage: v.stage,
                last_activity_at: v.last_activity_at,
              })),
            },
          });
          // Loop over the matched messages, oldest first
          for (const loopOverTheMatchedMessagesOldestFirst of each(pickTheMessagesThatBelongToAUseCaseRowOldestFirstAndConvertEachSlackTimeToEpochMilliseconds.result.items, {
            captureIterations: true,
          })) {
            // Look up the sender
            const lookUpTheSender = op("slack", "slack_get_user_info_by_id", {
              include_locale: false,
              user: loopOverTheMatchedMessagesOldestFirst.user,
            }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
            // Get the message permalink
            const getTheMessagePermalink = op("slack", "slack_chat_get_permalink", {
              channel: loopOverTheChannelsOneAtATime.channel_id,
              token_type: "bot_token",
              message_ts: loopOverTheMatchedMessagesOldestFirst.ts,
            }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
            // Pick the sender's name
            const pickTheSenderSName = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
              output: {
                type: "object",
                properties: {
                  actor_name: {
                    type: "string",
                  },
                },
                required: [
                  "actor_name",
                ],
              },
              input: {
                type: "object",
                properties: {
                  real_name: {
                    type: "string",
                  },
                  display_name: {
                    type: "string",
                  },
                  fallback: {
                    type: "string",
                  },
                },
              },
              code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef text = { v -> v == null ? '' : v.toString().trim() }\ndef name = text(value('real_name')) ?: (text(value('display_name')) ?: (text(value('fallback')) ?: 'Slack user'))\nresult = [actor_name: name.toString()]",
              compile_static: false,
              captureStdOutput: false,
              parameters: {
                real_name: lookUpTheSender.user.real_name,
                display_name: lookUpTheSender.user.profile.display_name,
                fallback: loopOverTheMatchedMessagesOldestFirst.fallback_name,
              },
            });
            // Write the activity row; an upsert, so a repeat cannot fail
            op("storage_by_unifyapps", "storage_by_unifyapps_update_record_by_id", {
              recordId: loopOverTheMatchedMessagesOldestFirst.activity_id,
              useRawPayload: false,
              writeThroughSessionVariables: false,
              object_type: "psl_activity",
              retryOnFailure: true,
              skipIfBlank: false,
              record: {
                activity_id: loopOverTheMatchedMessagesOldestFirst.activity_id,
                poc: loopOverTheMatchedMessagesOldestFirst.poc_id,
                type: loopOverTheMatchedMessagesOldestFirst.type,
                stage: loopOverTheMatchedMessagesOldestFirst.stage,
                actor_type: "person",
                actor_name: pickTheSenderSName.result.actor_name,
                actor_email: lookUpTheSender.user.profile.email,
                message: loopOverTheMatchedMessagesOldestFirst.text,
                created_at: loopOverTheMatchedMessagesOldestFirst.created_at,
                actor_avatar_url: lookUpTheSender.user.profile.image_72,
                slack_ts: loopOverTheMatchedMessagesOldestFirst.ts,
                slack_ref: getTheMessagePermalink.permalink,
              },
              upsert: true,
            });
            // Loop over the files the message carries
            for (const loopOverTheFilesTheMessageCarry of each(loopOverTheMatchedMessagesOldestFirst.files, {
              captureIterations: true,
            })) {
              // Write the document row; an upsert, so a repeat cannot fail
              op("storage_by_unifyapps", "storage_by_unifyapps_update_record_by_id", {
                recordId: loopOverTheFilesTheMessageCarry.document_id,
                useRawPayload: false,
                writeThroughSessionVariables: false,
                object_type: "psl_document",
                retryOnFailure: true,
                skipIfBlank: false,
                record: {
                  document_id: loopOverTheFilesTheMessageCarry.document_id,
                  poc: loopOverTheMatchedMessagesOldestFirst.poc_id,
                  name: loopOverTheFilesTheMessageCarry.name,
                  type: "input",
                  stage: loopOverTheMatchedMessagesOldestFirst.stage,
                  gate_pack: "none",
                  version: 1,
                  status: "final",
                  file_link: getTheMessagePermalink.permalink,
                  created_by: pickTheSenderSName.result.actor_name,
                  saved_at: loopOverTheMatchedMessagesOldestFirst.created_at,
                  format: "link",
                },
                upsert: true,
              });
            }
          }
          // Any message read?
          if (and(
            ne(pickTheMessagesThatBelongToAUseCaseRowOldestFirstAndConvertEachSlackTimeToEpochMilliseconds.result.newest_ts, "=\"\""),
          )) {
            // Loop over the channel's live rows
            for (const loopOverTheChannelSLiveRow of each(pickTheMessagesThatBelongToAUseCaseRowOldestFirstAndConvertEachSlackTimeToEpochMilliseconds.result.row_updates, {
              captureIterations: true,
            })) {
              // Move the row's cursor to the newest message read
              op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
                recordId: loopOverTheChannelSLiveRow.id,
                writeThroughSessionVariables: false,
                object_type: "psl_poc",
                skipIfBlank: false,
                skipPermissionCheck: false,
                updateFields: [
                  {
                    fieldName: "properties.slack_last_ts",
                    actionType: "SET",
                    setValue: pickTheMessagesThatBelongToAUseCaseRowOldestFirstAndConvertEachSlackTimeToEpochMilliseconds.result.newest_ts,
                  },
                ],
                skipSchemaValidation: true,
                unsetIfNull: false,
              });
              // Did a message match this row?
              if (and(
                eq(loopOverTheChannelSLiveRow.matched, true),
              )) {
                // Stamp the row's last activity
                op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
                  recordId: loopOverTheChannelSLiveRow.id,
                  writeThroughSessionVariables: false,
                  object_type: "psl_poc",
                  skipIfBlank: false,
                  skipPermissionCheck: false,
                  updateFields: [
                    {
                      fieldName: "properties.last_activity",
                      actionType: "SET",
                      setValue: loopOverTheChannelSLiveRow.last_activity,
                    },
                    {
                      fieldName: "properties.last_activity_at",
                      actionType: "SET",
                      setValue: loopOverTheChannelSLiveRow.last_activity_at,
                    },
                  ],
                  skipSchemaValidation: true,
                  unsetIfNull: false,
                });
              }
            }
          }
        });
      } catch {
        // Log the skipped channel
        op("code_by_unifyapps", "code_by_unifyapps_groovy", {
          output: {
            type: "object",
            properties: {
              logged: {
                type: "boolean",
              },
            },
            required: [
              "logged",
            ],
          },
          input: {
            type: "object",
            properties: {
              channel_id: {
                type: "string",
              },
            },
          },
          code: "def id = binding.hasVariable('channel_id') ? binding.getVariable('channel_id') : ''\nprintln('Channel ' + id + ' skipped: Slack or storage failed for it; the next channel carries on')\nresult = [logged: true]",
          compile_static: false,
          captureStdOutput: true,
          parameters: {
            channel_id: loopOverTheChannelsOneAtATime.channel_id,
          },
        });
      }
    }
    // Done
    stop();
  },
);
