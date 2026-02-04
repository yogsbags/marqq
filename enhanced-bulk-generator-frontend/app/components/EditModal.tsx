"use client";

import { useEffect, useRef, useState } from "react";

type EditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  stageId: number;
  stageName: string;
  onSubmit: (editedData: Record<string, any>) => void;
  isContentStage?: boolean; // Stages 4 & 5 use rich text editor
};

/** Strip CSV-style double-quotes so "derivatives" displays as derivatives; also fix stray leading/trailing quotes from misaligned rows. */
function stripSurroundingQuotes(s: string): string {
  let t = s.trim();
  // Strip balanced surrounding quotes (full field quoted)
  while (t.length >= 2 && t[0] === '"' && t[t.length - 1] === '"') {
    t = t.slice(1, -1).trim();
  }
  // Strip single stray leading or trailing quote (from comma-split / misaligned columns)
  if (t.length >= 1 && t[0] === '"') t = t.slice(1).trim();
  if (t.length >= 1 && t[t.length - 1] === '"') t = t.slice(0, -1).trim();
  return t;
}

/** Normalize a value for display/edit: objects and arrays become JSON strings; JSON-like strings are pretty-printed. */
function normalizeValueForEdit(val: unknown): string | number | boolean {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return JSON.stringify(JSON.parse(val), null, 2);
      } catch {
        return stripSurroundingQuotes(val);
      }
    }
    return stripSurroundingQuotes(val);
  }
  if (typeof val === "number" || typeof val === "boolean") return val;
  return stripSurroundingQuotes(String(val));
}

/** Build a flat record suitable for the modal: all values are string, number, or boolean. */
function normalizeDataForModal(
  raw: Record<string, any>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const key of Object.keys(raw)) {
    out[key] = normalizeValueForEdit(raw[key]) as string | number | boolean;
  }
  return out;
}

export default function EditModal({
  isOpen,
  onClose,
  data,
  stageId,
  stageName,
  onSubmit,
  isContentStage = false,
}: EditModalProps) {
  const [editedData, setEditedData] = useState<
    Record<string, string | number | boolean>
  >({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialNormalizedRef = useRef<Record<
    string,
    string | number | boolean
  > | null>(null);

  useEffect(() => {
    if (isOpen && data && Object.keys(data).length > 0) {
      const normalized = normalizeDataForModal(data);
      initialNormalizedRef.current = normalized;
      setEditedData(normalized);
      setHasChanges(false);
    }
  }, [isOpen, data]);

  useEffect(() => {
    if (!initialNormalizedRef.current) return;
    const changed =
      JSON.stringify(editedData) !==
      JSON.stringify(initialNormalizedRef.current);
    setHasChanges(changed);
  }, [editedData]);

  const handleFieldChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!hasChanges) return;

    setIsSubmitting(true);
    try {
      await onSubmit(editedData);
      onClose();
    } catch (error) {
      console.error("Submit error:", error);
      alert(
        "Failed to submit changes: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderFieldEditor = (field: string, value: any) => {
    // Display value is always from editedData (normalized: objects are JSON strings)
    const displayValue = editedData[field];
    const displayStr =
      typeof displayValue === "string"
        ? displayValue
        : displayValue != null
          ? String(displayValue)
          : "";

    // Object/array: show as editable JSON (editedData[field] is already stringified)
    if (typeof value === "object" && value !== null) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            <span className="ml-2 text-xs text-amber-600">JSON</span>
          </label>
          <textarea
            value={displayStr}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none font-mono text-sm text-gray-900 bg-white placeholder-gray-400"
            placeholder="Valid JSON"
            spellCheck={false}
          />
          <span className="text-xs text-gray-500">
            {displayStr.length} characters
          </span>
        </div>
      );
    }

    // Special handling for content fields in stages 4 & 5
    const isContentField =
      isContentStage &&
      (field === "content" ||
        field === "article_body" ||
        field === "full_content" ||
        field === "markdown_content");

    // Special handling for long text fields (string only)
    const isLongTextField =
      typeof value === "string" &&
      (value.length > 200 ||
        field.toLowerCase().includes("description") ||
        field.toLowerCase().includes("summary") ||
        field.toLowerCase().includes("excerpt"));

    if (isContentField) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            <span className="ml-2 text-xs text-purple-600">
              ✨ Content Editor
            </span>
          </label>
          <textarea
            value={displayStr}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={20}
            className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm text-gray-900 bg-white placeholder-gray-400"
            placeholder={`Enter ${field.replace(/_/g, " ")}...`}
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Character count: {displayStr.length.toLocaleString()}</span>
            <span>
              Words:{" "}
              {displayStr.split(/\s+/).filter(Boolean).length.toLocaleString()}
            </span>
          </div>
        </div>
      );
    }

    if (isLongTextField) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </label>
          <textarea
            value={displayStr}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white placeholder-gray-400"
            placeholder={`Enter ${field.replace(/_/g, " ")}...`}
          />
          <span className="text-xs text-gray-500">
            {displayStr.length} characters
          </span>
        </div>
      );
    }

    if (typeof value === "number") {
      const numVal =
        typeof displayValue === "number"
          ? displayValue
          : parseFloat(displayStr) || 0;
      return (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </label>
          <input
            type="number"
            value={numVal}
            onChange={(e) =>
              handleFieldChange(field, parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
          />
        </div>
      );
    }

    if (
      typeof value === "boolean" ||
      value === "true" ||
      value === "false" ||
      value === "Yes" ||
      value === "No"
    ) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </label>
          <select
            value={String(displayValue ?? "")}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
          >
            <option value="true">Yes / True</option>
            <option value="false">No / False</option>
          </select>
        </div>
      );
    }

    // Default: text input (strings and any other primitives)
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </label>
        <input
          type="text"
          value={displayStr}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white placeholder-gray-400"
          placeholder={`Enter ${field.replace(/_/g, " ")}...`}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              ✏️ Edit {stageName} Data
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isContentStage
                ? "📝 Content Editor Mode"
                : "📊 Field Editor Mode"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {Object.entries(data).map(([field, value]) => (
              <div key={field}>{renderFieldEditor(field, value)}</div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            {hasChanges ? (
              <span className="text-sm text-amber-600 font-semibold flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Unsaved changes detected
              </span>
            ) : (
              <span className="text-sm text-gray-500">No changes</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasChanges || isSubmitting}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                hasChanges && !isSubmitting
                  ? "bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "✅ Submit Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
