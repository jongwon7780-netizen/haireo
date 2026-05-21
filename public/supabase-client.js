/* ══════════════════════════════════════════════════════════════
   supabase-client.js — Supabase 클라이언트 + HD 호환 비동기 래퍼

   로드 순서:
     1. <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
     2. <script src="supabase-client.js"></script>

   HD(localStorage 동기) → SB(Supabase 비동기) 교체 매핑:
     HD.getSalons()           →  await SB.getSalons()
     HD.getSalon(id)          →  await SB.getSalon(id)
     HD.saveSalon(data)       →  await SB.saveSalon(data)
     HD.findOwner(ph, pw)     →  await SB.findOwner(ph, pw)
     HD.findDesigner(id, pw)  →  await SB.findDesigner(id, pw)
     HD.getCardsBySalon(sid)  →  await SB.getCardsBySalon(sid)
     HD.saveCard(data)        →  await SB.saveCard(data)
     (슬롯/예약은 SB 전용 메서드 추가)
══════════════════════════════════════════════════════════════ */
const SB = (function () {
  'use strict';

  let _client     = null;
  let _cfgPromise = null;

  /* ─ 클라이언트 초기화 (lazy, /api/config에서 키 수신) ─────── */
  async function getClient() {
    if (_client) return _client;
    if (!_cfgPromise) {
      _cfgPromise = fetch('/api/config').then(function (r) { return r.json(); });
    }
    const cfg = await _cfgPromise;
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      throw new Error('[SB] SUPABASE_URL / SUPABASE_ANON_KEY 미설정 — server.js /api/config 확인');
    }
    // window.supabase 는 CDN 스크립트가 주입
    _client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return _client;
  }

  /* ─ 쿼리 헬퍼 ─────────────────────────────────────────────── */
  async function q(fn) {
    const sb = await getClient();
    return fn(sb);
  }

  /* ─ 디자이너 동기화 (saveSalon 서브루틴) ─────────────────── */
  async function syncDesigners(sb, salonId, designers) {
    await sb.from('designers').delete().eq('salon_id', salonId);
    if (!designers.length) return;
    await sb.from('designers').insert(
      designers.map(function (d) {
        return { salon_id: salonId, name: d.name, login_id: d.loginId, password: d.password };
      })
    );
  }

  /* ─ 행 변환 헬퍼 ──────────────────────────────────────────── */
  function toSalonRow(data) {
    return {
      owner_id:             data.ownerId  || null,
      name:                 data.name,
      address:              data.address,
      phone:                data.phone    || null,
      naver_url:            data.naverUrl || null,
      business_hours_start: (data.businessHours && data.businessHours.start) !== undefined
                              ? data.businessHours.start : 10,
      business_hours_end:   (data.businessHours && data.businessHours.end)   !== undefined
                              ? data.businessHours.end   : 21,
      lat:                  data.lat != null ? data.lat : null,
      lng:                  data.lng != null ? data.lng : null,
    };
  }

  function mapSalon(row) {
    if (!row) return null;
    return {
      id:            row.id,
      name:          row.name,
      address:       row.address,
      phone:         row.phone     || '',
      naverUrl:      row.naver_url || '',
      ownerId:       row.owner_id,
      businessHours: { start: row.business_hours_start, end: row.business_hours_end },
      designers:     (row.designers || []).map(function (d) {
        return { name: d.name, loginId: d.login_id, password: d.password };
      }),
      lat:           row.lat  || null,
      lng:           row.lng  || null,
      createdAt:     row.created_at,
      updatedAt:     row.updated_at,
    };
  }

  function mapCard(row) {
    if (!row) return null;
    return {
      id:              row.id,
      salonId:         row.salon_id,
      salonName:       row.salon_name        || '',
      designerLoginId: row.designer_login_id || '',
      designerName:    row.designer_name     || '',
      customerName:    row.customer_name     || '',
      appointmentTime: row.appointment_time  || '',
      gender:          row.gender            || '',
      styles:          row.styles  || [],
      color:           row.color   || '',
      freeText:        row.free_text || '',
      photos:          row.photos  || [],
      createdAt:       row.created_at,
    };
  }

  /* ══════════════════════════════════════════════════════════
     공개 API — HD 인터페이스와 1:1 대응 (모두 async)
  ══════════════════════════════════════════════════════════ */
  return {

    /* ── 살롱 ──────────────────────────────────────────── */
    async getSalons() {
      const { data, error } = await q(function (sb) {
        return sb.from('salons')
          .select('*, designers(*)')
          .order('created_at', { ascending: false });
      });
      if (error) throw error;
      return (data || []).map(mapSalon);
    },

    async getSalon(id) {
      const { data, error } = await q(function (sb) {
        return sb.from('salons').select('*, designers(*)').eq('id', id).maybeSingle();
      });
      if (error || !data) return null;
      return mapSalon(data);
    },

    async saveSalon(salonData) {
      const sb  = await getClient();
      const row = toSalonRow(salonData);
      let saved;
      if (salonData.id) {
        const { data, error } = await sb.from('salons').update(row).eq('id', salonData.id).select().single();
        if (error) throw error;
        saved = data;
      } else {
        const { data, error } = await sb.from('salons').insert(row).select().single();
        if (error) throw error;
        saved = data;
      }
      if (Array.isArray(salonData.designers)) {
        await syncDesigners(sb, saved.id, salonData.designers);
      }
      return mapSalon(saved);
    },

    async deleteSalon(id) {
      const { error } = await q(function (sb) { return sb.from('salons').delete().eq('id', id); });
      if (error) throw error;
    },

    /* ── 사장님 인증 ───────────────────────────────────── */
    async findOwner(phone, password) {
      const { data, error } = await q(function (sb) {
        return sb.from('owners')
          .select('id, name, phone, salons(id, name)')
          .eq('phone', phone)
          .eq('password', password)
          .maybeSingle();
      });
      if (error || !data) return null;
      const salon = Array.isArray(data.salons) ? data.salons[0] : data.salons;
      return {
        id:        data.id,
        name:      data.name,
        phone:     data.phone,
        salonId:   salon ? salon.id   : null,
        salonName: salon ? salon.name : '',
      };
    },

    async ownerPhoneExists(phone) {
      const { count, error } = await q(function (sb) {
        return sb.from('owners').select('id', { count: 'exact', head: true }).eq('phone', phone);
      });
      if (error) return false;
      return (count || 0) > 0;
    },

    async saveOwner(data) {
      const { data: row, error } = await q(function (sb) {
        return sb.from('owners')
          .insert({ name: data.name, phone: data.phone, password: data.password })
          .select()
          .single();
      });
      if (error) throw error;
      return row;
    },

    /* ── 디자이너 인증 ─────────────────────────────────── */
    async findDesigner(loginId, password) {
      const { data, error } = await q(function (sb) {
        return sb.from('designers')
          .select('*, salons(id, name)')
          .eq('login_id', loginId)
          .eq('password', password)
          .maybeSingle();
      });
      if (error || !data) return null;
      return {
        name:      data.name,
        loginId:   data.login_id,
        password:  data.password,
        salonId:   data.salon_id,
        salonName: data.salons ? data.salons.name : '',
      };
    },

    /* ── 슬롯 (slots 테이블 — HD에는 없는 전용 메서드) ─── */
    async getSlots(salonId, date) {
      const { data, error } = await q(function (sb) {
        return sb.from('slots')
          .select('slot_time, status')
          .eq('salon_id', salonId)
          .eq('slot_date', date);
      });
      if (error) return {};
      return Object.fromEntries((data || []).map(function (s) { return [s.slot_time, s.status]; }));
    },

    async upsertSlot(salonId, date, time, status) {
      const { error } = await q(function (sb) {
        return sb.from('slots').upsert(
          { salon_id: salonId, slot_date: date, slot_time: time, status: status },
          { onConflict: 'salon_id,slot_date,slot_time' }
        );
      });
      if (error) throw error;
    },

    /* ── 스타일카드 ────────────────────────────────────── */
    async getCards() {
      const { data, error } = await q(function (sb) {
        return sb.from('style_cards').select('*').order('created_at', { ascending: false });
      });
      if (error) return [];
      return (data || []).map(mapCard);
    },

    async getCardsBySalon(salonId) {
      const { data, error } = await q(function (sb) {
        return sb.from('style_cards')
          .select('*').eq('salon_id', salonId)
          .order('created_at', { ascending: false });
      });
      if (error) return [];
      return (data || []).map(mapCard);
    },

    async getCardsByDesigner(loginId) {
      const { data, error } = await q(function (sb) {
        return sb.from('style_cards')
          .select('*').eq('designer_login_id', loginId)
          .order('created_at', { ascending: false });
      });
      if (error) return [];
      return (data || []).map(mapCard);
    },

    async saveCard(data) {
      const { data: inserted, error } = await q(function (sb) {
        return sb.from('style_cards').insert({
          salon_id:          data.salonId          || null,
          salon_name:        data.salonName         || null,
          designer_login_id: data.designerLoginId   || null,
          designer_name:     data.designerName      || null,
          customer_name:     data.customerName      || null,
          appointment_time:  data.appointmentTime   || null,
          gender:            data.gender            || null,
          styles:            data.styles  || [],
          color:             data.color   || null,
          free_text:         data.freeText || null,
          photos:            data.photos  || [],
        }).select().single();
      });
      if (error) throw error;
      return mapCard(inserted);
    },

    async getCard(id) {
      const { data, error } = await q(function (sb) {
        return sb.from('style_cards').select('*').eq('id', id).maybeSingle();
      });
      if (error || !data) return null;
      return mapCard(data);
    },

    async deleteCard(id) {
      const { error } = await q(function (sb) { return sb.from('style_cards').delete().eq('id', id); });
      if (error) throw error;
    },

    /* ── 예약 (bookings 테이블 — HD에는 없는 전용 메서드) ─ */
    async getBookings(salonId, status) {
      const { data, error } = await q(function (sb) {
        let b = sb.from('bookings').select('*').eq('salon_id', salonId);
        if (status) b = b.eq('status', status);
        return b.order('booking_time');
      });
      if (error) return [];
      return data || [];
    },

    async saveBooking(data) {
      const { data: inserted, error } = await q(function (sb) {
        return sb.from('bookings').insert({
          salon_id:       data.salonId,
          customer_name:  data.customerName,
          customer_phone: data.customerPhone || null,
          service:        data.service       || null,
          booking_date:   data.bookingDate,
          booking_time:   data.bookingTime,
          status:         'pending',
        }).select().single();
      });
      if (error) throw error;
      return inserted;
    },

    async updateBookingStatus(id, newStatus) {
      const { error } = await q(function (sb) {
        return sb.from('bookings').update({ status: newStatus }).eq('id', id);
      });
      if (error) throw error;
    },

  }; // end return
})();
