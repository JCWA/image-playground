# Image Playground

## 목적

1. 포트폴리오 — AI 이미지 파이프라인을 직접 설계/구현할 수 있다는 것을 보여주기
2. 이미지 AI 파이프라인 학습 — 텍스트→이미지, 이미지→이미지 변환 흐름을 직접 경험

## 서비스 URL

- **프로덕션**: https://image-playground-eight.vercel.app
- **GitHub**: https://github.com/JCWA/image-playground

## 아키텍처

```
[사용자 브라우저]
    │
    ├─ 페이지 접속 시 ──→ Slack Webhook (방문자 알림: IP, 페이지, 시간, 리퍼러)
    │
    ├─ /generate ──→ 프롬프트 입력
    │       │
    │       ▼
    │   [Next.js API Route: /api/generate]
    │       │
    │       ▼
    │   [HuggingFace Inference API]
    │   모델: FLUX.1-schnell (black-forest-labs)
    │       │
    │       ▼
    │   이미지 바이너리 → Base64 Data URL → 클라이언트에 반환
    │
    └─ /transform ──→ 이미지 업로드 + 스타일 선택
            │
            ▼
        [Next.js API Route: /api/transform]
            │
            ├─ 유저 이미지: Base64 Data URL → Blob 변환
            ├─ 스타일 이미지: public/styles/ 에서 읽기 → Blob
            │
            ▼
        [Gradio Spaces API]
        Space: multimodalart/flux-style-shaping
        입력: structure_image + style_image + prompt
            │
            ▼
        Gradio 임시 URL → fetch → Base64 Data URL → 클라이언트에 반환
```

## 기술 스택

| 역할 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | Next.js 16 (App Router) | TypeScript |
| 스타일링 | Tailwind CSS 4 | 다크 테마 |
| 텍스트→이미지 | HuggingFace Inference API | FLUX.1-schnell, 무료 |
| 이미지→이미지 | Gradio Spaces (HuggingFace) | FLUX Style Shaping, 무료 |
| 방문자 알림 | Slack Webhook | IP + 페이지 + 시간 + 리퍼러 |
| 배포 | Vercel | Git push 시 자동 배포 |

## 페이지 구성

```
/                    메인 — 모드 선택 (생성 / 변환)
/generate            텍스트→이미지 생성 페이지
/transform           이미지→이미지 스타일 변환 페이지
```

## 핵심 기능

### 1. 텍스트→이미지 생성 (/generate)
- 사용자가 프롬프트를 입력하면 AI가 이미지를 생성
- 모델: FLUX.1-schnell (HuggingFace Inference API, 무료)
- 예시 프롬프트 6종 제공
- 생성 히스토리 (세션 내)
- 이미지 다운로드

### 2. 이미지→이미지 스타일 변환 (/transform)
- 사용자가 사진을 업로드하고 스타일 프리셋을 선택하면 변환
- 모델: FLUX Style Shaping (Gradio Spaces, 무료)
- 원본 이미지(구조) + 스타일 참고 이미지 + 프롬프트 조합
- 스타일 강도 슬라이더 (10%~100%)
- Before/After 비교 UI
- 드래그앤드롭 업로드 + 파일 유효성 검사 (10MB, JPG/PNG/WebP)

### 3. 방문자 Slack 알림
- 페이지 접속 시 자동 발송
- IP 주소 (ipify API), 접속 페이지, 시간 (KST), 리퍼러

## 스타일 프리셋 (변환용)

| 프리셋 | 프롬프트 | 참고 이미지 |
|--------|---------|------------|
| 사이버펑크 | cyberpunk style, neon lights, futuristic dark atmosphere | public/styles/cyberpunk.jpg |
| 수채화 | watercolor painting, soft brush strokes, artistic | public/styles/watercolor.jpg |
| 애니메이션 | anime style illustration, vibrant colors, clean lines | public/styles/anime.jpg |
| 빈티지 필름 | vintage 35mm film photography, grain, warm tones | public/styles/vintage.jpg |
| 유화 | oil painting on canvas, rich texture, classical art style | public/styles/oilpainting.jpg |
| 네온 팝아트 | neon pop art style, bold colors, graphic design | public/styles/neon.jpg |

※ 스타일 참고 이미지는 FLUX.1-schnell로 AI 생성한 이미지

## 파일 구조

```
image-playground/
├── PLAN.md
├── .env.local                      ← HF_API_TOKEN
├── public/
│   └── styles/                     ← 스타일 참고 이미지 6종 (AI 생성)
├── src/
│   ├── components/
│   │   ├── Button.tsx              ← 공통 버튼 (primary/secondary)
│   │   ├── Header.tsx              ← 네비게이션 헤더 (active 상태)
│   │   └── Spinner.tsx             ← 로딩 스피너
│   └── app/
│       ├── layout.tsx              ← 공통 레이아웃 + Slack 알림 스크립트
│       ├── page.tsx                ← 메인 (모드 선택 카드)
│       ├── generate/
│       │   ├── layout.tsx          ← 페이지 메타데이터
│       │   └── page.tsx            ← 텍스트→이미지 (프롬프트 + 히스토리)
│       ├── transform/
│       │   ├── layout.tsx          ← 페이지 메타데이터
│       │   └── page.tsx            ← 이미지→스타일 변환 (업로드 + 프리셋)
│       └── api/
│           ├── generate/route.ts   ← HuggingFace FLUX.1-schnell 호출
│           └── transform/route.ts  ← Gradio FLUX Style Shaping 호출
```

