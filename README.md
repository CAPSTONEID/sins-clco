# SINS Claude & Codex & Hermes 스킬 패키지

SINS 프로젝트용 Claude Code, Codex, Hermes 스킬 패키지입니다.

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
| `sins-card-news-creator.skill` | `/sins-card-news-creator` | 인스타그램 카드뉴스 HTML, 캡션 TXT, 이미지 프롬프트 TXT 제작 |
| `sins-marketing-team.skill` | `/sins-marketing-team` | 마케팅 전략 팀 구성 및 실행 |
| `sins-sidenote-pass.skill` | `/sins-sidenote-pass` | SideNotes 고정 폴더에 새 메모 저장 및 기본 접기 처리 |
| `sins-web-pt.skill` | `/sins-web-pt` | 스크립트/PPTX 기반 웹 발표자료 HTML 및 발표 대본 TXT 제작 |
| `sins-wiki-pass.skill` | `/sins-wiki-pass` | Obsidian "LLM Wiki" 볼트와 Notion 위키 DB 동시 저장·동기화 (수동 발동, 타입 6종→폴더 자동 매핑 + Notion 카테고리 8종 고정 선택, 제목에 `영상 - `·`프롬프트 - ` 등 종류 프리픽스 자동) |
| `sins-llmwiki-auto.skill` | `/sins-llmwiki-auto` | 질문·답변·업무·제작 내용을 **자동으로** LLM 위키에 정리·기록하는 상시 발동 정책 (sins-wiki-pass 연동) |
| `sins-loopass-setup.skill` | `/sins-loopass-setup` | 루프 엔지니어링(자율 AI 에이전트 루프)을 6단계 인터뷰로 설계·세팅하는 위저드 (트리거→행동→검증→정지조건→아키텍처→산출, 단계별 스킬·MCP 추천 + 실행 가능한 루프 스킬 자동 생성) |
| `sins-higgsfield.skill` | `/sins-higgsfield` | 힉스필드(Higgsfield) MCP로 이미지·영상을 9스텝 선택카드로 단계별 생성 (유형→참고이미지→프롬프트→보강→모델/Soul 캐릭터→화면비→퀄리티→영상 길이·오디오→갯수→get_cost 비용확인→확정, 하네스 없는 순수 위저드) |
| `sins-contents-thumbstyle-prompt.skill` | `/sins-contents-thumbstyle-prompt` | 입력 내용에 맞춰 SINSRA 고정 썸네일 스타일(Anthropic 미니멀 싱글라인 네온 두들·#FF5E00·검정 배경) 프롬프트를 자동 작성하고 힉스필드로 총 4장(16:9 3장 + 9:16 1장, 오브제 모두 다르게) 생성 (내용 입력→오브제 확인/변경→이미지별 네온 강조컬러(추천 팔레트 포함)→모델 선택(GPT Image 2 최우선)→get_cost 비용확인→4장 생성) |
| `sins-yt-subtitles.skill` | `/sins-yt-subtitles` | SBV 자막을 유튜브용 VTT로 변환 (무조건 1줄·한 줄 목표 15자(공백 제외·단어 안 쪼갬)·마침표에서 자막 분리·쉼표에서 끊기 선호·가독성 우선, `[음악]`·`[박수]` 등 대괄호 효과음 태그와 문장 첫머리 추임새(`자`) 자동 삭제, /humanize-korean 으로 오탈자만 2회 검수해 음성 싱크 보존, 결정론적 재분할 + difflib 재타이밍 + 최소 표시시간 보장) |
| `sins-lenis.skill` | `/sins-lenis` | HTML `</head>` 직전에 Lenis 부드러운 스크롤 스니펫(CSS·JS·`new Lenis({ autoRaf: true })`) 삽입, 이미 있으면 중복 삽입 없이 알림 (unpkg CDN·버전 1.3.23 핀 고정) |
| `sins-palmierpro-cutedit.skill` | `/sins-palmierpro-cutedit` | PalmierPro MCP로 **현재 열려있는 프로젝트 타임라인을 직접 읽고 컷편집**. **단어를 지우는 게 아니라 말을 다듬는 작업**이므로 모든 삭제는 문장·문단 맥락 판정(룰 H)을 통과해야 한다 — 판단 단위는 단어/문장/문단 세 겹, 확정 전 **컷 후 남을 문장을 실제로 읽어 성분 결손·지시 대상·접속 대상을 검증**, 지시어(`이`·`이러한`)·접속사(`그래서`·`다만`)·열거 번호(`두번째는`)가 앞을 붙잡고 있으면 반복이라도 보류, **5초 이상 구간을 지운 뒤엔 문맥 재판정**(큰 컷은 뒷문장을 고아로 만들거나 없던 중복을 만든다), 문단 여는 담화표지(`자`·`그럼`·`마지막으로`)는 군소리가 아니라 구조 표지라 유지. 무음 삭제는 **완료 기준 4개**(실무음 0.6초↑ 0곳 · 타임라인 갭 0 · 무발화 클립 0 · 10프레임 미만 파편 0)를 충족할 때까지 문턱을 1.0→0.6→0.35→0.25초로 낮춰가며 **최대 5회 루프**, 여백은 0.15초로 두어 모든 공백에 0.30초 호흡을 남긴다. **반복·버벅임 판정은 반드시 편집 전 베이스라인 기준**(룰 G) — ASR이 반복 테이크를 클립 경계에서 병합·오라벨링해서 편집 후 트랜스크립트에는 반복이 **사라져 보인다**. 트랜스크립트에 안 잡히는 버벅임은 **간격 이상 스캔**(G-2)으로 찾고 **베이스라인 프레임 역산**(G-3) + `ripple_delete_ranges`로 처리. 단어 룰은 인덱스로 모아 `remove_words` **한 번에** 반영, `cutAggressiveness`는 **`balanced` 기본** (`tight`는 앞 단어 끝음절을 먹는다 — 잘리면 `set_clip_properties` + `move_clips`로 복구). 승인 표에는 **`컷 후 남을 문장` 열을 반드시 병기**하고 확정/추정 표를 분리 |
| `sins-mycontentsmake.skill` | `/sins-mycontentsmake` | 유튜브 영상 콘텐츠 자산(썸네일 프롬프트·제목·스크립트·영상설명/캡션/태그·썸네일이미지·슬라이드·카드뉴스)을 한 번에 제작해 노션 하위 7페이지로 발행하는 통합 워크플로우 (작업 전 노션 부모 링크 강제 확보→7페이지 생성(번호 이모지=아이콘)→스크립트 먼저 작성 후 나머지 병렬 팬아웃→최종 글 검수는 `/humanize-korean`). **슬라이드(6)·카드뉴스(7) 페이지는 빈 페이지만 생성하고 내용은 사용자가 직접 제작**(하위 스킬 자동 호출 안 함) |

## 함께 설치되는 외부 오픈소스 스킬

한 줄 설치와 수동 설치는 SINS 스킬 설치 후 아래 외부 스킬도 같이 설치합니다. (Hermes 대상은 gstack·superpowers·caveman 등을 자체 번들로 이미 제공하므로 외부 스킬 설치를 건너뛰고 SINS 스킬만 설치합니다.)

| 이름 | 대상 | 출처 |
|------|------|------|
| Caveman | Claude 전용 | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) |
| Frontend Slides | Claude 전용 | [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) |
| Grill Me | Claude 전용 | [mattpocock/skills](https://github.com/mattpocock/skills) |
| Handoff | Claude 전용 | [mattpocock/skills](https://github.com/mattpocock/skills) |
| Harness | Claude 전용 | [revfactory/harness](https://github.com/revfactory/harness) |
| UI/UX Pro Max | Claude 전용 | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) |
| HyperFrames | Claude / Codex | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) |
| gstack | Claude / Codex | [garrytan/gstack](https://github.com/garrytan/gstack) |
| Superpowers | Claude / Codex | [obra/superpowers](https://github.com/obra/superpowers) |
| Ponytail | Claude / Codex | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) |
| Humanize Korean | Claude / Codex | [epoko77-ai/im-not-ai](https://github.com/epoko77-ai/im-not-ai) |
| Emil Kowalski Skills | Claude / Codex | [emilkowalski/skills](https://github.com/emilkowalski/skills) |
| Insane Search | Codex 전용 | [sinmb79/codex-insane-search](https://github.com/sinmb79/codex-insane-search) |
| Insane Search | Claude 전용 | [fivetaku/insane-search](https://github.com/fivetaku/insane-search) |
| oh-my-design | Claude / Codex | [kwakseongjae/oh-my-design](https://github.com/kwakseongjae/oh-my-design) |

> **oh-my-design 채널 차이** — 286개 실제 기업 디자인 레퍼런스 기반 디자인 시스템 스킬 17개 + 서브에이전트 16개. 자체 `oh-my-design-cli` npx 설치를 사용하며 Claude·Codex 채널을 따로 설치합니다. Claude는 `--agent claude-code`로 스킬 `~/.claude/skills`, 에이전트 `~/.claude/agents`, 데이터 `~/.claude/data`에 설치하고, Codex는 `--agent codex`로 스킬 `~/.agents/skills`, 에이전트 `~/.codex/agents`, 데이터 `~/.codex/data`에 설치합니다(각 도구의 정규 경로). `npx`(Node.js)가 필요하며 없으면 자동으로 건너뜁니다. 건너뛰려면 `SINS_SKIP_OMD=1`. Hermes는 대상에서 제외됩니다.

> **Ponytail 설치 범위** — YAGNI·표준 라이브러리 우선·최소 구현을 강제하는 "게으른 시니어 개발자" 모드. 번들은 슬래시 명령 스킬 6개(`ponytail`·`ponytail-audit`·`ponytail-help`·`ponytail-review`·`ponytail-gain`·`ponytail-debt`)만 `skills/`에서 복사합니다. **상시 발동(always-on) 라이프사이클 훅은 번들로 연결되지 않습니다** — 매 프롬프트 자동 활성화가 필요하면 정규 플러그인 설치를 쓰세요. Claude `/plugin marketplace add DietrichGebert/ponytail` → `/plugin install ponytail@ponytail`(두 프롬프트로 분리 실행), Codex `codex plugin marketplace add DietrichGebert/ponytail`. 훅 실행에는 `node`가 PATH에 있어야 합니다. Hermes는 대상에서 제외됩니다.

> **Emil Kowalski Skills** — UI 애니메이션·모션·디자인 엔지니어링 스킬 5개(`animation-vocabulary`·`apple-design`·`emil-design-eng`·`improve-animations`·`review-animations`). Vaul·Sonner 제작자 Emil Kowalski의 UI 폴리시·애니메이션 철학을 담은 스킬로, `skills/`에서 그대로 복사합니다. Hermes는 대상에서 제외됩니다.

> **Humanize Korean 모드 차이** — Claude는 Fast(단일 호출) + strict 5인 파이프라인을 모두 설치합니다(스킬 `humanize-korean`·`humanize`·`humanize-redo` 3개 + `~/.claude/agents/` 서브에이전트 12개). Codex는 다중 서브에이전트를 결정적으로 실행하지 못해 Fast(단일 호출) 모드만 설치합니다(`humanize-korean` 1개). Hermes는 대상에서 제외됩니다.

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

### sins-web-pt

Claude Code:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-web-pt.skill \
  -o /tmp/sins-web-pt.skill
mkdir -p ~/.claude/skills/sins-web-pt
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-web-pt.skill').extractall(os.path.expanduser('~/.claude/skills/sins-web-pt'))
PY
```

Codex:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-web-pt.skill \
  -o /tmp/sins-web-pt.skill
mkdir -p ~/.codex/skills/sins-web-pt
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-web-pt.skill').extractall(os.path.expanduser('~/.codex/skills/sins-web-pt'))
PY
```

Hermes:

```bash
curl -L https://github.com/CAPSTONEID/sins-clco/raw/main/skill-list/sins-web-pt.skill \
  -o /tmp/sins-web-pt.skill
mkdir -p ~/.hermes/skills/sins-web-pt
python3 - <<'PY'
import os, zipfile
zipfile.ZipFile('/tmp/sins-web-pt.skill').extractall(os.path.expanduser('~/.hermes/skills/sins-web-pt'))
PY
```

### sins-wiki-pass

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

### sins-llmwiki-auto (자동 기록 / 상시 발동)

`sins-wiki-pass`는 수동 발동("위키에 넣어줘")이다. **질문·답변·업무·제작 내용을 자동으로** 옵시디언 + Notion에 정리·기록하려면 `sins-llmwiki-auto`를 쓴다. 함께 설치 후, [`skill-list-docs/llm-wiki-autosave.md`](skill-list-docs/llm-wiki-autosave.md)의 규칙 블록을 `~/.claude/CLAUDE.md`(또는 프로젝트 CLAUDE.md) 끝에 붙여넣으면 매 세션 영구 상시 발동.

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

**사전 준비 — PalmierPro MCP 연결 (이 스킬 전용)**

PalmierPro는 실행 중일 때 `http://127.0.0.1:19789/mcp` 에 MCP 서버를 엽니다. 한 번만 등록하면 됩니다.

```bash
# Claude Code
claude mcp add --transport http palmier-pro http://127.0.0.1:19789/mcp

# Codex
codex mcp add palmier-pro --url http://127.0.0.1:19789/mcp
```

Cursor는 `~/.cursor/mcp.json` 에 동일 URL을 등록합니다.

| 확인 | 방법 |
|------|------|
| 연결 상태 | `claude mcp list` → `palmier-pro ✔ Connected` |
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

Codex에서는 `@` 파일 참조로 스킬을 불러옵니다.

```text
@~/.codex/skills/sins-web-pt/SKILL.md 위 내용대로 실행해줘
```

## 요구사항

| 도구 | 설치 링크 | 지원 OS |
|------|-----------|---------|
| Claude Code | [claude.ai/code](https://claude.ai/code) | macOS / Linux |
| Codex CLI | [openai.com/codex](https://openai.com/codex) | macOS / Linux |
| Hermes | [atomicbot.ai](https://atomicbot.ai) | macOS / Linux |

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
