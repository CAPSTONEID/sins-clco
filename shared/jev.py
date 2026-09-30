#!/usr/bin/env python3
"""Jev(TypeSafe System One) 공용 호출 스크립트 — sins-* 스킬 공용, 표준 라이브러리만 사용.

Jev는 LLM이 아니다. 문장을 쓰지 않고 choice/score/noul 값과 확률만 돌려준다.
증거 수집·수정 문구 작성은 Claude가 하고, Jev는 판정 숫자만 낸다.
도구로 판정할 수 있는 항목(검증 스크립트·규격·형식)은 Jev에게 묻지 않고 checks로 받는다.

API 키: 환경변수 TYPESAFE_API_KEY → 없으면 macOS 키체인(서비스명 TYPESAFE_API_KEY).
키 값은 절대 출력·로그하지 않는다.

사용:
  python3 jev.py route  "작업 요약"                         # 시작 라우팅
  python3 jev.py review evidence.json --rubric jev-rubric.json  # 단계 심사
  python3 jev.py selftest                                   # 네트워크 없이 판정 로직 점검

jev-rubric.json (스킬마다 1개):
  {"criteria": {"id": "기준명: 질문"}, "checks": {"id": "라벨"},
   "blockers": {"id": {"question": "...", "criterion": "붙일 기준 id"}}}
  단계별로 기준이 다르면 {"stages": {"단계명": {위와 같은 구조}}} — evidence.json의 "stage"로 선택.

evidence.json:
  {"stage": "(stages 쓸 때만)", "evidence": {"기준 id": "Claude가 실제로 확인한 관찰"},
   "checks": {"id": 0 또는 true/false}, "attempt": 0}
  checks 규칙: id가 _violations로 끝나면 0이어야 통과, 나머지는 true여야 통과, 값이 없으면 미확인(차단).
"""
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

API_URL = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"

# 라우팅 레인 — 레인 ID: (모델, effort, 설명)
LANES = {
    "SMALL": ("Haiku 4.5", "low", "짧은 단일 산출물, 정해진 규칙 적용만 필요"),
    "MEDIUM": ("Sonnet 5.5", "medium", "산출물 여러 개, 규칙 적용 위주, 창작 판단 적음"),
    "HIGH": ("Opus 5.5", "medium", "산출물 다수, 시각·창작 판단 많음, 긴 입력"),
    "ESCALATE": ("Fable 5.1", "high", "반복 실패, 새 설계, 판단 불확실"),
}
SKIP_CARDS_CONF = 0.90  # SMALL을 이 confidence 이상으로 추천하면 카드 생략

SCALE = ["심각한 문제", "눈에 띄는 문제 여러 개", "사소한 문제 1~2개", "문제 거의 없음", "완벽"]
PASS_LEVEL = 3   # 레벨 3("문제 거의 없음") 이상이 통과 쪽
PASS_SCORE = 75  # 기준별 통과선 (0~100 환산)


def api_key():
    key = os.environ.get("TYPESAFE_API_KEY", "").strip()
    if key:
        return key
    try:  # 환경변수가 없으면 키체인에서 읽는다
        out = subprocess.run(
            ["security", "find-generic-password", "-a", os.environ.get("USER", ""),
             "-s", "TYPESAFE_API_KEY", "-w"],
            capture_output=True, text=True, timeout=5)
        return out.stdout.strip() if out.returncode == 0 else ""
    except (OSError, subprocess.TimeoutExpired):
        return ""


def call(state, questions, retries=3):
    """Jev 호출. 실패하면 {"error": ...}를 돌려주고 예외를 던지지 않는다."""
    key = api_key()
    if not key:
        return {"error": "TYPESAFE_API_KEY 없음 (환경변수·키체인 모두)"}
    body = json.dumps({"state": state, "model": MODEL, "questions": questions}).encode()
    req = urllib.request.Request(API_URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 529) and attempt < retries:
                time.sleep(2 ** attempt)  # 지수 백오프
                continue
            detail = e.read().decode(errors="replace")[:300]
            return {"error": f"HTTP {e.code}", "detail": detail}
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            if attempt < retries:
                time.sleep(2 ** attempt)
                continue
            return {"error": f"연결 실패: {e}"}


