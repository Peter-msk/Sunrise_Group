# Sunrise Group R31 — 3차 보완: 25개 제품 상세 탐색 정밀감사

## 기준과 근거
- 기준본: R30 main (2026-11-21), Github Peter-msk/Sunrise_Group, Cloudflare Worker sg-portal-8e4c71b9.
- 확정 테마: A 시네마틱 브랜드, B 하이엔드 기술기업, D 공간정보 전문기술기업.
- R30 실제 HTML 감사에서 PC 16개·QGIS 9개 = 소유 제품 상세 25개를 확인함. 디자인 패밀리는 utility/document/workspace/web/cartography/catalog/relief/field의 8개 유형.
- 모든 상세 페이지는 <div class="r28-workflow" aria-label="작업 흐름">의 3단계 작업 흐름 콘텐츠를 제공하지만, 기존 상단 "제품 안내 바로가기"에는 해당 작업 흐름으로 직접 이동할 방법이 없었음.
- 기존 SPA 라우터는 #/projects/<route>#<anchor> 형태를 파싱한 후 실제 HTMLElement.scrollIntoView로 스크롤하는 구현을 보유함.

## 변경 계약
1. 기존 25개 제품 안내 메뉴에 "작업 흐름" 바로가기 하나를 추가하고 같은 페이지의 유일한 작업 흐름 블록에 id="workflow", tabindex="-1"을 지정.
2. 시각적 강조는 제품군 별 R30 domain color를 재사용하고 44px 이상 탐색 크기, 좁은 모바일에서 줄바꿈, :focus-visible, scroll-margin-top을 부여.
3. 페이지 내용과 제품 상태·배포 가이드·실제 스크린샷 구분·QGIS Runtime 검증 메타데이터를 변경하지 않음.
4. 이전 R25~R30 소스/빌더를 수정하지 않고 R31 전용 builder+CSS만 추가. 새 이미지, 런타임 JS, API·외부서비스 요청 없음.

## R31 검증 게이트
- npm build 결과 34개 페이지/25개 제품 상세/25개 카탈로그 링크, A+B+D 3축과 R30 PC/QGIS 수량 보존.
- 25개 모두 PC 1440px, 모바일 390px 실제 URL로 로드하고 제품 안내 메뉴의 "작업 흐름" 클릭 및 목표 요소의 viewport 도달을 확인.
- 44px 이상 탭 영역·가로 넘침·기본 JS 오류·8개 디자인 패밀리·스코프 CSS를 검증.
- 대표 4개 제품 × PC/모바일 8장의 실제 브라우저 전체 페이지 화면을 수집해 텍스트, 강조선, 작업흐름 탐색을 검토.
- 과거 R28/R29/R30 PASS의 전제품 버전·이미지 집계·연관 없는 34개 경로 전체 상호작용은 재실행하지 않고 서명된 근거를 재사용.

## 배포 및 경계
- R31 PR 검증 PASS·시각 증거 확인 전 운영 Worker 배포 금지.
- 운영 확인에는 Cloudflare 배포 성공 로그와 실제 주소에서 id=workflow / 25개 shortcut / 34 routes / 25 workflows를 확인.
- 다른 Sunrise 저장소, Worker, 제품별 실제 QGIS·Windows 런타임은 변경하지 않음.
