import { NextResponse } from 'next/server';
import { slotManager } from '@/lib/slot-manager';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');
    const patientId = searchParams.get('patientId') || undefined;

    if (!doctorId || !date) {
      return NextResponse.json(
        { success: false, error: 'doctorId and date query parameters are required' },
        { status: 400 }
      );
    }

    const result = slotManager.getDoctorSlotsForDate(doctorId, date, patientId);

    return NextResponse.json({
      success: true,
      doctorId,
      date,
      slots: result.slots,
      doctorOnLeave: result.doctorOnLeave,
      leaveReason: result.leaveReason,
      workingHoursInfo: result.workingHoursInfo,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