def route(summary):
    questions = {
        "lane": {
            "type": "choice",
            "instructions": "이 작업을 틀리지 않고 끝낼 수 있는 가장 낮은 레인은?",
            "criteria": {k: v[2] for k, v in LANES.items()},
        },
        "fast": {
            "type": "noul",
            "instructions": "깊은 판단보다 응답 속도가 더 중요한 작업인가",
            "criteria": {"true": "반복 수정·짧은 확인 위주", "false": "새 설계·다수 판단 필요"},
        },
    }
    res = call(summary, questions)
    if "error" in res:
        return res
    a = res["answers"]
    probs = a["lane"].get("probabilities", {})
    options = sorted(
        ({"lane": k, "model": LANES[k][0], "effort": LANES[k][1],
          "suitability": round(probs.get(k, 0) * 100)} for k in LANES),
        key=lambda o: -o["suitability"])
    rec, conf = a["lane"]["choice"], a["lane"].get("confidence", 0)
    return {
        "recommended": rec,
        "confidence": conf,
        "options": options,
        "fast_recommended": a["fast"]["noul"] >= 0.5,
        "fast_probability": round(a["fast"]["noul"] * 100),
        "skip_cards": rec == "SMALL" and conf >= SKIP_CARDS_CONF,
        "jev_model": res.get("model"),
    }


def decision_confidence(probs):
    """통과/미달 판정에 대한 확신도.
    Jev 기본 confidence는 '거의 없음 vs 완벽'처럼 둘 다 통과인 레벨 사이 망설임도 깎는다.
    판정에 필요한 건 통과 쪽 확률 합이 한쪽으로 몰렸는지뿐이다."""
    pass_mass = sum(p for lvl, p in probs.items() if int(lvl) >= PASS_LEVEL)
    return max(pass_mass, 1 - pass_mass)


def check_blockers(checks, spec):
    """도구 결과로 차단 문제 판정. 값이 없으면 '미확인'도 차단으로 본다."""
    out = []
    for k, label in spec.items():
        v = checks.get(k)
        if v is None:
            out.append(f"{label}: 미확인")
        elif (k.endswith("_violations") and v != 0) or v is False:
            out.append(f"{label}: 실패 ({v})")
    return out


def verdict(scores, confidence, blocking, attempt):
    """판정 규칙. scores: 기준별 0~100."""
    total = round(sum(scores.values()) / len(scores))
    failed = [k for k, s in scores.items() if s < PASS_SCORE]
    if blocking or confidence < 0.60:
        v = "human_review"
    elif total >= 80 and not failed and confidence >= 0.80:
        v = "pass"
    elif total >= 60 and attempt < 2:
        v = "retry"
    else:
        v = "human_review"
    return v, total, failed


def load_rubric(rubric, stage):
    if "stages" in rubric:
        if stage not in rubric["stages"]:
            raise KeyError(f"rubric에 없는 stage: {stage!r} (가능: {list(rubric['stages'])})")
        return rubric["stages"][stage]
    return rubric


def human_review(reason, blocking=()):
    return {"verdict": "human_review", "pass": False, "score": 0, "confidence": 0.0,
            "criteria": [], "blocking_issues": list(blocking), "retry_prompt": "",
            "human_review_reason": reason, "failed_criteria": []}


