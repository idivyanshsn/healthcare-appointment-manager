import { NextResponse } from 'next/server';
import { slotManager } from '@/lib/slot-manager';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { doctorId, patientId, appointmentDate, startTime, endTime } = body;

    if (!doctorId || !patientId || !appointmentDate || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'doctorId, patientId, appointmentDate, startTime, and endTime are required',
        },
        { status: 400 }
      );
    }

    const result = slotManager.acquireSlotHold({
      doctorId,
      patientId,
      appointmentDate,
      startTime,
      endTime,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      hold: result.hold,
      expiresAt: result.hold?.expiresAt,
      holdDurationMinutes: 10,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
