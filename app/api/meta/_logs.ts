// ponytail: in-memory, single-instance (same as the original express server).
// Move to a DB if you run multiple replicas or need persistence.
export type WebhookLog = {
  id: string;
  timestamp: string;
  channel: string;
  event: string;
  payload: any;
  status: string;
};

export const webhookLogs: WebhookLog[] = [];
