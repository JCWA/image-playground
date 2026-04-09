# Image Playground

## 목적

1. 포트폴리오 — AI 이미지 파이프라인을 직접 설계/구현할 수 있다는 것을 보여주기
2. 이미지 AI 파이프라인 학습 — 텍스트→이미지, 이미지→이미지 변환 흐름을 직접 경험

## 핵심 기능

### 1. 텍스트→이미지 생성
- 사용자가 프롬프트를 입력하면 AI가 이미지를 생성
- 모델: FLUX Schnell (Fal.ai) — 빠른 생성 속도
- 예시 프롬프트 제공으로 진입 장벽 낮추기

### 2. 이미지→이미지 스타일 변환
- 사용자가 사진을 업로드하고 스타일을 선택하면 변환
- 모델: FLUX Dev Image-to-Image (Fal.ai)
- 프리셋 스타일: 왕홍풍, 인생네컷, 사이버펑크, 수채화 등
- strength 조절로 변환 강도 제어

## 페이지 구성

```
/                    메인 — 모드 선택 (생성 / 변환)
/generate            텍스트→이미지 생성 페이지
/transform           이미지→이미지 변환 페이지
```

## 기술 스택

| 역할 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | Next.js 16 (App Router) | TypeScript |
| 스타일링 | Tailwind CSS 4 | 다크 테마 |
| AI 모델 | Fal.ai (FLUX Schnell, FLUX Dev) | 무료 크레딧 |
| 배포 | Vercel | 무료 |

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
- [x] 2-4. /api/generate API Route — FLUX Schnell 호출
- [x] 2-5. 로딩 상태 UI (스피너 + 안내 문구)
- [x] 2-6. 결과 이미지 표시 + 다운로드 버튼
- [x] 2-7. 생성 히스토리 (같은 세션 내 이전 결과 목록)

### Phase 3 — 이미지→이미지 변환
- [x] 3-1. /transform 페이지 레이아웃 (업로드 영역 + 스타일 선택 + 결과 영역)
- [x] 3-2. 이미지 업로드 UI (드래그앤드롭 + 클릭 선택 + 미리보기)
- [x] 3-3. 이미지 유효성 검사 (파일 크기 제한, 포맷 체크)
- [x] 3-4. 스타일 프리셋 선택 UI (카드형 그리드, 선택 시 하이라이트)
- [x] 3-5. 변환 강도(strength) 슬라이더 + 설명 툴팁
- [x] 3-6. /api/transform API Route — FLUX Dev Image-to-Image 호출
- [x] 3-7. Before/After 비교 UI (나란히 또는 슬라이더)
- [x] 3-8. 결과 이미지 다운로드 버튼

### Phase 4 — 마무리
- [x] 4-1. 반응형 모바일 대응 (breakpoint별 레이아웃 조정)
- [x] 4-2. API 에러 핸들링 (타임아웃, 모델 실패, 크레딧 소진)
- [ ] 4-3. Vercel 배포 + 환경변수 설정
- [x] 4-4. OG 이미지 + 메타데이터

## 스타일 프리셋 (변환용)

| 프리셋 | 프롬프트 키워드 | strength |
|--------|----------------|----------|
| 왕홍풍 | Chinese influencer style, glamorous makeup, soft lighting, beauty filter | 0.75 |
| 인생네컷 | Korean photo booth style, cute pose, pastel background, soft filter | 0.70 |
| 사이버펑크 | Cyberpunk style, neon lights, futuristic, dark atmosphere | 0.80 |
| 수채화 | Watercolor painting style, soft brush strokes, artistic | 0.85 |
| 애니메이션 | Anime style illustration, vibrant colors, clean lines | 0.80 |
| 빈티지 필름 | Vintage film photography, grain, warm tones, 35mm | 0.70 |

## 참고

- Fal.ai 무료 크레딧: $10 (수백 장 생성 가능)
- FLUX Schnell: 텍스트→이미지, 빠름 (~2초)
- FLUX Dev: 이미지→이미지, 고품질 (~10초)