def review(evidence_path, rubric_path):
    with open(evidence_path, encoding="utf-8") as f:
        ev = json.load(f)
    with open(rubric_path, encoding="utf-8") as f:
        try:
            r = load_rubric(json.load(f), ev.get("stage"))
        except KeyError as e:
            return human_review(str(e))
    criteria, checks = r["criteria"], r.get("checks", {})
    blockers = r.get("blockers", {})
    blocking = check_blockers(ev.get("checks", {}), checks)
    scores, confs, errors, jev_model = {}, [], [], None
    top = len(SCALE) - 1
    # 기준마다 관련 증거만 따로 보낸다(fan-out) — 한 번에 물으면 confidence가 무너진다
    for k, q in criteria.items():
        text = ev.get("evidence", {}).get(k, "").strip()
        if not text:
            errors.append(f"{k}: 증거 없음")
            continue
        questions = {k: {"type": "score", "instructions": q, "criteria": SCALE}}
        attached = {b: spec for b, spec in blockers.items() if spec["criterion"] == k}
        for b, spec in attached.items():
            questions[b] = {"type": "noul", "instructions": spec["question"]}
        res = call(text, questions)
        if "error" in res:
            errors.append(f"{k}: Jev 호출 불가 ({res['error']})")
            continue
        a, jev_model = res["answers"], res.get("model")
        scores[k] = round(a[k]["score"] / top * 100)
        confs.append(decision_confidence(a[k].get("probabilities", {})))
        blocking += [spec["question"] for b, spec in attached.items() if a[b]["noul"] >= 0.5]
    if errors:  # 증거 누락·호출 불가 → 통과로 표시하지 않는다
        return human_review("; ".join(errors), blocking)
    confidence = min(confs)
    v, total, failed = verdict(scores, confidence, blocking, ev.get("attempt", 0))
    out_criteria = [{"name": criteria[k].split(":")[0], "score": scores[k],
                     "pass": scores[k] >= PASS_SCORE, "evidence": "", "fix": ""} for k in criteria]
    if checks:
        tool_fail = [b for b in blocking if any(b.startswith(lbl) for lbl in checks.values())]
        out_criteria.append({"name": "도구 검증", "score": 0 if tool_fail else 100,
                             "pass": not tool_fail, "evidence": "도구 판정", "fix": ""})
    return {
        "verdict": v, "pass": v == "pass", "score": total, "confidence": round(confidence, 2),
        "criteria": out_criteria,
        "blocking_issues": blocking,
        "retry_prompt": "",  # Jev는 문장을 쓰지 않는다 — Claude가 failed_criteria로 작성
        "human_review_reason": "" if v != "human_review" else
            ("차단 문제" if blocking else "confidence 미달" if confidence < 0.60
             else "재시도 한도 초과 또는 점수 미달"),
        "failed_criteria": failed,
        "jev_model": jev_model,
    }


def selftest():
    # ponytail: 판정 로직과 스킬별 rubric 형식만 점검. API 형식은 실제 호출로 확인
    s = {"a": 100, "b": 100}
    assert verdict(s, 0.9, [], 0)[0] == "pass"
    assert verdict(s, 0.7, [], 0)[0] == "retry"            # confidence 0.80 미만
    assert verdict(s, 0.5, [], 0)[0] == "human_review"     # confidence 0.60 미만
    assert verdict(s, 0.9, ["x"], 0)[0] == "human_review"  # 차단 문제
    s2 = {"a": 100, "b": 50, "c": 100, "d": 100}
    assert verdict(s2, 0.9, [], 0)[0] == "retry"           # 평균 88이지만 기준 1개 실패
    assert verdict(s2, 0.9, [], 2)[0] == "human_review"    # 재시도 2회 소진
    spec = {"frame_violations": "프레임", "spec_ok": "규격"}
    assert check_blockers({"frame_violations": 0, "spec_ok": True}, spec) == []
    assert len(check_blockers({"frame_violations": 2, "spec_ok": True}, spec)) == 1
    assert len(check_blockers({}, spec)) == 2             # 미확인은 차단
    assert round(decision_confidence({"3": 0.49, "4": 0.35, "2": 0.16}), 2) == 0.84
    assert round(decision_confidence({"2": 0.83, "3": 0.17}), 2) == 0.83
    # 설치된 sins-* 스킬 rubric 형식 점검
    skills = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    n = 0
    for d in sorted(os.listdir(skills)):
        p = os.path.join(skills, d, "jev-rubric.json")
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as f:
            rb = json.load(f)
        for name, st in (rb["stages"].items() if "stages" in rb else [("-", rb)]):
            assert st["criteria"], f"{d}/{name}: criteria 비어 있음"
            for b, spec in st.get("blockers", {}).items():
                assert spec["criterion"] in st["criteria"], f"{d}/{name}/{b}: 없는 기준"
        n += 1
    print(f"selftest ok (rubric {n}개 점검)")


if __name__ == "__main__":
    args = sys.argv[1:]
    cmd = args[0] if args else ""
    if cmd == "route" and len(args) > 1:
        out = route(args[1])
    elif cmd == "review" and len(args) == 4 and args[2] == "--rubric":
        out = review(args[1], args[3])
    elif cmd == "selftest":
        selftest()
        sys.exit(0)
    else:
        print(__doc__)
        sys.exit(1)
    print(json.dumps(out, ensure_ascii=False, indent=2))
    sys.exit(2 if "error" in out else 0)
