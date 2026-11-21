# Sunrise Group — 공식 홈페이지 R28 후보

운영 Worker: `sg-portal-8e4c71b9` · Production branch: `main`

- 운영 주소: https://sg-portal-8e4c71b9.ko-pg.workers.dev
- 현재 운영 기준: R27
- 개발 후보: R28 (branch `r28-portal-detail-performance-20261121`)
- 원본 기준본: R25 immutable source parts + R27 overlay
- 제품 소개 정책: PC 프로그램 및 QGIS 플러그인 소개 전용. 설치파일·직접 배포 링크를 홈페이지에서 제공하지 않는다.

## R28 변경 범위

- PC 프로그램 16개와 QGIS 플러그인 9개의 카드 설명 및 상세 소개를 실제 확인된 기능 기준으로 정리한다.
- 제품별 상세 페이지에 기능 설명과 3단계 작업 흐름을 추가한다.
- 개발 상태, 공개 배포 여부, 실제 QGIS Runtime 검증을 분리해 표시한다.
- 외부 개발 제품 목록과 상세 경로를 제거하고 QGIS 카탈로그 집계·그룹 수를 9개 기준으로 갱신한다.
- 18개 화면 이미지의 37개 인라인 참조를 24개 content-addressed 정적 파일로 외부화한다. 중복 이미지 payload는 한 번만 저장한다.
- 이미지에 `loading=lazy`, `decoding=async`, intrinsic width/height를 지정하고 이미지 확대는 동일 출처의 정적 자산을 연다.
- R28 전용 CSS·이미지 프리뷰·제품 설명 데이터는 `source/r28/`에 격리한다. R25 원본 조각과 R27 overlay는 변경하지 않는다.

## 빌드 및 QA

```bash
npm run build
node scripts/qa-portal.cjs
```

- `scripts/assemble-r28.cjs`는 R27 검증 빌드를 호출한 뒤 R28의 제품 설명·레이아웃·이미지 최적화를 적용한다.
- `source/r28/products.json`은 제품 카드·상세 소개·기능·작업 흐름·검증 주의사항의 단일 콘텐츠 원장이다.
- `public/assets/r28/`는 빌드 산출물이며 Git에 별도 저장하지 않는다. 파일명은 SHA-256 기반이다.
- QA는 34개 라우트, PC 16개, QGIS 9개, 25개 상세 작업흐름, 이미지 자산 로딩·확대, PC/모바일 반응형 및 기존 내비게이션 계약을 확인한다.
- QGIS Runtime이 실제로 실행되지 않은 제품은 NOT RUN으로 표시한다. 정적/모의 테스트를 실제 QGIS 실행 PASS로 바꾸어 표현하지 않는다.

## 배포

Cloudflare Workers Static Assets를 사용한다. `npm run deploy`는 `predeploy`에서 R28 빌드·검증을 수행한 뒤 기존 Worker에 배포한다. Cloudflare 인증 및 운영 배포 권한이 필요하다.

R28은 후보 브랜치에서 빌드와 QA를 통과한 뒤 PR을 통해 main 반영 및 운영 배포한다. 현재 운영 main과 R27 배포 버전은 이 후보 작업 중 변경하지 않는다. 다른 Sunrise 제품 저장소와 Worker는 변경하지 않는다.
