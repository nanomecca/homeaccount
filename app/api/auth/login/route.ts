import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '아이디와 비밀번호를 입력하세요.' },
        { status: 400 }
      );
    }

    const user = await loginUser(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    return NextResponse.json(
      { success: false, message: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
