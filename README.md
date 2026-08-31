# SINS Claude & Codex & Hermes & Grok 스킬 패키지

SINS 프로젝트용 Claude Code, Codex, Hermes, Grok 스킬 패키지입니다.

---

📧 Mail : [project@capstone.id](mailto:project@capstone.id)

🤳 Instagram : [instagram.com/id.capstone](https://www.instagram.com/id.capstone)

🌐 Homepage : [capstone.id](https://www.capstone.id)

🧵 Threads : [threads.com/@id.capstone](https://www.threads.com/@id.capstone)

▶️ YouTube : [youtube.com/@실무자](https://www.youtube.com/@실무자)

---

## 포함된 스킬

| 파일 | 명령어 | 설명 |
|------|--------|------|
| `sins-card-news-creator.skill` | `/sins-card-news-creator` | 인스타그램 카드뉴스 **카드 JSON TXT**, 캡션 TXT, 이미지 프롬프트 TXT 제작 (**HTML 파일은 만들지 않음** — 카드 데이터를 11필드 고정 스키마 JSON 배열로 `.txt` 저장 + 응답에도 코드블록 출력, 실제 렌더는 Figma 플러그인 `figma_plugin_sins` 담당). 한글 `title`·`body`·캡션은 작성 전 `/sins-fluent-korean` 로드, 확정 후 `/humanize-korean` 윤문 |
| `sins-marketing-team.skill` | `/sins-marketing-team` | 마케팅 전략 팀 구성 및 실행 |
| `sins-sidenote-pass.skill` | `/sins-sidenote-pass` | SideNotes 고정 폴더에 새 메모 저장 및 기본 접기 처리 |
| `sins-video-consource.skill` | `/sins-video-consource` | 대본(또는 오디오·영상·PPTX)을 입력받아 **제작 모드 3종 중 하나를 먼저 고르고** 결과물을 만드는 7인 팀 워크플로우 — 옵션1 **스크립트만**(TXT 대본) / 옵션2 **영상 자동 제작** / 옵션3 **스크립트+HTML**(기본값). **[옵션2 영상]** `/hyperframes`로 롱폼 2560×1440(2K, 자막 없음)과 숏폼 1080×1920 2편(서로 다른 챕터·서로 다른 주장, 각 90초 이내, 전사 자막 필수)을 제작. 제작 착수 전 **배경 계열**(그리드·대리석·페이퍼·기타)과 **컬러 계획**(60 배경 / 30 글자 / 10 포인트)을 질문으로 확정한다. 답이 없으면 **에디토리얼 골드**(`#0B0D10` / `#EDEAE4` / `#C9A66B`). 나열 씬은 **기준 화면** 밀도(아이콘 + 제목 폰트 키워드 + 보조 한 줄 + 2px 미니바, 비활성 opacity **.72**, 1px 테두리 없음, 라벨 `KEY + SHEET NN / DIVISION`). 숏폼은 릴스·쇼츠 UI **데드존을 실측 회피**(안전영역 y 228~1347, y 983 아래 우측 182px 잠식, 업로드 확대 대비 좌우 120px) — 본문은 화면 중앙보다 위, 자막은 안전영역 최하단에 화면 가로 중앙·1줄·17자 이내(`/sins-yt-subtitles` 기준). 씬은 **대본 → 그림 결정 → 문구** 순서로 설계하고 **그래픽은 유지하고 보조 텍스트를 붙인다**(아이콘·차트 유지, 항목마다 하단 키워드 2~6자 + 보조 한 줄 18~32자). 키워드만 있는 블록은 가로·세로 중앙. 아이콘은 Koboyo, 로고는 logos.lndev.me(없으면 텍스트), 정지 인포그래픽은 `/baoyu-infographic`. **스택 형태 11종**(`cards` / `compare` / `flow` / `contain` / `bigstat` / `metaphor` / `chart` / `gauge` / `pictogrid` / `timeline` / `wordfill`)에서 골라 **같은 형태 3연속 금지·한 편 4종 이상·cards 3씬 이하**. 영상 셀은 **1px 테두리 없음**(강조는 밝기·색·글로우). 그리드 배경 선은 텍스트색 **4%/7%**. contain 안쪽 키워드는 큰 타이포, 핵심 주장은 **`wordfill` 네온 키워드**. 픽토그램은 팝 뒤 **아이들 회전**. **제목 위계 3단**(XL 116px 1줄 / 기본 88px / SM 72px), 등장은 기본값이고 강조 모션은 씬당 2종·한 편 4종 이상. 마지막 약 2초는 그라디언트가 페이드인되며 유튜브·인스타그램 채널 안내 3줄이 순차 등장하고, 그 아래 작은 글씨로 `본 영상을 유튜브로 보셨다면 전체 영상을 관련 동영상을 통해 시청할 수 있습니다.` 주석 1줄이 붙는 **CTA 고정**(설명란·고정댓글 문안 동반 납품). `scripts/verify-frame.js`로 슬롯·데드존·넘침·줄 수·편 번호 노출을 실측해 **violations 0**이어야 통과하고, 검증기가 못 잡는 하이라이트 상태·형태 다양성·CTA 순차 등장은 렌더한 mp4에서 따로 확인. **[옵션3 웹PT]** 1920×1080 고정 스테이지 + 전 슬라이드 동일 좌표 마스터 프레임(챕터·제목·부제·본문·페이지수), 제목은 **결론 문장**, 차트 50% 이상·수치 100% 시각화, Lazyweb MCP 레퍼런스 기반 디자인, **키보드 전용 전환**(클릭·드래그 금지). 전 모드 공통으로 폰트는 제목 국민대해공체 400(**볼드 절대 금지**) + 본문 Presentation 300, 컬러는 60-30-10, 한글은 `/humanize-korean` 윤문 후 마침표마다 줄바꿈 |
| `sins-wiki-pass.skill` | `/sins-wiki-pass` | Notion 위키 DB(`LLM Wiki Index`)에만 저장 (옵시디언 쓰기 없음, 수동 발동, 타입 6종 + 카테고리 8종 고정 선택, 제목에 `영상 - `·`프롬프트 - ` 등 종류 프리픽스 자동) |
| `sins-llmwiki-auto.skill` | `/sins-llmwiki-auto` | 질문·답변·업무·제작 내용을 **자동으로** LLM 위키에 정리·기록하는 상시 발동 정책 (sins-wiki-pass 연동) |
| `sins-loopass-setup.skill` | `/sins-loopass-setup` | 루프 엔지니어링(자율 AI 에이전트 루프)을 6단계 인터뷰로 설계·세팅하는 위저드 (트리거→행동→검증→정지조건→아키텍처→산출, 단계별 스킬·MCP 추천 + 실행 가능한 루프 스킬 자동 생성) |
| `sins-higgsfield.skill` | `/sins-higgsfield` | 힉스필드(Higgsfield) MCP로 이미지·영상을 9스텝 선택카드로 단계별 생성 (유형→참고이미지→프롬프트→보강→모델/Soul 캐릭터→화면비→퀄리티→영상 길이·오디오→갯수→get_cost 비용확인→확정, 하네스 없는 순수 위저드) |
| `sins-contents-thumbstyle-prompt.skill` | `/sins-contents-thumbstyle-prompt` | 입력 내용에 맞춰 SINSRA 썸네일 제작. **시작 직후 제작 범위를 무조건 질문한다 — 가로형만(16:9 3장) / 숏폼 포함 전체(16:9 3장 + 세로형 9:16 2장 = 5장). 사용자가 장수·비율을 미리 말했어도, 재실행·이어하기여도 카드는 반드시 띄운다**(오브제는 모두 다르게). 스타일 3종 택1(A 블루 시네마틱 / B SINSRA 오렌지 네온 두들 #FF5E00 / C 귀여운 파스텔 3D 카와이), 배경은 힉스필드로 생성하고 **한글 2단 카피(리드+펀치라인)는 지정 웹폰트(Cafe24ProSlim·KblJump)로 HTML/CSS 오버레이 합성해 1280×720 캡처**(AI가 한글을 못 그리므로), 세로형 2장은 **1080×1920에 Presentation 9Black 타이틀을 레퍼런스 좌표로 HTML 오버레이** (내용 입력→**제작 범위 질문(스킵 금지)**→스타일 선택→오브제 배정/변경(가로형만 3개·전체 5개)→2단 카피 자동생성·확인(16:9)+9:16 타이틀 확인→폰트(16:9만)→강조·씨메 컬러(추천 팔레트)→모델 선택(GPT Image 2 최우선)→퀄리티·해상도(모델별 실제 옵션, 1k/low 최저)→get_cost 비용확인(범위 장수 기준)→N장 생성). 가로형만으로 뽑았으면 후속 메뉴에 **세로형 2장 추가 생성** 옵션이 붙는다 |
| `sins-yt-subtitles.skill` | `/sins-yt-subtitles` | SBV 자막을 유튜브용 VTT로 변환 (무조건 1줄·한 줄 목표 15자(공백 제외·단어 안 쪼갬)·마침표에서 자막 분리·쉼표에서 끊기 선호·가독성 우선, `[음악]`·`[박수]` 등 대괄호 효과음 태그·아웃트로(`오늘 영상은 여기까지입니다`~끝)·문장 첫머리 추임새(`자`) 자동 삭제, /humanize-korean 으로 오탈자만 2회 검수해 음성 싱크 보존, 결정론적 재분할 + difflib 재타이밍 + 최소 표시시간 보장) |
| `sins-lenis.skill` | `/sins-lenis` | HTML `</head>` 직전에 Lenis 부드러운 스크롤 스니펫(CSS·JS·`new Lenis({ autoRaf: true })`) 삽입, 이미 있으면 중복 삽입 없이 알림 (unpkg CDN·버전 1.3.23 핀 고정) |
| `sins-fluent-korean.skill` | `/sins-fluent-korean` | 한국어 응답에서 조사·어미를 생략하지 않고 문장을 서술어로 완성하게 하여, 전보체 기계 한국어를 막는 문체 지침. 코드·주석·인용문은 제외. 원문 MIT: snflkd/fluent-korean |
| `sins-palmierpro-cutedit.skill` | `/sins-palmierpro-cutedit` | PalmierPro MCP로 **현재 열려있는 프로젝트 타임라인을 직접 읽고 컷편집**. **단어를 지우는 게 아니라 말을 다듬는 작업**이므로 모든 삭제는 문장·문단 맥락 판정(룰 H)을 통과해야 한다 — 판단 단위는 단어/문장/문단 세 겹, 확정 전 **컷 후 남을 문장을 실제로 읽어 성분 결손·지시 대상·접속 대상을 검증**, 지시어(`이`·`이러한`)·접속사(`그래서`·`다만`)·열거 번호(`두번째는`)가 앞을 붙잡고 있으면 반복이라도 보류, **5초 이상 구간을 지운 뒤엔 문맥 재판정**(큰 컷은 뒷문장을 고아로 만들거나 없던 중복을 만든다), 문단 여는 담화표지(`자`·`그럼`·`마지막으로`)는 군소리가 아니라 구조 표지라 유지. 무음 삭제는 **완료 기준 4개**(실무음 0.6초↑ 0곳 · 타임라인 갭 0 · 무발화 클립 0 · 10프레임 미만 파편 0)를 충족할 때까지 문턱을 1.0→0.6→0.35→0.25초로 낮춰가며 **최대 5회 루프**, 여백은 0.15초로 두어 모든 공백에 0.30초 호흡을 남긴다. **반복·버벅임 판정은 반드시 편집 전 베이스라인 기준**(룰 G) — ASR이 반복 테이크를 클립 경계에서 병합·오라벨링해서 편집 후 트랜스크립트에는 반복이 **사라져 보인다**. 트랜스크립트에 안 잡히는 버벅임은 **간격 이상 스캔**(G-2)으로 찾고 **베이스라인 프레임 역산**(G-3) + `ripple_delete_ranges`로 처리. 단어 룰은 인덱스로 모아 `remove_words` **한 번에** 반영, `cutAggressiveness`는 **`balanced` 기본** (`tight`는 앞 단어 끝음절을 먹는다 — 잘리면 `set_clip_properties` + `move_clips`로 복구). 승인 표에는 **`컷 후 남을 문장` 열을 반드시 병기**하고 확정/추정 표를 분리 |
| `sins-mycontentsmake.skill` | `/sins-mycontentsmake` | 유튜브 영상 콘텐츠 자산(썸네일 프롬프트·제목·스크립트·영상설명/캡션/태그·썸네일이미지·카드뉴스)을 한 번에 제작해 노션 하위 **6페이지**로 발행하는 통합 워크플로우 (작업 전 노션 부모 링크 강제 확보→6페이지 생성(번호 이모지=아이콘)→스크립트 먼저 작성 후 나머지 병렬 팬아웃→최종 글 검수는 `/humanize-korean`). **슬라이드 페이지는 생성하지 않음**. **제목 12–20자, 썸네일 제목 6–12자**. **카드뉴스(6)는 빈 페이지+빈 코드블럭만 생성**(하위 스킬 자동 호출 안 함). **해시태그·키워드 태그 생성 금지** |

## 함께 설치되는 외부 오픈소스 스킬

한 줄 설치와 수동 설치는 SINS 스킬 설치 후 아래 외부 스킬도 같이 설치합니다. (Hermes 대상은 gstack·superpowers·caveman 등을 자체 번들로 이미 제공하므로 외부 스킬 설치를 건너뛰고 SINS 스킬만 설치합니다.) Grok은 Claude와 `SKILL.md` 프론트매터 규격이 같아 스킬을 그대로 복사해 씁니다.

| 이름 | 대상 | 출처 |
|------|------|------|
| Caveman | Claude / Grok | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) |
| Frontend Slides | Claude 전용 | [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) |
| Grill Me | Claude 전용 | [mattpocock/skills](https://github.com/mattpocock/skills) |
| Handoff | Claude 전용 | [mattpocock/skills](https://github.com/mattpocock/skills) |
| Harness | Claude 전용 | [revfactory/harness](https://github.com/revfactory/harness) |
| UI/UX Pro Max | Claude 전용 | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) |
| HyperFrames | Claude / Codex / Grok | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) |
| gstack | Claude / Codex / Grok | [garrytan/gstack](https://github.com/garrytan/gstack) |
| Superpowers | Claude / Codex / Grok | [obra/superpowers](https://github.com/obra/superpowers) |
| Ponytail | Claude / Codex / Grok | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) |
| Humanize Korean | Claude / Codex / Grok | [epoko77-ai/im-not-ai](https://github.com/epoko77-ai/im-not-ai) |
| Emil Kowalski Skills | Claude / Codex / Grok | [emilkowalski/skills](https://github.com/emilkowalski/skills) |
| Insane Search | Codex 전용 | [sinmb79/codex-insane-search](https://github.com/sinmb79/codex-insane-search) |
| Insane Search | Claude 전용 | [fivetaku/insane-search](https://github.com/fivetaku/insane-search) |
| oh-my-design | Claude / Codex | [kwakseongjae/oh-my-design](https://github.com/kwakseongjae/oh-my-design) |
| Fluent Korean | Claude 전용 | [snflkd/fluent-korean](https://github.com/snflkd/fluent-korean) |

> **oh-my-design 채널 차이** — 286개 실제 기업 디자인 레퍼런스 기반 디자인 시스템 스킬 17개 + 서브에이전트 16개. 자체 `oh-my-design-cli` npx 설치를 사용하며 Claude·Codex 채널을 따로 설치합니다. Claude는 `--agent claude-code`로 스킬 `~/.claude/skills`, 에이전트 `~/.claude/agents`, 데이터 `~/.claude/data`에 설치하고, Codex는 `--agent codex`로 스킬 `~/.agents/skills`, 에이전트 `~/.codex/agents`, 데이터 `~/.codex/data`에 설치합니다(각 도구의 정규 경로). `npx`(Node.js)가 필요하며 없으면 자동으로 건너뜁니다. 건너뛰려면 `SINS_SKIP_OMD=1`. Hermes·Grok는 `oh-my-design-cli` 채널이 없어 대상에서 제외됩니다.

> **Ponytail 설치 범위** — YAGNI·표준 라이브러리 우선·최소 구현을 강제하는 "게으른 시니어 개발자" 모드. 번들은 슬래시 명령 스킬 6개(`ponytail`·`ponytail-audit`·`ponytail-help`·`ponytail-review`·`ponytail-gain`·`ponytail-debt`)만 `skills/`에서 복사합니다. **상시 발동(always-on) 라이프사이클 훅은 번들로 연결되지 않습니다** — 매 프롬프트 자동 활성화가 필요하면 정규 플러그인 설치를 쓰세요. Claude `/plugin marketplace add DietrichGebert/ponytail` → `/plugin install ponytail@ponytail`(두 프롬프트로 분리 실행), Codex `codex plugin marketplace add DietrichGebert/ponytail`, Grok `grok plugin marketplace add DietrichGebert/ponytail`. 훅 실행에는 `node`가 PATH에 있어야 합니다. Hermes는 대상에서 제외됩니다.

> **Emil Kowalski Skills** — UI 애니메이션·모션·디자인 엔지니어링 스킬 5개(`animation-vocabulary`·`apple-design`·`emil-design-eng`·`improve-animations`·`review-animations`). Vaul·Sonner 제작자 Emil Kowalski의 UI 폴리시·애니메이션 철학을 담은 스킬로, `skills/`에서 그대로 복사합니다. Hermes는 대상에서 제외됩니다.

> **Fluent Korean 설치 형태** — 스킬이 아니라 Claude Code의 **output-style**입니다. `~/.claude/output-styles/` 에 `fluent-korean.md`(코딩 지침 유지판)와 `fluent-korean-not-coding.md`(코딩 지침 미유지판) 2종을 복사하며, 설치한 뒤 `/output-style` 에서 골라 켭니다. 조사와 어미의 생략을 금지하고, 명사구로 문장을 끝내지 못하게 하며, 비유적 어휘와 엠대시(—)를 자제시켜 한국어 응답의 의미를 명확하게 만듭니다. 코드·주석·변수명·커밋 메시지·로그 문자열·인용문은 적용 대상에서 제외됩니다. **`caveman` 과는 문장 생성 규칙이 정면으로 충돌하므로 두 가지를 동시에 켜지 마세요.** 플러그인 형태로 관리하고 싶다면 `/plugin marketplace add snflkd/fluent-korean` → `/plugin install fluent-korean@fluent-korean` 을 사용합니다(두 프롬프트로 분리 실행). output-style은 Claude Code 전용 개념이라 Codex·Grok·Hermes는 대상에서 제외됩니다.

> **Humanize Korean 모드 차이** — Claude는 Fast(단일 호출) + strict 5인 파이프라인을 모두 설치합니다(스킬 `humanize-korean`·`humanize`·`humanize-redo` 3개 + `~/.claude/agents/` 서브에이전트 12개). Codex와 Grok은 다중 서브에이전트를 결정적으로 실행하지 못해 Fast(단일 호출) 모드만 설치합니다(`humanize-korean` 1개). Hermes는 대상에서 제외됩니다.

외부 스킬 설치를 건너뛰려면 다음처럼 실행합니다.

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | SINS_SKIP_EXTERNAL=1 bash -s -- claude
```

`oh-my-design`만 건너뛰려면 `SINS_SKIP_OMD=1` 을 사용합니다(나머지 외부 스킬은 그대로 설치).

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | SINS_SKIP_OMD=1 bash -s -- claude
```

`gstack`은 기본적으로 스킬 파일만 복사합니다. 브라우저 빌드와 Playwright 설치까지 포함한 gstack 자체 setup을 함께 실행하려면 다음처럼 명시합니다.

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | SINS_RUN_GSTACK_SETUP=1 bash -s -- claude
```

## 한 줄 설치

### Claude Code

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- claude
```

### Codex

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- codex
```

### Hermes

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- hermes
```

### Grok

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-skill-all-install.sh | bash -s -- grok
```

> **Grok 설치 참고**
>
> - **설치 위치는 `~/.grok/skills/`** 입니다. Grok은 파일 변경을 감지해 재시작 없이 몇 초 안에 슬래시 메뉴에 반영합니다. `grok inspect` 로 확인하세요.
> - **Claude Code를 이미 쓰고 있다면 설치가 필요 없을 수도 있습니다.** Grok은 기본값으로 `~/.claude/skills/` 를 함께 스캔해(Claude 호환) `grok inspect` 에 `[claude]` 태그로 표시합니다. Claude 쪽 스킬을 지우거나 `GROK_CLAUDE_SKILLS_ENABLED=false` 로 호환 스캔을 끌 계획이면 `grok` 대상으로 따로 설치하세요.
> - **MCP는 이관되지 않습니다.** 노션(`/sins-mycontentsmake`)·힉스필드(`/sins-contents-thumbstyle-prompt`·`/sins-higgsfield`)·Lazyweb(`/sins-video-consource`)·PalmierPro(`/sins-palmierpro-cutedit`)는 `grok mcp add` 로 따로 등록해야 동작합니다. 상태 확인은 `grok mcp list` · `grok mcp doctor`.
> - **서브에이전트 구성은 다릅니다.** Claude의 `~/.claude/agents/*.md` 12개 팀 에이전트는 그대로 쓰이지 않습니다. Grok은 `--agents` JSON 또는 자체 서브에이전트 정의를 씁니다. `/humanize-korean` 은 이 때문에 Fast(단일 호출) 모드만 설치합니다.
> - **이름이 겹치면** Grok이 `/user:이름` 처럼 스코프를 붙인 명령으로도 함께 노출합니다. (`grok inspect` 가 `[collides with ...]` 로 표시)

## 수동 설치

### Claude Code

```bash
git clone https://github.com/CAPSTONEID/sins-clco.git /tmp/sins-clco
cd /tmp/sins-clco
bash sins-skill-all-install.sh claude
rm -rf /tmp/sins-clco
echo "Claude Code 설치 완료"
```

### Codex

```bash
git clone https://github.com/CAPSTONEID/sins-clco.git /tmp/sins-clco
cd /tmp/sins-clco
bash sins-skill-all-install.sh codex
rm -rf /tmp/sins-clco
echo "Codex 설치 완료"
```

### Hermes

```bash
git clone https://github.com/CAPSTONEID/sins-clco.git /tmp/sins-clco
cd /tmp/sins-clco
bash sins-skill-all-install.sh hermes
rm -rf /tmp/sins-clco
echo "Hermes 설치 완료"
```

### Grok

```bash
git clone https://github.com/CAPSTONEID/sins-clco.git /tmp/sins-clco
cd /tmp/sins-clco
bash sins-skill-all-install.sh grok
rm -rf /tmp/sins-clco
echo "Grok 설치 완료"
```

## 개별 스킬 설치

### Claude Code 준비

```bash
mkdir -p ~/.claude/skills
```

### Codex 준비

```bash
mkdir -p ~/.codex/skills
```

### Hermes 준비

```bash
mkdir -p ~/.hermes/skills
```

### Grok 준비

```bash
mkdir -p ~/.grok/skills
```

### sins-card-news-creator

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-card-news-creator.skill \
  -o /tmp/sins-card-news-creator.skill
mkdir -p ~/.claude/skills/sins-card-news-creator
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-card-news-creator.skill').extractall(os.path.expanduser('~/.claude/skills/sins-card-news-creator'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-card-news-creator.skill \
  -o /tmp/sins-card-news-creator.skill
mkdir -p ~/.codex/skills/sins-card-news-creator
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-card-news-creator.skill').extractall(os.path.expanduser('~/.codex/skills/sins-card-news-creator'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-card-news-creator.skill \
  -o /tmp/sins-card-news-creator.skill
mkdir -p ~/.hermes/skills/sins-card-news-creator
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-card-news-creator.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-card-news-creator'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-card-news-creator.skill \
  -o /tmp/sins-card-news-creator.skill
mkdir -p ~/.grok/skills/sins-card-news-creator
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-card-news-creator.skill').extractall(os.path.expanduser('~/.grok/skills/sins-card-news-creator'))
PY
```

### sins-marketing-team

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-marketing-team.skill \
  -o /tmp/sins-marketing-team.skill
mkdir -p ~/.claude/skills/sins-marketing-team
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-marketing-team.skill').extractall(os.path.expanduser('~/.claude/skills/sins-marketing-team'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-marketing-team.skill \
  -o /tmp/sins-marketing-team.skill
mkdir -p ~/.codex/skills/sins-marketing-team
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-marketing-team.skill').extractall(os.path.expanduser('~/.codex/skills/sins-marketing-team'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-marketing-team.skill \
  -o /tmp/sins-marketing-team.skill
mkdir -p ~/.hermes/skills/sins-marketing-team
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-marketing-team.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-marketing-team'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-marketing-team.skill \
  -o /tmp/sins-marketing-team.skill
mkdir -p ~/.grok/skills/sins-marketing-team
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-marketing-team.skill').extractall(os.path.expanduser('~/.grok/skills/sins-marketing-team'))
PY
```

### sins-sidenote-pass

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-sidenote-pass.skill \
  -o /tmp/sins-sidenote-pass.skill
mkdir -p ~/.claude/skills/sins-sidenote-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-sidenote-pass.skill').extractall(os.path.expanduser('~/.claude/skills/sins-sidenote-pass'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-sidenote-pass.skill \
  -o /tmp/sins-sidenote-pass.skill
mkdir -p ~/.codex/skills/sins-sidenote-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-sidenote-pass.skill').extractall(os.path.expanduser('~/.codex/skills/sins-sidenote-pass'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-sidenote-pass.skill \
  -o /tmp/sins-sidenote-pass.skill
mkdir -p ~/.hermes/skills/sins-sidenote-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-sidenote-pass.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-sidenote-pass'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-sidenote-pass.skill \
  -o /tmp/sins-sidenote-pass.skill
mkdir -p ~/.grok/skills/sins-sidenote-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-sidenote-pass.skill').extractall(os.path.expanduser('~/.grok/skills/sins-sidenote-pass'))
PY
```

### sins-video-consource

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-video-consource.skill \
  -o /tmp/sins-video-consource.skill
mkdir -p ~/.claude/skills/sins-video-consource
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-video-consource.skill').extractall(os.path.expanduser('~/.claude/skills/sins-video-consource'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-video-consource.skill \
  -o /tmp/sins-video-consource.skill
mkdir -p ~/.codex/skills/sins-video-consource
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-video-consource.skill').extractall(os.path.expanduser('~/.codex/skills/sins-video-consource'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-video-consource.skill \
  -o /tmp/sins-video-consource.skill
mkdir -p ~/.hermes/skills/sins-video-consource
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-video-consource.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-video-consource'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-video-consource.skill \
  -o /tmp/sins-video-consource.skill
mkdir -p ~/.grok/skills/sins-video-consource
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-video-consource.skill').extractall(os.path.expanduser('~/.grok/skills/sins-video-consource'))
PY
```

### sins-wiki-pass

Notion `LLM Wiki Index`에만 저장한다. 옵시디언 vault에는 쓰지 않는다.

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-wiki-pass.skill \
  -o /tmp/sins-wiki-pass.skill
mkdir -p ~/.claude/skills/sins-wiki-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-wiki-pass.skill').extractall(os.path.expanduser('~/.claude/skills/sins-wiki-pass'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-wiki-pass.skill \
  -o /tmp/sins-wiki-pass.skill
mkdir -p ~/.codex/skills/sins-wiki-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-wiki-pass.skill').extractall(os.path.expanduser('~/.codex/skills/sins-wiki-pass'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-wiki-pass.skill \
  -o /tmp/sins-wiki-pass.skill
mkdir -p ~/.hermes/skills/sins-wiki-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-wiki-pass.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-wiki-pass'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-wiki-pass.skill \
  -o /tmp/sins-wiki-pass.skill
mkdir -p ~/.grok/skills/sins-wiki-pass
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-wiki-pass.skill').extractall(os.path.expanduser('~/.grok/skills/sins-wiki-pass'))
PY
```

### sins-llmwiki-auto (자동 기록 / 상시 발동)

`sins-wiki-pass`는 수동 발동("위키에 넣어줘")이다. **질문·답변·업무·제작 내용을 자동으로** Notion 위키 DB에 정리·기록하려면 `sins-llmwiki-auto`를 쓴다. 옵시디언에는 쓰지 않는다. 함께 설치 후, [`skill-list-docs/llm-wiki-autosave.md`](skill-list-docs/llm-wiki-autosave.md)의 규칙 블록을 `~/.claude/CLAUDE.md`(또는 프로젝트 CLAUDE.md) 끝에 붙여넣으면 매 세션 영구 상시 발동.

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-llmwiki-auto.skill \
  -o /tmp/sins-llmwiki-auto.skill
mkdir -p ~/.claude/skills/sins-llmwiki-auto
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-llmwiki-auto.skill').extractall(os.path.expanduser('~/.claude/skills/sins-llmwiki-auto'))
PY
```


- 지식·정보성 답변 → 자동 위키 노트
- 마케팅 기획·전략·카피·리서치 → `concept`/`moc` 요약
- 카드뉴스·웹·랜딩·PT·이미지 등 제작물 → `source` 메타 요약(산출물 경로 포함)
- 인사·단순확인·잡담 → 제외
- 끄기: 대화 중 `위키 자동저장 꺼` / `wiki off`
- 토큰 영향(추정): 세션 평균 **+20~35%**

### sins-loopass-setup (루프 엔지니어링 셋업 위저드)

자율 AI 에이전트 루프를 6단계 인터뷰(트리거→행동→검증→정지조건→아키텍처→산출)로 설계·세팅한다. 각 단계마다 핵심 질문 + 추가할 스킬·MCP를 함께 묻고, 마지막에 정지조건 4종(검증 통과 / max_iterations / 예산 / no-progress)이 코드에 박힌 실행 가능한 루프 스킬을 자동 생성한다.

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-loopass-setup.skill \
  -o /tmp/sins-loopass-setup.skill
mkdir -p ~/.claude/skills/sins-loopass-setup
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-loopass-setup.skill').extractall(os.path.expanduser('~/.claude/skills/sins-loopass-setup'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-loopass-setup.skill \
  -o /tmp/sins-loopass-setup.skill
mkdir -p ~/.codex/skills/sins-loopass-setup
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-loopass-setup.skill').extractall(os.path.expanduser('~/.codex/skills/sins-loopass-setup'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-loopass-setup.skill \
  -o /tmp/sins-loopass-setup.skill
mkdir -p ~/.hermes/skills/sins-loopass-setup
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-loopass-setup.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-loopass-setup'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-loopass-setup.skill \
  -o /tmp/sins-loopass-setup.skill
mkdir -p ~/.grok/skills/sins-loopass-setup
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-loopass-setup.skill').extractall(os.path.expanduser('~/.grok/skills/sins-loopass-setup'))
PY
```

### sins-higgsfield (힉스필드 이미지·영상 단계별 생성)

힉스필드(Higgsfield) MCP가 연결된 환경에서, 이미지/영상을 9스텝 선택카드로 한 스텝씩 설계해 생성한다. 유형→참고이미지→프롬프트→보강→모델(Soul이면 캐릭터까지)→화면비→퀄리티→(영상이면 길이·오디오)→갯수→`get_cost` 비용확인→확정 순서. 모델 카탈로그·Soul 캐릭터·크레딧을 런타임에 실제 조회하며, 하네스 없는 순수 위저드다. **힉스필드 MCP 연결이 필요하다.**

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-higgsfield.skill \
  -o /tmp/sins-higgsfield.skill
mkdir -p ~/.claude/skills/sins-higgsfield
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-higgsfield.skill').extractall(os.path.expanduser('~/.claude/skills/sins-higgsfield'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-higgsfield.skill \
  -o /tmp/sins-higgsfield.skill
mkdir -p ~/.codex/skills/sins-higgsfield
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-higgsfield.skill').extractall(os.path.expanduser('~/.codex/skills/sins-higgsfield'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-higgsfield.skill \
  -o /tmp/sins-higgsfield.skill
mkdir -p ~/.hermes/skills/sins-higgsfield
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-higgsfield.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-higgsfield'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-higgsfield.skill \
  -o /tmp/sins-higgsfield.skill
mkdir -p ~/.grok/skills/sins-higgsfield
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-higgsfield.skill').extractall(os.path.expanduser('~/.grok/skills/sins-higgsfield'))
PY
```

### sins-yt-subtitles (SBV → 유튜브 VTT 자막 변환)

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-yt-subtitles.skill \
  -o /tmp/sins-yt-subtitles.skill
mkdir -p ~/.claude/skills/sins-yt-subtitles
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-yt-subtitles.skill').extractall(os.path.expanduser('~/.claude/skills/sins-yt-subtitles'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-yt-subtitles.skill \
  -o /tmp/sins-yt-subtitles.skill
mkdir -p ~/.codex/skills/sins-yt-subtitles
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-yt-subtitles.skill').extractall(os.path.expanduser('~/.codex/skills/sins-yt-subtitles'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-yt-subtitles.skill \
  -o /tmp/sins-yt-subtitles.skill
mkdir -p ~/.hermes/skills/sins-yt-subtitles
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-yt-subtitles.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-yt-subtitles'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-yt-subtitles.skill \
  -o /tmp/sins-yt-subtitles.skill
mkdir -p ~/.grok/skills/sins-yt-subtitles
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-yt-subtitles.skill').extractall(os.path.expanduser('~/.grok/skills/sins-yt-subtitles'))
PY
```

### sins-lenis (Lenis 부드러운 스크롤 스니펫 삽입)

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-lenis.skill \
  -o /tmp/sins-lenis.skill
mkdir -p ~/.claude/skills/sins-lenis
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-lenis.skill').extractall(os.path.expanduser('~/.claude/skills/sins-lenis'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-lenis.skill \
  -o /tmp/sins-lenis.skill
mkdir -p ~/.codex/skills/sins-lenis
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-lenis.skill').extractall(os.path.expanduser('~/.codex/skills/sins-lenis'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-lenis.skill \
  -o /tmp/sins-lenis.skill
mkdir -p ~/.hermes/skills/sins-lenis
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-lenis.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-lenis'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-lenis.skill \
  -o /tmp/sins-lenis.skill
mkdir -p ~/.grok/skills/sins-lenis
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-lenis.skill').extractall(os.path.expanduser('~/.grok/skills/sins-lenis'))
PY
```

### sins-fluent-korean (한국어 문체 지침)

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-fluent-korean.skill \
  -o /tmp/sins-fluent-korean.skill
mkdir -p ~/.claude/skills/sins-fluent-korean
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-fluent-korean.skill').extractall(os.path.expanduser('~/.claude/skills/sins-fluent-korean'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-fluent-korean.skill \
  -o /tmp/sins-fluent-korean.skill
mkdir -p ~/.codex/skills/sins-fluent-korean
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-fluent-korean.skill').extractall(os.path.expanduser('~/.codex/skills/sins-fluent-korean'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-fluent-korean.skill \
  -o /tmp/sins-fluent-korean.skill
mkdir -p ~/.hermes/skills/sins-fluent-korean
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-fluent-korean.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-fluent-korean'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-fluent-korean.skill \
  -o /tmp/sins-fluent-korean.skill
mkdir -p ~/.grok/skills/sins-fluent-korean
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-fluent-korean.skill').extractall(os.path.expanduser('~/.grok/skills/sins-fluent-korean'))
PY
```

### sins-mycontentsmake (유튜브 콘텐츠 자산 통합 제작 → 노션 발행)

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-mycontentsmake.skill \
  -o /tmp/sins-mycontentsmake.skill
mkdir -p ~/.claude/skills/sins-mycontentsmake
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-mycontentsmake.skill').extractall(os.path.expanduser('~/.claude/skills/sins-mycontentsmake'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-mycontentsmake.skill \
  -o /tmp/sins-mycontentsmake.skill
mkdir -p ~/.codex/skills/sins-mycontentsmake
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-mycontentsmake.skill').extractall(os.path.expanduser('~/.codex/skills/sins-mycontentsmake'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-mycontentsmake.skill \
  -o /tmp/sins-mycontentsmake.skill
mkdir -p ~/.hermes/skills/sins-mycontentsmake
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-mycontentsmake.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-mycontentsmake'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-mycontentsmake.skill \
  -o /tmp/sins-mycontentsmake.skill
mkdir -p ~/.grok/skills/sins-mycontentsmake
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-mycontentsmake.skill').extractall(os.path.expanduser('~/.grok/skills/sins-mycontentsmake'))
PY
```

### sins-palmierpro-cutedit (PalmierPro 타임라인 컷편집)

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-palmierpro-cutedit.skill \
  -o /tmp/sins-palmierpro-cutedit.skill
mkdir -p ~/.claude/skills/sins-palmierpro-cutedit
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-palmierpro-cutedit.skill').extractall(os.path.expanduser('~/.claude/skills/sins-palmierpro-cutedit'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-palmierpro-cutedit.skill \
  -o /tmp/sins-palmierpro-cutedit.skill
mkdir -p ~/.codex/skills/sins-palmierpro-cutedit
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-palmierpro-cutedit.skill').extractall(os.path.expanduser('~/.codex/skills/sins-palmierpro-cutedit'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-palmierpro-cutedit.skill \
  -o /tmp/sins-palmierpro-cutedit.skill
mkdir -p ~/.hermes/skills/sins-palmierpro-cutedit
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-palmierpro-cutedit.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-palmierpro-cutedit'))
PY
```

Grok:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-palmierpro-cutedit.skill \
  -o /tmp/sins-palmierpro-cutedit.skill
mkdir -p ~/.grok/skills/sins-palmierpro-cutedit
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-palmierpro-cutedit.skill').extractall(os.path.expanduser('~/.grok/skills/sins-palmierpro-cutedit'))
PY
```

**사전 준비 — PalmierPro MCP 연결 (이 스킬 전용)**

PalmierPro는 실행 중일 때 `http://127.0.0.1:19789/mcp` 에 MCP 서버를 엽니다. 한 번만 등록하면 됩니다.

```bash
# Claude Code
claude mcp add --transport http palmier-pro http://127.0.0.1:19789/mcp

# Codex
codex mcp add palmier-pro --url http://127.0.0.1:19789/mcp

# Grok
grok mcp add --transport http palmier-pro http://127.0.0.1:19789/mcp
```

Cursor는 `~/.cursor/mcp.json` 에 동일 URL을 등록합니다.

| 확인 | 방법 |
|------|------|
| 연결 상태 | `claude mcp list` → `palmier-pro ✔ Connected` (Grok은 `grok mcp doctor palmier-pro`) |
| `ConnectionRefused` | PalmierPro 앱이 꺼져 있음. 앱을 실행한 뒤 재시도 |

편집 대상은 **현재 열려있는 프로젝트**입니다. 파일 경로를 넘기지 않습니다.

## 설치 확인

Claude Code:

```bash
ls ~/.claude/skills/
```

Codex:

```bash
ls ~/.codex/skills/
```

Hermes:

```bash
ls ~/.hermes/skills/
```

Grok:

```bash
ls ~/.grok/skills/
grok inspect            # 발견된 스킬 전체와 출처(user·project·plugin)를 함께 확인
```

Codex에서는 `@` 파일 참조로 스킬을 불러옵니다.

```text
@~/.codex/skills/sins-video-consource/SKILL.md 위 내용대로 실행해줘
```

## 요구사항

| 도구 | 설치 링크 | 지원 OS |
|------|-----------|---------|
| Claude Code | [claude.ai/code](https://claude.ai/code) | macOS / Linux |
| Codex CLI | [openai.com/codex](https://openai.com/codex) | macOS / Linux |
| Hermes | [atomicbot.ai](https://atomicbot.ai) | macOS / Linux |
| Grok CLI | `npm i -g @xai-official/grok` | macOS / Linux |

스킬별 추가 요구사항:

| 스킬 | 추가 요구사항 |
|------|---------------|
| `/sins-palmierpro-cutedit` | [PalmierPro](https://github.com/palmier-io/palmier-pro) 실행 중 + MCP 등록 (macOS 26 Tahoe · Apple Silicon) |

---

## 설정 동기화 (다른 기기에서 동일 환경 구성)

`CLAUDE.md` 페르소나와 caveman 자동 활성화 hook을 새 기기에 적용합니다.

```bash
curl -fsSL https://raw.githubusercontent.com/CAPSTONEID/sins-clco/main/sins-config-apply.sh | bash
```

적용 내용:
- `~/CLAUDE.md` — 역할 페르소나, caveman mode, 작업 하네스 원칙
- `~/.claude/settings.json` — SessionStart hook (세션 시작 시 caveman full 자동 활성화)
- `~/.grok/rules/sins-persona.md` — Grok이 설치돼 있으면 같은 페르소나를 홈 룰로 복사 (Grok은 `~/CLAUDE.md` 를 스캔하지 않고 `~/.grok/rules/` 를 항상 읽습니다. caveman 규칙이 페르소나 본문에 있어 훅 없이 상시 적용)
