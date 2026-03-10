# 🚗 CarPlate Master — 음성 & 직접입력 차량 조회 시스템

🌐 **라이브 데모**: [https://car-plate-voice.vercel.app](https://car-plate-voice.vercel.app)

> 차량 번호판 뒷자리 **4자리**를 음성 또는 직접 입력하면, 즉시 차주 정보를 조회할 수 있는 **하이브리드 웹/앱** 서비스입니다.
>
> ☝️ **Vercel로 원클릭 배포 가능** — 위 버튼을 클릭하면 즉시 나만의 서비스를 배포할 수 있습니다!

---

## ✨ 주요 기능

### 🔍 차량 조회
- 번호판 **뒷자리 4자리** 입력으로 빠른 차주 정보 매칭
- `24머 3734`, `24머3734` 등 공백 유무에 관계없이 **끝 4자리 자동 추출**
- 검색 결과에 차주 성함, 소속, 차량번호 표시

### 🎤 음성 인식 입력
- **Web Speech API** 기반 브라우저 내장 음성 인식 (별도 API 키 불필요)
- 한국어 숫자 음성 입력 지원: `"삼칠삼사"` → `3734`
- **한글 연음 법칙 자동 보정**:
  - `"치리치리"` (칠이칠이의 연음) → `7272`
  - `"구이옥우"` (구이오구의 연음) → `9259`
  - `"파리"` (팔이의 연음) → `82`
  - 기타 ㄹ/ㄱ/ㅁ 받침 연음 패턴 자동 처리
- 여러 인식 결과 중 **숫자가 가장 많이 포함된 결과를 자동 선택**

### 🛠 관리자 패널 (Admin Dashboard)
- **수동 데이터 등록**: 이름, 차량번호, 소속 등 직접 입력
- **속성(컬럼) 관리**: 데이터 속성 추가/수정/삭제
- **대량 업로드**: CSV, 엑셀(.xlsx) 파일 업로드 지원
  - UTF-8 / EUC-KR **한글 인코딩 자동 감지** (한글 깨짐 방지)
  - 업로드 시 헤더를 기존 컬럼에 **자동 매핑**
- **전체 삭제 시 초기화**: 모든 데이터 삭제 시 속성 관리도 기본값으로 복원
- **회원 승인 시스템**: 관리자 승인 기반 회원가입 시뮬레이션

---

## 🏗 기술 스택

| 분류 | 기술 |
|------|------|
| **프레임워크** | React 19 + TypeScript |
| **빌드 도구** | Vite 7 |
| **스타일링** | Tailwind CSS (CDN) |
| **폰트** | Inter + Noto Sans KR (Google Fonts) |
| **음성 인식** | Web Speech API (브라우저 내장) |
| **파일 처리** | SheetJS (xlsx) |
| **상태 관리** | localStorage 기반 |

---

## 📁 프로젝트 구조

```
car_plate_voice/
├── index.html              # 진입점
├── index.tsx               # React 렌더링
├── App.tsx                 # 메인 앱 (라우팅, 인증)
├── types.ts                # TypeScript 타입 정의
├── components/
│   ├── SearchPortal.tsx    # 차량 조회 (직접입력 + 음성)
│   ├── AdminDashboard.tsx  # 관리자 대시보드
│   ├── Auth.tsx            # 로그인/회원가입
│   ├── Navbar.tsx          # 네비게이션 바
│   └── TechnicalGuide.tsx  # 기술 가이드
├── hooks/
│   └── useSpeechRecognition.ts  # 음성 인식 커스텀 훅
├── utils/
│   └── voiceToDigits.ts    # 음성→숫자 변환 (연음 법칙 포함)
└── vite.config.ts          # Vite 설정
```

---

## 🚀 시작하기

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### Vercel 배포

| 항목 | 설정값 |
|------|--------|
| Framework Preset | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

---

## 🎯 사용 방법

1. **로그인** → 관리자 또는 일반 사용자로 접속
2. **차량 조회** → 번호판 뒷자리 4자리를 직접 입력하거나 🎤 음성으로 입력
3. **관리자 모드** → DB 관리 탭에서 데이터 등록, 수정, 삭제, 대량 업로드

---

## 📌 참고사항

- 음성 인식은 **Chrome, Edge** 등 Web Speech API를 지원하는 브라우저에서만 동작합니다.
- 데이터는 **localStorage**에 저장되며, 브라우저 캐시를 지우면 초기화됩니다.
- CSV 업로드 시 한글 인코딩은 UTF-8을 먼저 시도하고, 깨짐이 감지되면 EUC-KR로 자동 재시도합니다.

---

© 2024 Jeonchansoo. All rights reserved.
