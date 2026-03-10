import argparse
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional in lightweight verification envs
    def load_dotenv():
        return False

try:
    from supabase import create_client
except ImportError:  # pragma: no cover - dry-run should still work without the client installed
    create_client = None


BASE_DIR = Path(__file__).parent
REPO_ROOT = BASE_DIR.parent.parent
HOOKS_CONFIG_PATH = REPO_ROOT / "platform" / "content-engine" / "hooks.json"
AGENTS_DIR = Path(os.getenv("TORQQ_AGENTS_DIR", str(BASE_DIR / "agents")))
CONTRACT_SENTINEL = "---CONTRACT---"
CALIBRATION_SIGNAL_TYPE = "agent_outcome_calibration"


def parse_args():
    parser = argparse.ArgumentParser(description="Verify predicted outcomes against actual KPI rows.")
    parser.add_argument("--dry-run", action="store_true", help="Validate config and print execution plan without writing rows.")
    parser.add_argument("--limit", type=int, default=50, help="Maximum agent_run_outputs rows to scan.")
    return parser.parse_args()


def load_hooks_config():
    return json.loads(HOOKS_CONFIG_PATH.read_text(encoding="utf-8"))


def find_weekly_hook(hooks_config: dict) -> Optional[dict]:
    scheduled = hooks_config.get("scheduled", [])
    for hook in scheduled:
        if hook.get("id") == "arjun-weekly-outcome":
            return hook
    return None


def extract_contract(raw_output: str) -> Optional[dict]:
    if not isinstance(raw_output, str):
        return None
    index = raw_output.rfind(CONTRACT_SENTINEL)
    if index == -1:
      return None

    candidate = raw_output[index + len(CONTRACT_SENTINEL):].strip()
    end_index = candidate.rfind("}")
    if end_index == -1:
      return None

    try:
      return json.loads(candidate[: end_index + 1])
    except json.JSONDecodeError:
      return None


def extract_outcome_prediction(run_row: dict) -> Optional[dict]:
    artifact = run_row.get("artifact") or {}
    data = artifact.get("data") or {}
    if isinstance(data.get("outcome_prediction"), dict):
        return data["outcome_prediction"]

    contract = extract_contract(run_row.get("raw_output") or "")
    prediction = contract.get("outcome_prediction") if isinstance(contract, dict) else None
    return prediction if isinstance(prediction, dict) else None


def round_number(value):
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    return round(numeric, 2)


def compute_variance(predicted, actual):
    predicted_value = round_number(predicted)
    actual_value = round_number(actual)
    if predicted_value in (None, 0) or actual_value is None:
        return None
    return round(((actual_value - predicted_value) / abs(predicted_value)) * 100, 2)


def derive_target_date(run_row: dict, prediction: dict) -> str:
    if prediction.get("target_date"):
        return str(prediction["target_date"])

    window_days = prediction.get("window_days")
    timestamp = run_row.get("timestamp")
    if isinstance(window_days, int) and timestamp:
        started_at = datetime.fromisoformat(str(timestamp).replace("Z", "+00:00"))
        return (started_at + timedelta(days=window_days)).date().isoformat()

    return datetime.now(timezone.utc).date().isoformat()


def build_calibration_guidance(metric: str, variance_pct: float) -> str:
    magnitude = abs(variance_pct)
    if variance_pct > 0:
        return f"Raise {metric} predictions by about {magnitude}% until the next verification cycle."
    if variance_pct < 0:
        return f"Lower {metric} predictions by about {magnitude}% until the next verification cycle."
    return f"Keep {metric} predictions aligned with the latest baseline."


def append_calibration_note(agent: str, company_id: str, metric: str, baseline_value, predicted_value, actual_value, variance_pct, verified_at: str):
    memory_path = AGENTS_DIR / agent / "memory" / "MEMORY.md"
    memory_path.parent.mkdir(parents=True, exist_ok=True)
    existing = memory_path.read_text(encoding="utf-8") if memory_path.exists() else ""
    marker = f'"companyId": "{company_id}", "metric": "{metric}", "variancePct": {variance_pct}'
    if marker in existing:
        return None

    note_payload = {
        "agent": agent,
        "companyId": company_id,
        "metric": metric,
        "baselineValue": baseline_value,
        "predictedValue": predicted_value,
        "actualValue": actual_value,
        "variancePct": variance_pct,
        "guidance": build_calibration_guidance(metric, variance_pct),
        "createdAt": verified_at,
    }
    block = "\n".join([
        "",
        f"## Calibration Note - {verified_at}",
        f"Company: {company_id}",
        f"Metric: {metric}",
        f"Variance: {variance_pct}%",
        f"Baseline: {baseline_value if baseline_value is not None else 'n/a'}",
        f"Predicted: {predicted_value if predicted_value is not None else 'n/a'}",
        f"Actual: {actual_value if actual_value is not None else 'n/a'}",
        f"Guidance: {note_payload['guidance']}",
        f"<!-- CALIBRATION_NOTE {json.dumps(note_payload)} -->",
        "",
    ])
    memory_path.write_text(f"{existing.rstrip()}{block}", encoding="utf-8")
    return note_payload


