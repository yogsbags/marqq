import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOKS_CONFIG_PATH = join(__dirname, "hooks.json");
const DEFAULT_HEARTBEAT_SECONDS = 60;
const DEFAULT_SIGNAL_COOLDOWN_MINUTES = 60;

const ALLOWED_AGENTS = new Set([
  "veena",
  "isha",
  "neel",
  "tara",
  "zara",
  "maya",
  "riya",
  "arjun",
  "dev",
  "priya",
  "kiran",
  "sam",
]);

const REQUIRED_SIGNAL_MAPPINGS = new Map([
  ["traffic_drop_20pct_7d", ["tara", "kiran"]],
  ["new_company_onboarded", ["veena", "isha", "neel", "zara"]],
  ["campaign_anomaly", ["zara", "dev"]],
  ["competitor_move", ["priya", "neel"]],
]);

const REQUIRED_TOP_LEVEL_KEYS = [
  "version",
  "timezone",
  "heartbeat_seconds",
  "scheduled",
  "signal_triggers",
  "chat_triggers",
];

const CRON_FIELD_RANGES = [
  { label: "minute", min: 0, max: 59, names: null },
  { label: "hour", min: 0, max: 23, names: null },
  { label: "day_of_month", min: 1, max: 31, names: null },
  {
    label: "month",
    min: 1,
    max: 12,
    names: new Map([
      ["jan", 1],
      ["feb", 2],
      ["mar", 3],
      ["apr", 4],
      ["may", 5],
      ["jun", 6],
      ["jul", 7],
      ["aug", 8],
      ["sep", 9],
      ["oct", 10],
      ["nov", 11],
      ["dec", 12],
    ]),
  },
  {
    label: "day_of_week",
    min: 0,
    max: 6,
    names: new Map([
      ["sun", 0],
      ["mon", 1],
      ["tue", 2],
      ["wed", 3],
      ["thu", 4],
      ["fri", 5],
      ["sat", 6],
    ]),
  },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCronValue(text, fieldConfig) {
  const normalized = String(text).trim().toLowerCase();
  if (fieldConfig.names?.has(normalized)) {
    return fieldConfig.names.get(normalized);
  }

  if (!/^\d+$/.test(normalized)) {
    throw new Error(
      `Cron ${fieldConfig.label} contains invalid token "${text}".`
    );
  }

  const value = Number(normalized);
  if (!Number.isInteger(value)) {
    throw new Error(`Cron ${fieldConfig.label} token "${text}" is not an integer.`);
  }

  if (fieldConfig.label === "day_of_week" && value === 7) {
    return 0;
  }

  if (value < fieldConfig.min || value > fieldConfig.max) {
    throw new Error(
      `Cron ${fieldConfig.label} token "${text}" is outside ${fieldConfig.min}-${fieldConfig.max}.`
    );
  }

  return value;
}

function validateCronSegment(segment, fieldConfig) {
  assert(segment.length > 0, `Cron ${fieldConfig.label} segment cannot be empty.`);

  const stepParts = segment.split("/");
  assert(
    stepParts.length <= 2,
    `Cron ${fieldConfig.label} segment "${segment}" has too many step separators.`
  );

  const [base, stepText] = stepParts;
  if (stepText !== undefined) {
    assert(/^\d+$/.test(stepText), `Cron ${fieldConfig.label} step must be numeric.`);
    assert(Number(stepText) > 0, `Cron ${fieldConfig.label} step must be > 0.`);
  }

  if (base === "*") {
    return;
  }

  if (base.includes(",")) {
    const parts = base.split(",");
    assert(
      parts.every(Boolean),
      `Cron ${fieldConfig.label} segment "${segment}" contains an empty list item.`
    );
    for (const part of parts) {
      validateCronSegment(part, fieldConfig);
    }
    return;
  }

  if (base.includes("-")) {
    const [startText, endText, extra] = base.split("-");
    assert(!extra, `Cron ${fieldConfig.label} range "${segment}" is malformed.`);
    const startValue = normalizeCronValue(startText, fieldConfig);
    const endValue = normalizeCronValue(endText, fieldConfig);
    assert(
      startValue <= endValue,
      `Cron ${fieldConfig.label} range "${segment}" must be ascending.`
    );
    return;
  }

  normalizeCronValue(base, fieldConfig);
}

export function parseCronExpression(cronText) {
  assert(typeof cronText === "string", "Cron expression must be a string.");
  const trimmed = cronText.trim();
  const fields = trimmed.split(/\s+/);
  assert(
    fields.length === 5,
    `Cron expression "${cronText}" must have exactly 5 fields.`
  );

  fields.forEach((field, index) => validateCronSegment(field, CRON_FIELD_RANGES[index]));

  return {
    minute: fields[0],
    hour: fields[1],
    dayOfMonth: fields[2],
    month: fields[3],
    dayOfWeek: fields[4],
    original: trimmed,
  };
}

function normalizeScheduledHook(hook, index) {
  assert(isPlainObject(hook), `scheduled[${index}] must be an object.`);
  assert(typeof hook.id === "string", `scheduled[${index}].id must be a string.`);
  assert(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(hook.id),
    `scheduled[${index}].id "${hook.id}" must be kebab-case.`
  );
  assert(typeof hook.enabled === "boolean", `scheduled[${index}].enabled must be boolean.`);
  assert(typeof hook.cron === "string", `scheduled[${index}].cron must be a string.`);
  const parsedCron = parseCronExpression(hook.cron);

  const dispatch = hook.dispatch;
  assert(
    isPlainObject(dispatch),
    `scheduled[${index}].dispatch must be an object with agent and task_type.`
  );
  assert(
    typeof dispatch.agent === "string" && dispatch.agent.length > 0,
    `scheduled[${index}].dispatch.agent must be a non-empty string.`
  );
  assert(
    ALLOWED_AGENTS.has(dispatch.agent),
    `scheduled[${index}].dispatch.agent "${dispatch.agent}" is not in the allowed roster.`
  );
  assert(
    typeof dispatch.task_type === "string" && dispatch.task_type.length > 0,
    `scheduled[${index}].dispatch.task_type must be a non-empty string.`
  );

  return {
    id: hook.id,
    enabled: hook.enabled,
    cron: parsedCron.original,
    cron_fields: parsedCron,
    dispatch: {
      agent: dispatch.agent,
      task_type: dispatch.task_type,
      query:
        typeof dispatch.query === "string" && dispatch.query.trim().length > 0
          ? dispatch.query.trim()
          : null,
    },
  };
}

function normalizeSignalDispatch(dispatchEntry, hookId, index) {
  assert(
    isPlainObject(dispatchEntry),
    `${hookId}.dispatch[${index}] must be an object.`
  );
  assert(
    typeof dispatchEntry.agent === "string" && dispatchEntry.agent.length > 0,
    `${hookId}.dispatch[${index}].agent must be a non-empty string.`
  );
  assert(
    ALLOWED_AGENTS.has(dispatchEntry.agent),
    `${hookId}.dispatch[${index}].agent "${dispatchEntry.agent}" is not in the allowed roster.`
  );
  assert(
    typeof dispatchEntry.task_type === "string" && dispatchEntry.task_type.length > 0,
    `${hookId}.dispatch[${index}].task_type must be a non-empty string.`
  );
  assert(
    Number.isInteger(dispatchEntry.order) && dispatchEntry.order > 0,
    `${hookId}.dispatch[${index}].order must be a positive integer.`
  );

  return {
    agent: dispatchEntry.agent,
    task_type: dispatchEntry.task_type,
    order: dispatchEntry.order,
  };
}

function normalizeSignalTrigger(hook, index) {
  assert(isPlainObject(hook), `signal_triggers[${index}] must be an object.`);
  assert(
    typeof hook.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(hook.id),
    `signal_triggers[${index}].id must be kebab-case.`
  );
  assert(
    typeof hook.signal_type === "string" && hook.signal_type.length > 0,
    `signal_triggers[${index}].signal_type must be a non-empty string.`
  );
  assert(
    typeof hook.enabled === "boolean",
    `signal_triggers[${index}].enabled must be boolean.`
  );
  assert(
    Array.isArray(hook.dispatch) && hook.dispatch.length > 0,
    `signal_triggers[${index}].dispatch must be a non-empty array.`
  );
  assert(
    isPlainObject(hook.condition),
    `signal_triggers[${index}].condition must be an object.`
  );

  const normalizedDispatch = hook.dispatch
    .map((entry, dispatchIndex) =>
      normalizeSignalDispatch(entry, `signal_triggers[${index}]`, dispatchIndex)
    )
    .sort((left, right) => left.order - right.order);

  normalizedDispatch.forEach((entry, dispatchIndex) => {
    const expectedOrder = dispatchIndex + 1;
    assert(
      entry.order === expectedOrder,
      `signal_triggers[${index}].dispatch order must be contiguous starting at 1.`
    );
  });

  const condition = hook.condition;
  assert(
    typeof condition.metric_path === "string" && condition.metric_path.length > 0,
    `signal_triggers[${index}].condition.metric_path must be a non-empty string.`
  );
  assert(
    typeof condition.baseline_path === "string" && condition.baseline_path.length > 0,
    `signal_triggers[${index}].condition.baseline_path must be a non-empty string.`
  );
  assert(
    typeof condition.operator === "string" && condition.operator.length > 0,
    `signal_triggers[${index}].condition.operator must be a non-empty string.`
  );
  assert(
    typeof condition.threshold === "number" && Number.isFinite(condition.threshold),
    `signal_triggers[${index}].condition.threshold must be numeric.`
  );

  const cooldown =
    hook.cooldown_minutes === undefined
      ? DEFAULT_SIGNAL_COOLDOWN_MINUTES
      : hook.cooldown_minutes;
  assert(
    Number.isInteger(cooldown) && cooldown >= 0,
    `signal_triggers[${index}].cooldown_minutes must be an integer >= 0.`
  );

  return {
    id: hook.id,
    signal_type: hook.signal_type,
    enabled: hook.enabled,
    dispatch: normalizedDispatch,
    condition: {
      metric_path: condition.metric_path,
      baseline_path: condition.baseline_path,
      operator: condition.operator,
      threshold: condition.threshold,
    },
    cooldown_minutes: cooldown,
  };
}

function normalizeChatTrigger(trigger, index) {
  assert(isPlainObject(trigger), `chat_triggers[${index}] must be an object.`);
  assert(
    typeof trigger.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trigger.id),
    `chat_triggers[${index}].id must be kebab-case.`
  );
  return { ...trigger };
}

