import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db-adapter';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, oldMainCategory, newMainCategory } = body;

    if (!type || !oldMainCategory || !newMainCategory) {
      return NextResponse.json(
        { error: 'type, oldMainCategory, and newMainCategory are required' },
        { status: 400 }
      );
    }

    await db.updateMainCategory(type, oldMainCategory, newMainCategory);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
