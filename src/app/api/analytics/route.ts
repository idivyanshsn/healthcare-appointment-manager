import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const analytics = dbStore.getAnalytics();
    return NextResponse.json({ success: true, analytics });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
