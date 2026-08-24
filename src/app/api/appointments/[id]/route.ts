import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { notificationService } from '@/lib/notification-service';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const apt = dbStore.getAppointmentById(params.id);
    if (!apt) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, appointment: apt });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const existing = dbStore.getAppointmentById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    const updated = dbStore.updateAppointment(params.id, body);

    if (body.status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      await notificationService.sendCancellationNotice({
        recipientEmail: existing.patientEmail,
        recipientName: existing.patientName,
        recipientRole: 'patient',
        doctorName: existing.doctorName,
        appointmentDate: existing.appointmentDate,
        startTime: existing.startTime,
        reason: body.cancellationReason || 'Cancelled by user',
        appointmentId: existing.id,
      });
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
