'use client';

import React, { useState } from 'react';
import { DoctorProfile, Appointment, MedicationReminder, User } from '@/types';
import { DoctorSearch } from './DoctorSearch';
import { BookingModal } from './BookingModal';
import {
  Calendar,
  Clock,
  Pill,
  FileText,
  AlertTriangle,
  CheckCircle2,
  CalendarPlus,
  RefreshCw,
  XCircle,
  Activity,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface PatientDashboardProps {
  user: User;
  doctors: DoctorProfile[];
  appointments: Appointment[];
  medicationReminders: MedicationReminder[];
  onRefreshData: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  user,
  doctors,
  appointments,
  medicationReminders,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'appointments' | 'medications'>('search');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedAppointmentForSummary, setSelectedAppointmentForSummary] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const myAppointments = appointments.filter((a) => a.patientId === user.id);
  const myReminders = medicationReminders.filter((r) => r.patientId === user.id);

  const handleOpenBooking = (doc: DoctorProfile) => {
    setSelectedDoctor(doc);
    setIsBookingOpen(true);
  };

  const handleCancelAppointment = async (aptId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(aptId);
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', cancellationReason: 'Patient requested cancellation' }),
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error('Failed to cancel appointment', err);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'search'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Book Specialist</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'appointments'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>My Appointments</span>
            {myAppointments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 text-[10px]">
                {myAppointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('medications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'medications'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Pill className="h-4 w-4" />
            <span>Prescriptions & Doses</span>
            {myReminders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px]">
                {myReminders.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onRefreshData}
          title="Refresh Data"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {activeTab === 'search' && (
        <DoctorSearch doctors={doctors} onSelectDoctor={handleOpenBooking} />
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                My Consultation Schedule
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track upcoming visits, AI symptom triage notes, and post-visit clinical summaries.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('search')}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm"
            >
              + Book New Visit
            </button>
          </div>

          {myAppointments.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No appointments booked yet
              </p>
              <button
                onClick={() => setActiveTab('search')}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
              >
                Browse Specialist Doctors
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myAppointments.map((apt) => {
                const isLeaveConflict = apt.status === 'RESCHEDULE_NEEDED';
                const isCompleted = apt.status === 'COMPLETED';
                const isConfirmed = apt.status === 'CONFIRMED';
                const isCancelled = apt.status === 'CANCELLED';

                return (
                  <div
                    key={apt.id}
                    className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 transition-all shadow-sm ${
                      isLeaveConflict
                        ? 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-300 shrink-0">
                          <Activity className="h-6 w-6" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {apt.doctorName}
                            </h3>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                              {apt.doctorSpecialisation}
                            </span>

                            {isConfirmed && (
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Confirmed
                              </span>
                            )}
                            {isLeaveConflict && (
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="h-3 w-3" /> Reschedule Required
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                Completed
                              </span>
                            )}
                            {isCancelled && (
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Cancelled
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-teal-500" />
                              <span>{apt.appointmentDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-teal-500" />
                              <span>{apt.startTime} - {apt.endTime}</span>
                            </div>
                            {apt.roomNumber && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-teal-500" />
                                <span>{apt.roomNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isConfirmed && apt.googleCalendarHtmlLink && (
                          <a
                            href={apt.googleCalendarHtmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition"
                          >
                            <CalendarPlus className="h-3.5 w-3.5 text-blue-500" />
                            <span>Google Cal</span>
                          </a>
                        )}

                        {apt.preVisitSummary && (
                          <button
                            onClick={() => setSelectedAppointmentForSummary(apt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 transition"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>AI Insights</span>
                          </button>
                        )}

                        {isCompleted && apt.postVisitSummary && (
                          <button
                            onClick={() => setSelectedAppointmentForSummary(apt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>View Rx & Summary</span>
                          </button>
                        )}

                        {isLeaveConflict && (
                          <button
                            onClick={() => {
                              const doc = doctors.find((d) => d.id === apt.doctorId);
                              if (doc) handleOpenBooking(doc);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Reschedule Now</span>
                          </button>
                        )}

                        {(isConfirmed || isLeaveConflict) && (
                          <button
                            disabled={cancellingId === apt.id}
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition text-xs font-medium"
                            title="Cancel appointment"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isLeaveConflict && (
                      <div className="mt-3 p-3 rounded-xl bg-red-100/80 dark:bg-red-950/50 text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                          <span>
                            <strong>Action Needed:</strong> {apt.doctorName} was marked on leave for this date ({apt.cancellationReason}). Priority rescheduling is available.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'medications' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Medication Schedule & Daily Reminders
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Structured dosage schedule automatically generated from your doctor's clinical prescriptions.
            </p>
          </div>

          {myReminders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Pill className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No active medication reminders
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When your physician completes a consultation and prescribes medications, your daily reminder schedule will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-5 rounded-2xl border border-teal-200/80 dark:border-teal-900/60 bg-gradient-to-br from-white to-teal-50/30 dark:from-slate-900 dark:to-slate-800/80 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-300">
                        <Pill className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {rem.medicineName}
                        </h4>
                        <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                          {rem.dosage} • {rem.frequency}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
                      {rem.scheduledTime}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Course Start
                      </span>
                      <span>{rem.startDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Course End
                      </span>
                      <span>{rem.endDate}</span>
                    </div>
                  </div>

                  {rem.lastSentAt && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Last reminder notification dispatched</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedAppointmentForSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Consultation Summary & AI Records
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedAppointmentForSummary.doctorName} • {selectedAppointmentForSummary.appointmentDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppointmentForSummary(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {selectedAppointmentForSummary.preVisitSummary && (
              <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-slate-800/60 border border-teal-200 dark:border-teal-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" /> AI Pre-Visit Triage
                  </span>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                      selectedAppointmentForSummary.preVisitSummary.urgencyLevel === 'High'
                        ? 'urgency-badge-high'
                        : selectedAppointmentForSummary.preVisitSummary.urgencyLevel === 'Medium'
                        ? 'urgency-badge-medium'
                        : 'urgency-badge-low'
                    }`}
                  >
                    {selectedAppointmentForSummary.preVisitSummary.urgencyLevel} Urgency
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Chief Complaint</span>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    {selectedAppointmentForSummary.preVisitSummary.chiefComplaint}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Suggested Questions</span>
                  <ul className="space-y-1 mt-1">
                    {selectedAppointmentForSummary.preVisitSummary.suggestedQuestions.map((q, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                        <span className="text-teal-500 font-bold">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {selectedAppointmentForSummary.postVisitSummary && (
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-600" /> Clinical Diagnosis & Post-Visit Summary
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Diagnosis</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedAppointmentForSummary.postVisitSummary.clinicalDiagnosis}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Patient-Friendly Explanation</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedAppointmentForSummary.postVisitSummary.patientFriendlyExplanation}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Prescriptions</span>
                  <div className="space-y-2">
                    {selectedAppointmentForSummary.postVisitSummary.medicationSchedule.map((med, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span>{med.medicineName} ({med.dosage})</span>
                          <span className="text-teal-600 text-[11px]">{med.frequency}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{med.instructions}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedAppointmentForSummary.postVisitSummary.followUpSteps && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">Follow-up Steps</span>
                    <ul className="space-y-1 mt-1">
                      {selectedAppointmentForSummary.postVisitSummary.followUpSteps.map((step, i) => (
                        <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedAppointmentForSummary(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold"
            >
              Close Summary
            </button>
          </div>
        </div>
      )}

      {selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false);
            setSelectedDoctor(null);
          }}
          patientId={user.id}
          patientName={user.name}
          patientEmail={user.email}
          onBookingSuccess={() => {
            onRefreshData();
          }}
        />
      )}
    </div>
  );
};
