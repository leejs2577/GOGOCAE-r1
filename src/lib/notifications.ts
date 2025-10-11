import { createServerSupabaseClient } from './supabase/server';

interface CreateNotificationParams {
  userId: string;
  type: 'request_created' | 'request_assigned' | 'request_updated' | 'request_completed' | 'file_uploaded';
  title: string;
  message: string;
  relatedRequestId?: string;
}

/**
 * 알림 생성 헬퍼 함수
 * API 라우트에서 사용자에게 알림을 전송할 때 사용
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        related_request_id: params.relatedRequestId,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * 요청 관련 여러 사용자에게 알림 전송
 */
export async function notifyRequestUpdate(
  requestId: string,
  requestTitle: string,
  userIds: string[],
  type: CreateNotificationParams['type'],
  message: string
) {
  const promises = userIds.map(userId =>
    createNotification({
      userId,
      type,
      title: `요청 업데이트: ${requestTitle}`,
      message,
      relatedRequestId: requestId,
    })
  );

  return Promise.all(promises);
}
