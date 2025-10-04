-- 즉시 중복 파일명 문제 해결
-- 기존 중복 체크 로직을 제거하고 파일명 중복을 허용

-- 1. 기존 중복 관련 제약조건들 확인 및 제거
DO $$ 
DECLARE
    constraint_name TEXT;
    constraint_type TEXT;
BEGIN
    -- file_name 관련 unique 제약조건 찾기
    FOR constraint_name, constraint_type IN 
        SELECT conname, contype
        FROM pg_constraint 
        WHERE conrelid = 'request_files'::regclass 
        AND contype IN ('u', 'p') 
        AND EXISTS (
            SELECT 1 FROM pg_attribute 
            WHERE attrelid = conrelid 
            AND attname = 'file_name' 
            AND attnum = ANY(conkey)
        )
    LOOP
        -- 제약조건 삭제
        EXECUTE 'ALTER TABLE request_files DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: % (type: %)', constraint_name, constraint_type;
    END LOOP;
END $$;

-- 2. file_name 컬럼에 대한 unique 제약조건 제거 (단순화)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- file_name 단독 unique 제약조건들을 찾아서 제거
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'request_files'::regclass 
    AND contype = 'u' 
    AND conkey IS NOT NULL
    AND array_length(conkey, 1) = 1
    AND EXISTS (
        SELECT 1 FROM pg_attribute 
        WHERE attrelid = conrelid 
        AND attname = 'file_name' 
        AND attnum = conkey[1]
    )
    LIMIT 1;
    
    -- 제약조건이 있으면 제거
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE request_files DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped single column unique constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No single column unique constraint found on file_name';
    END IF;
END $$;

-- 3. file_path는 고유해야 하므로 (request_id, file_path) 조합으로 unique 제약조건 추가
-- 기존에 있다면 제거 후 재생성
DO $$
BEGIN
    -- 기존 제약조건 제거
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'request_files'::regclass 
        AND conname = 'unique_request_file_path'
    ) THEN
        ALTER TABLE request_files DROP CONSTRAINT unique_request_file_path;
        RAISE NOTICE 'Dropped existing unique_request_file_path constraint';
    END IF;
    
    -- 새 제약조건 추가
    ALTER TABLE request_files 
    ADD CONSTRAINT unique_request_file_path 
    UNIQUE (request_id, file_path);
    
    RAISE NOTICE 'Added unique constraint on (request_id, file_path)';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add unique constraint: %', SQLERRM;
END $$;

-- 4. 기존 중복 데이터 정리 (필요한 경우)
-- file_path가 중복인 경우에만 처리
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- 중복 file_path 개수 확인
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT request_id, file_path, COUNT(*) as cnt
        FROM request_files
        GROUP BY request_id, file_path
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate file_path entries, fixing...', duplicate_count;
        
        -- 중복된 file_path를 가진 레코드들 수정
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
        
        RAISE NOTICE 'Fixed duplicate file_path entries';
    ELSE
        RAISE NOTICE 'No duplicate file_path entries found';
    END IF;
END $$;

-- 5. 최종 확인
SELECT 
    'Final check' as status,
    COUNT(*) as total_files,
    COUNT(DISTINCT file_name) as unique_file_names,
    COUNT(DISTINCT CONCAT(request_id, '|', file_path)) as unique_file_paths
FROM request_files;
