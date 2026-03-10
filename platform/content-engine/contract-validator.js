/**
 * contract-validator.js
 * Utilities for extracting and validating AgentRunOutput from LLM text.
 * No external dependencies. ESM module.
 *
 * AgentRunOutput shape (CONTRACT-01):
 * {
 *   agent:            string (non-empty)        — agent name
 *   task:             string (non-empty)        — one-line task description
 *   company_id:       string | null             — may be null if not provided by caller
 *   run_id:           string (non-empty)        — UUID
 *   timestamp:        string (non-empty)        — ISO 8601
 *   input: {
 *     mkg_version:        string | null
 *     dependencies_read:  array
 *     assumptions_made:   array
 *   }
 *   artifact: {
 *     data:       object
 *     summary:    string (non-empty)
 *     confidence: number, 0.0–1.0 inclusive
 *   }
 *   context_patch: {
 *     writes_to:  array
 *     patch:      object
 *   }
 *   handoff_notes:      string (may be empty)
 *   missing_data:       array
 *   tasks_created:      array of { task_type, agent_name, description, priority }
 *   outcome_prediction: any (optional, may be null)
 * }
 */

const SENTINEL = "---CONTRACT---";

/**
 * extractContract(fullText)
 * Finds the LAST occurrence of ---CONTRACT--- in fullText, extracts the JSON
 * block that follows it, trims trailing content after the final closing brace,
 * and returns the parsed object. Returns null on any failure.
 *
 * Uses lastIndexOf (not indexOf) to guard against LLM outputting the sentinel
 * mid-response. Trims trailing markdown after the closing brace to guard against
 * LLM adding courtesy text after the JSON block.
 */
export function extractContract(fullText) {
  if (typeof fullText !== "string") return null;
  const idx = fullText.lastIndexOf(SENTINEL);
  if (idx === -1) return null;
  let jsonStr = fullText.slice(idx + SENTINEL.length).trim();
  const lastBrace = jsonStr.lastIndexOf("}");
  if (lastBrace === -1) return null;
  jsonStr = jsonStr.slice(0, lastBrace + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * validateContract(obj)
 * Returns { valid: boolean, errors: string[] }.
 * Validates the 12 required top-level fields and nested shapes.
 * company_id is permitted to be null (caller may not have sent it).
 */
export function validateContract(obj) {
  const errors = [];

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { valid: false, errors: ["contract must be a non-null object"] };
  }

  // Required non-empty string fields (company_id is allowed null)
  for (const f of ["agent", "task", "run_id", "timestamp"]) {
    if (typeof obj[f] !== "string" || !obj[f].trim()) {
      errors.push(`${f} must be a non-empty string`);
    }
  }

  // company_id: string or null
  if (obj.company_id !== null && obj.company_id !== undefined) {
    if (typeof obj.company_id !== "string") {
      errors.push("company_id must be a string or null");
    }
  }

  // input object
  if (!obj.input || typeof obj.input !== "object" || Array.isArray(obj.input)) {
    errors.push("input must be an object");
  } else {
    if (!Array.isArray(obj.input.dependencies_read)) {
      errors.push("input.dependencies_read must be an array");
    }
    if (!Array.isArray(obj.input.assumptions_made)) {
      errors.push("input.assumptions_made must be an array");
    }
  }

  // artifact object
  if (!obj.artifact || typeof obj.artifact !== "object" || Array.isArray(obj.artifact)) {
    errors.push("artifact must be an object");
  } else {
    if (
      typeof obj.artifact.confidence !== "number" ||
      obj.artifact.confidence < 0 ||
      obj.artifact.confidence > 1
    ) {
      errors.push("artifact.confidence must be a number between 0.0 and 1.0");
    }
    if (typeof obj.artifact.summary !== "string" || !obj.artifact.summary.trim()) {
      errors.push("artifact.summary must be a non-empty string");
    }
    if (!obj.artifact.data || typeof obj.artifact.data !== "object" || Array.isArray(obj.artifact.data)) {
      errors.push("artifact.data must be an object");
    }
  }

  // context_patch object
  if (
    !obj.context_patch ||
    typeof obj.context_patch !== "object" ||
    Array.isArray(obj.context_patch)
  ) {
    errors.push("context_patch must be an object");
  } else {
    if (!Array.isArray(obj.context_patch.writes_to)) {
      errors.push("context_patch.writes_to must be an array");
    }
    if (
      !obj.context_patch.patch ||
      typeof obj.context_patch.patch !== "object" ||
      Array.isArray(obj.context_patch.patch)
    ) {
      errors.push("context_patch.patch must be an object");
    }
  }

  // handoff_notes: string (may be empty)
  if (typeof obj.handoff_notes !== "string") {
    errors.push("handoff_notes must be a string");
  }

  // arrays
  if (!Array.isArray(obj.missing_data)) {
    errors.push("missing_data must be an array");
  }
  if (!Array.isArray(obj.tasks_created)) {
    errors.push("tasks_created must be an array");
  } else {
    // Validate each tasks_created item has required fields
    obj.tasks_created.forEach((t, i) => {
      if (!t || typeof t !== "object") {
        errors.push(`tasks_created[${i}] must be an object`);
      } else {
        if (typeof t.task_type !== "string" || !t.task_type.trim()) {
          errors.push(`tasks_created[${i}].task_type must be a non-empty string`);
        }
        if (typeof t.agent_name !== "string" || !t.agent_name.trim()) {
          errors.push(`tasks_created[${i}].agent_name must be a non-empty string`);
        }
      }
    });
  }

  // outcome_prediction: any value including null is valid
  // (stored inside artifact JSONB per research recommendation)

  return { valid: errors.length === 0, errors };
}
