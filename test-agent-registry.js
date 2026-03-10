import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const AGENTS_DIR = join(ROOT, "platform", "crewai", "agents");
const BACKEND_FILE = join(ROOT, "platform", "content-engine", "backend-server.js");
const MCP_ROUTER_FILE = join(ROOT, "platform", "content-engine", "mcp-router.js");
const SCHEDULER_FILE = join(ROOT, "platform", "crewai", "autonomous_scheduler.py");
const SKILLS_MANIFEST_FILE = join(AGENTS_DIR, "skills-manifest.json");
const SCHEDULE_MATRIX_FILE = join(AGENTS_DIR, "schedule-matrix.json");

const EXPECTED_ROSTER = [
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
];

const EXPECTED_ROLE_MAP = {
  veena: "Company Intelligence",
  isha: "Market Research",
  neel: "Strategy",
  tara: "Offer Engineering",
  zara: "Distribution",
  maya: "SEO/Content",
  riya: "Content Creation",
  arjun: "Funnel/Leads",
  dev: "Analytics",
  priya: "Competitive Intelligence",
  kiran: "Lifecycle/Social",
  sam: "Messaging",
};

const FLAG_TO_CHECK = {
  "--check-soul-memory": "soulMemory",
  "--check-role-map": "roleMap",
  "--check-mkg-fields": "mkgFields",
  "--check-mcp-connectors": "mcpConnectors",
  "--check-skills-order": "skillsOrder",
  "--check-skill-provenance": "skillProvenance",
  "--check-backend-roster": "backendRoster",
  "--check-scheduler": "scheduler",
  "--check-scheduler-prompt-path": "schedulerPromptPath",
  "--check-schedule-matrix": "scheduleMatrix",
};

const selectedChecks = new Set(
  process.argv.slice(2).map((flag) => FLAG_TO_CHECK[flag]).filter(Boolean),
);

if (process.argv.length > 2 && selectedChecks.size === 0) {
  throw new Error(`Unknown flags: ${process.argv.slice(2).join(" ")}`);
}

