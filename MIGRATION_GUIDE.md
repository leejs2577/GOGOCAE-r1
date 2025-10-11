# 프로필 및 인증 문제 해결 가이드

## 문제 요약
- 로그인 후 사용자 프로필을 찾을 수 없는 오류 발생
- 역할(role) 정보 조회 실패
- 대시보드 및 요청 API에서 500 에러 발생

## 해결 방법

### 1. 데이터베이스 마이그레이션 적용

Supabase 대시보드에서 다음 SQL을 실행하세요:

1. Supabase 프로젝트 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭
4. "New query" 클릭
5. 아래 SQL 전체를 복사하여 붙여넣기
6. "Run" 버튼 클릭

```sql
-- 020_fix_all_profile_issues.sql
-- 프로필 관련 모든 문제를 해결하는 통합 마이그레이션

-- 1. 기존 RLS 정책 모두 제거
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable all access for service role" ON profiles;

-- 2. full_name 컬럼이 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT DEFAULT '';
  END IF;
END $$;

-- 3. 새로운 RLS 정책 생성 (간단하고 명확하게)

-- 모든 인증된 사용자가 모든 프로필을 읽을 수 있음 (역할 확인을 위해 필요)
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- 사용자는 자신의 프로필만 업데이트 가능
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 사용자는 자신의 프로필만 생성 가능
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Service role은 모든 작업 가능
CREATE POLICY "profiles_service_role_policy" ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. 트리거 함수 업데이트 (full_name 포함)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'designer'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 에러가 발생해도 사용자 생성은 계속 진행
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 기존 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. 기존 사용자 중 프로필이 없는 사용자에 대해 프로필 생성
INSERT INTO public.profiles (id, email, role, full_name)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'role', 'designer') as role,
    COALESCE(u.raw_user_meta_data->>'full_name', '') as full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- 7. NULL 값 정리
UPDATE public.profiles
SET full_name = COALESCE(full_name, '')
WHERE full_name IS NULL;

-- 8. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
```

### 2. 환경 변수 확인

`.env.local` 파일에 다음 환경 변수가 설정되어 있는지 확인하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 중요!
```

**SUPABASE_SERVICE_ROLE_KEY**가 없다면:
1. Supabase 대시보드 → Settings → API
2. "service_role" 키 복사
3. `.env.local`에 추가

### 3. 애플리케이션 재시작

```bash
npm run dev
```

### 4. 테스트

1. 브라우저에서 기존 쿠키/세션 삭제 (개발자 도구 → Application → Cookies → 모두 삭제)
2. 로그인 페이지로 이동
3. 기존 계정으로 로그인 테스트
4. 대시보드가 정상적으로 로드되는지 확인

## 변경 사항 요약

### 1. 데이터베이스 레벨
- ✅ RLS 정책 단순화 및 통합
- ✅ 프로필 자동 생성 메커니즘 개선
- ✅ 기존 사용자에 대한 프로필 자동 생성
- ✅ 성능 개선을 위한 인덱스 추가

### 2. 코드 레벨
- ✅ 새로운 유틸리티 함수 추가: `getUserProfile()`, `getUserRole()`
- ✅ 모든 API 라우트에서 안전한 프로필 조회 사용
- ✅ 프로필이 없을 경우 자동 생성 로직 추가
- ✅ Admin 클라이언트를 사용하여 RLS 우회

### 3. 주요 파일
- `supabase/migrations/020_fix_all_profile_issues.sql` - 데이터베이스 마이그레이션
- `src/lib/supabase/utils.ts` - 새로운 유틸리티 함수
- `src/app/api/auth/**/*.ts` - 인증 관련 API 수정
- `src/app/api/dashboard/**/*.ts` - 대시보드 API 수정
- `src/app/api/requests/route.ts` - 요청 API 수정
- `src/app/api/notifications/**/*.ts` - 알림 API 수정

## 문제가 계속되면

1. 브라우저 콘솔 확인
2. 터미널 로그 확인
3. Supabase 대시보드 → Logs 확인
4. 특정 사용자 ID로 프로필이 생성되었는지 확인:
   ```sql
   SELECT * FROM profiles WHERE id = 'user_id_here';
   ```

## 향후 권장 사항

1. **정기적인 프로필 동기화**: 주기적으로 auth.users와 profiles 테이블 동기화
2. **모니터링**: Sentry 또는 Vercel Analytics로 에러 추적
3. **테스트**: 회원가입 → 로그인 → 대시보드 플로우 자동 테스트 추가
