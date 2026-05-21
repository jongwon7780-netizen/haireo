-- ══════════════════════════════════════════════════════════
-- 헤어이어 테스트 데이터
-- Supabase Dashboard → SQL Editor 에서 실행하세요.
-- ══════════════════════════════════════════════════════════

-- 1. salons 테이블에 좌표 컬럼 추가 (없는 경우)
ALTER TABLE salons ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- ──────────────────────────────────────────────────────────
-- 2. 테스트 사장님 계정
--    로그인: admin / 1234
-- ──────────────────────────────────────────────────────────
INSERT INTO owners (name, phone, password)
VALUES ('테스트 원장', 'admin', '1234')
ON CONFLICT (phone) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- 3. 테스트 미용실
-- ──────────────────────────────────────────────────────────
WITH owner_row AS (
  SELECT id FROM owners WHERE phone = 'test@haireo.com' LIMIT 1
)
INSERT INTO salons (owner_id, name, address, phone, naver_url,
                    business_hours_start, business_hours_end, lat, lng)
SELECT
  owner_row.id,
  '헤어이어 테스트샵',
  '서울 강남구 역삼동 123-45',
  '02-1234-5678',
  'https://map.naver.com/v5/search/%ED%97%A4%EC%96%B4%EC%9D%B4%EC%96%B4%20%ED%85%8C%EC%8A%A4%ED%8A%B8%EC%83%B5',
  10, 21,
  37.4979, 127.0276
FROM owner_row
WHERE NOT EXISTS (SELECT 1 FROM salons WHERE name = '헤어이어 테스트샵');

-- ──────────────────────────────────────────────────────────
-- 4. 테스트 디자이너 2명
-- ──────────────────────────────────────────────────────────
WITH salon_row AS (SELECT id FROM salons WHERE name = '헤어이어 테스트샵' LIMIT 1)
INSERT INTO designers (salon_id, name, login_id, password)
SELECT salon_row.id, '김지수', 'jisu', 'jisu1234' FROM salon_row
WHERE NOT EXISTS (SELECT 1 FROM designers WHERE login_id = 'jisu');

WITH salon_row AS (SELECT id FROM salons WHERE name = '헤어이어 테스트샵' LIMIT 1)
INSERT INTO designers (salon_id, name, login_id, password)
SELECT salon_row.id, '박민준', 'minjun', 'minjun1234' FROM salon_row
WHERE NOT EXISTS (SELECT 1 FROM designers WHERE login_id = 'minjun');

-- ──────────────────────────────────────────────────────────
-- 5. 더미 조회수 (views 테이블)
--    오늘 47회 / 이번주 누적 213회 / 네이버 클릭 12회
-- ──────────────────────────────────────────────────────────
-- 오늘 view 47건
INSERT INTO views (salon_name, event_type, created_at)
SELECT '헤어이어 테스트샵', 'view',
       NOW() - (n || ' minutes')::interval
FROM generate_series(1, 47) AS gs(n);

-- 이번주 과거 view 166건 (합산 213)
INSERT INTO views (salon_name, event_type, created_at)
SELECT '헤어이어 테스트샵', 'view',
       NOW() - ((n % 6 + 1) || ' days')::interval - (n || ' minutes')::interval
FROM generate_series(1, 166) AS gs(n);

-- 네이버 클릭 12건
INSERT INTO views (salon_name, event_type, created_at)
SELECT '헤어이어 테스트샵', 'naver_click',
       NOW() - ((n % 6) || ' days')::interval - (n * 30 || ' minutes')::interval
FROM generate_series(1, 12) AS gs(n);
