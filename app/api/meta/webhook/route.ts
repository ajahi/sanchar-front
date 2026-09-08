import { NextResponse } from 'next/server';
import { webhookLogs } from '../_logs';

export async function POST(req: Request) {
  const event = await req.json();
  const webhookLog = {
    id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    channel: event.channel || 'facebook',
    event: event.entry?.[0]?.messaging?.[0] ? 'messages' : 'webhook_event',
    payload: event,
    status: 'PROCESSED',
  };
  webhookLogs.unshift(webhookLog);
  if (webhookLogs.length > 50) webhookLogs.pop();

  return NextResponse.json({
    status: 'EVENT_RECEIVED',
    logId: webhookLog.id,
    deduplicated: true,
  });
}
