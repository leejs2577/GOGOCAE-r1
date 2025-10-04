# Supabase Storage 버킷 생성 가이드

## 문제 상황
```
Upload URL error response text: {"error":"업로드 URL 생성 중 오류가 발생했습니다: Object not found"}
```

## 해결 방법

### 1단계: Supabase Dashboard에서 버킷 생성

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Storage 페이지로 이동**
   - 좌측 메뉴에서 "Storage" 클릭

3. **버킷 생성**
   - "Create bucket" 버튼 클릭
   - 설정:
     - **Name**: `request-files`
     - **Public bucket**: 체크 해제 (비공개)
     - **File size limit**: `50` (MB)
     - **Allowed MIME types**: 비워둠 (모든 파일 형식 허용)
   - "Create bucket" 클릭

### 2단계: SQL Editor에서 마이그레이션 실행

1. **SQL Editor 이동**
   - 좌측 메뉴에서 "SQL Editor" 클릭

2. **마이그레이션 실행**
   - `supabase/migrations/013_clean_storage_setup.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

### 3단계: 개발 서버 재시작

```bash
npm run dev
```

### 4단계: 테스트

1. 해석 요청 파일 업로드 테스트
2. 해석 보고서 업로드 테스트
3. 파일 다운로드 테스트

## 예상 결과

### 성공 시
- 파일 업로드 정상 작동
- 한글 파일명 자동 변환
- 원본 파일명 유지
- 다운로드 시 원본 파일명으로 저장

### 실패 시 확인사항
1. 버킷 이름이 정확한지 확인 (`request-files`)
2. 버킷이 비공개인지 확인
3. 마이그레이션이 성공적으로 실행되었는지 확인
4. 개발 서버가 재시작되었는지 확인

## 추가 정보

### 지원 파일 형식
- PDF, STEP, IGES
- 이미지 (PNG, JPEG, GIF)
- Office 문서 (Word, Excel, PowerPoint)
- 텍스트 파일

### 파일 크기 제한
- 최대 50MB (Supabase 무료 버전 제한)

### 보안 설정
- 인증된 사용자만 접근 가능
- RLS (Row Level Security) 정책 적용

