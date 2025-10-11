/**
 * Supabase 유틸리티 함수들
 * 프로필 관리 및 사용자 정보 처리를 위한 공통 함수
 */

import { createServerSupabaseClient, createServerSupabaseAdmin } from './server';

export interface UserProfile {
  id: string;
  email: string;
  role: 'designer' | 'analyst' | 'admin';
  full_name: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 사용자 프로필을 안전하게 가져오는 함수
 * - Admin 클라이언트를 사용하여 RLS 우회
 * - 프로필이 없으면 자동 생성
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const adminSupabase = createServerSupabaseAdmin();

    // 1. 먼저 프로필이 있는지 확인
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 프로필이 존재하면 반환
    if (profile && !profileError) {
      return profile;
    }

    console.log('Profile not found for user:', userId, 'Error:', profileError?.message);

    // 2. 프로필이 없으면 auth.users에서 정보 가져와서 생성
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || user.id !== userId) {
      console.error('Failed to get user info:', userError);
      return null;
    }

    // 3. 새 프로필 생성
    const newProfile = {
      id: user.id,
      email: user.email || '',
      role: (user.user_metadata?.role || 'designer') as 'designer' | 'analyst' | 'admin',
      full_name: user.user_metadata?.full_name || '',
    };

    const { data: createdProfile, error: createError } = await adminSupabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (createError) {
      console.error('Failed to create profile:', createError);
      // 생성 실패해도 기본 정보는 반환
      return newProfile;
    }

    console.log('Profile created successfully for user:', userId);
    return createdProfile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

/**
 * 사용자 역할을 안전하게 가져오는 함수
 */
export async function getUserRole(userId: string): Promise<'designer' | 'analyst' | 'admin'> {
  const profile = await getUserProfile(userId);
  return profile?.role || 'designer';
}

/**
 * 여러 사용자의 프로필을 한 번에 가져오는 함수 (성능 최적화)
 */
export async function getUserProfiles(userIds: string[]): Promise<UserProfile[]> {
  if (userIds.length === 0) return [];

  try {
    const adminSupabase = createServerSupabaseAdmin();
    const { data: profiles, error } = await adminSupabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (error) {
      console.error('Failed to fetch profiles:', error);
      return [];
    }

    return profiles || [];
  } catch (error) {
    console.error('Error in getUserProfiles:', error);
    return [];
  }
}
