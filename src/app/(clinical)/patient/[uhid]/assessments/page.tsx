"use client";
import { useParams } from "next/navigation";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  ClipboardCheck,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

// --- Types ---

interface Assessment {
  id: string;
  assessmentType: string;
  data: Record<string, unknown>;
  assessedBy: string;
  assessedAt: string;
}

interface PatientData {
  encounters: Array<{ id: string; status: string }>;
}

// --- Constants ---

const assessmentTypes = [
  { value: "fall_risk", label: "Fall Risk" },
  { value: "pressure_ulcer", label: "Pressure Ulcer" },
  { value: "pain", label: "Pain" },
  { value: "gcs", label: "GCS" },
  { value: "restraint", label: "Restraint" },
] as const;

type AssessmentType = (typeof assessmentTypes)[number]["value"];

function getTypeBadgeColor(type: string): string {
  switch (type) {
    case "fall_risk":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "pressure_ulcer":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    case "pain":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "gcs":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "restraint":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

function getTypeLabel(type: string): string {
  return (
    assessmentTypes.find((t) => t.value === type)?.label ??
    type.replace(/_/g, " ")
  );
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFieldValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "--";
  return String(value);
}

// --- Component ---

export default function AssessmentsPage({
  params,
}: {
  params: Promise<{ uhid: string }>;
}) {
  const { uhid } = useParams<{ uhid: string }>();

  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [noAdmission, setNoAdmission] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<AssessmentType>("fall_risk");
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const patientRes = await fetch(`/api/patients/${uhid}`);
      if (!patientRes.ok) throw new Error("Failed to load patient");
      const patient: PatientData = await patientRes.json();
      const active = patient.encounters.find((e) => e.status === "admitted");
      if (!active) {
        setNoAdmission(true);
        setLoading(false);
        return;
      }
      setEncounterId(active.id);

      const assessRes = await fetch(
        `/api/encounters/${active.id}/assessments`
      );
      if (!assessRes.ok) throw new Error("Failed to load assessments");
      const data: Assessment[] = await assessRes.json();
      setAssessments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [uhid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset form data when type changes
  useEffect(() => {
    setFormData(getDefaultFormData(selectedType));
  }, [selectedType]);

  function getDefaultFormData(
    type: AssessmentType
  ): Record<string, string | boolean> {
    switch (type) {
      case "fall_risk":
        return {
          mobility: "independent",
          mental_status: "alert",
          fall_history: false,
          score: "",
        };
      case "pressure_ulcer":
        return {
          braden_score: "",
          skin_integrity: "intact",
          location: "",
        };
      case "pain":
        return {
          pain_score: "",
          location: "",
          character: "sharp",
          interventions: "",
        };
      case "gcs":
        return {
          eye_opening: "",
          verbal_response: "",
          motor_response: "",
          total: "",
        };
      case "restraint":
        return {
          type: "soft",
          reason: "",
          location: "",
          circulation_check: false,
        };
      default:
        return {};
    }
  }

  function handleFieldChange(field: string, value: string | boolean) {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-calculate GCS total
      if (selectedType === "gcs") {
        const eye = parseInt(String(next.eye_opening)) || 0;
        const verbal = parseInt(String(next.verbal_response)) || 0;
        const motor = parseInt(String(next.motor_response)) || 0;
        if (eye > 0 && verbal > 0 && motor > 0) {
          next.total = String(eye + verbal + motor);
        }
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!encounterId) return;
    setSubmitting(true);

    // Convert form data to proper types for API
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === "boolean") {
        data[key] = value;
      } else if (value !== "") {
        // Try to parse numeric values
        const num = Number(value);
        data[key] = isNaN(num) ? value : num;
      }
    }

    try {
      const res = await fetch(
        `/api/encounters/${encounterId}/assessments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentType: selectedType,
            data,
          }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error ||
            "Failed to create assessment"
        );
      }
      setShowForm(false);
      setSelectedType("fall_risk");
      setFormData(getDefaultFormData("fall_risk"));
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create assessment"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (noAdmission) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 text-lg font-semibold text-foreground">
          No Active Admission
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This patient does not have an active admission. Assessments can only
          be recorded during an active encounter.
        </p>
      </div>
    );
  }

  if (error && assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h3 className="mt-3 text-lg font-semibold text-foreground">Error</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  // Group assessments by type, most recent first
  const grouped = assessmentTypes.reduce(
    (acc, t) => {
      const items = assessments
        .filter((a) => a.assessmentType === t.value)
        .sort(
          (a, b) =>
            new Date(b.assessedAt).getTime() -
            new Date(a.assessedAt).getTime()
        );
      if (items.length > 0) {
        acc.push({ type: t.value, label: t.label, items });
      }
      return acc;
    },
    [] as { type: string; label: string; items: Assessment[] }[]
  );

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          Nursing Assessments
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Assessment
            </>
          )}
        </button>
      </div>

      {/* New Assessment Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">
            Record New Assessment
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Assessment Type */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Assessment Type
              </label>
              <select
                value={selectedType}
                onChange={(e) =>
                  setSelectedType(e.target.value as AssessmentType)
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {assessmentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic fields based on assessment type */}
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {getTypeLabel(selectedType)} Details
              </h4>

              {selectedType === "fall_risk" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Mobility
                    </label>
                    <select
                      value={String(formData.mobility ?? "independent")}
                      onChange={(e) =>
                        handleFieldChange("mobility", e.target.value)
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="independent">Independent</option>
                      <option value="assisted">Assisted</option>
                      <option value="immobile">Immobile</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Mental Status
                    </label>
                    <select
                      value={String(formData.mental_status ?? "alert")}
                      onChange={(e) =>
                        handleFieldChange("mental_status", e.target.value)
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="alert">Alert</option>
                      <option value="confused">Confused</option>
                      <option value="sedated">Sedated</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={!!formData.fall_history}
                        onChange={(e) =>
                          handleFieldChange("fall_history", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Fall History
                    </label>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Score
                    </label>
                    <input
                      type="number"
                      value={String(formData.score ?? "")}
                      onChange={(e) =>
                        handleFieldChange("score", e.target.value)
                      }
                      placeholder="0"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {selectedType === "pressure_ulcer" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Braden Score (6-23)
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="23"
                      value={String(formData.braden_score ?? "")}
                      onChange={(e) =>
                        handleFieldChange("braden_score", e.target.value)
                      }
                      placeholder="23"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Skin Integrity
                    </label>
                    <select
                      value={String(formData.skin_integrity ?? "intact")}
                      onChange={(e) =>
                        handleFieldChange("skin_integrity", e.target.value)
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="intact">Intact</option>
                      <option value="stage1">Stage 1</option>
                      <option value="stage2">Stage 2</option>
                      <option value="stage3">Stage 3</option>
                      <option value="stage4">Stage 4</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Location
                    </label>
                    <input
                      type="text"
                      value={String(formData.location ?? "")}
                      onChange={(e) =>
                        handleFieldChange("location", e.target.value)
                      }
                      placeholder="e.g., Sacrum, Heel"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {selectedType === "pain" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Pain Score (0-10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={String(formData.pain_score ?? "")}
                      onChange={(e) =>
                        handleFieldChange("pain_score", e.target.value)
                      }
                      placeholder="0"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Location
                    </label>
                    <input
                      type="text"
                      value={String(formData.location ?? "")}
                      onChange={(e) =>
                        handleFieldChange("location", e.target.value)
                      }
                      placeholder="e.g., Lower back, Abdomen"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Character
                    </label>
                    <select
                      value={String(formData.character ?? "sharp")}
                      onChange={(e) =>
                        handleFieldChange("character", e.target.value)
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="sharp">Sharp</option>
                      <option value="dull">Dull</option>
                      <option value="burning">Burning</option>
                      <option value="aching">Aching</option>
                      <option value="throbbing">Throbbing</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Interventions
                    </label>
                    <input
                      type="text"
                      value={String(formData.interventions ?? "")}
                      onChange={(e) =>
                        handleFieldChange("interventions", e.target.value)
                      }
                      placeholder="e.g., Analgesic given, ice pack"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {selectedType === "gcs" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Eye Opening (1-4)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={String(formData.eye_opening ?? "")}
                      onChange={(e) =>
                        handleFieldChange("eye_opening", e.target.value)
                      }
                      placeholder="4"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Verbal Response (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={String(formData.verbal_response ?? "")}
                      onChange={(e) =>
                        handleFieldChange("verbal_response", e.target.value)
                      }
                      placeholder="5"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Motor Response (1-6)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={String(formData.motor_response ?? "")}
                      onChange={(e) =>
                        handleFieldChange("motor_response", e.target.value)
                      }
                      placeholder="6"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Total (auto)
                    </label>
                    <input
                      type="number"
                      value={String(formData.total ?? "")}
                      readOnly
                      className="w-full rounded-lg border bg-muted px-3 py-2 text-sm font-semibold text-foreground"
                    />
                  </div>
                </div>
              )}

              {selectedType === "restraint" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Type
                    </label>
                    <select
                      value={String(formData.type ?? "soft")}
                      onChange={(e) =>
                        handleFieldChange("type", e.target.value)
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="soft">Soft</option>
                      <option value="hard">Hard</option>
                      <option value="chemical">Chemical</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Location
                    </label>
                    <input
                      type="text"
                      value={String(formData.location ?? "")}
                      onChange={(e) =>
                        handleFieldChange("location", e.target.value)
                      }
                      placeholder="e.g., Bilateral wrists"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={String(formData.reason ?? "")}
                      onChange={(e) =>
                        handleFieldChange("reason", e.target.value)
                      }
                      placeholder="Reason for restraint"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={!!formData.circulation_check}
                        onChange={(e) =>
                          handleFieldChange(
                            "circulation_check",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Circulation Check Done
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedType("fall_risk");
                  setFormData(getDefaultFormData("fall_risk"));
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Assessment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assessments grouped by type */}
      {grouped.length === 0 ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No assessments recorded yet.
            </p>
          </div>
        </div>
      ) : (
        grouped.map((group) => (
          <div
            key={group.type}
            className="rounded-xl border bg-card shadow-sm"
          >
            <div className="flex items-center gap-2 border-b px-5 py-3">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  getTypeBadgeColor(group.type)
                )}
              >
                {group.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {group.items.length} record
                {group.items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ul className="divide-y">
              {group.items.map((assessment) => (
                <li
                  key={assessment.id}
                  className="px-5 py-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Data fields */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {Object.entries(
                          assessment.data as Record<string, unknown>
                        ).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="text-muted-foreground">
                              {formatFieldLabel(key)}:
                            </span>{" "}
                            <span className="font-medium text-card-foreground">
                              {formatFieldValue(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {/* Meta */}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Assessed by {assessment.assessedBy} &middot;{" "}
                        {formatDateTime(assessment.assessedAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
