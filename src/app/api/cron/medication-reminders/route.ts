import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/notification-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In dev or without CRON_SECRET configured, permit for dashboard triggers
      if (process.env.NODE_ENV === 'production' && cronSecret) {
        return NextResponse.json({ success: false, error: 'Unauthorized cron invocation' }, { status: 401 });
      }
    }

    const result = await notificationService.processMedicationRemindersCron();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
