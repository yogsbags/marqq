import { appendCalibrationNote } from "./calibration-writer.js";
import { getPipelineWriteClient } from "./supabase.js";

const KPI_METRICS = new Set([
  "spend",
  "revenue",
  "impressions",
  "clicks",
  "leads",
  "conversions",
  "ctr",
  "cpc",
  "cpl",
  "cpa",
  "roas",
]);
const DEFAULT_SOURCE_SCOPE = "blended";
const DEFAULT_CALIBRATION_THRESHOLD = 30;

function toFiniteNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function roundNumber(value, scale = 2) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(scale));
}

async function fetchActualValue(companyId, metric, options = {}) {
  const client = options.client || getPipelineWriteClient();
  if (!client || !companyId || !metric) return null;
  if (!KPI_METRICS.has(metric)) return null;

  const verifiedDate = String(options.verifiedAt || new Date().toISOString()).slice(0, 10);
  let query = client
    .from("company_kpi_daily")
    .select(`metric_date,${metric}`)
    .eq("company_id", companyId)
    .eq("source_scope", options.sourceScope || DEFAULT_SOURCE_SCOPE);

  if (typeof query.lte === "function") {
    query = query.lte("metric_date", verifiedDate);
  }

  if (typeof query.order === "function") {
    query = query.order("metric_date", { ascending: false });
  }

  if (typeof query.limit === "function") {
    query = query.limit(1);
  }

  const { data, error } = await query;
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return row ? toFiniteNumber(row[metric]) : null;
}

export function computeVariance({ baseline, predicted, actual }) {
  const baselineValue = toFiniteNumber(baseline);
  const predictedValue = toFiniteNumber(predicted);
  const actualValue = toFiniteNumber(actual);

  if (actualValue === null) return null;

  const referenceValue = predictedValue ?? baselineValue;
  if (referenceValue === null || referenceValue === 0) return null;

  return roundNumber(((actualValue - referenceValue) / Math.abs(referenceValue)) * 100);
}

export async function writeOutcomeLedgerRow(input, options = {}) {
  const client = options.client || getPipelineWriteClient();
  if (!client) {
    throw new Error("writeOutcomeLedgerRow requires a pipeline Supabase client.");
  }

  const metric = String(input.metric || "").trim().toLowerCase();
  if (!input.runId || !input.companyId || !input.agent || !metric) {
    throw new Error("writeOutcomeLedgerRow requires runId, companyId, agent, and metric.");
  }

  const baselineValue = roundNumber(toFiniteNumber(input.baselineValue));
  const predictedValue = roundNumber(toFiniteNumber(input.predictedValue));
  const actualValue = roundNumber(
    toFiniteNumber(input.actualValue) ?? await fetchActualValue(input.companyId, metric, {
      client,
      verifiedAt: input.verifiedAt,
      sourceScope: input.sourceScope,
    })
  );
  const variancePct = computeVariance({
    baseline: baselineValue,
    predicted: predictedValue,
    actual: actualValue,
  });
  const verifiedAt = input.verifiedAt || new Date().toISOString();
  const row = {
    run_id: input.runId,
    company_id: input.companyId,
    agent: input.agent,
    outcome_metric: metric,
    baseline_value: baselineValue,
    predicted_value: predictedValue,
    actual_value: actualValue,
    variance_pct: variancePct,
    verified_at: verifiedAt,
    created_at: options.clock?.iso?.() || new Date().toISOString(),
  };

  const insertBuilder = client.from("outcome_ledger").insert(row);
  const insertResult = typeof insertBuilder.select === "function"
    ? await insertBuilder.select().single()
    : await insertBuilder;

  if (insertResult?.error) throw insertResult.error;

  let calibration = null;
  if (
    variancePct !== null
    && Math.abs(variancePct) > (options.calibrationThresholdPct || DEFAULT_CALIBRATION_THRESHOLD)
  ) {
    calibration = await appendCalibrationNote({
      agent: input.agent,
      companyId: input.companyId,
      metric,
      baselineValue,
      predictedValue,
      actualValue,
      variancePct,
      createdAt: verifiedAt,
    }, options.calibrationOptions);
  }

  return {
    row,
    calibrationNote: calibration?.note || null,
  };
}
