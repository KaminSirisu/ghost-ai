import { logger, task } from "@trigger.dev/sdk";

interface TriggerSetupCheckPayload {
  message?: string;
}

export const triggerSetupCheck = task({
  id: "trigger-setup-check",
  run: async (payload: TriggerSetupCheckPayload) => {
    const message = payload.message ?? "Ghost AI Trigger.dev setup is connected.";

    logger.info("Trigger.dev setup check", { message });

    return {
      message,
      checkedAt: new Date().toISOString(),
    };
  },
});
