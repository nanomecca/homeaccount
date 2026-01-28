import { NextRequest, NextResponse } from 'next/server';
import { changePassword } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, currentPassword, newPassword } = await request.json();

    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: '모든 필드를 입력하세요.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { success: false, message: '비밀번호는 4자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const result = await changePassword(username, currentPassword, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    return NextResponse.json(
      { success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
