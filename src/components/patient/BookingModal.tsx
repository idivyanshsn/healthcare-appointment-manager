'use client';

import React, { useState, useEffect } from 'react';
import { DoctorProfile, TimeSlot, PreVisitSummary, Appointment } from '@/types';
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronLeft,
  CalendarPlus,
  Download,
  Mail,
  Activity,
} from 'lucide-react';

interface BookingModalProps {
  doctor: DoctorProfile | null;
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientEmail: string;
  onBookingSuccess: (appointment: Appointment) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  isOpen,
  onClose,
  patientId,
  patientName,
  patientEmail,
  onBookingSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [doctorOnLeave, setDoctorOnLeave] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [workingHoursInfo, setWorkingHoursInfo] = useState('');

  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [holdTimeLeft, setHoldTimeLeft] = useState<string>('10:00');
  const [holdError, setHoldError] = useState<string | null>(null);
  const [holdingSlot, setHoldingSlot] = useState(false);

  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('3 days');
  const [severity, setSeverity] = useState('Moderate');
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [preVisitSummary, setPreVisitSummary] = useState<PreVisitSummary | null>(null);

  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!isOpen || !doctor) return;
    fetchSlots();
  }, [isOpen, doctor, selectedDate]);

  useEffect(() => {
    if (!holdExpiresAt) return;

    const interval = setInterval(() => {
      const remainingMs = holdExpiresAt - Date.now();
      if (remainingMs <= 0) {
        setHoldTimeLeft('00:00');
        setHoldError('Your 10-minute slot hold has expired. Please re-select a time slot.');
        setSelectedSlot(null);
        setHoldExpiresAt(null);
        clearInterval(interval);
      } else {
        const totalSecs = Math.floor(remainingMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setHoldTimeLeft(
          `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const fetchSlots = async () => {
    if (!doctor) return;
    setLoadingSlots(true);
    setHoldError(null);
    try {
      const res = await fetch(
        `/api/slots/available?doctorId=${doctor.id}&date=${selectedDate}&patientId=${patientId}`
      );
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots || []);
        setDoctorOnLeave(data.doctorOnLeave || false);
        setLeaveReason(data.leaveReason || '');
        setWorkingHoursInfo(data.workingHoursInfo || '');
      }
    } catch (err) {
      console.error('Failed to load slots', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectSlot = async (slot: TimeSlot) => {
    if (!doctor || !slot.isAvailable) return;
    setHoldingSlot(true);
    setHoldError(null);

    try {
      const res = await fetch('/api/slots/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor.id,
          patientId,
          appointmentDate: selectedDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedSlot(slot);
        setHoldExpiresAt(data.expiresAt);
      } else {
        setHoldError(data.error || 'Could not reserve slot. It may have just been claimed.');
        fetchSlots();
      }
    } catch (err: any) {
      setHoldError(err.message || 'Network error holding slot');
    } finally {
      setHoldingSlot(false);
    }
  };

  const handleAnalyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    setAnalyzingAi(true);
    try {
      const res = await fetch('/api/ai/pre-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: `${symptoms}. Duration: ${duration}. Severity: ${severity}.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreVisitSummary(data.summary);
      }
    } catch (err) {
      console.error('AI symptom analysis failed', err);
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!doctor || !selectedSlot) return;
    setSubmittingBooking(true);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor.id,
          patientId,
          patientName,
          patientEmail,
          patientPhone: '+1 (555) 234-5678',
          appointmentDate: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          symptoms: `${symptoms}. Duration: ${duration}. Severity: ${severity}.`,
          vitalSigns: {
            bloodPressure: bp || 'Normal',
            heartRate: hr ? `${hr} bpm` : 'Normal',
          },
          consultationType: 'IN_PERSON',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConfirmedAppointment(data.appointment);
        setStep(3);
        onBookingSuccess(data.appointment);
      } else {
        setHoldError(data.error || 'Failed to complete booking.');
        setStep(1);
      }
    } catch (err: any) {
      setHoldError(err.message || 'Error confirming appointment.');
      setStep(1);
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <img
              src={doctor.avatarUrl}
              alt={doctor.name}
              className="h-10 w-10 rounded-xl object-cover ring-1 ring-teal-500/30"
            />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Book with {doctor.name}
              </h2>
              <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                {doctor.specialisation} • ${doctor.consultationFee} consultation fee
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <div
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition ${
              step === 1
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-950/20'
                : step > 1
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-400'
            }`}
          >
            <span className="flex h-5 w-5 rounded-full bg-current/10 items-center justify-center text-[11px]">
              1
            </span>
            <span>Select Slot</span>
          </div>

          <div
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition ${
              step === 2
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-950/20'
                : step > 2
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-400'
            }`}
          >
            <span className="flex h-5 w-5 rounded-full bg-current/10 items-center justify-center text-[11px]">
              2
            </span>
            <span>Symptom AI</span>
          </div>

          <div
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition ${
              step === 3
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50/30 dark:bg-teal-950/20'
                : 'border-transparent text-slate-400'
            }`}
          >
            <span className="flex h-5 w-5 rounded-full bg-current/10 items-center justify-center text-[11px]">
              3
            </span>
            <span>Confirmed</span>
          </div>
        </div>

        {selectedSlot && step < 3 && holdExpiresAt && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/60 px-6 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 animate-fade-in">
            <div className="flex items-center gap-2 font-medium">
              <Lock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              <span>
                Slot <strong>{selectedSlot.startTime}</strong> reserved exclusively for you
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono font-bold bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded">
              <Clock className="h-3 w-3" />
              <span>{holdTimeLeft}</span>
            </div>
          </div>
        )}

        <div className="p-6">
          {holdError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <span>{holdError}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Select Consultation Date
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    const dateStr = d.toISOString().split('T')[0];
                    const dayLabel = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setSelectedSlot(null);
                        }}
                        className={`flex flex-col items-center min-w-[76px] py-2.5 px-3 rounded-2xl border text-xs transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20 font-bold ring-2 ring-teal-500/30'
                            : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500/40'
                        }`}
                      >
                        <span className="text-[11px] opacity-80">{dayLabel}</span>
                        <span className="text-sm font-extrabold mt-0.5">
                          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Available Time Slots ({doctor.slotDurationMinutes} mins)
                  </label>
                  {workingHoursInfo && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Clinic Hours: {workingHoursInfo}
                    </span>
                  )}
                </div>

                {doctorOnLeave ? (
                  <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-center space-y-2">
                    <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto" />
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                      Doctor is on Leave on this Date
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 max-w-sm mx-auto">
                      {leaveReason || 'Doctor is out of clinic. Please select another date.'}
                    </p>
                  </div>
                ) : loadingSlots ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 animate-pulse">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                    No consultation slots available on this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      let badgeStyle =
                        'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-500/50 text-slate-700 dark:text-slate-300';
                      let label = '';

                      if (slot.status === 'BOOKED') {
                        badgeStyle = 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed line-through opacity-60 border-transparent';
                        label = 'Booked';
                      } else if (slot.status === 'HELD_BY_OTHER') {
                        badgeStyle = 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200 dark:border-amber-900/50 cursor-not-allowed';
                        label = 'In Progress';
                      } else if (isSelected || slot.status === 'HELD_BY_YOU') {
                        badgeStyle = 'bg-teal-600 text-white font-bold border-teal-600 shadow-md ring-2 ring-teal-500/30';
                        label = 'Held';
                      }

                      return (
                        <button
                          key={slot.startTime}
                          disabled={!slot.isAvailable && !isSelected}
                          onClick={() => handleSelectSlot(slot)}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${badgeStyle}`}
                        >
                          <span>{slot.startTime}</span>
                          {label && (
                            <span className="text-[9px] uppercase tracking-wider opacity-90 font-normal">
                              {label}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  disabled={!selectedSlot || holdingSlot}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-md shadow-teal-600/20"
                >
                  <span>Proceed to Symptom Intake</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Describe Your Symptoms
                    </label>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 flex items-center gap-1 font-medium">
                      <Sparkles className="h-3 w-3" /> AI Triage Assisted
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="e.g. Experiencing persistent dull headache and dizziness when standing up, worsened over the last 2 days..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none transition leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-medium">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-medium">
                      Severity
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <option>Mild</option>
                      <option>Moderate</option>
                      <option>Severe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-medium">
                      Blood Pressure (opt)
                    </label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 text-[11px] font-medium">
                      Heart Rate (opt)
                    </label>
                    <input
                      type="text"
                      placeholder="75 bpm"
                      value={hr}
                      onChange={(e) => setHr(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeSymptoms}
                  disabled={!symptoms.trim() || analyzingAi}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  <Sparkles className={`h-4 w-4 ${analyzingAi ? 'animate-spin' : ''}`} />
                  <span>
                    {analyzingAi
                      ? 'Analyzing Symptoms with Clinical LLM...'
                      : preVisitSummary
                      ? 'Re-Analyze Symptoms'
                      : 'Generate AI Pre-Visit Triage Summary'}
                  </span>
                </button>

                {preVisitSummary && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/70 to-slate-50 dark:from-slate-800/80 dark:to-slate-900 border border-teal-200/80 dark:border-teal-800/60 space-y-3 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" /> AI Pre-Visit Clinical Summary
                      </span>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          preVisitSummary.urgencyLevel === 'High'
                            ? 'urgency-badge-high'
                            : preVisitSummary.urgencyLevel === 'Medium'
                            ? 'urgency-badge-medium'
                            : 'urgency-badge-low'
                        }`}
                      >
                        Urgency: {preVisitSummary.urgencyLevel}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                        Chief Complaint
                      </span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        {preVisitSummary.chiefComplaint}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Suggested Doctor Inquiries (AI Generated)
                      </span>
                      <ul className="space-y-1">
                        {preVisitSummary.suggestedQuestions.map((q, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5"
                          >
                            <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to Slots</span>
                </button>

                <button
                  type="button"
                  disabled={!symptoms.trim() || submittingBooking}
                  onClick={handleConfirmBooking}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 active:scale-95"
                >
                  {submittingBooking ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Confirming Booking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirm & Book Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && confirmedAppointment && (
            <div className="text-center py-4 space-y-5 animate-slide-up">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto ring-8 ring-emerald-50 dark:ring-emerald-950/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Appointment Confirmed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Your consultation with <strong>{doctor.name}</strong> on{' '}
                  <strong>{confirmedAppointment.appointmentDate}</strong> at{' '}
                  <strong>{confirmedAppointment.startTime}</strong> is locked in.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Calendar & Notification Sync
                </span>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={confirmedAppointment.googleCalendarHtmlLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                  >
                    <CalendarPlus className="h-4 w-4 text-blue-500" />
                    <span>Add to Google Calendar</span>
                  </a>

                  <a
                    href={`/api/calendar?appointmentId=${confirmedAppointment.id}&format=ics`}
                    download
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
                  >
                    <Download className="h-4 w-4 text-emerald-500" />
                    <span>Download iCal (.ics)</span>
                  </a>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                  <Mail className="h-3.5 w-3.5 text-teal-500" />
                  <span>Confirmation email sent to {confirmedAppointment.patientEmail}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-md shadow-teal-600/20"
              >
                Done & View in My Appointments
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
