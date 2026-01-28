import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db-adapter';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, newName } = body;

    if (!id || !newName) {
      return NextResponse.json(
        { error: 'id and newName are required' },
        { status: 400 }
      );
    }

    await db.updateSubCategory(id, newName);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