function shouldRun(name) {
  return selectedChecks.size === 0 || selectedChecks.has(name);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseQuotedList(source, anchor) {
  const match = source.match(anchor);
  assert(match, `Could not parse list with pattern ${anchor}`);
  return Array.from(match[1].matchAll(/"([^"]+)"/g), (item) => item[1]);
}

function parseBackendProfileTitle(source, agent) {
  const escapedAgent = agent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(
    new RegExp(`${escapedAgent}:\\s*\\{[\\s\\S]*?title:\\s*"([^"]+)"`, "m"),
  );
  return match?.[1] || null;
}

function parsePythonDictValue(source, dictName) {
  const match = source.match(new RegExp(`${dictName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\}`, "m"));
  assert(match, `Could not parse ${dictName} from scheduler`);
  const values = {};
  for (const [, key, value] of match[1].matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
    values[key] = value;
  }
  return values;
}

function getSkillFiles(agent) {
  const skillsDir = join(AGENTS_DIR, agent, "skills");
  assert(existsSync(skillsDir), `${agent} is missing skills directory`);
  return readdirSync(skillsDir).filter((file) => file.endsWith(".md")).sort();
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function checkSoulMemory() {
  for (const agent of EXPECTED_ROSTER) {
    const soulPath = join(AGENTS_DIR, agent, "SOUL.md");
    const memoryPath = join(AGENTS_DIR, agent, "memory", "MEMORY.md");
    const mcpPath = join(AGENTS_DIR, agent, "mcp.json");
    assert(existsSync(soulPath), `${agent} missing SOUL.md`);
    assert(existsSync(memoryPath), `${agent} missing memory/MEMORY.md`);
    assert(existsSync(mcpPath), `${agent} missing mcp.json`);
  }
}

function checkRoleMap() {
  const backendSource = readFileSync(BACKEND_FILE, "utf8");
  const schedulerSource = readFileSync(SCHEDULER_FILE, "utf8");
  const schedulerRoles = parsePythonDictValue(schedulerSource, "AGENT_ROLES");

  for (const [agent, title] of Object.entries(EXPECTED_ROLE_MAP)) {
    assert(parseBackendProfileTitle(backendSource, agent) === title, `Backend role mismatch for ${agent}`);
    assert(schedulerRoles[agent] === title, `Scheduler role mismatch for ${agent}`);
  }
}

function checkMkgFields() {
  for (const agent of EXPECTED_ROSTER) {
    const soulText = readFileSync(join(AGENTS_DIR, agent, "SOUL.md"), "utf8");
    for (const marker of ["**reads_from_mkg**", "**writes_to_mkg**", "**triggers_agents**"]) {
      assert(soulText.includes(marker), `${agent} SOUL.md missing ${marker}`);
    }
  }
}

function checkMcpConnectors() {
  const mcpRouter = readFileSync(MCP_ROUTER_FILE, "utf8");
  const connectors = new Set(
    Array.from(
      mcpRouter.matchAll(/^\s*([a-z0-9_]+):\s+'[^']+'/gm),
      (match) => match[1],
    ),
  );
  for (const agent of EXPECTED_ROSTER) {
    const mcp = loadJson(join(AGENTS_DIR, agent, "mcp.json"));
    for (const connector of mcp.connectors || []) {
      assert(connectors.has(connector), `${agent} declares unknown connector ${connector}`);
    }
  }
}

function checkSkillsOrder() {
  for (const agent of EXPECTED_ROSTER) {
    const files = getSkillFiles(agent);
    assert(files.length >= 1, `${agent} has no skills`);
    assert(files[0] === "00-product-marketing-context.md", `${agent} does not load product marketing context first`);
  }
}

function checkSkillProvenance() {
  assert(existsSync(SKILLS_MANIFEST_FILE), "skills-manifest.json missing");
  const manifest = loadJson(SKILLS_MANIFEST_FILE);
  const manifestAgents = new Map(manifest.agents.map((entry) => [entry.agent, entry]));

  for (const agent of EXPECTED_ROSTER.filter((name) => name !== "veena")) {
    const entry = manifestAgents.get(agent);
    assert(entry, `skills-manifest.json missing ${agent}`);
    const files = getSkillFiles(agent);
    assert(
      JSON.stringify(entry.local_skills) === JSON.stringify(files),
      `skills-manifest local_skills drift for ${agent}`,
    );
    assert(
      Array.isArray(entry.sources) && entry.sources.length === files.length,
      `skills-manifest sources mismatch for ${agent}`,
    );
    for (const source of entry.sources) {
      assert(files.includes(source.local_file), `${agent} manifest references missing file ${source.local_file}`);
      assert(
        typeof source.marketingskills_name === "string" && source.marketingskills_name.trim(),
        `${agent} manifest missing marketingskills_name`,
      );
      assert(
        typeof source.provenance === "string" && source.provenance.trim(),
        `${agent} manifest missing provenance`,
      );
    }
  }
}

function checkBackendRoster() {
  const source = readFileSync(BACKEND_FILE, "utf8");
  const roster = parseQuotedList(source, /const VALID_AGENTS = new Set\(\[([\s\S]*?)\]\);/);
  assert(JSON.stringify(roster) === JSON.stringify(EXPECTED_ROSTER), "Backend VALID_AGENTS roster mismatch");
  for (const agent of EXPECTED_ROSTER) {
    if (agent === "veena") {
      continue;
    }
    assert(Boolean(parseBackendProfileTitle(source, agent)), `Backend AGENT_PROFILES missing ${agent}`);
  }
}

function checkScheduler() {
  const source = readFileSync(SCHEDULER_FILE, "utf8");
  const roles = parsePythonDictValue(source, "AGENT_ROLES");
  const crews = parsePythonDictValue(source, "AGENT_CREWS");
  for (const agent of EXPECTED_ROSTER) {
    assert(Boolean(roles[agent]), `Scheduler role map missing ${agent}`);
    assert(Boolean(crews[agent]), `Scheduler crew map missing ${agent}`);
  }
}

function checkSchedulerPromptPath() {
  const source = readFileSync(SCHEDULER_FILE, "utf8");
  assert(source.includes("load_skills(agent_name)"), "Scheduler does not load skills");
  assert(source.includes("build_system_context("), "Scheduler does not assemble full system context");
  assert(
    source.includes('00-product-marketing-context.md is first'),
    "Scheduler skill loader does not document the 00-product-marketing-context.md ordering",
  );
}

function checkScheduleMatrix() {
  assert(existsSync(SCHEDULE_MATRIX_FILE), "schedule-matrix.json missing");
  const matrix = loadJson(SCHEDULE_MATRIX_FILE);
  assert(matrix.timezone === "Asia/Kolkata", "schedule-matrix timezone must be Asia/Kolkata");
  const entries = Array.isArray(matrix.agents) ? matrix.agents : [];
  assert(entries.length === EXPECTED_ROSTER.length, "schedule-matrix roster size mismatch");
  const seen = new Set();
  for (const entry of entries) {
    assert(EXPECTED_ROSTER.includes(entry.agent), `Unexpected agent in schedule-matrix: ${entry.agent}`);
    assert(entry.phase4_role === EXPECTED_ROLE_MAP[entry.agent], `schedule-matrix role mismatch for ${entry.agent}`);
    assert(["daily_monitor", "weekly_brief", "event_driven"].includes(entry.cadence_type), `Invalid cadence_type for ${entry.agent}`);
    if (entry.cadence_type === "event_driven") {
      assert(entry.cron_ist === null, `${entry.agent} event_driven entries must have null cron_ist`);
    } else {
      assert(typeof entry.cron_ist === "string" && entry.cron_ist.trim(), `${entry.agent} missing cron_ist`);
    }
    assert(typeof entry.task_type === "string" && entry.task_type.trim(), `${entry.agent} missing task_type`);
    assert(typeof entry.rationale === "string" && entry.rationale.trim(), `${entry.agent} missing rationale`);
    seen.add(entry.agent);
  }
  assert(seen.size === EXPECTED_ROSTER.length, "schedule-matrix does not cover full roster");
}

const checks = [
  ["soulMemory", checkSoulMemory],
  ["roleMap", checkRoleMap],
  ["mkgFields", checkMkgFields],
  ["mcpConnectors", checkMcpConnectors],
  ["skillsOrder", checkSkillsOrder],
  ["skillProvenance", checkSkillProvenance],
  ["backendRoster", checkBackendRoster],
  ["scheduler", checkScheduler],
  ["schedulerPromptPath", checkSchedulerPromptPath],
  ["scheduleMatrix", checkScheduleMatrix],
];

for (const [name, fn] of checks) {
  if (shouldRun(name)) {
    fn();
    console.log(`ok ${name}`);
  }
}
