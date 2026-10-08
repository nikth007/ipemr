"use client";
import { useParams } from "next/navigation";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  Stethoscope,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

// --- Types ---

interface Diagnosis {
  id: string;
  icdCode: string | null;
  description: string;
  type: string;
  diagnosedBy: string;
  diagnosedAt: string;
}

interface PatientData {
  encounters: Array<{ id: string; status: string }>;
}

// --- Constants ---

const diagnosisTypes = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "comorbidity", label: "Comorbidity" },
] as const;

type DiagnosisType = (typeof diagnosisTypes)[number]["value"];

function getTypeBadgeColor(type: string): string {
  switch (type) {
    case "primary":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "secondary":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    case "comorbidity":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

function getTypeLabel(type: string): string {
  return (
    diagnosisTypes.find((t) => t.value === type)?.label ??
    type.replace(/_/g, " ")
  );
}

// --- Component ---

export default function DiagnosesPage({
  params,
}: {
  params: Promise<{ uhid: string }>;
}) {
  const { uhid } = useParams<{ uhid: string }>();

  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [noAdmission, setNoAdmission] = useState(false);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formType, setFormType] = useState<DiagnosisType>("primary");
  const [formDescription, setFormDescription] = useState("");
  const [formIcdCode, setFormIcdCode] = useState("");

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

      const diagRes = await fetch(
        `/api/encounters/${active.id}/diagnoses`
      );
      if (!diagRes.ok) throw new Error("Failed to load diagnoses");
      const data: Diagnosis[] = await diagRes.json();
      setDiagnoses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [uhid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function resetForm() {
    setFormType("primary");
    setFormDescription("");
    setFormIcdCode("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!encounterId) return;
    if (!formDescription.trim()) {
      setError("Description is required");
      return;
    }
    setSubmitting(true);

    const body: Record<string, string> = {
      description: formDescription.trim(),
      type: formType,
    };
    if (formIcdCode.trim()) {
      body.icdCode = formIcdCode.trim();
    }

    try {
      const res = await fetch(
        `/api/encounters/${encounterId}/diagnoses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error ||
            "Failed to add diagnosis"
        );
      }
      resetForm();
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add diagnosis"
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
          <p className="text-sm">Loading diagnoses...</p>
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
          This patient does not have an active admission. Diagnoses can only
          be managed during an active encounter.
        </p>
      </div>
    );
  }

  if (error && diagnoses.length === 0) {
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

  // Group diagnoses by type in order: primary, secondary, comorbidity
  const typeOrder: DiagnosisType[] = ["primary", "secondary", "comorbidity"];
  const grouped = typeOrder
    .map((type) => ({
      type,
      label: getTypeLabel(type),
      items: diagnoses.filter((d) => d.type === type),
    }))
    .filter((g) => g.items.length > 0);

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
        <h2 className="text-xl font-bold text-foreground">Diagnoses</h2>
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
              Add Diagnosis
            </>
          )}
        </button>
      </div>

      {/* Add Diagnosis Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">
            Add Diagnosis
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Type
                </label>
                <select
                  value={formType}
                  onChange={(e) =>
                    setFormType(e.target.value as DiagnosisType)
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {diagnosisTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  ICD Code (optional)
                </label>
                <input
                  type="text"
                  value={formIcdCode}
                  onChange={(e) => setFormIcdCode(e.target.value)}
                  placeholder="e.g., J18.9"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Diagnosis description"
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
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
                Add Diagnosis
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Diagnoses grouped by type */}
      {grouped.length === 0 ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <Stethoscope className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No diagnoses recorded yet.
            </p>
          </div>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.type} className="rounded-xl border bg-card shadow-sm">
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
                {group.items.length} diagnosis
                {group.items.length !== 1 ? "es" : ""}
              </span>
            </div>
            <ul className="divide-y">
              {group.items.map((diagnosis) => (
                <li
                  key={diagnosis.id}
                  className={cn(
                    "px-5 py-4 transition-colors hover:bg-muted/30",
                    group.type === "primary" &&
                      "border-l-4 border-l-blue-500"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-card-foreground">
                          {diagnosis.description}
                        </p>
                        {diagnosis.icdCode && (
                          <span className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                            {diagnosis.icdCode}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Diagnosed by {diagnosis.diagnosedBy} &middot;{" "}
                        {formatDateTime(diagnosis.diagnosedAt)}
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
