import test from "node:test";
import assert from "node:assert/strict";

import {
  loadHooksConfig,
  parseCronExpression,
  validateHooksConfig,
} from "./hooks-config.js";

function createValidConfig() {
  return {
    version: 1,
    timezone: "Asia/Kolkata",
    heartbeat_seconds: 60,
    scheduled: [
      {
        id: "veena-weekly-refresh",
        enabled: true,
        cron: "0 6 * * mon",
        dispatch: {
          agent: "veena",
          task_type: "weekly_mkg_refresh",
          query: "Refresh MKG",
        },
      },
      {
        id: "isha-daily-market-scan",
        enabled: true,
        cron: "30 7 * * mon-fri",
        dispatch: {
          agent: "isha",
          task_type: "daily_market_scan",
          query: "Scan market",
        },
      },
    ],
    signal_triggers: [
      {
        id: "traffic-drop-20pct-7d",
        signal_type: "traffic_drop_20pct_7d",
        enabled: true,
        dispatch: [
          { agent: "tara", task_type: "traffic_drop_recovery_plan", order: 1 },
          { agent: "kiran", task_type: "traffic_drop_social_response", order: 2 },
        ],
        condition: {
          metric_path: "metrics.value.website_sessions_7d",
          baseline_path: "baselines.value.website_sessions_7d",
          operator: "pct_drop_gte",
          threshold: 20,
        },
      },
      {
        id: "new-company-onboarded-chain",
        signal_type: "new_company_onboarded",
        enabled: true,
        dispatch: [
          { agent: "veena", task_type: "company_intel_bootstrap", order: 1 },
          { agent: "isha", task_type: "market_landscape_bootstrap", order: 2 },
          { agent: "neel", task_type: "strategy_bootstrap", order: 3 },
          { agent: "zara", task_type: "distribution_bootstrap", order: 4 },
        ],
        condition: {
          metric_path: "signals.value.onboarding_stage",
          baseline_path: "baselines.value.onboarding_stage",
          operator: "changed_from_baseline",
          threshold: 1,
        },
      },
      {
        id: "campaign-anomaly-response",
        signal_type: "campaign_anomaly",
        enabled: true,
        dispatch: [
          { agent: "zara", task_type: "campaign_channel_response", order: 1 },
          { agent: "dev", task_type: "campaign_metric_diagnosis", order: 2 },
        ],
        condition: {
          metric_path: "metrics.value.campaign_health_score",
          baseline_path: "baselines.value.campaign_health_score",
          operator: "pct_drop_gte",
          threshold: 15,
        },
      },
      {
        id: "competitor-move-response",
        signal_type: "competitor_move",
        enabled: true,
        dispatch: [
          { agent: "priya", task_type: "competitor_move_analysis", order: 1 },
          { agent: "neel", task_type: "strategy_countermove", order: 2 },
        ],
        condition: {
          metric_path: "signals.value.competitor_move_score",
          baseline_path: "baselines.value.competitor_move_score",
          operator: "pct_increase_gte",
          threshold: 25,
        },
      },
    ],
    chat_triggers: [],
  };
}

test("valid checked-in config loads successfully", async () => {
  const config = await loadHooksConfig();

  assert.equal(config.timezone, "Asia/Kolkata");
  assert.equal(config.heartbeat_seconds, 60);
  assert.ok(config.scheduled.length >= 6);
  assert.ok(config.signal_triggers.length >= 7);
  assert.equal(config.chat_triggers.length, 0);
});

test("duplicate hook ids are rejected", () => {
  const config = createValidConfig();
  config.signal_triggers[0].id = "veena-weekly-refresh";

  assert.throws(
    () => validateHooksConfig(config),
    /Duplicate hook id "veena-weekly-refresh"/
  );
});

test("unknown agent names are rejected", () => {
  const config = createValidConfig();
  config.signal_triggers[0].dispatch[1].agent = "ghost";

  assert.throws(
    () => validateHooksConfig(config),
    /ghost".*allowed roster/
  );
});

test("missing required HOOKS-02 signal mappings are rejected", () => {
  const config = createValidConfig();
  config.signal_triggers = config.signal_triggers.filter(
    (trigger) => trigger.signal_type !== "competitor_move"
  );

  assert.throws(
    () => validateHooksConfig(config),
    /Signal mapping "competitor_move" must exist exactly once/
  );
});

test("malformed cron strings are rejected", () => {
  assert.throws(
    () => parseCronExpression("60 6 * * mon"),
    /outside 0-59/
  );

  const config = createValidConfig();
  config.scheduled[0].cron = "0 24 * * mon";

  assert.throws(
    () => validateHooksConfig(config),
    /outside 0-23/
  );
});

test("missing required top-level sections are rejected", () => {
  const config = createValidConfig();
  delete config.chat_triggers;

  assert.throws(
    () => validateHooksConfig(config),
    /missing top-level key "chat_triggers"/
  );
});
