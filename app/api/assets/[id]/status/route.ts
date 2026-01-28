import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db-adapter';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    
    if (!status || !['active', 'matured', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be active, matured, or closed.' },
        { status: 400 }
      );
    }

    const asset = await db.updateAssetStatus(params.id, status);
    return NextResponse.json(asset);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
