import { NextResponse } from 'next/server';
import { webhookLogs } from '../_logs';

export async function GET() {
  return NextResponse.json({ logs: webhookLogs });
}
