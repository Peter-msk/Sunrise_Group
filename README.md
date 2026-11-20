# Sunrise Group — 공식 홈페이지 R27

운영 Worker: `sg-portal-8e4c71b9` · Production branch: `main`

- 운영 주소: https://sg-portal-8e4c71b9.ko-pg.workers.dev
- 릴리즈: R27 세부 UI 개선 (2026-11-20) · HTML 원본 기준본 R25 유지
- 배포 파일: `public/index.html` (빌드 시 생성)
- 기준본: 11120080 bytes
- SHA-256: `aadf5a7f45b3575add06de90fc837e3142d3821f22f4a2b80c8ae0e4bee29aef`

## 빌드·배포

원본 HTML의 대용량 전송 제한 때문에 파일을 12개의 무손실 조각으로 저장한다. `npm run build`는 원본을 정확히 복원하고 크기·SHA-256·HTML 진입점을 검증한다. 원본 조각은 줄바꿈 변환을 금지한다. 생성된 `public/index.html`은 Git에 중복 저장하지 않는다.

Cloudflare Workers Static Assets. `npm run deploy` 실행 시 predeploy에서 복원·검증 후 기존 Cloudflare CLI로 배포한다. Cloudflare 인증과 배포 권한이 필요하다. main의 Git 연동 자동 빌드를 사용한다.

다음 버전은 원본 조각과 manifest를 함께 갱신하거나, 단일 HTML을 직접 저장하는 구조로 전환할 경우 빌드 스크립트와 .gitignore를 함께 갱신한다. 이전 버전은 Git 이력으로 복원할 수 있다. 기존 제품별 저장소 및 Worker는 변경하지 않는다.

## R26 배포 안전 계약

`cloudflare.config.ts`에서 운영 Worker 이름과 previewUrls=false를 고정한다. 기존 폐기 Worker는 재생성하지 않는다. `public/_headers`는 검색 색인 억제와 외부 Referrer 전달 방지를 설정한다. 이 설정은 인증이나 접근 통제를 대체하지 않는다. 비공개 저장소와 Cloudflare Git 연동 권한을 유지한다. R25 HTML 원본 조각 및 무결성 기준은 변경하지 않는다.

## R27 UI 변경

R25 원본 12개 조각의 크기·SHA-256 검증 후 `scripts/assemble-r27.cjs`에서 검증된 표식만 수정한다. 35개 페이지 경로를 유지한다. 태양계 조작 버튼, 모바일 터치 선택 모드, 스크롤 충돌 방지, 메뉴·카드·검색·다운로드 버튼 마감, 비공개 다운로드 7개 안내를 개선한다. 공개 배포용 설치 파일은 별도 배포 정책 확정 전까지 비공개 저장소 권한을 요구한다. 생성 HTML의 SHA-256은 빌드 로그에서 확인한다. 검색 색인 억제는 접근 통제를 대체하지 않는다.
