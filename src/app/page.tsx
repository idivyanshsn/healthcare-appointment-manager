'use client';

import React, { useState, useEffect } from 'react';
import { UserRole, DoctorProfile, Appointment, MedicationReminder, User } from '@/types';
import { Header } from '@/components/layout/Header';
import { PatientDashboard } from '@/components/patient/PatientDashboard';
import { DoctorDashboard } from '@/components/doctor/DoctorDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { NotificationDrawer } from '@/components/admin/NotificationDrawer';
import { Sparkles, CheckCircle2, ShieldCheck, HeartPulse, Activity } from 'lucide-react';

const DEMO_USERS: Record<UserRole, User> = {
  patient: {
    id: 'usr_pat_1',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    role: 'patient',
  },
  doctor: {
    id: 'usr_doc_1',
    name: 'Dr. Sarah Smith, MD',
    email: 'dr.smith@healthmanager.clinic',
    role: 'doctor',
  },
  admin: {
    id: 'usr_admin_1',
    name: 'Elena Rostova',
    email: 'admin@healthmanager.clinic',
    role: 'admin',
  },
};

export default function Home() {
  const [currentRole, setCurrentRole] = useState<UserRole>('patient');
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicationReminders, setMedicationReminders] = useState<MedicationReminder[]>([]);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const isDarkMode =
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const refreshAllData = async () => {
    try {
      const docRes = await fetch('/api/doctors');
      const docData = await docRes.json();
      if (docData.success) {
        setDoctors(docData.doctors || []);
      }

      const aptRes = await fetch('/api/appointments');
      const aptData = await aptRes.json();
      if (aptData.success) {
        setAppointments(aptData.appointments || []);
      }

      const notifRes = await fetch('/api/notifications');
      const notifData = await notifRes.json();
      if (notifData.success) {
        setNotificationCount(notifData.count || 0);
      }
    } catch (err) {
      console.error('Failed to load clinic state', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleTriggerMedCron = async () => {
    try {
      const res = await fetch('/api/cron/medication-reminders', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Medication reminders processed & dispatched!');
        refreshAllData();
      }
    } catch (err) {
      console.error('Medication cron error', err);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Reset entire clinical dataset to initial demonstration state?')) return;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Clinical dataset successfully reset to seed data.');
        refreshAllData();
      }
    } catch (err) {
      console.error('Reset error', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        notificationCount={notificationCount}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onResetData={handleResetData}
        onTriggerMedCron={handleTriggerMedCron}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <div className="bg-teal-700/10 dark:bg-teal-950/40 border-b border-teal-200/60 dark:border-teal-800/40 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-teal-800 dark:text-teal-300">
              Active Demonstration Persona:
            </span>
            <span className="font-bold text-slate-900 dark:text-white capitalize">
              {DEMO_USERS[currentRole].name} ({currentRole} portal)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-teal-700 dark:text-teal-400">
            <span className="hidden sm:inline">Switch personas instantly in the header bar above</span>
            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="underline font-bold hover:text-teal-900 dark:hover:text-teal-200"
            >
              Inspect Outbound Emails ({notificationCount})
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="p-4 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-300 flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentRole === 'patient' && (
          <PatientDashboard
            user={DEMO_USERS.patient}
            doctors={doctors}
            appointments={appointments}
            medicationReminders={medicationReminders}
            onRefreshData={refreshAllData}
          />
        )}

        {currentRole === 'doctor' && (
          <DoctorDashboard
            doctorUser={DEMO_USERS.doctor}
            doctors={doctors}
            appointments={appointments}
            onRefreshData={refreshAllData}
          />
        )}

        {currentRole === 'admin' && (
          <AdminDashboard
            adminUser={DEMO_USERS.admin}
            doctors={doctors}
            appointments={appointments}
            onRefreshData={refreshAllData}
            onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          />
        )}
      </main>

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              CarePulse AI - Healthcare Appointment & Follow-up Manager
            </span>
          </div>
          <p>
            Vercel Zero-Config Deployment • AI Pre/Post Visit Summaries • Double-Booking Guard • Doctor Leave Engine
          </p>
        </div>
      </footer>
    </div>
  );
}
