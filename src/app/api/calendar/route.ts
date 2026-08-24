import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { calendarService } from '@/lib/calendar-service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get('appointmentId');
    const format = searchParams.get('format') || 'url';

    if (!appointmentId) {
      return NextResponse.json({ success: false, error: 'appointmentId is required' }, { status: 400 });
    }

    const apt = dbStore.getAppointmentById(appointmentId);
    if (!apt) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    if (format === 'ics') {
      const icsContent = calendarService.generateIcsFileContent(apt);
      return new Response(icsContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="appointment-${apt.id}.ics"`,
        },
      });
    }

    const webUrl = calendarService.generateGoogleCalendarWebUrl(apt);
    return NextResponse.json({
      success: true,
      appointmentId: apt.id,
      googleCalendarUrl: webUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
