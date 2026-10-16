import { automation, callable, op, TRIGGER } from "@ua/automations";

export default automation(
  {
    name: "POC Studio Live · Approve skill suggestion",
    description: "Called by the Approve button on the Feedback page. Approves a pending skill suggestion for a manager: sets the skill's new version and prompt and marks the evidence tickets resolved. This version is a contract shell and always answers status error.",
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
          skill_id: {
            type: "string",
            title: "Skill id",
          },
          to_version: {
            type: "integer",
            title: "To version",
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
          suggestion_id: {
            type: "string",
            title: "Suggestion id",
          },
          caller_email: {
            type: "string",
            title: "Caller email",
          },
          caller_name: {
            type: "string",
            title: "Caller name",
          },
        },
        required: [
          "suggestion_id",
        ],
      },
    }),
  },
  () => {
    // Return the contract shell answer
    return {
      status: "error",
      skill_id: "=\"\"",
      to_version: 0,
      message: "This is a contract shell: the approval logic is not built yet.",
    };
  },
);
