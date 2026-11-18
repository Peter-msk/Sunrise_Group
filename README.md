# Sunrise_Group
Sunrise_Group

## 공식 웹사이트

- 운영 Worker: `sunrise-group`
- Production branch: `main`
- 배포 파일: `public/index.html` (제공된 HTML 원본과 동일)
- 기준본 SHA-256: `e3170390535c141b4ac632fc6c6417d0d559c566ee84cd5cd204d0b34a418198`

## 배포

Cloudflare Workers Static Assets 방식. 프로젝트 루트에서 별도 빌드 없이 `npm run deploy` 실행. Cloudflare 인증과 배포 권한이 필요하다. `main`의 Git 연동과 운영 배포 여부는 Cloudflare의 실제 빌드 및 배포 기록으로 확인한다.

## 검증

원본 HTML의 Git blob SHA 일치 및 정적 검사와 JavaScript 문법 검사를 확인했다. 실제 운영 URL, PC·모바일 브라우저 렌더링, 외부 링크 검증은 별도 수행한다. 기존 제품별 저장소 및 Worker는 변경하지 않는다.
