# 미담릴공장 · AI 광고 / 모델 이미지

노트북 작업을 집 컴퓨터에서 이어갈 수 있도록 이미지, 레퍼런스, 프롬프트, 작업 이력과 웹 보드를 함께 보관한 프로젝트입니다.

**생성 결과 15장:** EBC 광고 9장 + 안경 모델 4장 + 경추베개 모델 2장.

## 집에서 열기
1. GitHub에서 **Code → Download ZIP**으로 내려받아 압축을 풉니다. 또는 `git clone https://github.com/uncheon0912/Ai_ad_modelimage.git`을 실행합니다.
2. **START_BOARD.cmd**를 더블클릭합니다. Node.js 또는 Python 3 중 하나가 컴퓨터에서 실행 가능해야 합니다. 추가 패키지 설치는 없습니다.
3. 브라우저에서 **http://127.0.0.1:8765**를 엽니다. 실행 창은 보드를 사용하는 동안 열어 둡니다.
4. AI 모델 화면: **http://127.0.0.1:8765/?category=ai-models&view=mini**.

직접 실행할 수도 있습니다.

```powershell
node serve-board.mjs
```

또는 프로젝트 최상위 폴더에서:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory midam-ad-board/dist
```

HTML 파일을 더블클릭하기보다 위 서버로 여세요. 이미지 목록을 불러오는 기능과 ZIP 다운로드가 서버 주소를 사용합니다.

## Codex에서 새 이미지 만들기
집 컴퓨터의 Codex에서 **이 저장소 최상위 폴더**를 프로젝트로 열고 새 채팅을 시작합니다. 이미지 생성 도구 사용이 가능한 환경에서 다음과 같이 요청하세요.

> AGENTS.md와 HANDOFF.md를 읽고 이 프로젝트를 이어서 작업해줘. 첨부 제품으로 대한민국 30대 여성 모델 1명을 일상 아이폰 실사 스타일로 만들고, 업체별 AI 모델 스토리보드에 제품 원본과 함께 등록해줘.

완성 이미지는 그대로 가져온 파일입니다. 새 이미지 생성은 온라인 Codex 이미지 생성 도구로 수행하며, 웹 보드 자체에 생성 API가 들어 있지는 않습니다. 계정 로그인과 도구/플러그인 연결은 집 컴퓨터에서도 확인해야 합니다.

## 포함 내용
| 폴더 | 내용 |
|---|---|
| midam-ad-board | 웹 코드, 등록 이미지, 날짜/선택 ZIP 다운로드, 제품별 비교 |
| ad_image | EBC 광고 원본, 프롬프트, 메타데이터, History |
| ai_models | 안경·베개 모델, 상품/자세 참조, 아이폰 프롬프트, 모델 조건 |
| references | 추가 광고/인물 참고 자료 |
| History | 배포 이력, 화면 기록, 이전 웹 소스 Git bundle |

아이폰 실사 기준: [사용자 지정 프롬프트](midam-ad-board/docs/iphone-daily-prompt.md). 작업 재개: [HANDOFF.md](HANDOFF.md).

## 확인과 동기화
`python verify-transfer.py`는 포함 파일의 SHA-256과 웹 이미지 참조를 검사합니다. Git clone을 사용했다면 다른 컴퓨터의 변경은 `git pull`로 받으세요. Download ZIP을 사용했다면 갱신본을 다시 내려받아야 합니다.

기존 배포 주소: https://midam-creative-board.inbyeol.chatgpt.site/?category=ai-models&view=mini . 이 주소는 소유자 계정 로그인이 필요합니다. GitHub 업로드와 Sites 배포는 별도입니다. `.openai/hosting.json`은 기존 사이트 식별자를 보존하며 인증 키를 포함하지 않습니다.
