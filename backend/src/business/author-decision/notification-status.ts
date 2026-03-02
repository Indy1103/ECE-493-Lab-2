import type { AuthorDecisionAccessRecord } from "./ports.js";

export type NotificationStatusResult =
  | { available: true; decision: "ACCEPT" | "REJECT" }
  | { available: false; reasonCode: "notification-undelivered" };

export class AuthorDecisionNotificationStatusReader {
  evaluate(record: AuthorDecisionAccessRecord): NotificationStatusResult {
    if (record.notificationStatus === "FAILED") {
      return {
        available: false,
        reasonCode: "notification-undelivered"
      };
    }

    return {
      available: true,
      decision: record.decision
    };
  }
}
