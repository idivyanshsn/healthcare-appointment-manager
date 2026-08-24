import { NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { symptoms } = body;

    if (!symptoms || symptoms.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Symptoms description is required' },
        { status: 400 }
      );
    }

    const summary = await llmService.generatePreVisitSummary(symptoms.trim());

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
