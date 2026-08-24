import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const doctor = dbStore.getDoctorById(params.id);
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, doctor });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = dbStore.updateDoctor(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, doctor: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
