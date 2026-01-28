import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db-adapter';
import { TransactionFormData } from '@/types/transaction';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let transactions;
    if (startDate && endDate) {
      transactions = await db.getTransactionsByDateRange(startDate, endDate);
    } else {
      transactions = await db.getTransactions();
    }

    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      // 일괄 추가
      const transactions = await db.addTransactions(body as TransactionFormData[]);
      return NextResponse.json(transactions);
    } else {
      // 단일 추가
      const transaction = await db.addTransaction(body as TransactionFormData);
      return NextResponse.json(transaction);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.deleteTransaction(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
