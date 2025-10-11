import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// 알림 목록 조회
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // notifications 테이블에서 알림 조회
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      // 에러가 나도 빈 배열 반환
      return NextResponse.json({ notifications: [] });
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { notifications: [] },
      { status: 200 }
    );
  }
}
