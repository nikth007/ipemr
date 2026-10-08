"use client";
import { useParams } from "next/navigation";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  Droplets,
  ArrowDown,
  ArrowUp,
  Activity,
} from "lucide-react";
import { cn, formatDateTime, formatTime } from "@/lib/utils";

// --- Types ---

interface IoRecord {
  id: string;
  recordedAt: string;
  type: "intake" | "output";
  category: string;
  volumeMl: number;
  route: string | null;
  recordedBy: string;
  notes: string | null;
}

interface PatientData {
  encounters: Array<{ id: string; status: string }>;
}

type TypeFilter = "all" | "intake" | "output";

// --- Constants ---

const intakeCategories = [
  "Oral",
  "IV Fluids",
  "Blood Products",
  "NG Feed",
  "Other",
];
const outputCategories = [
  "Urine",
  "Drain",
  "Vomit",
  "Stool",
  "NG Aspirate",
  "Other",
];

// --- Component ---

export default function IoPage() {
  const { uhid } = useParams<{ uhid: string }>();

  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [noAdmission, setNoAdmission] = useState(false);
  const [records, setRecords] = useState<IoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formType, setFormType] = useState<"intake" | "output">("intake");
  const [formCategory, setFormCategory] = useState("Oral");
  const [formVolume, setFormVolume] = useState("");
  const [formRoute, setFormRoute] = useState("");
  const [formNotes, setFormNotes] = useState("");

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

      const ioRes = await fetch(`/api/encounters/${active.id}/io`);
      if (!ioRes.ok) throw new Error("Failed to load I/O records");
      const data: IoRecord[] = await ioRes.json();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [uhid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 24h summary
  const summary = useMemo(() => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recent = records.filter(
      (r) => new Date(r.recordedAt) >= twentyFourHoursAgo
    );

    const totalIntake = recent
      .filter((r) => r.type === "intake")
      .reduce((sum, r) => sum + r.volumeMl, 0);

    const totalOutput = recent
      .filter((r) => r.type === "output")
      .reduce((sum, r) => sum + r.volumeMl, 0);

    return {
      totalIntake,
      totalOutput,
      netBalance: totalIntake - totalOutput,
    };
  }, [records]);

  function resetForm() {
    setFormType("intake");
    setFormCategory("Oral");
    setFormVolume("");
    setFormRoute("");
    setFormNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!encounterId) return;
    setSubmitting(true);

    const body: Record<string, unknown> = {
      type: formType,
      category: formCategory,
      volumeMl: parseFloat(formVolume),
    };
    if (formRoute.trim()) body.route = formRoute.trim();
    if (formNotes.trim()) body.notes = formNotes.trim();

    try {
      const res = await fetch(`/api/encounters/${encounterId}/io`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error ||
            "Failed to record I/O"
        );
      }
      resetForm();
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record I/O");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = records.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading I/O records...</p>
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
          This patient does not have an active admission. I/O records are only
          available during an active encounter.
        </p>
      </div>
    );
  }

  if (error && records.length === 0) {
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

  const categories = formType === "intake" ? intakeCategories : outputCategories;

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
        <h2 className="text-xl font-bold text-foreground">Intake / Output</h2>
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
              Record I/O
            </>
          )}
        </button>
      </div>

      {/* 24h Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <ArrowDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                24h Intake
              </p>
              <p className="text-lg font-bold text-card-foreground">
                {summary.totalIntake} ml
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <ArrowUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                24h Output
              </p>
              <p className="text-lg font-bold text-card-foreground">
                {summary.totalOutput} ml
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                summary.netBalance >= 0
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              )}
            >
              <Activity
                className={cn(
                  "h-5 w-5",
                  summary.netBalance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                24h Net Balance
              </p>
              <p
                className={cn(
                  "text-lg font-bold",
                  summary.netBalance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {summary.netBalance >= 0 ? "+" : ""}
                {summary.netBalance} ml
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Record I/O Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">
            Record New I/O Entry
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Toggle */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Type
              </label>
              <div className="flex gap-1 rounded-lg border bg-muted/50 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => {
                    setFormType("intake");
                    setFormCategory("Oral");
                  }}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                    formType === "intake"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-card-foreground"
                  )}
                >
                  Intake
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType("output");
                    setFormCategory("Urine");
                  }}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                    formType === "output"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-card-foreground"
                  )}
                >
                  Output
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Volume (ml) *
                </label>
                <input
                  type="number"
                  value={formVolume}
                  onChange={(e) => setFormVolume(e.target.value)}
                  required
                  min="1"
                  placeholder="e.g., 500"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Route
                </label>
                <input
                  type="text"
                  value={formRoute}
                  onChange={(e) => setFormRoute(e.target.value)}
                  placeholder="e.g., Oral, IV line 1"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Notes
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                placeholder="Additional observations..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

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
                disabled={submitting || !formVolume}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1 w-fit">
        {(["all", "intake", "output"] as TypeFilter[]).map((key) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              typeFilter === key
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-card-foreground"
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Records Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-3">
          <h3 className="font-semibold text-card-foreground">
            I/O Records
          </h3>
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <Droplets className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No I/O records found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Date/Time
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Volume (ml)
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Route
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors hover:bg-muted/30",
                      row.type === "intake"
                        ? "border-l-4 border-l-blue-500"
                        : "border-l-4 border-l-amber-500"
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-card-foreground">
                      {formatDateTime(row.recordedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          row.type === "intake"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        )}
                      >
                        {row.type === "intake" ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUp className="h-3 w-3" />
                        )}
                        {row.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-card-foreground">
                      {row.category}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-card-foreground">
                      {row.volumeMl}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.route || "--"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                      {row.notes || "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
