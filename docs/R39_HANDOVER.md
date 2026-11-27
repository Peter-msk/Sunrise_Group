# Sunrise Group(WEB) R39 최종 인수인계 및 운영 기록

- 기준일: 2026-11-27 (KST)
- 공식 주소: https://sunrise-group.ko-pg.workers.dev
- 저장소: https://github.com/Peter-msk/Sunrise_Group
- 운영 소스 기준 커밋: `50b998e00a4aee6d2e9d0b8a1e8f02ab7e0dccee`
- Parent baseline: `e0e9f3314f366a90e790126eb9acdba148de1308` (R38 주소 동기화)
- R39 PR: https://github.com/Peter-msk/Sunrise_Group/pull/14
- CI run: https://github.com/Peter-msk/Sunrise_Group/actions/runs/45923796024 — success
- Cloudflare Worker: `sunrise-group`, version 14, version ID `1cfcc46c-401c-4422-ba44-600859d1f5e4`, deployment `835ed796-81e7-49c2-95c8-2640f5a15b`, 100% traffic.
- 이전 복구 버전: 13, `c29d1f99-2ec2-4b80-b57e-e325e7f22de4`.

## 변경 및 검증

R38의 Worker 이름을 기존 ID에서 변경하고 R39에서 주소 추적 매개변수를 제거했다. UTM 9개 키만 제거하며 다른 query, hash route, history state를 유지한다. R38 원본, 정적 자산, UI/UX 및 제품 소개 정책은 보존한다. 실제 운영 HTML은 R38 자산을 상속한 Worker의 HTMLRewriter로 추적값이 있는 루트 요청에 동일 스크립트를 삽입한다. 소스 빌드에서는 head에 동일 스크립트를 포함한다. 이 두 경로의 배포 형태는 다르며 전체 산출물 바이트 동일성은 주장하지 않는다.

| Gate | 결과 |
|---|---|
| R39 URL 단위시험 | 8/8 PASS |
| GitHub candidate QA (R38 그래픽, fallback, responsive) | PASS |
| 신규 운영 URL PC | PASS: UTM 없음 |
| 모바일 제품 경로 | PASS: mode=demo 및 #/programs 유지, UTM 제거 |
| 운영 HTML route / workflow | 34 / 25 확인 |
| Cloudflare traffic | version 14 100% |
| 기타 제품 변경 | 없음 |

## 재현 및 유지보수

1. GitHub main 또는 위 기준 커밋에서 소스를 확보한다. R25 원본 조각 및 R27~R38 overlay는 임의 수정하지 않는다.
2. Windows CMD 또는 지원 Node 환경에서 `npm run build`, `node scripts/qa-r39-url.cjs`를 실행한다. 브라우저 회귀는 기존 candidate QA에서 수행한다.
3. 실제 배포가 필요한 변경만 `npm run deploy`로 실행한다. Cloudflare 인증과 동일 계정의 Worker 권한이 필요하다. 기존 주소와 배포 대상 이름을 변경하지 않는다.
4. 배포 후 UTM 포함 루트와 일반 query/hash가 포함된 제품 경로를 실접속 검사하고 기존 디자인/자산을 확인한다. 운영 version 13으로 rollback 가능 여부는 Cloudflare Versions에서 확인한다. 복구 후 R39 URL 기능은 사라진다.
5. GitHub에는 생성 HTML 및 파생 자산을 커밋하지 않는다. 소스와 문서만 관리한다. 인증 토큰 및 개인 설정은 포함하지 않는다.

## 종료 범위

이번 작업은 R39 운영 안정화와 자료 보관이다. 추가 기능, 제품별 웹서비스 및 도메인 구매는 대상이 아니다. 향후 개발은 R39의 main 및 최종 보관본에서 시작한다. 이번 종료 작업으로 운영 Worker를 다시 배포하지 않는다. 보관 파일의 실제 업로드/검증은 별도 결과로 기록한다.
