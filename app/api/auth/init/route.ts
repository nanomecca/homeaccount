import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// 초기 사용자 비밀번호를 해시로 변환하는 API
// 한 번만 실행하면 됩니다
export async function POST() {
  try {
    // 기본 비밀번호 'password'를 해시화
    const hashedPassword = await bcrypt.hash('password', 10);

    // nano 사용자가 있으면 업데이트, 없으면 생성
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'nano')
      .single();

    if (existingUser) {
      // 기존 사용자 비밀번호 업데이트
      const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('username', 'nano');

      if (error) throw error;
      return NextResponse.json({ 
        success: true, 
        message: '비밀번호가 해시로 업데이트되었습니다.' 
      });
    } else {
      // 새 사용자 생성
      const { error } = await supabase
        .from('users')
        .insert({ username: 'nano', password: hashedPassword });

      if (error) throw error;
      return NextResponse.json({ 
        success: true, 
        message: '사용자가 생성되었습니다.' 
      });
    }
  } catch (error) {
    console.error('초기화 오류:', error);
    return NextResponse.json(
      { success: false, message: '초기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}
