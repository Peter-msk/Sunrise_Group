# Sunrise Group WEB — R28 후보 변경 내역

기준: R27 운영본 · 2026-11-21 KST

## 콘텐츠·소유권

- PC 프로그램 16개 및 QGIS 플러그인 9개의 카드·상세 설명을 검증된 자료와 기존 제품 기준본에 맞춰 보완.
- 제품별 주요 기능, 입력·처리·산출 흐름을 구분.
- Drawing Editor 상세에 DXF·DWG 입력을 반영하고, DWG 외부 변환기(ODA File Converter 또는 DWG 지원 LibreCAD) 의존성을 명시.
- 개발 상태, 공개 배포 여부, 실제 QGIS Runtime 검증을 분리 표기.
- Sunrise EIASS는 운영기관의 공식 소프트웨어가 아닌 Sunrise Group 자체 개발 도구임을 상세에 명시.
- Sunrise Finder는 공개 Release v2.1.2와 개발 중지 상태를 분리 표기하며, 기존의 잘못된 공개 미정 문구를 교정.
- 제품 소유권이 확인되지 않은 QGIS 목록 항목과 상세 경로를 제거. 최종 카탈로그는 9개 플러그인으로 집계.

## 렌더링·정적 자산

- 36개 인라인 이미지 참조를 23개 SHA-256 기반 정적 자산으로 외부화.
- 중복 이미지 payload 제거.
- 경로별 첫 이미지 12개는 eager/high-priority, 보조 이미지 5개는 lazy loading. async decoding과 intrinsic dimensions 적용.
- 3D 태양계의 9개 행성 텍스처는 홈 장면이 viewport에 들어올 때만 로드하며, 다른 제품 페이지에서는 요청하지 않음.
- 확대 이미지는 same-origin 정적 자산만 열도록 제한.
- 해시 기반 이미지 자산에 1년 immutable cache 정책 적용.
- 기존 R25 원본 조각 및 R27 overlay는 불변으로 유지.

## 검증 경계

- 34개 route, PC 16개, QGIS 9개, 상세 workflow 25개를 대상으로 브라우저 QA.
- 이미지 자산 응답·확대, 메뉴·검색·내비게이션, 320~3840px 레이아웃 확인.
- 실제 QGIS 실행을 수행하지 않은 제품은 NOT RUN으로 표기.
- 후보 브랜치 QA와 운영 배포 검증은 별도 판정.
