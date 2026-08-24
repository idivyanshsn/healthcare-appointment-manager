import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cleanedCount = dbStore.cleanupExpiredHolds();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cleanedHoldsCount: cleanedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
