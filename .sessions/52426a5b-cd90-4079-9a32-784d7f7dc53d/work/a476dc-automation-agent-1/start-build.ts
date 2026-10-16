import { automation, callable, op, ENV, RUN, TRIGGER, and, eq, missing } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Start build",
    description: "Called by the app's Build button and by Approve gate to start a build run for one POC. Checks the inputs, refuses a second plan run while the row already has a build run, fires the Claude routine, then stores the session link on the row, writes a stage_started activity row and posts the session link in the row's Slack channel.",
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
          build_run_id: {
            type: "string",
            title: "Build run id",
          },
          message: {
            type: "string",
            title: "Message",
          },
        },
        required: [
          "status",
          "build_run_id",
          "message",
        ],
      },
      setup: {
        type: "object",
        properties: {
          poc_id: {
            type: "string",
            title: "POC id",
          },
          mode: {
            type: "string",
            title: "Mode",
          },
          approved_prd_link: {
            type: "string",
            title: "Approved PRD link",
          },
        },
        required: [
          "poc_id",
        ],
      },
    }),
  },
  (t) => {
    let fireTheClaudeRoutine;

    // Check the inputs
    const checkTheInputs = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          valid: {
            type: "boolean",
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
          mode: {
            type: "string",
            title: "Mode",
          },
          prdLink: {
            type: "string",
            title: "Approved PRD link",
          },
        },
      },
      input: {
        type: "object",
        properties: {
          pocId: {
            type: "string",
            title: "POC id",
          },
          mode: {
            type: "string",
            title: "Mode",
          },
          prdLink: {
            type: "string",
            title: "Approved PRD link",
          },
        },
      },
      code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef text = { String name -> (value(name)?.toString() ?: '').trim() }\ndef flat = { String s -> s.replaceAll(/[\\r\\n\\t]+/, ' ').trim() }\ndef pocId = text('pocId')\ndef mode = text('mode').toLowerCase() ?: 'plan'\ndef problem = ''\nif (!pocId) problem = 'poc_id is required.'\nelse if (pocId.length() > 200 || pocId != flat(pocId)) problem = 'poc_id is not valid.'\nelse if (!(mode in ['plan', 'build'])) problem = 'mode must be plan or build.'\ndef prd = mode == 'build' ? flat(text('prdLink')) : ''\nresult = [valid: problem == '', error: problem, pocId: pocId, mode: mode, prdLink: prd]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        pocId: t.poc_id,
        mode: t.mode,
        prdLink: t.approved_prd_link,
      },
    });
    // Inputs invalid?
    if (and(
      eq(checkTheInputs.result.valid, false),
    )) {
      // Refuse the request
      return {
        status: "error",
        build_run_id: "=\"\"",
        message: checkTheInputs.result.error,
      };
    }
    // Read the POC row
    const readThePocRow = op("storage_by_unifyapps", "storage_by_unifyapps_fetch_records", {
      triggerInputCondition: and(
        eq("properties_poc_id", checkTheInputs.result.pocId),
      ),
      shouldSearchInAnalyticsStore: false,
      object_type: "psl_poc",
      includeRoleMappings: false,
      includeCurrentUserPermissions: false,
      translationsOption: "DEFAULT",
      numberOfRecordsToFetch: "SINGLE",
      readThroughSessionVariables: false,
    });
    // No such POC?
    if (and(
      missing(readThePocRow.id),
    )) {
      // Answer not found
      return {
        status: "not_found",
        build_run_id: "=\"\"",
        message: `No POC with id ${checkTheInputs.result.pocId} was found.`,
      };
    }
    // Prepare the request values
    const prepareTheRequestValues = op("code_by_unifyapps", "code_by_unifyapps_groovy", {
      output: {
        type: "object",
        properties: {
          alreadyRunning: {
            type: "boolean",
            title: "Already running",
          },
          client: {
            type: "string",
            title: "Client",
          },
          useCase: {
            type: "string",
            title: "Use case",
          },
          channelId: {
            type: "string",
            title: "Slack channel id",
          },
          prdLine: {
            type: "string",
            title: "PRD line",
          },
          stage: {
            type: "string",
            title: "Stage",
          },
        },
      },
      input: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            title: "Mode",
          },
          clientName: {
            type: "string",
            title: "Client name",
          },
          useCase: {
            type: "string",
            title: "Use case",
          },
          channelId: {
            type: "string",
            title: "Slack channel id",
          },
          buildRunId: {
            type: "string",
            title: "Build run id",
          },
          prdLink: {
            type: "string",
            title: "Approved PRD link",
          },
        },
      },
      code: "def value = { String name -> binding.hasVariable(name) ? binding.getVariable(name) : null }\ndef flat = { String name -> (value(name)?.toString() ?: '').replaceAll(/[\\r\\n\\t]+/, ' ').trim() }\ndef nl = String.valueOf((char) 10)\ndef mode = flat('mode')\ndef link = flat('prdLink')\nresult = [\n  alreadyRunning: (mode == 'plan' && flat('buildRunId') != ''),\n  client: flat('clientName'),\n  useCase: flat('useCase'),\n  channelId: flat('channelId'),\n  prdLine: (mode == 'build' ? nl + 'approved_prd_link: ' + link : ''),\n  stage: (mode == 'build' ? '5_build' : '1_signal_capture')\n]",
      compile_static: false,
      captureStdOutput: false,
      parameters: {
        mode: checkTheInputs.result.mode,
        clientName: readThePocRow.properties.client_name,
        useCase: readThePocRow.properties.use_case,
        channelId: readThePocRow.properties.slack_channel_id,
        buildRunId: readThePocRow.properties.build_run_id,
        prdLink: checkTheInputs.result.prdLink,
      },
    });
    // Plan run already started for this row?
    if (and(
      eq(prepareTheRequestValues.result.alreadyRunning, true),
    )) {
      // Answer already running
      return {
        status: "already_running",
        build_run_id: readThePocRow.properties.build_run_id,
        message: `A build is already running for ${prepareTheRequestValues.result.useCase}.`,
      };
    }
    try {
      // Fire the Claude routine
      fireTheClaudeRoutine = op("custom_http_endpoint", "custom_http_endpoint_execute", {
        isAsync: false,
        enableProxy: false,
        requestTimeoutInSecs: -1,
        httpMethod: "POST",
        body: {
          text: `command: /build
client: ${prepareTheRequestValues.result.client}
use_case: ${prepareTheRequestValues.result.useCase}
row_id: ${checkTheInputs.result.pocId}
mode: ${checkTheInputs.result.mode}
slack_channel_id: ${prepareTheRequestValues.result.channelId}${prepareTheRequestValues.result.prdLine}
report_url: ${ENV.POC_STUDIO_REPORT_URL}
report_header: ${ENV.POC_STUDIO_REPORT_HEADER}`,
        },
        connectionType: "DIRECT",
        sslVerify: false,
        path: "/v1/claude_code/routines/:routine_id/fire",
        responseSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
            },
            claude_code_session_id: {
              type: "string",
            },
            claude_code_session_url: {
              type: "string",
            },
          },
        },
        baseUrl: "https://api.anthropic.com",
        httpVersion: "HTTP_2",
        bodySchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              title: "Text",
            },
          },
        },
        responseContentType: "application/json",
        followRedirects: "NORMAL",
        headersList: [
          {
            key: "Authorization",
            value: `Bearer ${ENV.CLAUDE_ROUTINE_TOKEN}`,
          },
          {
            key: "anthropic-beta",
            value: "experimental-cc-routine-2026-04-01",
          },
          {
            key: "anthropic-version",
            value: "2023-06-01",
          },
          {
            key: "Content-Type",
            value: "application/json",
          },
        ],
        pathParamsList: [
          {
            key: "routine_id",
            value: ENV.CLAUDE_ROUTINE_ID,
          },
        ],
        authType: "CUSTOM",
        requestContentType: "application/json",
        ignoreTrailingSlashes: false,
        certificateType: "CERT_STRING",
      });
      // Routine accepted the request?
      if (and(
        eq(fireTheClaudeRoutine.status, 200),
      )) {
        // Store the session link, stage and status on the row
        op("storage_by_unifyapps", "storage_by_unifyapps_update_record_fields_by_id", {
          recordId: readThePocRow.id,
          writeThroughSessionVariables: false,
          object_type: "psl_poc",
          skipIfBlank: false,
          skipPermissionCheck: false,
          updateFields: [
            {
              fieldName: "properties.build_run_id",
              actionType: "SET",
              setValue: fireTheClaudeRoutine.result.claude_code_session_url,
            },
            {
              fieldName: "properties.stage",
              actionType: "SET",
              setValue: prepareTheRequestValues.result.stage,
            },
            {
              fieldName: "properties.status",
              actionType: "SET",
              setValue: "running",
            },
          ],
          skipSchemaValidation: true,
          unsetIfNull: false,
        });
        // Write the stage_started activity row
        op("storage_by_unifyapps", "storage_by_unifyapps_create_record", {
          useRawPayload: false,
          writeThroughSessionVariables: false,
          object_type: "psl_activity",
          skipIfBlank: false,
          inlineRefresh: false,
          record: {
            activity_id: `ACT-${RUN.currentTime}-${RUN.executionId}`,
            poc: readThePocRow.id,
            type: "stage_started",
            stage: prepareTheRequestValues.result.stage,
            gate: "none",
            actor_type: "system",
            actor_name: "POC Studio Live",
            message: `Build started · ${checkTheInputs.result.mode}`,
            posted_to: readThePocRow.properties.slack_channel,
            created_at: RUN.currentTime,
          },
          useUuid: false,
          batching: false,
        });
        // Post the session link in the row's channel
        const postTheSessionLinkInTheRowSChannel = op("slack", "slack_post_message_in_channel", {
          link_names: true,
          messageType: "text",
          channel: prepareTheRequestValues.result.channelId,
          text: `Build started for ${prepareTheRequestValues.result.useCase}. Claude session: ${fireTheClaudeRoutine.result.claude_code_session_url}`,
          token_type: "bot_token",
          mrkdwn: true,
        }, { connectionId: "6ad1be602ac9ba64653a9d36", onError: "CONTINUE" });
        // Slack post went through?
        if (and(
          eq(postTheSessionLinkInTheRowSChannel.ok, true),
        )) {
          // Answer started
          return {
            status: "started",
            build_run_id: fireTheClaudeRoutine.result.claude_code_session_url,
            message: `Build started (${checkTheInputs.result.mode}). Claude session: ${fireTheClaudeRoutine.result.claude_code_session_url}`,
          };
        } else {
          // Answer started, Slack post failed
          return {
            status: "started",
            build_run_id: fireTheClaudeRoutine.result.claude_code_session_url,
            message: `Build started (${checkTheInputs.result.mode}), but the Slack post did not go through. Claude session: ${fireTheClaudeRoutine.result.claude_code_session_url}`,
          };
        }
      } else {
        // Answer error, routine refused
        return {
          status: "error",
          build_run_id: "=\"\"",
          message: `The Claude routine did not accept the build request (HTTP ${fireTheClaudeRoutine.status}). Nothing was changed.`,
        };
      }
    } catch {
      // Answer error, routine call failed
      return {
        status: "error",
        build_run_id: "=\"\"",
        message: `The Claude routine call failed (HTTP ${fireTheClaudeRoutine.status}). Nothing was changed.`,
      };
    }
  },
);