def query_latest_actual(supabase, company_id: str, metric: str, target_date: str):
    response = (
        supabase.table("company_kpi_daily")
        .select(f"metric_date,{metric}")
        .eq("company_id", company_id)
        .eq("source_scope", "blended")
        .lte("metric_date", target_date)
        .order("metric_date", desc=True)
        .limit(1)
        .execute()
    )
    data = response.data or []
    if not data:
        return None
    return round_number(data[0].get(metric))


def write_outcome_row(supabase, payload: dict):
    return supabase.table("outcome_ledger").insert(payload).execute()


def enqueue_calibration_signal(supabase, company_id: str, agent: str, metric: str, variance_pct: float, note_payload: Optional[dict]):
    return (
        supabase.table("agent_signals")
        .insert({
            "company_id": company_id,
            "signal_type": CALIBRATION_SIGNAL_TYPE,
            "payload": {
                "agent": agent,
                "metric": metric,
                "variance_pct": variance_pct,
                "calibration_note": note_payload,
            },
            "status": "pending",
            "dedupe_key": f"{company_id}:{agent}:{metric}:{variance_pct}",
            "created_by_agent": "arjun",
        })
        .execute()
    )


def verify_outcomes(supabase, limit: int = 50) -> dict:
    response = (
        supabase.table("agent_run_outputs")
        .select("run_id, company_id, agent, timestamp, artifact, raw_output")
        .order("timestamp", desc=True)
        .limit(limit)
        .execute()
    )
    rows = response.data or []
    processed = 0
    written = 0
    calibrations = 0

    for row in rows:
        prediction = extract_outcome_prediction(row)
        if not prediction:
            continue

        metric = str(prediction.get("metric") or "").strip().lower()
        if not metric or not row.get("company_id") or not row.get("agent"):
            continue

        processed += 1
        target_date = derive_target_date(row, prediction)
        actual_value = round_number(prediction.get("actual_value"))
        if actual_value is None:
            actual_value = query_latest_actual(supabase, row["company_id"], metric, target_date)
        predicted_value = round_number(prediction.get("predicted_value"))
        baseline_value = round_number(prediction.get("baseline_value"))
        variance_pct = compute_variance(predicted_value, actual_value)
        verified_at = datetime.now(timezone.utc).isoformat()

        outcome_row = {
            "run_id": row["run_id"],
            "company_id": row["company_id"],
            "agent": row["agent"],
            "outcome_metric": metric,
            "baseline_value": baseline_value,
            "predicted_value": predicted_value,
            "actual_value": actual_value,
            "variance_pct": variance_pct,
            "verified_at": verified_at,
            "created_at": verified_at,
        }
        write_outcome_row(supabase, outcome_row)
        written += 1

        if variance_pct is not None and abs(variance_pct) > 30:
            note_payload = append_calibration_note(
                row["agent"],
                row["company_id"],
                metric,
                baseline_value,
                predicted_value,
                actual_value,
                variance_pct,
                verified_at,
            )
            enqueue_calibration_signal(
                supabase,
                row["company_id"],
                row["agent"],
                metric,
                variance_pct,
                note_payload,
            )
            calibrations += 1

    return {
        "processed_runs": processed,
        "ledger_rows_written": written,
        "calibrations_written": calibrations,
    }


def main():
    load_dotenv()
    args = parse_args()
    hooks_config = load_hooks_config()
    weekly_hook = find_weekly_hook(hooks_config)

    if args.dry_run:
        print(json.dumps({
            "mode": "dry-run",
            "scheduled_hook_present": bool(weekly_hook),
            "scheduled_hook_id": weekly_hook.get("id") if weekly_hook else None,
            "scheduled_hook_cron": weekly_hook.get("cron") if weekly_hook else None,
            "agents_dir": str(AGENTS_DIR),
            "limit": args.limit,
        }, indent=2))
        return

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY are required.")
    if create_client is None:
        raise SystemExit("python supabase client is required for non-dry-run execution.")

    supabase = create_client(supabase_url, service_key)
    result = verify_outcomes(supabase, limit=args.limit)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
