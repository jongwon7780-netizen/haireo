# 헤어이어 (Haireo)

미용실과 고객을 이어주는 실시간 예약 플랫폼.

## 실행

```bash
npm install
npm start
```

서버가 `http://localhost:3000` 에서 실행됩니다.

## 환경 변수

`.env` 파일을 프로젝트 루트에 생성하고 아래 값을 입력하세요.

```
KAKAO_REST_KEY=카카오_REST_API_키
```

Railway 등 배포 환경에서는 환경 변수 패널에서 직접 설정합니다.

## 기술 스택

- Node.js + Express
- Kakao Maps JavaScript SDK
- Kakao Local REST API (서버 프록시)

## 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 메인 — 카카오맵 기반 미용실 검색 |
| `/search.html` | 미용실 목록 |
| `/booking.html` | 빈자리 예약 그리드 |
| `/style-card.html` | 스타일 전달카드 위저드 |
| `/for-salon.html` | 사장님 소개 및 요금제 |
| `/salon-join.html` | 사장님 등록 신청 |
