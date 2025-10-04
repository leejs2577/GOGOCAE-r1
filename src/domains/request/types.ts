import { z } from 'zod';

export enum RequestStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export const CreateRequestSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이하로 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요').max(2000, '설명은 2000자 이하로 입력해주세요'),
  car_model: z.string().min(1, '차종을 입력해주세요').max(100, '차종은 100자 이하로 입력해주세요'),
  analysis_type: z.string().min(1, '해석 유형을 선택해주세요'),
  priority: z.nativeEnum(RequestPriority).default(RequestPriority.MEDIUM),
  requested_deadline: z.string().min(1, '요청 마감일을 선택해주세요'),
});

export const UpdateRequestSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이하로 입력해주세요'),
  description: z.string().min(1, '설명을 입력해주세요').max(2000, '설명은 2000자 이하로 입력해주세요'),
  car_model: z.string().min(1, '차종을 입력해주세요').max(100, '차종은 100자 이하로 입력해주세요'),
  analysis_type: z.string().min(1, '해석 유형을 선택해주세요'),
  priority: z.nativeEnum(RequestPriority),
  requested_deadline: z.string().min(1, '요청 마감일을 선택해주세요'),
});

export type CreateRequestData = z.infer<typeof CreateRequestSchema>;
export type UpdateRequestData = z.infer<typeof UpdateRequestSchema>;

export interface Request {
  id: string;
  title: string;
  description: string;
  car_model: string;
  analysis_type: string;
  priority: RequestPriority;
  status: RequestStatus;
  requested_deadline: string;
  requester_id: string;
  assignee_id?: string;
  created_at: string;
  updated_at: string;
  has_report?: boolean; // 보고서 존재 여부
  requester?: {
    id: string;
    email: string;
    full_name?: string;
    role: string;
  };
  assignee?: {
    id: string;
    email: string;
    full_name?: string;
    role: string;
  };
}

export interface RequestFile {
  id: string;
  request_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  content_type: string;
  file_category: 'request' | 'report'; // 파일 카테고리 추가
  uploaded_by: string;
  uploaded_at: string;
  updated_at?: string;
  metadata?: {
    type?: string;
    specialNotes?: string;
    uploadedAt?: string;
    [key: string]: any;
  };
}

// 파일 업로드 관련 타입
export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UploadResult {
  success: boolean;
  file?: RequestFile;
  error?: string;
}

// 상수
export const REQUEST_STATUS_LABELS = {
  [RequestStatus.PENDING]: '대기',
  [RequestStatus.ASSIGNED]: '담당자 지정됨',
  [RequestStatus.IN_PROGRESS]: '진행 중',
  [RequestStatus.COMPLETED]: '완료',
  [RequestStatus.CANCELLED]: '취소됨'
};

export const REQUEST_PRIORITY_LABELS = {
  [RequestPriority.LOW]: '낮음',
  [RequestPriority.MEDIUM]: '보통',
  [RequestPriority.HIGH]: '높음',
  [RequestPriority.URGENT]: '긴급'
};

export const REQUEST_PRIORITY_COLORS = {
  [RequestPriority.LOW]: 'bg-gray-100 text-gray-800',
  [RequestPriority.MEDIUM]: 'bg-blue-100 text-blue-800',
  [RequestPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [RequestPriority.URGENT]: 'bg-red-100 text-red-800'
};

export const ANALYSIS_TYPES = [
  '구조해석',
  '열해석',
  '유동해석',
  '진동해석',
  '충돌해석',
  '기타'
];

// 파일 관련 상수
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (Supabase 무료 버전 제한)
export const ALLOWED_FILE_TYPES = [
  'application/step',
  'application/iges',
  'application/x-pdf',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

export const FILE_TYPE_LABELS = {
  'application/step': 'STEP 파일',
  'application/iges': 'IGES 파일',
  'application/x-pdf': 'PDF 파일',
  'application/pdf': 'PDF 파일',
  'image/png': 'PNG 이미지',
  'image/jpeg': 'JPEG 이미지',
  'image/gif': 'GIF 이미지',
  'text/plain': '텍스트 파일',
  'application/msword': 'Word 문서',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word 문서',
  'application/vnd.ms-excel': 'Excel 스프레드시트',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel 스프레드시트',
  'application/vnd.ms-powerpoint': 'PowerPoint 프레젠테이션',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint 프레젠테이션'
};