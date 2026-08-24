import { NextResponse } from 'next/server';
import { leaveManager } from '@/lib/leave-manager';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { doctorId, startDate, endDate, reason, previewOnly } = body;

    if (!doctorId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'doctorId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    if (previewOnly) {
      const conflicts = leaveManager.previewLeaveConflicts(doctorId, startDate, endDate);
      return NextResponse.json({
        success: true,
        conflictsCount: conflicts.length,
        conflicts,
      });
    }

    const result = await leaveManager.applyDoctorLeave({
      doctorId,
      startDate,
      endDate,
      reason: reason || 'Scheduled Physician Leave',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      leave: result.leave,
      affectedAppointmentsCount: result.affectedAppointments.length,
      notifiedPatientsCount: result.notifiedPatientsCount,
      affectedAppointments: result.affectedAppointments,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
