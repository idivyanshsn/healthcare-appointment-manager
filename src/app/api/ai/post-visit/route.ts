import { NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';
import { dbStore } from '@/lib/store';
import { notificationService } from '@/lib/notification-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId, doctorNotes, prescriptions } = body;

    if (!doctorNotes || doctorNotes.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Doctor clinical notes are required' },
        { status: 400 }
      );
    }

    const postVisitSummary = await llmService.generatePostVisitSummary(
      doctorNotes.trim(),
      prescriptions
    );

    if (appointmentId) {
      const apt = dbStore.getAppointmentById(appointmentId);
      if (apt) {
        dbStore.updateAppointment(appointmentId, {
          status: 'COMPLETED',
          postVisitSummary,
        });

        if (postVisitSummary.medicationSchedule && postVisitSummary.medicationSchedule.length > 0) {
          const startDate = apt.appointmentDate;
          for (const med of postVisitSummary.medicationSchedule) {
            const endDateObj = new Date(startDate);
            endDateObj.setDate(endDateObj.getDate() + (med.durationDays || 7));
            const endDate = endDateObj.toISOString().split('T')[0];

            for (const timeStr of med.scheduledTimes) {
              dbStore.createMedicationReminder({
                appointmentId: apt.id,
                patientId: apt.patientId,
                patientName: apt.patientName,
                patientEmail: apt.patientEmail,
                medicineName: med.medicineName,
                dosage: med.dosage,
                scheduledTime: timeStr,
                frequency: med.frequency,
                startDate,
                endDate,
                nextScheduledAt: `${startDate} ${timeStr}`,
                status: 'ACTIVE',
              });
            }
          }
        }

        await notificationService.sendEmail({
          to: apt.patientEmail,
          recipientName: apt.patientName,
          recipientRole: 'patient',
          type: 'POST_VISIT_SUMMARY',
          subject: `Consultation Summary & Medication Plan: ${apt.doctorName}`,
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f766e;">Your Consultation Summary</h2>
              <p>Dear <strong>${apt.patientName}</strong>,</p>
              <p>Dr. <strong>${apt.doctorName}</strong> has finalized your visit summary and prescription plan.</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 4px 0;"><strong>Diagnosis:</strong> ${postVisitSummary.clinicalDiagnosis}</p>
                <p style="margin: 8px 0;"><strong>Explanation:</strong> ${postVisitSummary.patientFriendlyExplanation}</p>
              </div>
              <p>Log in to your patient dashboard to view your complete interactive medication schedule and reminder timeline.</p>
              <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Healthcare Appointment & Follow-up Manager</p>
            </div>
          `,
          textContent: `Consultation summary available. Diagnosis: ${postVisitSummary.clinicalDiagnosis}. Check your patient portal.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: postVisitSummary,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
