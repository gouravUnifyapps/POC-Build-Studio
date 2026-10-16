import { automation, callable } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Start build",
    description: "Disabled: builds start from Claude Code via /demo-studio:build. Every call returns status disabled and does nothing else; the trigger contract is kept for its callers (the app data source and Approve gate).",
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
    // Answer disabled
    return {
      status: "disabled",
      build_run_id: "=\"\"",
      message: "Builds start from Claude Code now: copy the /demo-studio:build prompt from the POC page.",
    };
  },
);
