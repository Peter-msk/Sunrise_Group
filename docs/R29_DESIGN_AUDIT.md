# Sunrise Group R29 — A+B+D 디자인 계약 보완

## 운영 기준 및 결함 확인
- 확정 디자인 방향: A 시네마틱 현대미술형 + B 하이엔드 기술기업형 + D 공간정보 전문 기술기업형의 복합 적용.
- 운영 기준: R28, Cloudflare Workers Static Assets, 브랜치 main.
- 메인 첫 화면은 R19 시네마틱 태양계 중심이었으나 PC 기술형·GIS 공간정보형을 연결하는 독립 진입 화면이 부족.
- PC 프로그램 화면의 QGIS 탭은 10개로 표기되어 실제 소유 QGIS 카탈로그 9개와 불일치.

## R29 구현
- 기존 태양계, 스크롤 동작, 그룹 철학, PC 16개 및 QGIS 9개 제품과 상세 25개를 변경하지 않음.
- 홈 시네마틱 영역 하단에 3분야 진입 블록 설치: 01 그룹 소개(A), 02 PC·웹 프로그램(B), 03 GIS·QGIS(D).
- A 궤도 / B 소프트웨어 인터페이스 / D 등고선 그래픽을 CSS로 구현하며 새로운 영상·이미지·JS 다운로드 없음.
- PC·QGIS 카탈로그 제목 아래 분야별 정체성 안내 라벨을 추가하며 공통 브랜드 타이포그래피는 유지.
- PC 카탈로그의 오래된 QGIS 10 표기를 9로 수정하고 양쪽 메뉴 총계 일치.
- 넓은 화면 3열, 태블릿 2열(브랜드 강조), 모바일 1열. 키보드 focus 및 reduced-motion 적용.

## 코드 보존 범위
- source/r25, source/r27, source/r28, scripts/assemble-r25.cjs, scripts/assemble-r27.cjs, scripts/assemble-r28.cjs 변경 없음.
- R29 전용 추가물: scripts/assemble-r29.cjs, scripts/qa-r29-design.cjs, source/r29/polish.css.
- R29 빌더는 기존 R28 빌드를 호출한 뒤 해당 페이지 3개와 R29 전용 스타일만 추가함.
- QA는 7개 viewport에서 3테마 컨테이너 수평 넘침과 카드 경계를 확인하고, PC/모바일 6개 실제 이동과 두 카탈로그의 숫자 정합성을 확인.
- R28에서 기존 PASS로 확인한 제품 25개와 정적 자산 체계는 변경하지 않으므로 전체 구간의 중복 검증 대신 변경영향 QA를 수행.

## 게이트 및 배포
- 후보 브랜치의 R29 빌드 및 Chromium QA 성공, 시각 증거 확인, 사용자에게 결과 보고 후 본 운영 브랜치 main과 기존 단일 Worker만 배포 대상으로 사용.
- 테스트 성공 전이나 실제 Worker 배포 확인 전에는 운영 적용 완료를 선언하지 않는다.
- 다른 Sunrise GitHub 저장소, Cloudflare Worker 및 제품별 런타임은 변경하지 않는다.
