# Image Playground 개발 로그

## 기획 배경

- 스타트업 면접 준비 중, AI 이미지 파이프라인을 직접 구현해본 경험이 필요했음
- 기존 챗봇 프로젝트(RAG 파이프라인)와 다른 형태의 AI 파이프라인을 경험하고 싶었음
- 목표: 텍스트→이미지 생성 + 이미지→이미지 스타일 변환을 무료 인프라로 구현

## 기획 단계

### 요구사항 정의
1. 텍스트→이미지 생성: 프롬프트 입력 → AI 이미지 생성
2. 이미지→이미지 변환: 사진 업로드 + 스타일 프리셋 선택 → 스타일 변환
3. 완전 무료 인프라 (포트폴리오용)
4. Vercel 배포 (Git push 자동 배포)

### 페이지 설계
```
/              모드 선택 (생성 vs 변환)
/generate      텍스트 → 이미지 생성
/transform     이미지 → 스타일 변환
```

### 태스크 분할 (4 Phase, 20개 태스크)
- Phase 1: 기본 구조 (라우팅, 레이아웃, 공통 컴포넌트)
- Phase 2: 텍스트→이미지 생성 (프롬프트, API, 히스토리)
- Phase 3: 이미지→이미지 변환 (업로드, 프리셋, Before/After)
- Phase 4: 마무리 (반응형, 에러 핸들링, 배포, 메타데이터)

## 개발 과정

### Phase 1~3: 초기 구현 (Fal.ai)

**첫 번째 선택: Fal.ai**
- FLUX Schnell (텍스트→이미지) + FLUX Dev (이미지→이미지) 조합
- API가 깔끔하고 모델 품질이 좋음
- `@fal-ai/client` npm 패키지로 간편한 연동

**구현 내용:**
- Next.js 16 App Router + TypeScript + Tailwind CSS 4
- 공통 컴포넌트: Button, Header(네비게이션), Spinner
- Generate: 프롬프트 입력 + 예시 버튼 + 세션 히스토리 + 다운로드
- Transform: 드래그앤드롭 업로드 + 스타일 프리셋 6종 + 강도 슬라이더 + Before/After

**문제 발생: Fal.ai 크레딧 0**
- 가입 시 무료 크레딧을 안 줌 (정책 변경된 듯)
- $5 충전 필요 → 무료로 대체할 방법 탐색

### 모델 교체 1차: HuggingFace Inference API

**결정:** Fal.ai → HuggingFace Inference API로 교체

**텍스트→이미지: 성공**
- 모델: `black-forest-labs/FLUX.1-schnell`
- 완전 무료, API도 간단

**이미지→이미지: 실패**
- `stabilityai/stable-diffusion-xl-base-1.0` → deprecated
- `timbrooks/instruct-pix2pix` → HuggingFace Inference에서 지원 안 함
- HuggingFace Inference API는 image-to-image 모델을 거의 지원하지 않음

**임시 대응:** Transform 페이지를 스타일 기반 텍스트→이미지 생성으로 변경
- 이미지 업로드 없이 스타일 프리셋 + 주제 입력 → 이미지 생성
- 원래 의도(사진 변환)와 달라서 불만족

### 모델 교체 2차: Gradio Spaces

**발견:** HuggingFace Spaces에 올라간 Gradio 앱을 API로 호출 가능 (무료)

**시도 1: `okaris/flux-img2img`**
- "Space metadata could not be loaded" 에러 → Space가 없거나 비공개

**시도 2: `Manjushri/Instruct-Pix-2-Pix`**
- 연결 성공, API 호출 성공
- 하지만 결과 이미지 품질이 기괴함 (오래된 모델)

**시도 3: `multimodalart/flux-style-shaping`** ← 최종 선택
- FLUX 기반이라 고품질
- structure_image(원본) + style_image(참고) + prompt 조합
- 스타일 참고 이미지가 필요한 구조

### 스타일 참고 이미지 문제

**문제 1: 외부 이미지 URL**
- Unsplash URL 사용 → 404 (URL이 유효하지 않음)
- Wikipedia 이미지 → 429 (rate limit)
- 외부 URL은 불안정

