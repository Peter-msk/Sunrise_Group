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

## 최신 공식 릴리즈 확인 (2026-11-20 KST)

아래는 각 제품 저장소의 GitHub Latest Release 조회 결과이며, 개발 중 버전이나 설치 검증 완료를 뜻하지 않는다. 비공개 저장소는 로그인과 접근 권한이 필요하다.

| 제품 | 공식 릴리즈 태그 | 릴리즈 |
|---|---|---|
| Sunrise Capture | v4.2.2 | [GitHub](https://github.com/Peter-msk/Sunrise_capture/releases/tag/v4.2.2) |
| Sunrise PDF Editor | v4.6.3 | [GitHub](https://github.com/Peter-msk/Sunrise-PDF-Editor/releases/tag/v4.6.3) |
| Sunrise Cleaner | v3.7.7 | [GitHub](https://github.com/Peter-msk/Sunrise-Cleaner/releases/tag/v3.7.7) |
| Sunrise PDF PRO | v2.7.1 | [GitHub](https://github.com/Peter-msk/Sunrise_PDF-PRO/releases/tag/v2.7.1) |
| Sunrise Finder | v2.1.2 | [GitHub](https://github.com/Peter-msk/Sunrise_Finder/releases/tag/v2.1.2) |
| Sunrise EIASS | v4.7.0 | [GitHub](https://github.com/Peter-msk/Sunrise-EIASS/releases/tag/v4.7.0) |
| Sunrise Image | Sunrise_Image | [GitHub](https://github.com/Peter-msk/Sunrise-Image/releases/tag/Sunrise_Image) |
| Sunrise File Manager | v1.8.2 | [GitHub](https://github.com/Peter-msk/Sunrise-File-Manager/releases/tag/v1.8.2) |
| Sunrise Drawing Editor | v1.1.0 | [GitHub](https://github.com/Peter-msk/Sunrise_Drawing_Editor/releases/tag/v1.1.0) |

Sunrise Control, PDF Editor Web, PDF PRO Web, EIA Data Hub는 Latest Release 확인 불가로 버전을 추정하지 않는다.

## 추가 UI 마감

R27의 기존 원본과 경로를 유지하며 좁은 화면의 버튼 배치, 장문 줄바꿈, 검색 입력 폭, 키보드 포커스 및 모션 감소 설정을 보완한다. 실제 브라우저 시각 검증과 운영 배포 확인은 별도 수행 대상이다.

## 제품 페이지 최신화 (2026-11-20 KST)

- File Manager: 상세 및 목록 v1.8.0 → v1.8.2, 공식 설치 파일 주소 교체.
- Drawing Editor: v1.1.0 및 공식 EXE 링크 추가, 기존 실행 파일 미제공 안내 수정.
- 기존 7개 비공개 다운로드 안내에 Drawing Editor 1개를 추가하여 총 8개로 검증한다. 계정 및 저장소 접근 권한 요구는 유지한다. Finder의 기존 개발 중지·종료 표기는 변경하지 않는다.
- R25 원본, 35개 경로, Cloudflare 설정과 나머지 제품 다운로드 주소 유지. 빌드 스크립트는 경로별 정확한 기존 표식 및 링크 개수를 검증하고 불일치 시 중단한다.
- 부분 원본으로 변경 로직과 실패 차단을 검증했고, 커밋된 빌드 스크립트의 JavaScript 구문 검사를 통과했다. 전체 원본 복원 빌드·브라우저 시각검증·운영 배포는 아직 수행하지 않았다.

## 3차 상세 보완 — 내비게이션 및 전체 데이터 검증 (2026-11-20 KST)

- 이전 기준 커밋 `bf65935`: Base64로 R25 12개 원본 조각을 무손실 복원했다. 11,120,080 bytes 및 manifest SHA-256 일치 확인. JavaScript 호환 실행 환경에서 해당 커밋의 R27 오버레이를 실행했다. 결과 11,126,330 bytes / SHA-256 `b4436001b86565f8756a2cae2734f5b569a9f8fec6b3d9db0a9a693df343edc5`. 35개 route, 224개 정적 hash 링크와 앵커, 8개 비공개 배포 안내, 3개 인라인 JS 구문 검사 통과.
- 후속 내비게이션 커밋 `5fbc2fd`: 동일 hash 링크 재선택 시 실제 이동 재실행, 예약된 앵커 이동이 현재 hash/route와 다르면 폐기, 모바일 메뉴 외부 클릭 및 데스크톱 전환 시 닫힘. Ctrl/Shift 등 수정키 클릭의 기본 동작은 보존한다.
- 후속 수정의 원본 표식 4개 및 JS 구문 검사와 render 모의 테스트 3개 통과. 실제 Node.js 빌드 및 실제 브라우저 클릭·시각검증은 아직 미수행. 앞서 기록한 생성 HTML SHA-256은 이전 기준 커밋의 결과로만 사용한다.
- 운영 main 및 Cloudflare 배포 설정은 유지. 실제 브라우저/운영 배포 검증 전까지 Draft PR 유지.

## 5차 보완 — 제품 목록 검색 (2026-11-20 KST)
- PC 16개 / QGIS 10개 기존 제품 상태 유지, 검색어 NFKC 정규화 및 제품명 공백 생략 검색, 상태별 검색, 명시적 초기화 및 입력 포커스 복원, 수정키 클릭 보존.
- R25 기준본은 수정하지 않고 R27 빌드 시 검색 함수 및 두 입력창에만 정확한 표식 기반 패치 적용. 초기화 버튼 CSS는 해당 검색 행에 한정.
- Chromium 144 실제 브라우저에서 26개 제품의 이름·버전·상태로 구성한 축소 fixture를 사용하여 320/390/1440px 검색·초기화·분류 조작 66개 시험 통과. 전체 사이트 레이아웃 또는 실제 홈페이지 완전 빌드 성공으로 해석하지 않는다.
- 기존 CI는 실행 단계 0개 상태에서 실패. 로컬 환경에는 Node.js/Chromium이 있으나 private raw GitHub 호스트 DNS 접근 불가. 전체 실빌드 및 운영 배포는 보류.
