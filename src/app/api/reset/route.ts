import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export async function POST() {
  try {
    dbStore.resetToSeed();
    return NextResponse.json({
      success: true,
      message: 'Store reset to default clinical seed dataset successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
