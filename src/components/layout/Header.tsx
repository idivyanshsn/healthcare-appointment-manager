'use client';

import React from 'react';
import { UserRole } from '@/types';
import {
  Activity,
  User as UserIcon,
  Stethoscope,
  ShieldCheck,
  Bell,
  RotateCcw,
  Clock,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  notificationCount: number;
  onOpenNotifications: () => void;
  onResetData: () => void;
  onTriggerMedCron: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  notificationCount,
  onOpenNotifications,
  onResetData,
  onTriggerMedCron,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 ring-2 ring-teal-500/20">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-teal-800 to-teal-600 dark:from-white dark:via-teal-200 dark:to-teal-400 bg-clip-text text-transparent">
                CarePulse AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> Healthcare Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Intelligent Clinical Scheduling & Follow-up Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
          <button
            onClick={() => onRoleChange('patient')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentRole === 'patient'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserIcon className="h-3.5 w-3.5 text-teal-500" />
            <span className="hidden sm:inline">Patient:</span> Alex J.
          </button>

          <button
            onClick={() => onRoleChange('doctor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentRole === 'doctor'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Doctor:</span> Dr. Smith
          </button>

          <button
            onClick={() => onRoleChange('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentRole === 'admin'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Admin:</span> Clinic Ops
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerMedCron}
            title="Trigger Background Medication Reminders Cron Job"
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/40 hover:text-teal-600 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 transition"
          >
            <Clock className="h-3.5 w-3.5 text-teal-500" />
            <span className="hidden lg:inline">Simulate Cron</span>
          </button>

          <button
            onClick={onResetData}
            title="Reset to Initial Clinical Seed Data"
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 transition"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden lg:inline">Reset Seed</span>
          </button>

          <button
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="View Email Outbox & Notification Center"
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
