import { automation, callableApi, op, ENV, RUN, TRIGGER, and, branch, each, eq, exists, missing, ne, or, regex, respond } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Receive build result",
    description: "Receives what a Claude build run sends back for a POC row: a plan or a final build for a gate, feedback entries, or a status line. Writes the documents, activity, iteration and feedback rows, moves the row to the gate, and posts the gate in the row's Slack channel.",
    settings: {
      enableNodeLevelLogging: true,
      enableRunLogging: true,
      enableVariableLogging: true,
      route: {
        default: false,
        tierName: "global",
      },
    },
    trigger: callableApi({
      request: {
        contentType: "application/json",
        body: {
          type: "object",
          properties: {
            row_id: {
              type: "string",
              title: "Row id (the POC id)",
            },
            kind: {
              type: "string",
              title: "Kind: plan, final, feedback or status",
            },
            gate: {
              type: "string",
              title: "Gate: g2 or g3",
            },
            title: {
              type: "string",
              title: "Title",
            },
            summary: {
              type: "string",
              title: "Summary",
            },
            documents: {
              type: "array",
              title: "Documents",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                  type: {
                    type: "string",
                  },
                  format: {
                    type: "string",
                  },
                  content: {
                    type: "string",
                  },
                  link: {
                    type: "string",
                  },
                },
              },
            },
            feedback: {
              type: "array",
              title: "Feedback",
              items: {
                type: "object",
                properties: {
                  phase: {
                    type: "string",
                  },
                  source: {
                    type: "string",
                  },
                  actor_name: {
                    type: "string",
                  },
                  text: {
                    type: "string",
                  },
                  skill: {
                    type: "string",
                  },
                },
              },
            },
          },
          required: [
            "row_id",
          ],
        },
      },
      endpointType: "REST",
      response: [
        {
          name: "posted",
          status: 200,
          contentType: "application/json",
          body: {
            type: "object",
            properties: {
              status: {
                type: "string",
              },
            },
          },
        },
        {
          name: "row_not_found",
          status: 404,
          contentType: "application/json",
          body: {
            type: "object",
            properties: {
              status: {
                type: "string",
              },
            },
          },
        },
        {
          name: "bad_request",
          status: 400,
          contentType: "application/json",
          body: {
            type: "object",
            properties: {
              status: {
                type: "string",
              },
            },
          },
        },
      ],
      streamingResponse: false,
    }),
  },
  (t) => {
    // Check the request body
    const checkTheRequestBody = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          ok: {
            type: "boolean",
          },
          error: {
            type: "string",
          },
        },
        required: [
          "ok",
          "error",
        ],
      },
      input: {
        type: "object",
        properties: {
          row_id: {
            type: "string",
          },
          kind: {
            type: "string",
          },
          summary: {
            type: "string",
          },
          documents: {
            type: "array",
            items: {
              type: "object",
            },
          },
          feedback: {
            type: "array",
            items: {
              type: "object",
            },
          },
        },
      },
      code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef text = { v -> v == null ? '' : v.toString().trim() }\ndef errors = []\ndef kinds = ['plan', 'final', 'feedback', 'status']\ndef docTypes = ['brief','input','requirements','scope','email','brd','design_system','build_report','app','evidence_pack','demo_script','deck','video','use_case','design','automation','object','agent','walkthrough','poc_link']\ndef docFormats = ['markdown', 'html', 'link']\ndef phases = ['understand', 'plan', 'build', 'deliver']\ndef sources = ['judge', 'person']\ndef kind = text(value('kind'))\nif (!text(value('row_id'))) errors << 'row_id is required'\nif (!(kind in kinds)) errors << 'kind must be plan, final, feedback or status'\nif (kind == 'plan' || kind == 'final') {\n  def docs = (value('documents') ?: []) as List\n  docs.eachWithIndex { d, i ->\n    def at = 'documents[' + (i + 1) + ']'\n    if (!text(d?.name)) errors << (at + '.name is required')\n    if (!(text(d?.type) in docTypes)) errors << (at + '.type is not a known document type')\n    def fmt = text(d?.format)\n    if (fmt && !(fmt in docFormats)) errors << (at + '.format must be markdown, html or link')\n  }\n}\nif (kind == 'feedback') {\n  def items = (value('feedback') ?: []) as List\n  if (items.isEmpty()) errors << 'feedback must have at least one entry'\n  items.eachWithIndex { f, i ->\n    def at = 'feedback[' + (i + 1) + ']'\n    if (!(text(f?.phase) in phases)) errors << (at + '.phase must be understand, plan, build or deliver')\n    if (!(text(f?.source) in sources)) errors << (at + '.source must be judge or person')\n    if (!text(f?.actor_name)) errors << (at + '.actor_name is required')\n    if (!text(f?.text)) errors << (at + '.text is required')\n  }\n}\nif (kind == 'status' && !text(value('summary'))) errors << 'summary is required for a status update'\nresult = [ok: errors.isEmpty(), error: errors.join('; ').toString()]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        row_id: t.body.row_id,
        kind: t.body.kind,
        summary: t.body.summary,
        documents: t.body.documents.map((v) => ({
          name: v.name,
          type: v.type,
          format: v.format,
        })),
        feedback: t.body.feedback.map((v) => ({
          phase: v.phase,
          source: v.source,
          actor_name: v.actor_name,
          text: v.text,
        })),
      },
    });
    // Body not valid?
    if (and(
      eq(checkTheRequestBody.result.ok, false),
    )) {
      // Respond 400
      respond("400_bad_request", {
        streamingCompleted: true,
        body: {
          status: "bad_request",
        },
        status: 400,
      });
    }
    // Read the POC row
    const readThePocRow = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      triggerInputCondition: and(
        eq("properties_poc_id", t.body.row_id),
      ),
      shouldSearchInAnalyticsStore: false,
      object_type: "psl_poc",
      includeRoleMappings: false,
      includeCurrentUserPermissions: false,
      translationsOption: "DEFAULT",
      numberOfRecordsToFetch: "SINGLE",
      readThroughSessionVariables: false,
    });
    // No such row?
    if (and(
      missing(readThePocRow.id),
    )) {
      // Respond 404
      respond("404_row_not_found", {
        streamingCompleted: true,
        body: {
          status: "row_not_found",
        },
        status: 404,
      });
    }
    // One arm per kind. Each arm writes its rows in the order the contract names them.
    branch([
      {
        name: "Plan",
        when: and(
          eq(t.body.kind, "plan"),
        ),
        then: () => {
          // Branch Condition
          op("branch_condition", "branch_condition", {
            name: "Plan",
            conditions: and(
              eq(t.body.kind, "plan"),
            ),
          }, { nodeType: "BRANCH_CONDITION" });
          // Compose the gate texts
          const composeTheGateTexts = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
            output: {
              type: "object",
              properties: {
                slack_text: {
                  type: "string",
                },
                dm_text: {
                  type: "string",
                },
                activity_message: {
                  type: "string",
                },
                now: {
                  type: "integer",
                },
                g1_activity_id: {
                  type: "string",
                },
                gate_activity_id: {
                  type: "string",
                },
              },
              required: [
                "slack_text",
                "dm_text",
                "activity_message",
                "now",
                "g1_activity_id",
                "gate_activity_id",
              ],
            },
            input: {
              type: "object",
              properties: {
                kind: {
                  type: "string",
                },
                poc_id: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                summary: {
                  type: "string",
                },
                app_url: {
                  type: "string",
                },
                links: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                now: {
                  type: "number",
                },
              },
            },
            code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef text = { v -> v == null ? '' : v.toString().trim() }\ndef toBig = { v -> try { new BigDecimal(text(v)).toBigInteger() } catch (e) { BigInteger.ZERO } }\ndef kind = text(value('kind'))\ndef poc = text(value('poc_id'))\ndef title = text(value('title'))\ndef summary = text(value('summary'))\ndef base = text(value('app_url'))\nwhile (base.endsWith('/')) { base = base.substring(0, base.length() - 1) }\ndef link = base ? (base + '/pocs/' + poc) : ''\ndef now = toBig(value('now'))\ndef lines = ['[' + poc + ']']\nif (title) lines << ('*' + title + '*')\nif (summary) lines << summary\ndef builtLinks = ((value('links') ?: []) as List).collect { text(it) }.findAll { it }\nif (kind == 'final' && builtLinks) { lines << 'Built assets:'; builtLinks.each { lines << ('- ' + it) } }\nif (link) lines << link\ndef label = kind == 'final' ? 'Build posted for G3 · Build sign-off' : 'Plan posted for G2 · Design check'\ndef activity = (title ? label + ': ' + title : label)\nresult = [slack_text: lines.join('\\n').toString(), dm_text: ('BUILD is complete' + (link ? '\\n' + link : '')).toString(), activity_message: activity.toString(), now: now.longValue(), g1_activity_id: ('ACT-' + now + '-g1').toString(), gate_activity_id: ('ACT-' + now + '-gate').toString()]",
            compile_static: false,
            captureStdOutput: false,
            parameters: {
              kind: "plan",
              poc_id: t.body.row_id,
              title: t.body.title,
              summary: t.body.summary,
              app_url: ENV.POC_STUDIO_APP_URL,
              links: t.body.documents.map((v) => v.link),
              now: RUN.currentTime,
            },
          });
          // Is the POC still in Understand?
          if (or(
            eq(readThePocRow.properties.stage, "0_kickoff"),
            eq(readThePocRow.properties.stage, "1_signal_capture"),
            eq(readThePocRow.properties.stage, "2_research_assess"),
          )) {
            // The setValue input takes text, so the two true values come from a variable
            const theSetvalueInputTakesTextSoTheTwoTrueValuesComeFromAVariable = op("variable_by_unifyapps", "variable_by_unifyapps_create_variables", {
              yes: true,
            });
            // Record G1 as passed by the Judge
            op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
              recordId: readThePocRow.id,
              writeThroughSessionVariables: false,
              object_type: "psl_poc",
              skipIfBlank: false,
              skipPermissionCheck: false,
              updateFields: [
                {
                  fieldName: "properties.g1_status",
                  actionType: "SET",
                  setValue: "approved",
                },
                {
                  fieldName: "properties.g1_owner_approved",
                  actionType: "SET",
                  setValue: theSetvalueInputTakesTextSoTheTwoTrueValuesComeFromAVariable.yes,
                },
                {
                  fieldName: "properties.g1_manager_approved",
                  actionType: "SET",
                  setValue: theSetvalueInputTakesTextSoTheTwoTrueValuesComeFromAVariable.yes,
                },
              ],
              skipSchemaValidation: true,
              unsetIfNull: false,
            });
            // Log the Judge's G1 decision
            op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
              useRawPayload: false,
              writeThroughSessionVariables: false,
              object_type: "psl_activity",
              skipIfBlank: false,
              inlineRefresh: false,
              record: {
                activity_id: composeTheGateTexts.result.g1_activity_id,
                poc: t.body.row_id,
                type: "gate_decided",
                stage: readThePocRow.properties.stage,
                gate: "g1",
                decision: "approve",
                actor_type: "ai",
                actor_name: "Judge",
                message: "Judge passed G1 · Scope check",
                posted_to: readThePocRow.properties.slack_channel,
                created_at: composeTheGateTexts.result.now,
              },
              useUuid: false,
              batching: false,
            });
          }
          // Move the row to the G2 gate
          op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
            recordId: readThePocRow.id,
            writeThroughSessionVariables: false,
            object_type: "psl_poc",
            skipIfBlank: false,
            skipPermissionCheck: false,
            updateFields: [
              {
                fieldName: "properties.stage",
                actionType: "SET",
                setValue: "4_design_system",
              },
              {
                fieldName: "properties.current_gate",
                actionType: "SET",
                setValue: "g2",
              },
              {
                fieldName: "properties.g2_status",
                actionType: "SET",
                setValue: "waiting",
              },
              {
                fieldName: "properties.gate_summary",
                actionType: "SET",
                setValue: t.body.summary,
              },
              {
                fieldName: "properties.status",
                actionType: "SET",
                setValue: "waiting",
              },
              {
                fieldName: "properties.last_activity",
                actionType: "SET",
                setValue: composeTheGateTexts.result.activity_message,
              },
              {
                fieldName: "properties.last_activity_at",
                actionType: "SET",
                setValue: composeTheGateTexts.result.now,
              },
            ],
            skipSchemaValidation: true,
            unsetIfNull: false,
          });
          // Any documents?
          if (and(
            exists(t.body.documents[0].name),
          )) {
            // Loop over the documents
            for (const loopOverTheDocument of each(t.body.documents, {
              captureIterations: true,
            })) {
              // Find the latest version of this document on the row
              const findTheLatestVersionOfThisDocumentOnTheRow = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
                triggerInputCondition: and(
                  eq("properties_poc", t.body.row_id),
                  eq("properties_name", loopOverTheDocument.name),
                ),
                shouldSearchInAnalyticsStore: false,
                object_type: "psl_document",
                includeRoleMappings: false,
                includeCurrentUserPermissions: false,
                sortBy: [
                  {
                    field: "version",
                    order: "DESC",
                  },
                ],
                translationsOption: "DEFAULT",
                numberOfRecordsToFetch: "SINGLE",
                readThroughSessionVariables: false,
              });
              // Number the document
              const numberTheDocument = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
                output: {
                  type: "object",
                  properties: {
                    version: {
                      type: "integer",
                    },
                    document_id: {
                      type: "string",
                    },
                    format: {
                      type: "string",
                    },
                  },
                  required: [
                    "version",
                    "document_id",
                    "format",
                  ],
                },
                input: {
                  type: "object",
                  properties: {
                    poc_id: {
                      type: "string",
                    },
                    stage: {
                      type: "string",
                    },
                    name: {
                      type: "string",
                    },
                    latest: {
                      type: [
                        "integer",
                        "string",
                      ],
                    },
                    format: {
                      type: "string",
                    },
                    link: {
                      type: "string",
                    },
                  },
                },
                code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef text = { v -> v == null ? '' : v.toString().trim() }\ndef latest = value('latest')\ndef last = 0\nif (latest instanceof Number) { last = latest as int }\nelse if (text(latest).isInteger()) { last = text(latest).toInteger() }\ndef slug = text(value('name')).toLowerCase().replaceAll(/[^a-z0-9]+/, '-').replaceAll(/^-+|-+$/, '')\nif (!slug) slug = 'document'\ndef version = last + 1\ndef fmt = text(value('format')).toLowerCase()\nif (!(fmt in ['markdown', 'html', 'link'])) { fmt = text(value('link')) ? 'link' : 'markdown' }\nresult = [version: version, document_id: (text(value('poc_id')) + '__' + text(value('stage')) + '__' + slug + '__v' + version).toString(), format: fmt]",
                compile_static: false,
                captureStdOutput: false,
                parameters: {
                  poc_id: t.body.row_id,
                  stage: "4_design_system",
                  name: loopOverTheDocument.name,
                  latest: findTheLatestVersionOfThisDocumentOnTheRow.properties.version,
                  format: loopOverTheDocument.format,
                  link: loopOverTheDocument.link,
                },
              });
              // Save the document for review
              op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
                useRawPayload: false,
                writeThroughSessionVariables: false,
                object_type: "psl_document",
                skipIfBlank: false,
                inlineRefresh: false,
                record: {
                  document_id: numberTheDocument.result.document_id,
                  poc: t.body.row_id,
                  name: loopOverTheDocument.name,
                  type: loopOverTheDocument.type,
                  stage: "4_design_system",
                  gate_pack: "g2",
                  version: numberTheDocument.result.version,
                  status: "in_review",
                  content: loopOverTheDocument.content,
                  file_link: loopOverTheDocument.link,
                  created_by: "Claude build run",
                  saved_at: composeTheGateTexts.result.now,
                  format: numberTheDocument.result.format,
                },
                useUuid: false,
                batching: false,
              });
            }
          }
          // Log that the gate was posted
          op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
            useRawPayload: false,
            writeThroughSessionVariables: false,
            object_type: "psl_activity",
            skipIfBlank: false,
            inlineRefresh: false,
            record: {
              activity_id: composeTheGateTexts.result.gate_activity_id,
              poc: t.body.row_id,
              type: "gate_posted",
              stage: "4_design_system",
              gate: "g2",
              actor_type: "ai",
              actor_name: "Claude build run",
              message: composeTheGateTexts.result.activity_message,
              posted_to: readThePocRow.properties.slack_channel,
              created_at: composeTheGateTexts.result.now,
            },
            useUuid: false,
            batching: false,
          });
          // Row has a channel?
          if (and(
            exists(readThePocRow.properties.slack_channel_id),
            ne(readThePocRow.properties.slack_channel_id, "=\"\""),
          )) {
            // Post the plan in the row's channel
            op("slack", "slack_post_message_in_channel", {
              link_names: true,
              messageType: "text",
              channel: readThePocRow.properties.slack_channel_id,
              text: composeTheGateTexts.result.slack_text,
              token_type: "bot_token",
              mrkdwn: true,
            }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
          }
        },
      },
      {
        name: "Final",
        when: and(
          eq(t.body.kind, "final"),
        ),
        then: () => {
          // Branch Condition
          op("branch_condition", "branch_condition", {
            name: "Final",
            conditions: and(
              eq(t.body.kind, "final"),
            ),
          }, { nodeType: "BRANCH_CONDITION" });
          // Compose the gate texts
          const composeTheGateTexts2 = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
            output: {
              type: "object",
              properties: {
                slack_text: {
                  type: "string",
                },
                dm_text: {
                  type: "string",
                },
                activity_message: {
                  type: "string",
                },
                now: {
                  type: "integer",
                },
                g1_activity_id: {
                  type: "string",
                },
                gate_activity_id: {
                  type: "string",
                },
              },
              required: [
                "slack_text",
                "dm_text",
                "activity_message",
                "now",
                "g1_activity_id",
                "gate_activity_id",
              ],
            },
            input: {
              type: "object",
              properties: {
                kind: {
                  type: "string",
                },
                poc_id: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                summary: {
                  type: "string",
                },
                app_url: {
                  type: "string",
                },
                links: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                now: {
                  type: "number",
                },
              },
            },
            code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef text = { v -> v == null ? '' : v.toString().trim() }\ndef toBig = { v -> try { new BigDecimal(text(v)).toBigInteger() } catch (e) { BigInteger.ZERO } }\ndef kind = text(value('kind'))\ndef poc = text(value('poc_id'))\ndef title = text(value('title'))\ndef summary = text(value('summary'))\ndef base = text(value('app_url'))\nwhile (base.endsWith('/')) { base = base.substring(0, base.length() - 1) }\ndef link = base ? (base + '/pocs/' + poc) : ''\ndef now = toBig(value('now'))\ndef lines = ['[' + poc + ']']\nif (title) lines << ('*' + title + '*')\nif (summary) lines << summary\ndef builtLinks = ((value('links') ?: []) as List).collect { text(it) }.findAll { it }\nif (kind == 'final' && builtLinks) { lines << 'Built assets:'; builtLinks.each { lines << ('- ' + it) } }\nif (link) lines << link\ndef label = kind == 'final' ? 'Build posted for G3 · Build sign-off' : 'Plan posted for G2 · Design check'\ndef activity = (title ? label + ': ' + title : label)\nresult = [slack_text: lines.join('\\n').toString(), dm_text: ('BUILD is complete' + (link ? '\\n' + link : '')).toString(), activity_message: activity.toString(), now: now.longValue(), g1_activity_id: ('ACT-' + now + '-g1').toString(), gate_activity_id: ('ACT-' + now + '-gate').toString()]",
            compile_static: false,
            captureStdOutput: false,
            parameters: {
              kind: "final",
              poc_id: t.body.row_id,
              title: t.body.title,
              summary: t.body.summary,
              app_url: ENV.POC_STUDIO_APP_URL,
              links: t.body.documents.map((v) => v.link),
              now: RUN.currentTime,
            },
          });
          // Move the row to the G3 gate
          op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
            recordId: readThePocRow.id,
            writeThroughSessionVariables: false,
            object_type: "psl_poc",
            skipIfBlank: false,
            skipPermissionCheck: false,
            updateFields: [
              {
                fieldName: "properties.stage",
                actionType: "SET",
                setValue: "6_finalize",
              },
              {
                fieldName: "properties.current_gate",
                actionType: "SET",
                setValue: "g3",
              },
              {
                fieldName: "properties.g3_status",
                actionType: "SET",
                setValue: "waiting",
              },
              {
                fieldName: "properties.gate_summary",
                actionType: "SET",
                setValue: t.body.summary,
              },
              {
                fieldName: "properties.status",
                actionType: "SET",
                setValue: "waiting",
              },
              {
                fieldName: "properties.last_activity",
                actionType: "SET",
                setValue: composeTheGateTexts2.result.activity_message,
              },
              {
                fieldName: "properties.last_activity_at",
                actionType: "SET",
                setValue: composeTheGateTexts2.result.now,
              },
            ],
            skipSchemaValidation: true,
            unsetIfNull: false,
          });
          // Any documents?
          if (and(
            exists(t.body.documents[0].name),
          )) {
            // Loop over the documents
            for (const loopOverTheDocument2 of each(t.body.documents, {
              captureIterations: true,
            })) {
              // Find the latest version of this document on the row
              const findTheLatestVersionOfThisDocumentOnTheRow2 = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
                triggerInputCondition: and(
                  eq("properties_poc", t.body.row_id),
                  eq("properties_name", loopOverTheDocument2.name),
                ),
                shouldSearchInAnalyticsStore: false,
                object_type: "psl_document",
                includeRoleMappings: false,
                includeCurrentUserPermissions: false,
                sortBy: [
                  {
                    field: "version",
                    order: "DESC",
                  },
                ],
                translationsOption: "DEFAULT",
                numberOfRecordsToFetch: "SINGLE",
                readThroughSessionVariables: false,
              });
              // Number the document
              const numberTheDocument2 = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
                output: {
                  type: "object",
                  properties: {
                    version: {
                      type: "integer",
                    },
                    document_id: {
                      type: "string",
                    },
                    format: {
                      type: "string",
                    },
                  },
                  required: [
                    "version",
                    "document_id",
                    "format",
                  ],
                },
                input: {
                  type: "object",
                  properties: {
                    poc_id: {
                      type: "string",
                    },
                    stage: {
                      type: "string",
                    },
                    name: {
                      type: "string",
                    },
                    latest: {
                      type: [
                        "integer",
                        "string",
                      ],
                    },
                    format: {
                      type: "string",
                    },
                    link: {
                      type: "string",
                    },
                  },
                },
                code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef text = { v -> v == null ? '' : v.toString().trim() }\ndef latest = value('latest')\ndef last = 0\nif (latest instanceof Number) { last = latest as int }\nelse if (text(latest).isInteger()) { last = text(latest).toInteger() }\ndef slug = text(value('name')).toLowerCase().replaceAll(/[^a-z0-9]+/, '-').replaceAll(/^-+|-+$/, '')\nif (!slug) slug = 'document'\ndef version = last + 1\ndef fmt = text(value('format')).toLowerCase()\nif (!(fmt in ['markdown', 'html', 'link'])) { fmt = text(value('link')) ? 'link' : 'markdown' }\nresult = [version: version, document_id: (text(value('poc_id')) + '__' + text(value('stage')) + '__' + slug + '__v' + version).toString(), format: fmt]",
                compile_static: false,
                captureStdOutput: false,
                parameters: {
                  poc_id: t.body.row_id,
                  stage: "6_finalize",
                  name: loopOverTheDocument2.name,
                  latest: findTheLatestVersionOfThisDocumentOnTheRow2.properties.version,
                  format: loopOverTheDocument2.format,
                  link: loopOverTheDocument2.link,
                },
              });
              // Save the document for review
              op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
                useRawPayload: false,
                writeThroughSessionVariables: false,
                object_type: "psl_document",
                skipIfBlank: false,
                inlineRefresh: false,
                record: {
                  document_id: numberTheDocument2.result.document_id,
                  poc: t.body.row_id,
                  name: loopOverTheDocument2.name,
                  type: loopOverTheDocument2.type,
                  stage: "6_finalize",
                  gate_pack: "g3",
                  version: numberTheDocument2.result.version,
                  status: "in_review",
                  content: loopOverTheDocument2.content,
                  file_link: loopOverTheDocument2.link,
                  created_by: "Claude build run",
                  saved_at: composeTheGateTexts2.result.now,
                  format: numberTheDocument2.result.format,
                },
                useUuid: false,
                batching: false,
              });
            }
          }
          // Log that the gate was posted
          op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
            useRawPayload: false,
            writeThroughSessionVariables: false,
            object_type: "psl_activity",
            skipIfBlank: false,
            inlineRefresh: false,
            record: {
              activity_id: composeTheGateTexts2.result.gate_activity_id,
              poc: t.body.row_id,
              type: "gate_posted",
              stage: "6_finalize",
              gate: "g3",
              actor_type: "ai",
              actor_name: "Claude build run",
              message: composeTheGateTexts2.result.activity_message,
              posted_to: readThePocRow.properties.slack_channel,
              created_at: composeTheGateTexts2.result.now,
            },
            useUuid: false,
            batching: false,
          });
          // Row has a channel?
          if (and(
            exists(readThePocRow.properties.slack_channel_id),
            ne(readThePocRow.properties.slack_channel_id, "=\"\""),
          )) {
            // Post the build and its asset links in the row's channel
            op("slack", "slack_post_message_in_channel", {
              link_names: true,
              messageType: "text",
              channel: readThePocRow.properties.slack_channel_id,
              text: composeTheGateTexts2.result.slack_text,
              token_type: "bot_token",
              mrkdwn: true,
            }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
          }
          // Row has an owner Slack id?
          if (and(
            exists(readThePocRow.properties.owner_slack_id),
            ne(readThePocRow.properties.owner_slack_id, "=\"\""),
          )) {
            // Open a direct message with the owner
            const openADirectMessageWithTheOwner = op("slack", "slack_open_conversation", {
              return_im: false,
              prevent_creation: false,
              token_type: "bot_token",
              users: [
                readThePocRow.properties.owner_slack_id,
              ],
            }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
            // Conversation opened?
            if (and(
              exists(openADirectMessageWithTheOwner.channel.id),
            )) {
              // Tell the owner the build is complete
              op("slack", "slack_post_message_in_channel", {
                link_names: true,
                messageType: "text",
                channel: openADirectMessageWithTheOwner.channel.id,
                text: composeTheGateTexts2.result.dm_text,
                token_type: "bot_token",
                mrkdwn: true,
              }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
            }
          }
        },
      },
      {
        name: "Feedback",
        when: and(
          eq(t.body.kind, "feedback"),
        ),
        then: () => {
          // Branch Condition
          op("branch_condition", "branch_condition", {
            name: "Feedback",
            conditions: and(
              eq(t.body.kind, "feedback"),
            ),
          }, { nodeType: "BRANCH_CONDITION" });
          // Loop over the feedback entries
          const loopOverTheFeedbackEntryLoop = each(t.body.feedback, {
            captureIterations: true,
          });
          for (const loopOverTheFeedbackEntry of loopOverTheFeedbackEntryLoop) {
            // Count the iterations the row already has
            const countTheIterationsTheRowAlreadyHas = op("storage_by_unifyapps", "storage_by_unifyapps_count_records", {
              triggerInputCondition: and(
                eq("properties_poc", t.body.row_id),
              ),
              object_type: "psl_iteration",
            });
            // Number the entry
            const numberTheEntry = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
              output: {
                type: "object",
                properties: {
                  ticket_no: {
                    type: "string",
                  },
                  iteration_id: {
                    type: "string",
                  },
                  activity_id: {
                    type: "string",
                  },
                  title: {
                    type: "string",
                  },
                  gate: {
                    type: "string",
                  },
                  iteration: {
                    type: "integer",
                  },
                  created_at: {
                    type: "integer",
                  },
                  actor_type: {
                    type: "string",
                  },
                  activity_message: {
                    type: "string",
                  },
                },
                required: [
                  "ticket_no",
                  "iteration_id",
                  "activity_id",
                  "title",
                  "gate",
                  "iteration",
                  "created_at",
                  "actor_type",
                  "activity_message",
                ],
              },
              input: {
                type: "object",
                properties: {
                  now: {
                    type: "number",
                  },
                  index: {
                    type: "number",
                  },
                  count: {
                    type: "number",
                  },
                  text: {
                    type: "string",
                  },
                  phase: {
                    type: "string",
                  },
                  source: {
                    type: "string",
                  },
                },
              },
              code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef text = { v -> v == null ? '' : v.toString().trim() }\ndef toBig = { v -> try { new BigDecimal(text(v)).toBigInteger() } catch (e) { BigInteger.ZERO } }\ndef now = toBig(value('now'))\ndef n = toBig(value('index')).intValue() + 1\ndef cnt = toBig(value('count')).intValue()\ndef body = text(value('text'))\ndef title = body.length() > 80 ? body.substring(0, 80) : body\ndef phase = text(value('phase'))\ndef gate = [understand: 'g1', plan: 'g2', build: 'g3', deliver: 'g4'][phase] ?: 'none'\ndef actor = text(value('source')) == 'person' ? 'person' : 'ai'\nresult = [ticket_no: ('FB-' + now + '-' + n).toString(), iteration_id: ('ITR-' + now + '-' + n).toString(), activity_id: ('ACT-' + now + '-i' + n).toString(), title: title, gate: gate, iteration: cnt + 1, created_at: now.longValue(), actor_type: actor, activity_message: ('Change logged: ' + title).toString()]",
              compile_static: false,
              captureStdOutput: false,
              parameters: {
                now: RUN.currentTime,
                index: loopOverTheFeedbackEntryLoop.index,
                count: countTheIterationsTheRowAlreadyHas.count,
                text: loopOverTheFeedbackEntry.text,
                phase: loopOverTheFeedbackEntry.phase,
                source: loopOverTheFeedbackEntry.source,
              },
            });
            // Log the change
            op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
              useRawPayload: false,
              writeThroughSessionVariables: false,
              object_type: "psl_iteration",
              skipIfBlank: false,
              inlineRefresh: false,
              record: {
                iteration_id: numberTheEntry.result.iteration_id,
                poc: t.body.row_id,
                phase: loopOverTheFeedbackEntry.phase,
                source: loopOverTheFeedbackEntry.source,
                actor_name: loopOverTheFeedbackEntry.actor_name,
                title: numberTheEntry.result.title,
                reason: loopOverTheFeedbackEntry.text,
                skill: loopOverTheFeedbackEntry.skill,
                related_ticket: numberTheEntry.result.ticket_no,
                created_at: numberTheEntry.result.created_at,
              },
              useUuid: false,
              batching: false,
            });
            // Open a feedback ticket
            op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
              useRawPayload: false,
              writeThroughSessionVariables: false,
              object_type: "psl_feedback",
              skipIfBlank: false,
              inlineRefresh: false,
              record: {
                ticket_no: numberTheEntry.result.ticket_no,
                poc: t.body.row_id,
                poc_stage: readThePocRow.properties.stage,
                gate: numberTheEntry.result.gate,
                iteration: numberTheEntry.result.iteration,
                client_name: readThePocRow.properties.client_name,
                title: numberTheEntry.result.title,
                feedback: loopOverTheFeedbackEntry.text,
                severity: "medium",
                target_skill: loopOverTheFeedbackEntry.skill,
                status: "open",
                given_by_name: loopOverTheFeedbackEntry.actor_name,
                created_at: numberTheEntry.result.created_at,
              },
              useUuid: false,
              batching: false,
            });
            // Log the change in the activity feed
            op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
              useRawPayload: false,
              writeThroughSessionVariables: false,
              object_type: "psl_activity",
              skipIfBlank: false,
              inlineRefresh: false,
              record: {
                activity_id: numberTheEntry.result.activity_id,
                poc: t.body.row_id,
                type: "iteration_logged",
                stage: readThePocRow.properties.stage,
                gate: numberTheEntry.result.gate,
                actor_type: numberTheEntry.result.actor_type,
                actor_name: loopOverTheFeedbackEntry.actor_name,
                message: numberTheEntry.result.activity_message,
                posted_to: readThePocRow.properties.slack_channel,
                created_at: numberTheEntry.result.created_at,
              },
              useUuid: false,
              batching: false,
            });
          }
        },
      },
    ], () => {
      // Summary starts with "error"?
      if (and(
        regex(t.body.summary, "(?i)^\\s*error"),
      )) {
        // Block the row and say what it is blocked on
        op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
          recordId: readThePocRow.id,
          writeThroughSessionVariables: false,
          object_type: "psl_poc",
          skipIfBlank: false,
          skipPermissionCheck: false,
          updateFields: [
            {
              fieldName: "properties.last_activity",
              actionType: "SET",
              setValue: t.body.summary,
            },
            {
              fieldName: "properties.last_activity_at",
              actionType: "SET",
              setValue: RUN.currentTime,
            },
            {
              fieldName: "properties.status",
              actionType: "SET",
              setValue: "blocked",
            },
            {
              fieldName: "properties.blocked_on",
              actionType: "SET",
              setValue: t.body.summary,
            },
          ],
          skipSchemaValidation: true,
          unsetIfNull: false,
        });
      } else {
        // Record the status line
        op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
          recordId: readThePocRow.id,
          writeThroughSessionVariables: false,
          object_type: "psl_poc",
          skipIfBlank: false,
          skipPermissionCheck: false,
          updateFields: [
            {
              fieldName: "properties.last_activity",
              actionType: "SET",
              setValue: t.body.summary,
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
      }
    });
    // Respond 200
    respond("200_posted", {
      streamingCompleted: true,
      body: {
        status: "posted",
      },
      status: 200,
    });
  },
);
