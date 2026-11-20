# Sunrise Group — 공식 홈페이지 R25

운영 Worker: `sunrise-group` · Production branch: `main`

- 운영 주소: https://sunrise-group.ko-pg.workers.dev
- 릴리즈: R25 (2026-11-20)
- 배포 파일: `public/index.html` (빌드 시 생성)
- 기준본: 11120080 bytes
- SHA-256: `aadf5a7f45b3575add06de90fc837e3142d3821f22f4a2b80c8ae0e4bee29aef`

## 빌드·배포

원본 HTML의 대용량 전송 제한 때문에 파일을 12개의 무손실 조각으로 저장한다. `npm run build`는 원본을 정확히 복원하고 크기·SHA-256·HTML 진입점을 검증한다. 원본 조각은 줄바꿈 변환을 금지한다. 생성된 `public/index.html`은 Git에 중복 저장하지 않는다.

Cloudflare Workers Static Assets. `npm run deploy` 실행 시 predeploy에서 복원·검증 후 기존 Cloudflare CLI로 배포한다. Cloudflare 인증과 배포 권한이 필요하다. main의 Git 연동 자동 빌드를 사용한다.

다음 버전은 원본 조각과 manifest를 함께 갱신하거나, 단일 HTML을 직접 저장하는 구조로 전환할 경우 빌드 스크립트와 .gitignore를 함께 갱신한다. 이전 버전은 Git 이력으로 복원할 수 있다. 기존 제품별 저장소 및 Worker는 변경하지 않는다.
