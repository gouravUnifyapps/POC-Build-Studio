import { automation, appEvent, op, RUN, TRIGGER, and, branch, each, eq, exists, missing, ne, or, stop } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Slack listener",
    description: "Hears the Slack new-message event of the POC Studio Live Slack connection. Ignores bots and the bot's own messages. Four branches: the bot joined a channel (link its use case rows and say so), the bot was tagged at the top of a channel (the POC Studio Agent answers in a thread), a reply in a manager question thread (the agent answers in the thread), and an owner's 'approve' reply under a gate post (calls Approve gate).",
    settings: {
      enableNodeLevelLogging: true,
      enableRunLogging: true,
      enableVariableLogging: true,
      route: {
        default: false,
        tierName: "global",
      },
    },
    trigger: appEvent("slack", "slack_on_new_message", {
      triggerInputCondition: and(
        missing(TRIGGER.event.bot_id),
        or(
          ne(TRIGGER.event.user, "U0C9P6MFR62"),
          eq(TRIGGER.event.type, "member_joined_channel"),
        ),
      ),
    }, { connectionId: "6ad1be602ac9ba64653a9d36" }),
  },
  (t) => {
    // Classify the event
    const classifyTheEvent = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            title: "Kind",
          },
          nowTs: {
            type: "string",
            title: "Now as a Slack ts",
          },
          live: {
            type: "boolean",
            title: "Slack live flag",
          },
        },
      },
      input: {
        type: "object",
        properties: {
          evType: {
            type: "string",
            title: "Event type",
          },
          evSubtype: {
            type: "string",
            title: "Subtype",
          },
          evUser: {
            type: "string",
            title: "User",
          },
          evBotId: {
            type: "string",
            title: "Bot id",
          },
          evText: {
            type: "string",
            title: "Text",
          },
          evTs: {
            type: "string",
            title: "Message ts",
          },
          evThreadTs: {
            type: "string",
            title: "Thread ts",
          },
          nowMs: {
            type: "number",
            title: "Now in epoch ms",
          },
        },
      },
      code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef str = { String name -> (value(name)?.toString() ?: '').trim() }\ndef bot = 'U0C9P6MFR62'\ndef type = str('evType')\ndef subtype = str('evSubtype')\ndef user = str('evUser')\ndef ts = str('evTs')\ndef threadTs = str('evThreadTs')\ndef body = (value('evText')?.toString() ?: '')\ndef kind = 'ignore'\nif (str('evBotId')) {\n  kind = 'ignore'\n} else if (type == 'member_joined_channel') {\n  kind = (user == bot) ? 'joined' : 'ignore'\n} else if (type == 'message' && user && user != bot && (!subtype || subtype in ['thread_broadcast', 'file_share'])) {\n  if (threadTs && threadTs != ts) {\n    kind = (body.trim().toLowerCase() == 'approve') ? 'approve' : 'reply'\n  } else if (body.contains('<@' + bot + '>')) {\n    kind = 'tag'\n  }\n}\nlong ms = (value('nowMs') ?: 0) as long\ndef nowTs = String.format('%d.%06d', ms.intdiv(1000L), (ms % 1000L) * 1000L)\nresult = [kind: kind, nowTs: nowTs, live: true]",
      compile_static: false,
      captureStdOutput: false,
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
    });
    // Route the event
    branch([
      {
        name: "Bot joined a channel",
        when: and(
          eq(classifyTheEvent.result.kind, "joined"),
        ),
        then: () => {
          // Branch Condition
          op("branch_condition", "branch_condition", {
            name: "Bot joined a channel",
            conditions: and(
              eq(classifyTheEvent.result.kind, "joined"),
            ),
          }, { nodeType: "BRANCH_CONDITION" });
          // Read the channel name
          const readTheChannelName = op("slack", "slack_get_conversation", {
            token_type: "bot_token",
            channelId: t.event.channel,
          }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
          // Channel name read?
          if (and(
            exists(readTheChannelName.channel.name),
          )) {
            // Find the use case rows of this channel name
            const findTheUseCaseRowsOfThisChannelName = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
              triggerInputCondition: and(
                eq("properties_slack_channel", readTheChannelName.channel.name),
              ),
              shouldSearchInAnalyticsStore: false,
              object_type: "psl_poc",
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
            // For each use case row of the channel
            for (const forEachUseCaseRowOfTheChannel of each(findTheUseCaseRowsOfThisChannelName.objects, {
              captureIterations: true,
            })) {
              // Link the row to the channel
              op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
                recordId: forEachUseCaseRowOfTheChannel.id,
                writeThroughSessionVariables: false,
                object_type: "psl_poc",
                skipIfBlank: false,
                skipPermissionCheck: false,
                updateFields: [
                  {
                    fieldName: "properties.slack_channel_id",
                    actionType: "SET",
                    setValue: t.event.channel,
                  },
                  {
                    fieldName: "properties.slack_live",
                    actionType: "SET",
                    setValue: classifyTheEvent.result.live,
                  },
                ],
                skipSchemaValidation: true,
                unsetIfNull: false,
              });
            }
            // Write the message to post
            const writeTheMessageToPost = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
              output: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    title: "Message",
                  },
                  count: {
                    type: "number",
                    title: "Linked count",
                  },
                },
              },
              input: {
                type: "object",
                properties: {
                  names: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    title: "Use case names",
                  },
                },
              },
              code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef names = (value('names') ?: []) as List\ndef cleaned = names.collect { (it?.toString() ?: '').trim().replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;') }.findAll { it }\ndef message = cleaned.isEmpty() ? 'Tag me with the use case name to start a POC' : ('Linked ' + cleaned.size() + ' use case(s): ' + cleaned.join(', '))\nresult = [text: message.toString(), count: cleaned.size()]",
              compile_static: false,
              captureStdOutput: false,
              parameters: {
                names: findTheUseCaseRowsOfThisChannelName.objects.map((v) => v.properties.use_case),
              },
            });
            // Say what was linked in the channel
            op("slack", "slack_post_message_in_channel", {
              link_names: true,
              messageType: "text",
              channel: t.event.channel,
              text: writeTheMessageToPost.result.text,
              token_type: "bot_token",
              mrkdwn: true,
            }, { connectionId: "6ad1be602ac9ba64653a9d36" });
          }
        },
      },
      {
        name: "Bot tagged at the top of a channel",
        when: and(
          eq(classifyTheEvent.result.kind, "tag"),
        ),
        then: () => {
          // Branch Condition
          op("branch_condition", "branch_condition", {
            name: "Bot tagged at the top of a channel",
            conditions: and(
              eq(classifyTheEvent.result.kind, "tag"),
            ),
          }, { nodeType: "BRANCH_CONDITION" });
          // React with eyes: processing started
          op("slack", "slack_reactions_add", {
            channel: t.event.channel,
            name: "eyes",
            token_type: "bot_token",
            timestamp: t.event.ts,
          }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
          // Read the thread of the tag message
          const readTheThreadOfTheTagMessage = op("slack", "slack_list_conversations_replies", {
            channel: t.event.channel,
            limit: 50,
            token_type: "bot_token",
            ts: t.event.ts,
          }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
          // Look for a reply by the bot
          const lookForAReplyByTheBot = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
            output: {
              type: "object",
              properties: {
                answered: {
                  type: "boolean",
                  title: "Already answered",
                },
              },
            },
            input: {
              type: "object",
              properties: {
                messages: {
                  type: "array",
                  items: {
                    type: "object",
                  },
                  title: "Thread messages",
                },
                eventTs: {
                  type: "string",
                  title: "Message ts",
                },
              },
            },
            code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef msgs = (value('messages') ?: []) as List\ndef eventTs = (value('eventTs')?.toString() ?: '').trim()\ndef answered = false\nif (eventTs) {\n  def mine = new BigDecimal(eventTs)\n  msgs.each { m ->\n    def u = m?.user?.toString()\n    def s = m?.ts?.toString()\n    if (u == 'U0C9P6MFR62' && s && new BigDecimal(s) > mine) { answered = true }\n  }\n}\nresult = [answered: answered]",
            compile_static: false,
            captureStdOutput: false,
            parameters: {
              messages: readTheThreadOfTheTagMessage.messages.map((v) => ({
                user: v.user,
                ts: v.ts,
              })),
              eventTs: t.event.ts,
            },
          });
          // Not answered yet?
          if (and(
            eq(lookForAReplyByTheBot.result.answered, false),
          )) {
            // Read the channel name
            const readTheChannelName2 = op("slack", "slack_get_conversation", {
              token_type: "bot_token",
              channelId: t.event.channel,
            }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
            // Ask the POC Studio Agent
            const askThePocStudioAgent = op("ai_agents_by_unifyapps", "ai_agents_by_unifyapps_invoke_agent", {
              callableInterfaceId: "__ua__invoke_ai_agent_by_unifyapps",
              triggerWorkflowWithRuntimeType: "IN_MEMORY",
              defaultFallbackWorkflowId: "68050ca67df58855654804a0",
              parameters: {
                aiAgentId: "e_6ad1ca0bc0f97b3e983d2679",
                userQuery: `channel id: ${t.event.channel}
channel name: ${readTheChannelName2.channel.name}
tagger slack id: ${t.event.user}
thread ts: ${t.event.ts}
text: ${t.event.text}`,
              },
            }, { nodeType: "CALL_INTERFACE_WORKFLOW", onError: "CONTINUE" });
            // Make the reply safe to post
            const makeTheReplySafeToPost = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
              output: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    title: "Reply to post",
                  },
                },
              },
              input: {
                type: "object",
                properties: {
                  replies: {
                    type: "array",
                    items: {
                      type: "object",
                    },
                    title: "Agent replies",
                  },
                },
              },
              code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef items = (value('replies') ?: []) as List\ndef raw = items.collect { m -> ((m instanceof Map ? m.text : m)?.toString() ?: '').trim() }.findAll { it }.join('\\n\\n')\ndef safe = raw ? raw.replace('<!', '&lt;!') : 'I could not work that out just now. Please tag me again.'\nresult = [text: safe.toString()]",
              compile_static: false,
              captureStdOutput: false,
              parameters: {
                replies: askThePocStudioAgent.agentResponses.map((v) => ({
                  text: v.text,
                })),
              },
            });
            // Post the reply under the tag message
            op("slack", "slack_post_message_in_channel", {
              link_names: true,
              messageType: "text",
              thread_ts: t.event.ts,
              channel: t.event.channel,
              text: makeTheReplySafeToPost.result.text,
              token_type: "bot_token",
              mrkdwn: true,
            }, { connectionId: "6ad1be602ac9ba64653a9d36" });
          }
          // Remove the eyes reaction: processing finished
          op("slack", "slack_reactions_remove", {
            channel: t.event.channel,
            name: "eyes",
            timestamp: t.event.ts,
          }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
        },
      },
      {
        name: "Reply in a manager question thread",
        when: and(
          eq(classifyTheEvent.result.kind, "reply"),
        ),
        then: () => {
          // Branch Condition
          op("branch_condition", "branch_condition", {
            name: "Reply in a manager question thread",
            conditions: and(
              eq(classifyTheEvent.result.kind, "reply"),
            ),
          }, { nodeType: "BRANCH_CONDITION" });
          // React with eyes: processing started
          op("slack", "slack_reactions_add", {
            channel: t.event.channel,
            name: "eyes",
            token_type: "bot_token",
            timestamp: t.event.ts,
          }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
          // Find the row whose manager question thread this is
          const findTheRowWhoseManagerQuestionThreadThisIs = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
            triggerInputCondition: and(
              eq("properties_slack_channel_id", t.event.channel),
              eq("properties_bot_thread_ts", t.event.thread_ts),
            ),
            shouldSearchInAnalyticsStore: false,
            object_type: "psl_poc",
            includeRoleMappings: false,
            includeCurrentUserPermissions: false,
            translationsOption: "DEFAULT",
            page: {
              paginateBy: "OFFSET",
              limit: 20,
              offset: 0,
            },
            numberOfRecordsToFetch: "MULTIPLE",
            readThroughSessionVariables: false,
            includeTotalCount: false,
          });
          // Pick the row that still has no manager
          const pickTheRowThatStillHasNoManager = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
            output: {
              type: "object",
              properties: {
                found: {
                  type: "boolean",
                  title: "Found",
                },
                pocId: {
                  type: "string",
                  title: "POC id",
                },
                channelName: {
                  type: "string",
                  title: "Channel name",
                },
              },
            },
            input: {
              type: "object",
              properties: {
                rows: {
                  type: "array",
                  items: {
                    type: "object",
                  },
                  title: "Rows of the thread",
                },
              },
            },
            code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef rows = (value('rows') ?: []) as List\ndef hit = rows.find { r -> (r?.pocId?.toString() ?: '').trim() && !((r?.managerSlackId?.toString() ?: '').trim()) }\nresult = [found: hit != null, pocId: (hit ? hit.pocId.toString() : ''), channelName: (hit ? (hit.channelName?.toString() ?: '') : '')]",
            compile_static: false,
            captureStdOutput: false,
            parameters: {
              rows: findTheRowWhoseManagerQuestionThreadThisIs.objects.map((v) => ({
                pocId: v.properties.poc_id,
                managerSlackId: v.properties.manager_slack_id,
                channelName: v.properties.slack_channel,
              })),
            },
          });
          // Manager thread with no manager yet?
          if (and(
            eq(pickTheRowThatStillHasNoManager.result.found, true),
          )) {
            // Read the thread
            const readTheThread = op("slack", "slack_list_conversations_replies", {
              channel: t.event.channel,
              limit: 200,
              token_type: "bot_token",
              ts: t.event.thread_ts,
            }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
            // Look for a reply by the bot after this message
            const lookForAReplyByTheBotAfterThisMessage = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
              output: {
                type: "object",
                properties: {
                  answered: {
                    type: "boolean",
                    title: "Already answered",
                  },
                },
              },
              input: {
                type: "object",
                properties: {
                  messages: {
                    type: "array",
                    items: {
                      type: "object",
                    },
                    title: "Thread messages",
                  },
                  eventTs: {
                    type: "string",
                    title: "Message ts",
                  },
                },
              },
              code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef msgs = (value('messages') ?: []) as List\ndef eventTs = (value('eventTs')?.toString() ?: '').trim()\ndef answered = false\nif (eventTs) {\n  def mine = new BigDecimal(eventTs)\n  msgs.each { m ->\n    def u = m?.user?.toString()\n    def s = m?.ts?.toString()\n    if (u == 'U0C9P6MFR62' && s && new BigDecimal(s) > mine) { answered = true }\n  }\n}\nresult = [answered: answered]",
              compile_static: false,
              captureStdOutput: false,
              parameters: {
                messages: readTheThread.messages.map((v) => ({
                  user: v.user,
                  ts: v.ts,
                })),
                eventTs: t.event.ts,
              },
            });
            // Not answered yet?
            if (and(
              eq(lookForAReplyByTheBotAfterThisMessage.result.answered, false),
            )) {
              // Ask the POC Studio Agent
              const askThePocStudioAgent2 = op("ai_agents_by_unifyapps", "ai_agents_by_unifyapps_invoke_agent", {
                callableInterfaceId: "__ua__invoke_ai_agent_by_unifyapps",
                triggerWorkflowWithRuntimeType: "IN_MEMORY",
                defaultFallbackWorkflowId: "68050ca67df58855654804a0",
                parameters: {
                  aiAgentId: "e_6ad1ca0bc0f97b3e983d2679",
                  userQuery: `channel id: ${t.event.channel}
channel name: ${pickTheRowThatStillHasNoManager.result.channelName}
tagger slack id: ${t.event.user}
thread ts: ${t.event.thread_ts}
poc id: ${pickTheRowThatStillHasNoManager.result.pocId}
text: ${t.event.text}`,
                },
              }, { nodeType: "CALL_INTERFACE_WORKFLOW", onError: "CONTINUE" });
              // Make the reply safe to post
              const makeTheReplySafeToPost2 = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
                output: {
                  type: "object",
                  properties: {
                    text: {
                      type: "string",
                      title: "Reply to post",
                    },
                  },
                },
                input: {
                  type: "object",
                  properties: {
                    replies: {
                      type: "array",
                      items: {
                        type: "object",
                      },
                      title: "Agent replies",
                    },
                  },
                },
                code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef items = (value('replies') ?: []) as List\ndef raw = items.collect { m -> ((m instanceof Map ? m.text : m)?.toString() ?: '').trim() }.findAll { it }.join('\\n\\n')\ndef safe = raw ? raw.replace('<!', '&lt;!') : 'I could not work that out just now. Please reply again.'\nresult = [text: safe.toString()]",
                compile_static: false,
                captureStdOutput: false,
                parameters: {
                  replies: askThePocStudioAgent2.agentResponses.map((v) => ({
                    text: v.text,
                  })),
                },
              });
              // Post the reply in the thread
              op("slack", "slack_post_message_in_channel", {
                link_names: true,
                messageType: "text",
                thread_ts: t.event.thread_ts,
                channel: t.event.channel,
                text: makeTheReplySafeToPost2.result.text,
                token_type: "bot_token",
                mrkdwn: true,
              }, { connectionId: "6ad1be602ac9ba64653a9d36" });
            }
          }
          // Remove the eyes reaction: processing finished
          op("slack", "slack_reactions_remove", {
            channel: t.event.channel,
            name: "eyes",
            timestamp: t.event.ts,
          }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
        },
      },
      {
        name: "Owner approve reply",
        when: and(
          eq(classifyTheEvent.result.kind, "approve"),
        ),
        then: () => {
          // Branch Condition
          op("branch_condition", "branch_condition", {
            name: "Owner approve reply",
            conditions: and(
              eq(classifyTheEvent.result.kind, "approve"),
            ),
          }, { nodeType: "BRANCH_CONDITION" });
          // React with eyes: processing started
          op("slack", "slack_reactions_add", {
            channel: t.event.channel,
            name: "eyes",
            token_type: "bot_token",
            timestamp: t.event.ts,
          }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
          // Read the post the reply sits under
          const readThePostTheReplySitsUnder = op("slack", "slack_list_conversations_replies", {
            channel: t.event.channel,
            limit: 1,
            token_type: "bot_token",
            ts: t.event.thread_ts,
          }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
          // Read the POC id from the first line of the bot post
          const readThePocIdFromTheFirstLineOfTheBotPost = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
            output: {
              type: "object",
              properties: {
                found: {
                  type: "boolean",
                  title: "Found",
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
                parentText: {
                  type: "string",
                  title: "Parent post text",
                },
                parentUser: {
                  type: "string",
                  title: "Parent post author",
                },
              },
            },
            code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef first = (value('parentText')?.toString() ?: '').split(/\\r?\\n/, 2)[0]\ndef m = (first =~ /\\[(POC-[A-Za-z0-9._-]+)\\]/)\ndef pocId = m.find() ? m.group(1) : ''\ndef fromBot = (value('parentUser')?.toString() ?: '') == 'U0C9P6MFR62'\nresult = [found: (pocId != '' && fromBot), pocId: pocId]",
            compile_static: false,
            captureStdOutput: false,
            parameters: {
              parentText: readThePostTheReplySitsUnder.messages[0].text,
              parentUser: readThePostTheReplySitsUnder.messages[0].user,
            },
          });
          // Bot post that names a POC?
          if (and(
            eq(readThePocIdFromTheFirstLineOfTheBotPost.result.found, true),
          )) {
            // Read the POC row
            const readThePocRow = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
              triggerInputCondition: and(
                eq("properties_poc_id", readThePocIdFromTheFirstLineOfTheBotPost.result.pocId),
              ),
              shouldSearchInAnalyticsStore: false,
              object_type: "psl_poc",
              includeRoleMappings: false,
              includeCurrentUserPermissions: false,
              translationsOption: "DEFAULT",
              numberOfRecordsToFetch: "SINGLE",
              readThroughSessionVariables: false,
            });
            // Sent by the owner of the row?
            if (and(
              exists(readThePocRow.id),
              eq(readThePocRow.properties.owner_slack_id, t.event.user),
            )) {
              // Approve the gate as the owner
              op("callables", "callables_call_automation", {
                automationId: "6ad1c75967956c53e38f1a70",
                synchronous: true,
                version: "-1",
                parameters: {
                  poc_id: readThePocIdFromTheFirstLineOfTheBotPost.result.pocId,
                  role: "owner",
                  caller_slack_id: t.event.user,
                },
                executeOnSameVM: false,
              });
            }
          }
          // Remove the eyes reaction: processing finished
          op("slack", "slack_reactions_remove", {
            channel: t.event.channel,
            name: "eyes",
            timestamp: t.event.ts,
          }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
        },
      },
    ], () => {
    });
    // Done
    stop();
  },
);
