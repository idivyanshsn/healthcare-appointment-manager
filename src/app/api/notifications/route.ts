import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { notificationService } from '@/lib/notification-service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const type = searchParams.get('type');

    let logs = dbStore.getNotificationLogs();

    if (email) {
      logs = logs.filter((l) => l.recipientEmail.toLowerCase() === email.toLowerCase());
    }
    if (type) {
      logs = logs.filter((l) => l.type === type);
    }

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { logId, action } = body;

    if (action === 'retry' && logId) {
      const updated = await notificationService.retryFailedNotification(logId);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Notification log not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, log: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
