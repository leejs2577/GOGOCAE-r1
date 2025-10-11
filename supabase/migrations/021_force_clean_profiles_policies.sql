-- 021_force_clean_profiles_policies.sql
-- 무한 재귀 문제를 해결하기 위한 강제 정리

-- 1. profiles 테이블의 RLS 비활성화
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. 모든 정책을 강제로 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    END LOOP;
END $$;

-- 3. RLS 다시 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. 새로운 정책 생성 (매우 간단하게)

-- 인증된 사용자는 모든 프로필 읽기 가능
CREATE POLICY "profiles_authenticated_select"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "profiles_own_update"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 생성 가능
CREATE POLICY "profiles_own_insert"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Service role은 모든 작업 가능 (DELETE 포함)
CREATE POLICY "profiles_service_all"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. full_name 컬럼 확인 및 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT DEFAULT '';
  END IF;
END $$;

-- 6. 기존 사용자 프로필 생성 (없는 경우)
INSERT INTO profiles (id, email, role, full_name)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'role', 'designer'),
    COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name, '');

-- 7. NULL 값 정리
UPDATE profiles
SET full_name = COALESCE(full_name, '')
WHERE full_name IS NULL;

-- 8. 트리거 함수 재생성
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
        RAISE WARNING 'Profile creation failed for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 10. 현재 정책 확인 (확인용)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';
