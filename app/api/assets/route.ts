import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db-adapter';
import { AssetFormData } from '@/types/asset';

export async function GET(request: NextRequest) {
  try {
    const assets = await db.getAssets();
    return NextResponse.json(assets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const assetData: AssetFormData = await request.json();
    const asset = await db.addAsset(assetData);
    return NextResponse.json(asset, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
