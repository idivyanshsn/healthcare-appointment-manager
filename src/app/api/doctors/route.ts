import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const specialisation = searchParams.get('specialisation');
    const search = searchParams.get('search');

    let doctors = dbStore.getDoctors();

    if (specialisation && specialisation !== 'All') {
      doctors = doctors.filter(
        (d) => d.specialisation.toLowerCase() === specialisation.toLowerCase()
      );
    }

    if (search && search.trim().length > 0) {
      const term = search.toLowerCase();
      doctors = doctors.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.specialisation.toLowerCase().includes(term) ||
          d.bio.toLowerCase().includes(term)
      );
    }

    return NextResponse.json({ success: true, doctors });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, specialisation, consultationFee, roomNumber, bio, slotDurationMinutes } = body;

    if (!name || !email || !specialisation) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and specialisation are required' },
        { status: 400 }
      );
    }

    const newDoctor = dbStore.createDoctor({
      userId: `usr_doc_${Date.now()}`,
      name,
      email,
      avatarUrl: `https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300`,
      specialisation,
      experienceYears: Number(body.experienceYears) || 5,
      consultationFee: Number(consultationFee) || 120,
      rating: 5.0,
      reviewCount: 0,
      roomNumber: roomNumber || 'Suite 200',
      bio: bio || 'Practicing clinical specialist dedicated to patient wellness.',
      slotDurationMinutes: Number(slotDurationMinutes) || 30,
      workingHours: [
        { dayOfWeek: 1, dayName: 'Monday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 2, dayName: 'Tuesday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 3, dayName: 'Wednesday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 4, dayName: 'Thursday', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: 5, dayName: 'Friday', startTime: '09:00', endTime: '16:00', isWorkingDay: true },
        { dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00', endTime: '14:00', isWorkingDay: false },
        { dayOfWeek: 0, dayName: 'Sunday', startTime: '10:00', endTime: '14:00', isWorkingDay: false },
      ],
      leaveDays: [],
    });

    return NextResponse.json({ success: true, doctor: newDoctor }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
