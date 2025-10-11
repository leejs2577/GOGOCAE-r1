import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { UpdateProfileSchema, UserRole } from '@/domains/auth/types';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PUT /api/admin/users/[id] - 특정 사용자 정보 수정 (관리자 전용)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('Admin user update request:', { id, body });
    
    // 입력 데이터 검증 (역할 포함)
    const validatedData = {
      email: body.email,
      full_name: body.full_name,
      role: body.role,
    };
    
    console.log('Validated data:', validatedData);

    // 기본 검증
    if (!validatedData.email || !validatedData.full_name) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 역할 검증
    if (!Object.values(UserRole).includes(validatedData.role)) {
      return NextResponse.json(
        { error: '유효하지 않은 역할입니다.' },
        { status: 400 }
      );
    }
    
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 대상 사용자 확인
    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이메일 변경이 있는 경우 Supabase Auth 업데이트 (Admin API 없이)
    if (validatedData.email !== targetUser.email) {
      console.log('Email change detected, but skipping Auth update due to Admin API limitations');
      // Admin API 권한 문제로 인해 Auth 업데이트는 건너뛰고 profiles 테이블만 업데이트
    }

    // 프로필 정보 업데이트
    const updateData = {
      email: validatedData.email,
      full_name: validatedData.full_name,
      role: validatedData.role,
      updated_at: new Date().toISOString(),
    };
    
    console.log('Updating profile with data:', updateData);
    
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json(
        { error: '프로필 업데이트에 실패했습니다.', details: profileError },
        { status: 500 }
      );
    }
    
    console.log('Profile updated successfully:', updatedProfile);

    return NextResponse.json({ 
      profile: updatedProfile,
      message: '사용자 정보가 성공적으로 업데이트되었습니다.' 
    });
  } catch (error) {
    console.error('Admin user update API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET /api/admin/users/[id] - 특정 사용자 정보 조회 (관리자 전용)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 특정 사용자 프로필 조회
    const { data: targetProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('User fetch error:', error);
      return NextResponse.json(
        { error: '사용자 정보를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!targetProfile) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: targetProfile });
  } catch (error) {
    console.error('Admin user fetch API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
