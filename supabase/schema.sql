-- ══════════════════════════════════════════════════════════════
-- 헤어이어 Supabase 스키마
-- Supabase Dashboard → SQL Editor 에 붙여넣고 실행하세요.
-- ══════════════════════════════════════════════════════════════

-- UUID 확장 (Supabase에서 기본 활성화되어 있으나 명시)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- 1. 사장님 계정 (owners)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE owners (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  phone        TEXT        UNIQUE NOT NULL,           -- 로그인 아이디
  password     TEXT        NOT NULL,                  -- TODO: 운영 시 bcrypt 해싱 필수
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- 2. 미용실 (salons)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE salons (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              UUID        REFERENCES owners(id) ON DELETE CASCADE,
  name                  TEXT        NOT NULL,
  address               TEXT        NOT NULL,
  phone                 TEXT,
  naver_url             TEXT,
  business_hours_start  SMALLINT    NOT NULL DEFAULT 10,  -- 영업 시작 시 (0-23)
  business_hours_end    SMALLINT    NOT NULL DEFAULT 21,  -- 영업 종료 시 (0-23)
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- 3. 디자이너 (designers)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE designers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id     UUID        NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  login_id     TEXT        NOT NULL,                  -- 로그인 아이디
  password     TEXT        NOT NULL,                  -- TODO: 운영 시 bcrypt 해싱 필수
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id, login_id)                          -- 미용실 내 아이디 중복 방지
);

-- ──────────────────────────────────────────────────────────────
-- 4. 빈자리 슬롯 (slots)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE slots (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id     UUID        NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  slot_date    DATE        NOT NULL,
  slot_time    TEXT        NOT NULL,                  -- 'HH:00' 형식 (예: '14:00')
  status       TEXT        NOT NULL DEFAULT 'open'
               CHECK (status IN ('open', 'blocked', 'booked')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id, slot_date, slot_time)              -- 미용실+날짜+시간 복합 유니크
);

-- ──────────────────────────────────────────────────────────────
-- 5. 스타일카드 (style_cards)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE style_cards (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id             UUID        REFERENCES salons(id)    ON DELETE CASCADE,
  designer_id          UUID        REFERENCES designers(id) ON DELETE SET NULL,
  designer_login_id    TEXT,                          -- 빠른 조회용 비정규화
  designer_name        TEXT,
  salon_name           TEXT,
  customer_name        TEXT,
  appointment_time     TEXT,                          -- 'HH:00' 형식
  gender               TEXT,
  styles               JSONB       NOT NULL DEFAULT '[]',   -- 스타일 키워드 배열
  color                TEXT,
  free_text            TEXT,
  photos               JSONB       NOT NULL DEFAULT '[]',   -- base64/URL 배열
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- 6. 예약 (bookings)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id         UUID        NOT NULL REFERENCES salons(id)    ON DELETE CASCADE,
  designer_id      UUID                 REFERENCES designers(id) ON DELETE SET NULL,
  style_card_id    UUID                 REFERENCES style_cards(id) ON DELETE SET NULL,
  customer_name    TEXT        NOT NULL,
  customer_phone   TEXT,
  service          TEXT,
  booking_date     DATE        NOT NULL,
  booking_time     TEXT        NOT NULL,              -- 'HH:00' 형식
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- 트리거: updated_at 자동 갱신
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER owners_updated_at   BEFORE UPDATE ON owners   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER salons_updated_at   BEFORE UPDATE ON salons   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER slots_updated_at    BEFORE UPDATE ON slots    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════
-- 인덱스
-- ══════════════════════════════════════════════════════════════
CREATE INDEX idx_salons_owner          ON salons(owner_id);
CREATE INDEX idx_designers_salon       ON designers(salon_id);
CREATE INDEX idx_designers_login       ON designers(login_id);
CREATE INDEX idx_slots_salon_date      ON slots(salon_id, slot_date);
CREATE INDEX idx_style_cards_salon     ON style_cards(salon_id);
CREATE INDEX idx_style_cards_designer  ON style_cards(designer_login_id);
CREATE INDEX idx_bookings_salon        ON bookings(salon_id);
CREATE INDEX idx_bookings_status       ON bookings(status);
CREATE INDEX idx_bookings_date         ON bookings(booking_date);

-- ══════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- anon key(프론트엔드)로 읽기 가능, 쓰기도 허용
-- 운영 배포 시 인증 기반으로 정책을 강화하세요.
-- ══════════════════════════════════════════════════════════════
ALTER TABLE owners       ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE designers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_cards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings     ENABLE ROW LEVEL SECURITY;

-- 공개 읽기
CREATE POLICY "salons_read"       ON salons       FOR SELECT USING (true);
CREATE POLICY "designers_read"    ON designers    FOR SELECT USING (true);
CREATE POLICY "slots_read"        ON slots        FOR SELECT USING (true);
CREATE POLICY "style_cards_read"  ON style_cards  FOR SELECT USING (true);
CREATE POLICY "bookings_read"     ON bookings     FOR SELECT USING (true);

-- owners: 읽기는 본인만 (phone 일치 시 — 추후 auth.uid() 기반으로 강화)
CREATE POLICY "owners_read"       ON owners       FOR SELECT USING (true);
CREATE POLICY "owners_insert"     ON owners       FOR INSERT WITH CHECK (true);
CREATE POLICY "owners_update"     ON owners       FOR UPDATE USING (true);

-- 쓰기 정책 (현재는 모두 허용 — 운영 시 auth.uid() 검증 추가 필요)
CREATE POLICY "salons_write"         ON salons       FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "designers_write"      ON designers    FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "slots_upsert"         ON slots        FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "style_cards_write"    ON style_cards  FOR ALL    USING (true) WITH CHECK (true);
CREATE POLICY "bookings_write"       ON bookings     FOR ALL    USING (true) WITH CHECK (true);
