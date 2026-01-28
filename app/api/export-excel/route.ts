import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const { transactions, fileName } = await request.json();

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: '다운로드할 거래 내역이 없습니다.' },
        { status: 400 }
      );
    }

    // 엑셀 데이터 준비
    const excelData = transactions.map((t: {
      date: string;
      type: string;
      category: string;
      amount: number;
      description?: string;
      main_category?: string;
    }) => {
      const date = new Date(t.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return {
        '날짜': `${year}-${month}-${day}`,
        '유형': t.type,
        '대분류': t.main_category || '',
        '소분류': t.category,
        '금액': Number(t.amount),
        '설명': t.description || '',
      };
    });

    // 워크북 생성
    const ws = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정
    const colWidths = [
      { wch: 12 }, // 날짜
      { wch: 10 }, // 유형
      { wch: 12 }, // 대분류
      { wch: 15 }, // 소분류
      { wch: 15 }, // 금액
      { wch: 30 }, // 설명
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '거래내역');

    // 엑셀 파일을 버퍼로 생성
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // 응답 반환
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName || '거래내역.xlsx')}"`,
      },
    });
  } catch (error) {
    console.error('엑셀 생성 오류:', error);
    return NextResponse.json(
      { error: '엑셀 파일 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