## 환경변수

| 변수 | 설명 | 설정 위치 |
|------|------|----------|
| HF_API_TOKEN | HuggingFace API 토큰 | .env.local + Vercel |

## 데이터 흐름 상세

### Generate (텍스트→이미지)
```
1. 사용자: 프롬프트 입력 + 생성 클릭
2. 클라이언트: POST /api/generate { prompt }
3. API Route: HuggingFace FLUX.1-schnell 호출 (inputs: prompt)
4. HuggingFace: 이미지 바이너리 반환
5. API Route: Buffer → Base64 → Data URL
6. 클라이언트: 이미지 표시 + 히스토리에 추가
```

### Transform (이미지→이미지)
```
1. 사용자: 이미지 업로드 + 스타일 선택 + 변환 클릭
2. 클라이언트: FileReader → Base64 Data URL
3. 클라이언트: POST /api/transform { prompt, imageUrl, styleImage, styleStrength }
4. API Route:
   a. 유저 이미지: Base64 → Buffer → Blob
   b. 스타일 이미지: fs.readFileSync(public/styles/...) → Blob
5. API Route: Gradio Client → predict("/generate_image", { structure_image, style_image, prompt, ... })
6. Gradio Space: FLUX 모델로 스타일 변환 실행
7. API Route: 결과 임시 URL → fetch → Buffer → Base64 Data URL
8. 클라이언트: Before/After 비교 표시
```

## 태스크

### Phase 1 — 기본 구조
- [x] 1-1. 페이지 라우팅 구성 (/, /generate, /transform)
- [x] 1-2. 공통 레이아웃 컴포넌트 (헤더 + 네비게이션)
- [x] 1-3. 메인 페이지 — 모드 선택 카드 UI (생성 / 변환)
- [x] 1-4. 공통 컴포넌트 분리 (버튼, 카드, 로딩 스피너)

### Phase 2 — 텍스트→이미지 생성
- [x] 2-1. /generate 페이지 레이아웃 (프롬프트 입력 영역 + 결과 영역)
- [x] 2-2. 프롬프트 입력 폼 (텍스트 입력 + 생성 버튼 + Enter 키 지원)
- [x] 2-3. 예시 프롬프트 버튼 (클릭 시 입력창에 채워짐)
- [x] 2-4. /api/generate API Route — HuggingFace FLUX.1-schnell 호출
- [x] 2-5. 로딩 상태 UI (스피너 + 안내 문구)
- [x] 2-6. 결과 이미지 표시 + 다운로드 버튼
- [x] 2-7. 생성 히스토리 (같은 세션 내 이전 결과 목록)

### Phase 3 — 이미지→이미지 변환
- [x] 3-1. /transform 페이지 레이아웃 (업로드 영역 + 스타일 선택 + 결과 영역)
- [x] 3-2. 이미지 업로드 UI (드래그앤드롭 + 클릭 선택 + 미리보기)
- [x] 3-3. 이미지 유효성 검사 (파일 크기 제한, 포맷 체크)
- [x] 3-4. 스타일 프리셋 선택 UI (카드형 그리드 + 미리보기 이미지)
- [x] 3-5. 스타일 강도(styleStrength) 슬라이더
- [x] 3-6. /api/transform API Route — Gradio FLUX Style Shaping 호출
- [x] 3-7. Before/After 비교 UI (나란히 표시)
- [x] 3-8. 결과 이미지 다운로드 버튼

### Phase 4 — 마무리
- [x] 4-1. 반응형 모바일 대응 (breakpoint별 레이아웃 조정)
- [x] 4-2. API 에러 핸들링 (타임아웃, 모델 실패, 503 모델 로딩)
- [x] 4-3. Vercel 배포 + 환경변수 설정
- [x] 4-4. OG 이미지 + 메타데이터
- [x] 4-5. 방문자 Slack 알림 (IP + 페이지 + 시간 + 리퍼러)

## 참고

- HuggingFace Inference API: 완전 무료, 모델 로딩 시 503 (30초 대기 후 재시도)
- Gradio Spaces: 완전 무료, GPU 웨이크업 시 30초~2분 소요
- 스타일 참고 이미지: FLUX.1-schnell로 자체 생성 (외부 URL 의존 없음)
- Gradio 결과 이미지: 임시 URL이라 서버에서 Base64로 변환하여 전달
