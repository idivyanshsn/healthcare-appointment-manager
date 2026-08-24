import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { slotManager } from '@/lib/slot-manager';
import { llmService } from '@/lib/llm-service';
import { notificationService } from '@/lib/notification-service';
import { calendarService } from '@/lib/calendar-service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');

    let appointments = dbStore.getAppointments();

    if (doctorId) {
      appointments = appointments.filter((a) => a.doctorId === doctorId);
    } else if (userId && role === 'patient') {
      appointments = appointments.filter((a) => a.patientId === userId);
    } else if (userId && role === 'doctor') {
      const doc = dbStore.getDoctors().find((d) => d.userId === userId || d.id === userId);
      if (doc) {
        appointments = appointments.filter((a) => a.doctorId === doc.id);
      }
    }

    if (status) {
      appointments = appointments.filter((a) => a.status === status);
    }

    appointments.sort((a, b) => (b.appointmentDate + b.startTime).localeCompare(a.appointmentDate + a.startTime));

    return NextResponse.json({ success: true, appointments });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      doctorId,
      patientId,
      patientName,
      patientEmail,
      patientPhone,
      appointmentDate,
      startTime,
      endTime,
      symptoms,
      vitalSigns,
      consultationType,
    } = body;

    if (!doctorId || !patientId || !appointmentDate || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'doctorId, patientId, appointmentDate, startTime, and endTime are required',
        },
        { status: 400 }
      );
    }

    const doctor = dbStore.getDoctorById(doctorId);
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    const claimCheck = slotManager.validateAndClaimSlot({
      doctorId,
      patientId,
      appointmentDate,
      startTime,
    });

    if (!claimCheck.valid) {
      return NextResponse.json({ success: false, error: claimCheck.error }, { status: 409 });
    }

    let preVisitSummary = undefined;
    if (symptoms && symptoms.trim().length > 0) {
      const summary = await llmService.generatePreVisitSummary(symptoms.trim());
      if (vitalSigns) {
        summary.vitalSigns = vitalSigns;
      }
      preVisitSummary = summary;
    }

    const newAppointment = dbStore.createAppointment({
      doctorId,
      patientId,
      doctorName: doctor.name,
      doctorSpecialisation: doctor.specialisation,
      patientName: patientName || 'Valued Patient',
      patientEmail: patientEmail || 'patient@example.com',
      patientPhone: patientPhone || '',
      appointmentDate,
      startTime,
      endTime,
      status: 'CONFIRMED',
      consultationType: consultationType || 'IN_PERSON',
      roomNumber: doctor.roomNumber,
      fee: doctor.consultationFee,
      preVisitSummary,
    });

    dbStore.releasePatientHolds(patientId);

    const googleCalLink = calendarService.generateGoogleCalendarWebUrl(newAppointment);
    dbStore.updateAppointment(newAppointment.id, {
      googleCalendarHtmlLink: googleCalLink,
    });

    await notificationService.sendBookingConfirmation({
      patientEmail: newAppointment.patientEmail,
      patientName: newAppointment.patientName,
      doctorEmail: doctor.email,
      doctorName: doctor.name,
      doctorSpecialisation: doctor.specialisation,
      appointmentDate: newAppointment.appointmentDate,
      startTime: newAppointment.startTime,
      roomNumber: doctor.roomNumber,
      urgencyLevel: preVisitSummary?.urgencyLevel,
      appointmentId: newAppointment.id,
    });

    return NextResponse.json(
      {
        success: true,
        appointment: { ...newAppointment, googleCalendarHtmlLink: googleCalLink },
        googleCalendarUrl: googleCalLink,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
