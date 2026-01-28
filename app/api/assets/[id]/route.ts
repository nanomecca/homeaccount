import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db-adapter';
import { AssetFormData } from '@/types/asset';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assetData: AssetFormData = await request.json();
    const asset = await db.updateAsset(params.id, assetData);
    return NextResponse.json(asset);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.deleteAsset(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
