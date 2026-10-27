# 미담릴공장 광고 소재 보드

빌드 도구가 필요 없는 정적 웹사이트입니다. 실행: `python -m http.server 8765 --directory dist`.

## 소재 추가
1. 광고 원본을 `dist/assets/`에 추가합니다.
2. `dist/assets.json`의 기존 항목을 참고해 고유 id, brand, title, shortTitle, concept, industry, date(YYYY-MM-DD), image, keywords, description, copy, format, dimensions, palette를 기록합니다.
3. 제작일·업종·스타일을 확인합니다. 소재 개수·스타일/업종 필터·최신 제작일·총계는 목록에서 자동 계산됩니다.
4. 사이트 소스를 저장하고 Sites에 재배포합니다. 브라우저 업로드나 폴더 감시 기능은 없습니다.

## 검증
`node --check dist/app.js` 및 `node verify.mjs`.
배포 설정과 Site 식별자는 `.openai/hosting.json`에 보존합니다. 키·토큰은 저장하지 않습니다.

이미지를 제작하면 반드시 assets.json에 등록하고 원본과 메타데이터를 함께 배포해 스토리보드에 표시합니다. 보기 바로가기: `?view=mini` 또는 `?view=story`.

AI 모델 항목의 productName과 productImage를 입력하면 업체별 AI 모델 화면에서 해당 제품 원본 카드가 관련 모델들보다 먼저 표시됩니다. 같은 제품은 한 번만 표시하며, 원본 카드는 생성 결과 개수와 묶음 선택에 포함하지 않습니다.

## 묶음 다운로드
제작일을 선택하고 날짜별 전체 다운로드를 누르면 모든 카테고리의 해당 날짜 생성 원본을 ZIP으로 묶습니다. 이미지 체크박스 또는 현재 목록 전체 선택을 사용한 뒤 선택 다운로드를 누르면 체크한 원본만 포함합니다. 선택은 현재 브라우저 페이지에서 보기·필터 변경 시 유지되며 새로고침하면 초기화됩니다. 제품 참고 사진은 생성 결과 다운로드에 포함하지 않습니다.

ZIP 검증용 `node check-downloads.mjs`는 프로젝트 상위 폴더에 날짜/선택/한글명 시험 ZIP을 생성합니다. 실제 PNG 바이트를 변경하지 않는 저장 방식입니다.
