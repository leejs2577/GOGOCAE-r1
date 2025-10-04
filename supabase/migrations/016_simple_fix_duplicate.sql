-- 간단한 중복 파일명 문제 해결
-- 복잡한 PL/pgSQL 대신 단순한 SQL 명령어 사용

-- 1. 기존 unique 제약조건들 확인 (정보만 출력)
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'request_files'::regclass 
AND contype IN ('u', 'p')
ORDER BY conname;

-- 2. file_name 관련 제약조건들을 직접 제거 (안전하게)
-- 일반적인 제약조건 이름들 시도
DO $$
DECLARE
    constraint_names TEXT[] := ARRAY[
        'request_files_file_name_key',
        'request_files_pkey', 
        'unique_file_name',
        'request_files_file_name_unique'
    ];
    constraint_name TEXT;
BEGIN
    FOREACH constraint_name IN ARRAY constraint_names
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE request_files DROP CONSTRAINT IF EXISTS ' || constraint_name;
            RAISE NOTICE 'Tried to drop constraint: %', constraint_name;
        EXCEPTION
            WHEN undefined_object THEN
                RAISE NOTICE 'Constraint % does not exist', constraint_name;
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop constraint %: %', constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. (request_id, file_path) 조합에 unique 제약조건 추가
-- 기존 제약조건이 있으면 제거 후 재생성
ALTER TABLE request_files DROP CONSTRAINT IF EXISTS unique_request_file_path;

ALTER TABLE request_files 
ADD CONSTRAINT unique_request_file_path 
UNIQUE (request_id, file_path);

-- 4. 중복 데이터 정리 (file_path 기준)
-- file_path가 중복인 레코드들 수정
UPDATE request_files 
SET file_path = file_path || '_' || EXTRACT(EPOCH FROM uploaded_at)::TEXT || '_' || SUBSTRING(id::TEXT, 1, 8)
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY request_id, file_path ORDER BY uploaded_at) as rn
        FROM request_files
    ) ranked 
    WHERE rn > 1
);

-- 5. 최종 확인
SELECT 
    'Final check' as status,
    COUNT(*) as total_files,
    COUNT(DISTINCT file_name) as unique_file_names,
    COUNT(DISTINCT CONCAT(request_id, '|', file_path)) as unique_file_paths
FROM request_files;

-- 6. 현재 제약조건 상태 확인
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'request_files'::regclass 
ORDER BY conname;

