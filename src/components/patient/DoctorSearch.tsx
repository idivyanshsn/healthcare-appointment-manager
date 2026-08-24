'use client';

import React, { useState, useMemo } from 'react';
import { DoctorProfile } from '@/types';
import { Search, Star, Clock, MapPin, Calendar, CheckCircle, Award } from 'lucide-react';

interface DoctorSearchProps {
  doctors: DoctorProfile[];
  onSelectDoctor: (doctor: DoctorProfile) => void;
}

const SPECIALISATIONS = [
  'All',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'General Medicine',
];

export const DoctorSearch: React.FC<DoctorSearchProps> = ({ doctors, onSelectDoctor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialisation, setSelectedSpecialisation] = useState('All');

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSpec =
        selectedSpecialisation === 'All' ||
        doc.specialisation.toLowerCase() === selectedSpecialisation.toLowerCase();

      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialisation.toLowerCase().includes(q) ||
        doc.bio.toLowerCase().includes(q);

      return matchesSpec && matchesSearch;
    });
  }, [doctors, searchTerm, selectedSpecialisation]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 p-6 md:p-8 text-white shadow-xl shadow-teal-900/10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-teal-200 border border-white/15">
            <CheckCircle className="h-3.5 w-3.5 text-teal-300" /> Verified Clinical Specialists Available Today
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Find Your Doctor & Book Instant AI-Assisted Visits
          </h1>
          <p className="text-sm md:text-base text-teal-100/90 leading-relaxed">
            Share your symptoms in advance to receive an instant AI pre-visit clinical triage summary, sync confirmed appointments directly to Google Calendar, and receive structured post-visit medication schedules.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
          <div className="w-80 h-80 rounded-full bg-teal-300 blur-3xl" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctors, symptoms, or specialties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {SPECIALISATIONS.map((spec) => {
            const isSelected = selectedSpecialisation === spec;
            return (
              <button
                key={spec}
                onClick={() => setSelectedSpecialisation(spec)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 font-semibold ring-2 ring-teal-500/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {spec}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => {
          return (
            <div
              key={doctor.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-xl hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={doctor.avatarUrl}
                      alt={doctor.name}
                      className="h-16 w-16 rounded-2xl object-cover ring-2 ring-teal-500/20 group-hover:ring-teal-500/40 transition"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                        {doctor.name}
                      </h3>
                    </div>
                    <span className="inline-block mt-0.5 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-md border border-teal-100 dark:border-teal-900/60">
                      {doctor.specialisation}
                    </span>

                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>{doctor.rating}</span>
                      </div>
                      <span>•</span>
                      <span>{doctor.reviewCount} reviews</span>
                      <span>•</span>
                      <div className="flex items-center gap-0.5">
                        <Award className="h-3 w-3 text-slate-400" />
                        <span>{doctor.experienceYears}y exp</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {doctor.bio}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-teal-500" />
                    <span>{doctor.slotDurationMinutes} min slots</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <MapPin className="h-3.5 w-3.5 text-teal-500" />
                    <span className="truncate">{doctor.roomNumber}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Fee</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    ${doctor.consultationFee}
                  </span>
                </div>

                <button
                  onClick={() => onSelectDoctor(doctor)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm hover:shadow-teal-600/20 active:scale-95"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Book Slot</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Search className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No specialist matching "{searchTerm}"
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Try adjusting your search criteria or select 'All' specialties to see all available clinic physicians.
          </p>
        </div>
      )}
    </div>
  );
};
