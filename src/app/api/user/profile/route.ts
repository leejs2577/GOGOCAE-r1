import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { UpdateProfileSchema } from '@/domains/auth/types';

export const runtime = 'nodejs';

// GET /api/user/profile - 현재 사용자 프로필 조회
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: '프로필을 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - 프로필 업데이트
export async function PUT(request: NextRequest) {
  console.log('========================================');
  console.log('프로필 업데이트 API 호출');
  console.log('========================================');

  try {
    const body = await request.json();
    console.log('1. 요청 body:', body);

    // 입력 데이터 검증
    const validatedData = UpdateProfileSchema.parse(body);
    console.log('2. 검증된 데이터:', validatedData);

    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ 인증 오류:', authError);
      return NextResponse.json(
        { error: '인증이 필요합니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }

    console.log('3. ✓ 인증된 사용자:', { id: user.id, email: user.email });

    // 이메일 변경이 있는 경우 (현재는 Auth 업데이트 생략)
    if (validatedData.email !== user.email) {
      console.log('⚠ 이메일 변경 감지 (Auth 업데이트는 생략)');
    }

    // 현재 프로필 조회 (업데이트 전)
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (currentProfileError) {
      console.error('❌ 현재 프로필 조회 오류:', currentProfileError);
      return NextResponse.json(
        {
          error: '현재 프로필을 가져오는데 실패했습니다.',
          details: currentProfileError.message,
          code: currentProfileError.code
        },
        { status: 500 }
      );
    }

    console.log('4. 현재 프로필:', currentProfile);

    // 프로필 정보 업데이트
    const updateData = {
      email: validatedData.email,
      full_name: validatedData.full_name,
      updated_at: new Date().toISOString(),
    };

    console.log('5. 업데이트할 데이터:', updateData);

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (profileError) {
      console.error('❌ 프로필 업데이트 오류:', profileError);
      console.error('오류 세부사항:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
      });

      return NextResponse.json(
        {
          error: '프로필 업데이트에 실패했습니다.',
          details: profileError.message,
          code: profileError.code,
          hint: profileError.hint
        },
        { status: 500 }
      );
    }

    console.log('6. ✓ 프로필 업데이트 성공:', updatedProfile);
    console.log('========================================');

    return NextResponse.json({
      data: {
        profile: updatedProfile,
      },
      message: '프로필이 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('❌ 프로필 업데이트 API 오류:', error);

    // Zod 검증 오류
    if (error instanceof Error && error.name === 'ZodError') {
      console.error('Zod 검증 오류:', error);
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