**해결:** AI로 스타일 참고 이미지 직접 생성
- FLUX.1-schnell로 6종 스타일 이미지를 생성
- `public/styles/`에 저장하여 외부 의존성 제거

### Gradio 연동 삽질들

**삽질 1: `handle_file()` 이슈**
- `handle_file(dataUrl)` → Data URL을 파일 경로로 인식하여 ENOENT 에러
- 해결: Base64 → Buffer → Blob으로 직접 변환하여 전달

**삽질 2: Gradio 임시 URL**
- 결과 이미지가 `https://xxx.hf.space/gradio_api/file=/tmp/gradio/...` 형태
- 이 URL은 외부(브라우저)에서 접근 불가
- 해결: API Route에서 fetch → Base64 Data URL로 변환하여 클라이언트에 전달

**삽질 3: HuggingFace API URL 변경**
- `api-inference.huggingface.co` → `router.huggingface.co/hf-inference`로 변경됨
- 기존 URL 사용 시 "no longer supported" 에러

### Phase 4: 마무리

- 반응형 모바일 대응 (입력 영역 세로 배치 등)
- API 에러 핸들링 (503 모델 로딩, 429 rate limit, 타임아웃)
- 페이지별 메타데이터 (layout.tsx에서 설정)
- Vercel 배포 + 환경변수 설정
- Slack 방문자 알림 (봇 크롤러 필터링 포함)
- robots noindex 설정

## 최종 아키텍처

```
[브라우저]
    │
    ├─ /generate
    │   └─ POST /api/generate
    │       └─ HuggingFace Inference API (FLUX.1-schnell)
    │           └─ 바이너리 → Base64 → 클라이언트
    │
    └─ /transform
        └─ POST /api/transform
            ├─ 유저 이미지: Base64 → Blob
            ├─ 스타일 이미지: public/styles/ → Blob
            └─ Gradio Spaces (flux-style-shaping)
                └─ 임시 URL → fetch → Base64 → 클라이언트
```

## 기술적 의사결정 요약

| 결정 | 이유 |
|------|------|
| Fal.ai → HuggingFace | 크레딧 0, 무료 대안 필요 |
| HuggingFace img2img → Gradio | Inference API가 img2img 모델 미지원 |
| Instruct-Pix2Pix → FLUX Style Shaping | 결과 품질 문제 (기괴한 이미지) |
| 외부 이미지 URL → 자체 생성 | Unsplash 404, Wikipedia 429 |
| handle_file → 직접 Blob 변환 | Data URL을 파일 경로로 인식하는 버그 |
| Gradio URL 직접 반환 → Base64 프록시 | 임시 URL 외부 접근 불가 |
| api-inference → router.huggingface.co | HuggingFace API 엔드포인트 변경 |

### 멀티 모델 지원 추가

**요구사항:** 모델 1개 고정이 아니라 콤보박스로 여러 모델을 선택할 수 있게

**Generate 모델 탐색 과정:**
- HuggingFace Inference API: 대부분 404/410 (deprecated)
  - 사용 가능: `FLUX.1-schnell`, `stable-diffusion-3-medium-diffusers` (2개뿐)
- Gradio Spaces: Space마다 접속 가능 여부가 다름
  - `stabilityai/*` → 전부 "Could not resolve app config"
  - `multimodalart/FLUX.1-merged` → OK
  - `prithivMLmods/FLUX-REALISM` → OK (내부에 model_choice로 2개 모델 지원)
  - `ByteDance/Hyper-FLUX-8Steps-LoRA` → OK
  - 나머지 대부분 FAIL 또는 TIMEOUT

**결과: Generate 7종**

| # | 모델 | 방식 | 특징 |
|---|------|------|------|
| 1 | FLUX.1 Schnell | HuggingFace API | 기본값, 빠름 |
| 2 | Stable Diffusion 3 | HuggingFace API | 안정적 |
| 3 | FLUX.1 Schnell (Gradio) | Gradio Space | 고해상도 1024px |
| 4 | FLUX.1 Merged | Gradio Space | 고품질 통합 |
| 5 | FLUX Krea Dev | Gradio Space (FLUX-REALISM) | 크리에이티브 |
| 6 | FLUX Realism | Gradio Space (FLUX-REALISM) | 사실적 사진 |
| 7 | Hyper-FLUX | Gradio Space (ByteDance) | 8스텝 고속 |

