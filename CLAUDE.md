# haireo (헤어이어)

미용실과 고객을 이어주는 실시간 예약 플랫폼. **고객 트랙**과 **사장님 트랙** 두 갈래로 구성.

## 프로젝트 구조

```
haireo/
├── server.js              # Express 서버 (포트 3000)
├── public/
│   ├── style.css          # 공통 스타일 (모든 페이지 공유)
│   │
│   ├── ── 고객 트랙 ──
│   ├── index.html         # 고객 메인 — 히어로 검색창, 위치기반 CTA
│   ├── search.html        # 미용실 목록 — 거리순/별점순 정렬, 필터
│   ├── booking.html       # 실시간 예약 그리드 — 시간×미용실 매트릭스
│   ├── style-card.html    # 스타일 전달카드 4단계 위저드
│   │
│   └── ── 사장님 트랙 ──
│       ├── for-salon.html # 사장님 소개페이지 + 요금제 3종
│       └── salon-join.html# 등록 신청 3단계 폼
└── package.json
```

## 기술 스택

- **서버**: Node.js + Express 5 (`npm start` → port 3000)
- **프론트엔드**: 정적 HTML / CSS / Vanilla JS
- **폰트**: Noto Sans KR, Noto Serif KR (Google Fonts)

## 디자인 시스템

| 토큰          | 값          | 용도               |
|---------------|-------------|-------------------|
| `--cream`     | `#F9F5F0`   | 페이지 배경        |
| `--rose`      | `#C4725A`   | 포인트/CTA         |
| `--rose-dark` | `#A85A44`   | hover 상태         |
| `--rose-light`| `#F2E8E4`   | 연한 배경 강조      |
| `--dark`      | `#2D2D2D`   | 본문 텍스트        |
| `--sub`       | `#7A7A7A`   | 보조 텍스트        |
| `--border`    | `#E8E0D8`   | 선/구분선           |
| `--green`     | `#4CAF82`   | 예약 여유           |
| `--yellow`    | `#E8A838`   | 마감임박            |
| `--red`       | `#D95C5C`   | 마감/에러           |

## 공통 네비게이션

```
헤어이어 로고 | 미용실 찾기 → search.html
             | 빈자리 보기 → booking.html
             | 스타일카드  → style-card.html
             | [사장님이신가요?] → for-salon.html  ← 버튼 스타일
```

## 페이지별 역할

### 고객 트랙

| 파일 | 역할 |
|------|------|
| `index.html` | 검색창 즉시 노출 히어로, 서비스 하이라이트, 빠른 CTA |
| `search.html` | 거리순 정렬 미용실 카드 목록, 별점/거리/서비스 필터 |
| `booking.html` | 시간대×미용실 그리드, 슬롯 클릭 예약 모달 |
| `style-card.html` | 사진첨부→키워드→소심한고객모드→전달카드 4단계 위저드 |

### 사장님 트랙

| 파일 | 역할 |
|------|------|
| `for-salon.html` | 장점·통계·요금제(베이직 29,000/프로 59,000/체인 문의) |
| `salon-join.html` | 3단계 등록폼 (기본정보→영업정보→요금제 선택) |

## 개발 서버

```bash
npm start          # node server.js → http://localhost:3000
```

## 주의사항

- 모바일 반응형 필수 (breakpoint: 768px, 480px)
- 예약/검색 데이터는 목업(mock) 데이터 사용
- 모든 페이지 상단 nav는 공통 구조 유지
