-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('request_created', 'request_assigned', 'request_updated', 'request_completed', 'file_uploaded')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_request_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, request_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_request_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify all analysts when a new request is created
CREATE OR REPLACE FUNCTION notify_analysts_new_request()
RETURNS TRIGGER AS $$
DECLARE
  analyst_record RECORD;
BEGIN
  -- Get all analysts
  FOR analyst_record IN 
    SELECT id, email FROM profiles WHERE role = 'analyst'
  LOOP
    -- Create notification for each analyst
    PERFORM create_notification(
      analyst_record.id,
      'request_created',
      '새로운 해석 요청',
      '새로운 해석 요청 "' || NEW.title || '"이 생성되었습니다.',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically notify analysts when a request is created
DROP TRIGGER IF EXISTS trigger_notify_analysts_new_request ON requests;
CREATE TRIGGER trigger_notify_analysts_new_request
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_analysts_new_request();

-- Function to notify requester when request is assigned
CREATE OR REPLACE FUNCTION notify_requester_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if assignee_id changed from NULL to a value
  IF OLD.assignee_id IS NULL AND NEW.assignee_id IS NOT NULL THEN
    PERFORM create_notification(
      NEW.requester_id,
      'request_assigned',
      '담당자 지정됨',
      '요청 "' || NEW.title || '"에 담당자가 지정되었습니다.',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to notify requester when request is assigned
DROP TRIGGER IF EXISTS trigger_notify_requester_assigned ON requests;
CREATE TRIGGER trigger_notify_requester_assigned
  AFTER UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_requester_assigned();

-- Function to notify requester when request status changes
CREATE OR REPLACE FUNCTION notify_requester_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed
  IF OLD.status != NEW.status THEN
    PERFORM create_notification(
      NEW.requester_id,
      'request_updated',
      '요청 상태 변경',
      '요청 "' || NEW.title || '"의 상태가 "' || 
      CASE NEW.status 
        WHEN 'assigned' THEN '담당자 지정됨'
        WHEN 'in_progress' THEN '진행 중'
        WHEN 'completed' THEN '완료'
        WHEN 'cancelled' THEN '취소됨'
        ELSE NEW.status
      END || '"으로 변경되었습니다.',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to notify requester when request status changes
DROP TRIGGER IF EXISTS trigger_notify_requester_status_change ON requests;
CREATE TRIGGER trigger_notify_requester_status_change
  AFTER UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_requester_status_change();

