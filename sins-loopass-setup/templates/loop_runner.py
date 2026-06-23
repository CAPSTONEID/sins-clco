#!/usr/bin/env python3
"""캐노니컬 루프 러너 — sins-loopass-setup 위저드 산출 골격.

정지조건 4종(검증 통과 / max_iterations / 예산 / no-progress)을
코드에 강제로 박아 무한루프·비용폭발·환각성 성공선언을 차단한다.
{{...}} 자리는 위저드가 사용자 스펙으로 치환한다.
"""

import argparse
import hashlib
import subprocess
import sys
import time


def run_verify(verify_cmd: str) -> bool:
    """결정론적 검증. exit 0 이면 성공. 모델 자기평가 금지."""
    try:
        r = subprocess.run(verify_cmd, shell=True, capture_output=True, text=True, timeout=600)
        return r.returncode == 0
    except subprocess.TimeoutExpired:
        return False


def step_action() -> str:
    """매 반복의 행동(observe→act). 위저드가 사용자 행동으로 치환.
    상태 시그니처(문자열) 반환 → no-progress 감지에 사용."""
    # {{ACT_STEP}} — 예: subprocess 호출, subagent 스폰, 파일 수정 등
    return "TODO: replace with real action; return a state signature string"


def escalate(reason: str, state_sig: str) -> None:
    """무한루프 대신 사람 호출. 위저드가 에스컬레이션 통로로 치환."""
    print(f"[ESCALATE] {reason} | last_state={state_sig[:16]}", file=sys.stderr)
    # {{ESCALATION}} — 예: Slack/이메일/PushNotification


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--verify-cmd", required=True, help="결정론적 검증 명령(exit 0=성공)")
    p.add_argument("--max-iterations", type=int, default=50, help="하드캡")
    p.add_argument("--budget", type=int, default=300, help="벽시계 예산(초)")
    p.add_argument("--no-progress-n", type=int, default=3, help="동일 상태 N회 시 중단")
    args = p.parse_args()

    start = time.time()
    recent: list[str] = []

    for step in range(args.max_iterations):
        # --- 검증 먼저: 이미 성공이면 즉시 종료 ---
        if run_verify(args.verify_cmd):
            print(f"[SUCCESS] verified at step {step}")
            return 0

        # --- 예산 가드 ---
        if time.time() - start > args.budget:
            escalate("budget exhausted", recent[-1] if recent else "")
            return 2

        # --- 행동 ---
        state_sig = hashlib.sha256(step_action().encode()).hexdigest()

        # --- no-progress 감지: 최근 N스텝 동일 시그니처면 중단 ---
        recent.append(state_sig)
        recent = recent[-args.no_progress_n:]
        if len(recent) == args.no_progress_n and len(set(recent)) == 1:
            escalate("no progress detected", state_sig)
            return 3

        print(f"[step {step}] state={state_sig[:12]} elapsed={time.time()-start:.0f}s")

    # --- max_iterations 소진 ---
    escalate("max_iterations reached", recent[-1] if recent else "")
    return 4


if __name__ == "__main__":
    sys.exit(main())
