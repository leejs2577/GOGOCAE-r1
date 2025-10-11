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
