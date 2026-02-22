import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { inactivityReminder } from "@/inngest/functions/reminder-email";
import { creditReset } from "@/inngest/functions/credit-reset";
import { trialExpiry } from "@/inngest/functions/trial-expiry";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    inactivityReminder,
    creditReset,
    trialExpiry,
  ],
});