function validateUniqueIds(config) {
  const seen = new Map();
  const sections = ["scheduled", "signal_triggers", "chat_triggers"];

  for (const section of sections) {
    for (const entry of config[section]) {
      const existingSection = seen.get(entry.id);
      assert(
        !existingSection,
        `Duplicate hook id "${entry.id}" found in ${existingSection} and ${section}.`
      );
      seen.set(entry.id, section);
    }
  }
}

function validateRequiredSignalMappings(signalTriggers) {
  for (const [signalType, requiredAgents] of REQUIRED_SIGNAL_MAPPINGS.entries()) {
    const matches = signalTriggers.filter((trigger) => trigger.signal_type === signalType);
    assert(
      matches.length === 1,
      `Signal mapping "${signalType}" must exist exactly once; found ${matches.length}.`
    );

    const actualAgents = matches[0].dispatch.map((entry) => entry.agent);
    assert(
      actualAgents.length === requiredAgents.length,
      `Signal mapping "${signalType}" must dispatch ${requiredAgents.length} agents.`
    );
    requiredAgents.forEach((agentName, index) => {
      assert(
        actualAgents[index] === agentName,
        `Signal mapping "${signalType}" must dispatch ${requiredAgents.join(" -> ")}.`
      );
    });
  }
}

export function validateHooksConfig(config) {
  assert(isPlainObject(config), "Hooks config must be a JSON object.");
  REQUIRED_TOP_LEVEL_KEYS.forEach((key) => {
    assert(Object.hasOwn(config, key), `Hooks config is missing top-level key "${key}".`);
  });

  assert(config.version === 1, "Hooks config version must be 1.");
  assert(
    typeof config.timezone === "string" && config.timezone.trim().length > 0,
    "Hooks config timezone must be a non-empty string."
  );
  assert(
    Number.isInteger(config.heartbeat_seconds) && config.heartbeat_seconds > 0,
    "Hooks config heartbeat_seconds must be a positive integer."
  );
  assert(Array.isArray(config.scheduled), "Hooks config scheduled must be an array.");
  assert(
    Array.isArray(config.signal_triggers),
    "Hooks config signal_triggers must be an array."
  );
  assert(Array.isArray(config.chat_triggers), "Hooks config chat_triggers must be an array.");

  const normalized = {
    version: config.version,
    timezone: config.timezone.trim(),
    heartbeat_seconds: config.heartbeat_seconds || DEFAULT_HEARTBEAT_SECONDS,
    scheduled: config.scheduled.map(normalizeScheduledHook),
    signal_triggers: config.signal_triggers.map(normalizeSignalTrigger),
    chat_triggers: config.chat_triggers.map(normalizeChatTrigger),
  };

  validateUniqueIds(normalized);
  validateRequiredSignalMappings(normalized.signal_triggers);

  return normalized;
}

export async function loadHooksConfig() {
  const raw = await readFile(HOOKS_CONFIG_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return validateHooksConfig(parsed);
}
