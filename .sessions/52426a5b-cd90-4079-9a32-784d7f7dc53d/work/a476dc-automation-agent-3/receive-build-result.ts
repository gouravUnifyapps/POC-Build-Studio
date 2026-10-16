import {
  and,
  automation,
  branch,
  callableApi,
  each,
  ENV,
  eq,
  exists,
  missing,
  ne,
  op,
  or,
  regex,
  respond,
  RUN,
} from "@ua/automations";

const SLACK = "6ad1be602ac9ba64653a9d36";

export default automation(
  {
    name: "POC Studio Live · Receive build result",
    description:
      "Receives what a Claude build run sends back for a POC row: a plan or a final build for a gate, feedback entries, or a status line. Writes the documents, activity, iteration and feedback rows, moves the row to the gate, and posts the gate in the row's Slack channel.",
    trigger: callableApi({
      endpointType: "REST",
      streamingResponse: false,
      request: {
        contentType: "application/json",
        body: {
          type: "object",
          properties: {
            row_id: { type: "string", title: "Row id (the POC id)" },
            kind: { type: "string", title: "Kind: plan, final, feedback or status" },
            gate: { type: "string", title: "Gate: g2 or g3" },
            title: { type: "string", title: "Title" },
            summary: { type: "string", title: "Summary" },
            documents: {
              type: "array",
              title: "Documents",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  format: { type: "string" },
                  content: { type: "string" },
                  link: { type: "string" },
                },
              },
            },
            feedback: {
              type: "array",
              title: "Feedback",
              items: {
                type: "object",
                properties: {
                  phase: { type: "string" },
                  source: { type: "string" },
                  actor_name: { type: "string" },
                  text: { type: "string" },
                  skill: { type: "string" },
                },
              },
            },
          },
          required: ["row_id"],
        },
      },
      response: [
        {
          name: "posted",
          status: 200,
          contentType: "application/json",
          body: { type: "object", properties: { status: { type: "string" } } },
        },
        {
          name: "row_not_found",
          status: 404,
          contentType: "application/json",
          body: { type: "object", properties: { status: { type: "string" } } },
        },
        {
          name: "bad_request",
          status: 400,
          contentType: "application/json",
          body: { type: "object", properties: { status: { type: "string" } } },
        },
      ],
    }),
  },
  (t) => {
    // The body is checked before anything is written. The script reads only the fields it checks, never a document's content.
    // Check the request body
    const checked = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      input: {
        type: "object",
        properties: {
          row_id: { type: "string" },
          kind: { type: "string" },
          summary: { type: "string" },
          documents: { type: "array", items: { type: "object" } },
          feedback: { type: "array", items: { type: "object" } },
        },
      },
      output: {
        type: "object",
        properties: { ok: { type: "boolean" }, error: { type: "string" } },
        required: ["ok", "error"],
      },
      parameters: {
        row_id: t.body.row_id,
        kind: t.body.kind,
        summary: t.body.summary,
        documents: t.body.documents.map((d) => ({ name: d.name, type: d.type, format: d.format })),
        feedback: t.body.feedback.map((f) => ({
          phase: f.phase,
          source: f.source,
          actor_name: f.actor_name,
          text: f.text,
        })),
      },
      code: [
        "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
        "def text = { v -> v == null ? '' : v.toString().trim() }",
        "def errors = []",
        "def kinds = ['plan', 'final', 'feedback', 'status']",
        "def docTypes = ['brief','input','requirements','scope','email','brd','design_system','build_report','app','evidence_pack','demo_script','deck','video','use_case','design','automation','object','agent','walkthrough','poc_link']",
        "def docFormats = ['markdown', 'html', 'link']",
        "def phases = ['understand', 'plan', 'build', 'deliver']",
        "def sources = ['judge', 'person']",
        "def kind = text(value('kind'))",
        "if (!text(value('row_id'))) errors << 'row_id is required'",
        "if (!(kind in kinds)) errors << 'kind must be plan, final, feedback or status'",
        "if (kind == 'plan' || kind == 'final') {",
        "  def docs = (value('documents') ?: []) as List",
        "  docs.eachWithIndex { d, i ->",
        "    def at = 'documents[' + (i + 1) + ']'",
        "    if (!text(d?.name)) errors << (at + '.name is required')",
        "    if (!(text(d?.type) in docTypes)) errors << (at + '.type is not a known document type')",
        "    def fmt = text(d?.format)",
        "    if (fmt && !(fmt in docFormats)) errors << (at + '.format must be markdown, html or link')",
        "  }",
        "}",
        "if (kind == 'feedback') {",
        "  def items = (value('feedback') ?: []) as List",
        "  if (items.isEmpty()) errors << 'feedback must have at least one entry'",
        "  items.eachWithIndex { f, i ->",
        "    def at = 'feedback[' + (i + 1) + ']'",
        "    if (!(text(f?.phase) in phases)) errors << (at + '.phase must be understand, plan, build or deliver')",
        "    if (!(text(f?.source) in sources)) errors << (at + '.source must be judge or person')",
        "    if (!text(f?.actor_name)) errors << (at + '.actor_name is required')",
        "    if (!text(f?.text)) errors << (at + '.text is required')",
        "  }",
        "}",
        "if (kind == 'status' && !text(value('summary'))) errors << 'summary is required for a status update'",
        "result = [ok: errors.isEmpty(), error: errors.join('; ').toString()]",
      ].join("\n"),
      compile_static: false,
      captureStdOutput: false,
    });

    // Body not valid?
    if (eq(checked.result.ok, false)) {
      // Respond 400
      respond("400_bad_request", {
        status: 400,
        body: { status: "bad_request" },
        streamingCompleted: true,
      });
    }

    // Read the POC row
    const row = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      object_type: "psl_poc",
      numberOfRecordsToFetch: "SINGLE",
      triggerInputCondition: eq("properties_poc_id", t.body.row_id),
    });

    // No such row?
    if (missing(row.id)) {
      // Respond 404
      respond("404_row_not_found", {
        status: 404,
        body: { status: "row_not_found" },
        streamingCompleted: true,
      });
    }

    // One arm per kind. Each arm writes its rows in the order the contract names them.
    branch(
      [
        {
          name: "Plan",
          when: eq(t.body.kind, "plan"),
          then: () => {
            // Compose the gate texts
            const planMsg = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
              input: {
                type: "object",
                properties: {
                  kind: { type: "string" },
                  poc_id: { type: "string" },
                  title: { type: "string" },
                  summary: { type: "string" },
                  app_url: { type: "string" },
                  links: { type: "array", items: { type: "string" } },
                  now: { type: "number" },
                },
              },
              output: {
                type: "object",
                properties: {
                  slack_text: { type: "string" },
                  dm_text: { type: "string" },
                  activity_message: { type: "string" },
                  now: { type: "integer" },
                  g1_activity_id: { type: "string" },
                  gate_activity_id: { type: "string" },
                },
                required: ["slack_text", "dm_text", "activity_message", "now", "g1_activity_id", "gate_activity_id"],
              },
              parameters: {
                kind: "plan",
                poc_id: t.body.row_id,
                title: t.body.title,
                summary: t.body.summary,
                app_url: ENV.POC_STUDIO_APP_URL,
                links: t.body.documents.map((d) => d.link),
                now: RUN.currentTime,
              },
              code: [
                "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
                "def text = { v -> v == null ? '' : v.toString().trim() }",
                "def toBig = { v -> try { new BigDecimal(text(v)).toBigInteger() } catch (e) { BigInteger.ZERO } }",
                "def kind = text(value('kind'))",
                "def poc = text(value('poc_id'))",
                "def title = text(value('title'))",
                "def summary = text(value('summary'))",
                "def base = text(value('app_url'))",
                "while (base.endsWith('/')) { base = base.substring(0, base.length() - 1) }",
                "def link = base ? (base + '/pocs/' + poc) : ''",
                "def now = toBig(value('now'))",
                "def lines = ['[' + poc + ']']",
                "if (title) lines << ('*' + title + '*')",
                "if (summary) lines << summary",
                "def builtLinks = ((value('links') ?: []) as List).collect { text(it) }.findAll { it }",
                "if (kind == 'final' && builtLinks) { lines << 'Built assets:'; builtLinks.each { lines << ('- ' + it) } }",
                "if (link) lines << link",
                "def label = kind == 'final' ? 'Build posted for G3 · Build sign-off' : 'Plan posted for G2 · Design check'",
                "def activity = (title ? label + ': ' + title : label)",
                "result = [slack_text: lines.join('\\n').toString(), dm_text: ('BUILD is complete' + (link ? '\\n' + link : '')).toString(), activity_message: activity.toString(), now: now.longValue(), g1_activity_id: ('ACT-' + now + '-g1').toString(), gate_activity_id: ('ACT-' + now + '-gate').toString()]",
              ].join("\n"),
              compile_static: false,
              captureStdOutput: false,
            });

            // Is the POC still in Understand?
            if (
              or(
                eq(row.properties.stage, "0_kickoff"),
                eq(row.properties.stage, "1_signal_capture"),
                eq(row.properties.stage, "2_research_assess"),
              )
            ) {
              // The setValue input takes text, so the two true values come from a variable
              const flags = op("variable_by_unifyapps", "variable_by_unifyapps_create_variables", { yes: true });

              // Record G1 as passed by the Judge
              op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
                object_type: "psl_poc",
                recordId: row.id,
                updateFields: [
                  { fieldName: "properties.g1_status", actionType: "SET", setValue: "approved" },
                  { fieldName: "properties.g1_owner_approved", actionType: "SET", setValue: flags.yes },
                  { fieldName: "properties.g1_manager_approved", actionType: "SET", setValue: flags.yes },
                ],
              });

              // Log the Judge's G1 decision
              op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
                object_type: "psl_activity",
                record: {
                  activity_id: planMsg.result.g1_activity_id,
                  poc: t.body.row_id,
                  type: "gate_decided",
                  stage: row.properties.stage,
                  gate: "g1",
                  decision: "approve",
                  actor_type: "ai",
                  actor_name: "Judge",
                  message: "Judge passed G1 · Scope check",
                  posted_to: row.properties.slack_channel,
                  created_at: planMsg.result.now,
                },
              });
            }

            // Move the row to the G2 gate
            op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
              object_type: "psl_poc",
              recordId: row.id,
              updateFields: [
                { fieldName: "properties.stage", actionType: "SET", setValue: "4_design_system" },
                { fieldName: "properties.current_gate", actionType: "SET", setValue: "g2" },
                { fieldName: "properties.g2_status", actionType: "SET", setValue: "waiting" },
                { fieldName: "properties.gate_summary", actionType: "SET", setValue: t.body.summary },
                { fieldName: "properties.status", actionType: "SET", setValue: "waiting" },
                { fieldName: "properties.last_activity", actionType: "SET", setValue: planMsg.result.activity_message },
                { fieldName: "properties.last_activity_at", actionType: "SET", setValue: planMsg.result.now },
              ],
            });

            // Any documents?
            if (exists(t.body.documents[0].name)) {
              // Loop over the documents
              for (const doc of t.body.documents) {
                // Find the latest version of this document on the row
                const planLatest = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
                  object_type: "psl_document",
                  numberOfRecordsToFetch: "SINGLE",
                  triggerInputCondition: and(eq("properties_poc", t.body.row_id), eq("properties_name", doc.name)),
                  sortBy: [{ field: "properties_version", order: "DESC" }],
                });

                // Number the document
                const planNumbered = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
                  input: {
                    type: "object",
                    properties: {
                      poc_id: { type: "string" },
                      stage: { type: "string" },
                      name: { type: "string" },
                      latest: { type: ["integer", "string"] },
                      format: { type: "string" },
                      link: { type: "string" },
                    },
                  },
                  output: {
                    type: "object",
                    properties: {
                      version: { type: "integer" },
                      document_id: { type: "string" },
                      format: { type: "string" },
                    },
                    required: ["version", "document_id", "format"],
                  },
                  parameters: {
                    poc_id: t.body.row_id,
                    stage: "4_design_system",
                    name: doc.name,
                    latest: planLatest.properties.version,
                    format: doc.format,
                    link: doc.link,
                  },
                  code: [
                    "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
                    "def text = { v -> v == null ? '' : v.toString().trim() }",
                    "def latest = value('latest')",
                    "def last = 0",
                    "if (latest instanceof Number) { last = latest as int }",
                    "else if (text(latest).isInteger()) { last = text(latest).toInteger() }",
                    "def slug = text(value('name')).toLowerCase().replaceAll(/[^a-z0-9]+/, '-').replaceAll(/^-+|-+$/, '')",
                    "if (!slug) slug = 'document'",
                    "def version = last + 1",
                    "def fmt = text(value('format')).toLowerCase()",
                    "if (!(fmt in ['markdown', 'html', 'link'])) { fmt = text(value('link')) ? 'link' : 'markdown' }",
                    "result = [version: version, document_id: (text(value('poc_id')) + '__' + text(value('stage')) + '__' + slug + '__v' + version).toString(), format: fmt]",
                  ].join("\n"),
                  compile_static: false,
                  captureStdOutput: false,
                });

                // Save the document for review
                op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
                  object_type: "psl_document",
                  record: {
                    document_id: planNumbered.result.document_id,
                    poc: t.body.row_id,
                    name: doc.name,
                    type: doc.type,
                    stage: "4_design_system",
                    gate_pack: "g2",
                    version: planNumbered.result.version,
                    status: "in_review",
                    content: doc.content,
                    file_link: doc.link,
                    created_by: "Claude build run",
                    saved_at: planMsg.result.now,
                    format: planNumbered.result.format,
                  },
                });
              }
            }

            // Log that the gate was posted
            op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
              object_type: "psl_activity",
              record: {
                activity_id: planMsg.result.gate_activity_id,
                poc: t.body.row_id,
                type: "gate_posted",
                stage: "4_design_system",
                gate: "g2",
                actor_type: "ai",
                actor_name: "Claude build run",
                message: planMsg.result.activity_message,
                posted_to: row.properties.slack_channel,
                created_at: planMsg.result.now,
              },
            });

            // Row has a channel?
            if (and(exists(row.properties.slack_channel_id), ne(row.properties.slack_channel_id, ""))) {
              // Post the plan in the row's channel
              op(
                "slack",
                "slack_post_message_in_channel",
                {
                  channel: row.properties.slack_channel_id,
                  messageType: "text",
                  text: planMsg.result.slack_text,
                },
                { connectionId: SLACK, onError: "CONTINUE" },
              );
            }
          },
        },
        {
          name: "Final",
          when: eq(t.body.kind, "final"),
          then: () => {
            // Compose the gate texts
            const finalMsg = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
              input: {
                type: "object",
                properties: {
                  kind: { type: "string" },
                  poc_id: { type: "string" },
                  title: { type: "string" },
                  summary: { type: "string" },
                  app_url: { type: "string" },
                  links: { type: "array", items: { type: "string" } },
                  now: { type: "number" },
                },
              },
              output: {
                type: "object",
                properties: {
                  slack_text: { type: "string" },
                  dm_text: { type: "string" },
                  activity_message: { type: "string" },
                  now: { type: "integer" },
                  g1_activity_id: { type: "string" },
                  gate_activity_id: { type: "string" },
                },
                required: ["slack_text", "dm_text", "activity_message", "now", "g1_activity_id", "gate_activity_id"],
              },
              parameters: {
                kind: "final",
                poc_id: t.body.row_id,
                title: t.body.title,
                summary: t.body.summary,
                app_url: ENV.POC_STUDIO_APP_URL,
                links: t.body.documents.map((d) => d.link),
                now: RUN.currentTime,
              },
              code: [
                "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
                "def text = { v -> v == null ? '' : v.toString().trim() }",
                "def toBig = { v -> try { new BigDecimal(text(v)).toBigInteger() } catch (e) { BigInteger.ZERO } }",
                "def kind = text(value('kind'))",
                "def poc = text(value('poc_id'))",
                "def title = text(value('title'))",
                "def summary = text(value('summary'))",
                "def base = text(value('app_url'))",
                "while (base.endsWith('/')) { base = base.substring(0, base.length() - 1) }",
                "def link = base ? (base + '/pocs/' + poc) : ''",
                "def now = toBig(value('now'))",
                "def lines = ['[' + poc + ']']",
                "if (title) lines << ('*' + title + '*')",
                "if (summary) lines << summary",
                "def builtLinks = ((value('links') ?: []) as List).collect { text(it) }.findAll { it }",
                "if (kind == 'final' && builtLinks) { lines << 'Built assets:'; builtLinks.each { lines << ('- ' + it) } }",
                "if (link) lines << link",
                "def label = kind == 'final' ? 'Build posted for G3 · Build sign-off' : 'Plan posted for G2 · Design check'",
                "def activity = (title ? label + ': ' + title : label)",
                "result = [slack_text: lines.join('\\n').toString(), dm_text: ('BUILD is complete' + (link ? '\\n' + link : '')).toString(), activity_message: activity.toString(), now: now.longValue(), g1_activity_id: ('ACT-' + now + '-g1').toString(), gate_activity_id: ('ACT-' + now + '-gate').toString()]",
              ].join("\n"),
              compile_static: false,
              captureStdOutput: false,
            });

            // Move the row to the G3 gate
            op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
              object_type: "psl_poc",
              recordId: row.id,
              updateFields: [
                { fieldName: "properties.stage", actionType: "SET", setValue: "6_finalize" },
                { fieldName: "properties.current_gate", actionType: "SET", setValue: "g3" },
                { fieldName: "properties.g3_status", actionType: "SET", setValue: "waiting" },
                { fieldName: "properties.gate_summary", actionType: "SET", setValue: t.body.summary },
                { fieldName: "properties.status", actionType: "SET", setValue: "waiting" },
                { fieldName: "properties.last_activity", actionType: "SET", setValue: finalMsg.result.activity_message },
                { fieldName: "properties.last_activity_at", actionType: "SET", setValue: finalMsg.result.now },
              ],
            });

            // Any documents?
            if (exists(t.body.documents[0].name)) {
              // Loop over the documents
              for (const doc of t.body.documents) {
                // Find the latest version of this document on the row
                const finalLatest = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
                  object_type: "psl_document",
                  numberOfRecordsToFetch: "SINGLE",
                  triggerInputCondition: and(eq("properties_poc", t.body.row_id), eq("properties_name", doc.name)),
                  sortBy: [{ field: "properties_version", order: "DESC" }],
                });

                // Number the document
                const finalNumbered = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
                  input: {
                    type: "object",
                    properties: {
                      poc_id: { type: "string" },
                      stage: { type: "string" },
                      name: { type: "string" },
                      latest: { type: ["integer", "string"] },
                      format: { type: "string" },
                      link: { type: "string" },
                    },
                  },
                  output: {
                    type: "object",
                    properties: {
                      version: { type: "integer" },
                      document_id: { type: "string" },
                      format: { type: "string" },
                    },
                    required: ["version", "document_id", "format"],
                  },
                  parameters: {
                    poc_id: t.body.row_id,
                    stage: "6_finalize",
                    name: doc.name,
                    latest: finalLatest.properties.version,
                    format: doc.format,
                    link: doc.link,
                  },
                  code: [
                    "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
                    "def text = { v -> v == null ? '' : v.toString().trim() }",
                    "def latest = value('latest')",
                    "def last = 0",
                    "if (latest instanceof Number) { last = latest as int }",
                    "else if (text(latest).isInteger()) { last = text(latest).toInteger() }",
                    "def slug = text(value('name')).toLowerCase().replaceAll(/[^a-z0-9]+/, '-').replaceAll(/^-+|-+$/, '')",
                    "if (!slug) slug = 'document'",
                    "def version = last + 1",
                    "def fmt = text(value('format')).toLowerCase()",
                    "if (!(fmt in ['markdown', 'html', 'link'])) { fmt = text(value('link')) ? 'link' : 'markdown' }",
                    "result = [version: version, document_id: (text(value('poc_id')) + '__' + text(value('stage')) + '__' + slug + '__v' + version).toString(), format: fmt]",
                  ].join("\n"),
                  compile_static: false,
                  captureStdOutput: false,
                });

                // Save the document for review
                op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
                  object_type: "psl_document",
                  record: {
                    document_id: finalNumbered.result.document_id,
                    poc: t.body.row_id,
                    name: doc.name,
                    type: doc.type,
                    stage: "6_finalize",
                    gate_pack: "g3",
                    version: finalNumbered.result.version,
                    status: "in_review",
                    content: doc.content,
                    file_link: doc.link,
                    created_by: "Claude build run",
                    saved_at: finalMsg.result.now,
                    format: finalNumbered.result.format,
                  },
                });
              }
            }

            // Log that the gate was posted
            op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
              object_type: "psl_activity",
              record: {
                activity_id: finalMsg.result.gate_activity_id,
                poc: t.body.row_id,
                type: "gate_posted",
                stage: "6_finalize",
                gate: "g3",
                actor_type: "ai",
                actor_name: "Claude build run",
                message: finalMsg.result.activity_message,
                posted_to: row.properties.slack_channel,
                created_at: finalMsg.result.now,
              },
            });

            // Row has a channel?
            if (and(exists(row.properties.slack_channel_id), ne(row.properties.slack_channel_id, ""))) {
              // Post the build and its asset links in the row's channel
              op(
                "slack",
                "slack_post_message_in_channel",
                {
                  channel: row.properties.slack_channel_id,
                  messageType: "text",
                  text: finalMsg.result.slack_text,
                },
                { connectionId: SLACK, onError: "CONTINUE" },
              );
            }

            // Row has an owner Slack id?
            if (and(exists(row.properties.owner_slack_id), ne(row.properties.owner_slack_id, ""))) {
              // Open a direct message with the owner
              const ownerDm = op(
                "slack",
                "slack_open_conversation",
                { users: [row.properties.owner_slack_id] },
                { connectionId: SLACK, onError: "CONTINUE" },
              );

              // Conversation opened?
              if (exists(ownerDm.channel.id)) {
                // Tell the owner the build is complete
                op(
                  "slack",
                  "slack_post_message_in_channel",
                  {
                    channel: ownerDm.channel.id,
                    messageType: "text",
                    text: finalMsg.result.dm_text,
                  },
                  { connectionId: SLACK, onError: "CONTINUE" },
                );
              }
            }
          },
        },
        {
          name: "Feedback",
          when: eq(t.body.kind, "feedback"),
          then: () => {
            // Loop over the feedback entries
            const entries = each(t.body.feedback);
            for (const entry of entries) {
              // Count the iterations the row already has
              const logged = op("storage_by_unifyapps", "storage_by_unifyapps_count_records", {
                object_type: "psl_iteration",
                triggerInputCondition: eq("properties_poc", t.body.row_id),
              });

              // Number the entry
              const numbered = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
                input: {
                  type: "object",
                  properties: {
                    now: { type: "number" },
                    index: { type: "number" },
                    count: { type: "number" },
                    text: { type: "string" },
                    phase: { type: "string" },
                    source: { type: "string" },
                  },
                },
                output: {
                  type: "object",
                  properties: {
                    ticket_no: { type: "string" },
                    iteration_id: { type: "string" },
                    activity_id: { type: "string" },
                    title: { type: "string" },
                    gate: { type: "string" },
                    iteration: { type: "integer" },
                    created_at: { type: "integer" },
                    actor_type: { type: "string" },
                    activity_message: { type: "string" },
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
                parameters: {
                  now: RUN.currentTime,
                  index: entries.index,
                  count: logged.count,
                  text: entry.text,
                  phase: entry.phase,
                  source: entry.source,
                },
                code: [
                  "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }",
                  "def text = { v -> v == null ? '' : v.toString().trim() }",
                  "def toBig = { v -> try { new BigDecimal(text(v)).toBigInteger() } catch (e) { BigInteger.ZERO } }",
                  "def now = toBig(value('now'))",
                  "def n = toBig(value('index')).intValue() + 1",
                  "def cnt = toBig(value('count')).intValue()",
                  "def body = text(value('text'))",
                  "def title = body.length() > 80 ? body.substring(0, 80) : body",
                  "def phase = text(value('phase'))",
                  "def gate = [understand: 'g1', plan: 'g2', build: 'g3', deliver: 'g4'][phase] ?: 'none'",
                  "def actor = text(value('source')) == 'person' ? 'person' : 'ai'",
                  "result = [ticket_no: ('FB-' + now + '-' + n).toString(), iteration_id: ('ITR-' + now + '-' + n).toString(), activity_id: ('ACT-' + now + '-i' + n).toString(), title: title, gate: gate, iteration: cnt + 1, created_at: now.longValue(), actor_type: actor, activity_message: ('Change logged: ' + title).toString()]",
                ].join("\n"),
                compile_static: false,
                captureStdOutput: false,
              });

              // Log the change
              op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
                object_type: "psl_iteration",
                record: {
                  iteration_id: numbered.result.iteration_id,
                  poc: t.body.row_id,
                  phase: entry.phase,
                  source: entry.source,
                  actor_name: entry.actor_name,
                  title: numbered.result.title,
                  reason: entry.text,
                  skill: entry.skill,
                  related_ticket: numbered.result.ticket_no,
                  created_at: numbered.result.created_at,
                },
              });

              // Open a feedback ticket
              op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
                object_type: "psl_feedback",
                record: {
                  ticket_no: numbered.result.ticket_no,
                  poc: t.body.row_id,
                  poc_stage: row.properties.stage,
                  gate: numbered.result.gate,
                  iteration: numbered.result.iteration,
                  client_name: row.properties.client_name,
                  title: numbered.result.title,
                  feedback: entry.text,
                  severity: "medium",
                  target_skill: entry.skill,
                  status: "open",
                  given_by_name: entry.actor_name,
                  created_at: numbered.result.created_at,
                },
              });

              // Log the change in the activity feed
              op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
                object_type: "psl_activity",
                record: {
                  activity_id: numbered.result.activity_id,
                  poc: t.body.row_id,
                  type: "iteration_logged",
                  stage: row.properties.stage,
                  gate: numbered.result.gate,
                  actor_type: numbered.result.actor_type,
                  actor_name: entry.actor_name,
                  message: numbered.result.activity_message,
                  posted_to: row.properties.slack_channel,
                  created_at: numbered.result.created_at,
                },
              });
            }
          },
        },
      ],
      () => {
        // Status: the only kind left after the body check
        // Summary starts with "error"?
        if (regex(t.body.summary, "(?i)^\\s*error")) {
          // Block the row and say what it is blocked on
          op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
            object_type: "psl_poc",
            recordId: row.id,
            updateFields: [
              { fieldName: "properties.last_activity", actionType: "SET", setValue: t.body.summary },
              { fieldName: "properties.last_activity_at", actionType: "SET", setValue: RUN.currentTime },
              { fieldName: "properties.status", actionType: "SET", setValue: "blocked" },
              { fieldName: "properties.blocked_on", actionType: "SET", setValue: t.body.summary },
            ],
          });
        } else {
          // Record the status line
          op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
            object_type: "psl_poc",
            recordId: row.id,
            updateFields: [
              { fieldName: "properties.last_activity", actionType: "SET", setValue: t.body.summary },
              { fieldName: "properties.last_activity_at", actionType: "SET", setValue: RUN.currentTime },
            ],
          });
        }
      },
    );

    // Respond 200
    respond("200_posted", {
      status: 200,
      body: { status: "posted" },
      streamingCompleted: true,
    });
  },
);