**API 설계:** `MODEL_MAP` 객체로 모델별 설정을 관리. HF/Gradio 분기, Space별 파라미터/엔드포인트 차이를 추상화.

**삽질: Gradio 응답 형태 불일치**
- Space마다 결과 데이터 구조가 다름 (`{url}`, `[{image:{url}}]` 등)
- 여러 형태를 순회하며 URL을 찾는 범용 파싱 로직 필요했음

**Transform 모델 확장:**
- img2img 지원하는 무료 Gradio Space가 극히 적음
- 사용 가능한 것: `flux-style-shaping`, `Instruct-Pix-2-Pix`, `cosxl` (3개)
- 모델별로 입력 구조가 완전히 다름:
  - flux-style-shaping: structure_image + style_image + prompt
  - cosxl: image + prompt
  - pix2pix: source_img + instructions + guide + steps + Strength

**결과: Transform 3종**

| # | 모델 | 입력 방식 |
|---|------|----------|
| 1 | FLUX Style Shaping | 스타일 참고 이미지 + 프롬프트 |
| 2 | CosXL Edit | 프롬프트만으로 편집 |
| 3 | Instruct Pix2Pix | 지시형 프롬프트 변환 |

**UI 분기:** 모델에 `needsStyleImage` 플래그를 두어:
- true → 스타일 프리셋 카드 그리드 표시
- false → 커스텀 프롬프트 입력란 표시

## 배운 점

1. **무료 AI API는 불안정하다** — 모델 deprecated, URL 변경, Space 삭제 등 수시로 바뀜
2. **모델 호출보다 파이프라인이 어렵다** — API 호출은 fetch 한 줄이지만, 이미지 포맷 변환/에러 핸들링/프록시 등이 실제 작업의 80%
3. **외부 의존성은 최소화** — 외부 이미지 URL 대신 자체 생성/저장이 안정적
4. **Gradio Spaces는 프로토타입용으로 유용** — 무료 GPU, 다양한 모델, 단 느리고 불안정
5. **Base64 변환이 만능 해결책** — 임시 URL, CORS 문제 등을 우회하는 데 유용하지만 용량이 큼
6. **무료 모델 생태계는 파편화돼 있다** — HuggingFace Inference API에서 쓸 수 있는 모델이 극소수, Gradio Space도 절반 이상 접속 불가
7. **멀티 모델 지원은 추상화가 핵심** — Space마다 엔드포인트, 파라미터, 응답 형태가 다르므로 MODEL_MAP 같은 설정 객체로 차이를 흡수하는 구조가 필수

## 커밋 히스토리

```
60f7c36 feat: AI 이미지 생성/변환 플레이그라운드 초기 구현 (Fal.ai)
244fdf7 refactor: Fal.ai → HuggingFace Inference API로 교체
64f5325 feat: Gradio Spaces로 image-to-image 변환 복원
8b6e0da fix: Gradio Space를 Manjushri/Instruct-Pix-2-Pix로 교체
97813e9 fix: Base64→Blob 변환으로 Gradio 파일 업로드 수정
2eef180 feat: FLUX Style Shaping 모델로 교체 (고품질 스타일 변환)
ada5abc fix: 스타일 이미지를 로컬 파일로 교체 (외부 URL 404 해결)
48dc331 fix: Gradio 임시 URL → Base64 변환으로 이미지 표시 수정
2e90d15 feat: Slack 방문자 알림 추가 + PLAN.md 전체 프로세스 문서화
4a5d981 feat: Generate 페이지에 모델 선택 콤보박스 추가 (3종)
3a37808 feat: 모델 7종으로 확장 (HuggingFace 2 + Gradio 5)
e27f6a0 feat: Transform 페이지에 모델 선택 콤보박스 추가 (3종)
```
