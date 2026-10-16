import { automation, callable, op, TRIGGER } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Approve gate",
    description: "Contract shell. Records the manager's or the owner's approval of a POC's open gate. Called by the app's Approve button (role manager) and by the Slack listener (role owner).",
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
          gate_passed: {
            type: "boolean",
            title: "Gate passed",
          },
          warnings: {
            type: "array",
            items: {
              type: "string",
            },
            title: "Warnings",
          },
          message: {
            type: "string",
            title: "Message",
          },
        },
      },
      setup: {
        type: "object",
        properties: {
          poc_id: {
            type: "string",
            title: "POC id",
          },
          role: {
            type: "string",
            title: "Role (manager or owner)",
          },
          caller_email: {
            type: "string",
            title: "Caller email",
          },
          caller_name: {
            type: "string",
            title: "Caller name",
          },
          caller_slack_id: {
            type: "string",
            title: "Caller Slack id",
          },
        },
        required: [],
      },
    }),
  },
  () => {
    // Contract shell: answers a typed error until the real logic is built
    return {
      status: "error",
      gate_passed: false,
      warnings: [],
      message: "This is a contract shell: the approve logic is not built yet.",
    };
  },
);
