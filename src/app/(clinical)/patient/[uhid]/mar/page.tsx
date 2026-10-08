"use client";
import { useParams } from "next/navigation";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  Pill,
  Check,
  Clock,
} from "lucide-react";
import { cn, formatDate, formatTime, formatDateTime } from "@/lib/utils";

// --- Types ---

interface Administration {
  administeredAt: string;
  doseGiven: string;
  site: string | null;
  notes: string | null;
}

interface MarRecord {
  id: string;
  scheduledTime: string;
  status: string;
  drugName: string;
  brandName: string | null;
  dose: string;
  route: string;
  frequency: string;
  administration: Administration | null;
}

interface PatientData {
  encounters: Array<{ id: string; status: string }>;
}

// --- Helpers ---

function getStatusBadge(status: string) {
  switch (status) {
    case "administered":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "due":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "held":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    case "missed":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "scheduled":
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "administered":
      return <Check className="h-3.5 w-3.5" />;
    case "due":
      return <Clock className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

function groupByDate(records: MarRecord[]): Record<string, MarRecord[]> {
  const groups: Record<string, MarRecord[]> = {};
  for (const r of records) {
    const dateKey = formatDate(r.scheduledTime);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(r);
  }
  return groups;
}

// --- Component ---

export default function MarPage() {
  const { uhid } = useParams<{ uhid: string }>();

  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [noAdmission, setNoAdmission] = useState(false);
  const [records, setRecords] = useState<MarRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Administration form
  const [adminScheduleId, setAdminScheduleId] = useState<string | null>(null);
  const [adminDose, setAdminDose] = useState("");
  const [adminSite, setAdminSite] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

      const marRes = await fetch(`/api/encounters/${active.id}/mar`);
      if (!marRes.ok) throw new Error("Failed to load MAR data");
      const data: MarRecord[] = await marRes.json();
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

  function openAdminForm(record: MarRecord) {
    setAdminScheduleId(record.id);
    setAdminDose(record.dose);
    setAdminSite("");
    setAdminNotes("");
  }

  function closeAdminForm() {
    setAdminScheduleId(null);
    setAdminDose("");
    setAdminSite("");
    setAdminNotes("");
  }

  async function handleAdminister(e: React.FormEvent) {
    e.preventDefault();
    if (!encounterId || !adminScheduleId) return;
    setSubmitting(true);

    const body: Record<string, string> = {
      scheduleId: adminScheduleId,
      doseGiven: adminDose,
    };
    if (adminSite.trim()) body.site = adminSite.trim();
    if (adminNotes.trim()) body.notes = adminNotes.trim();

    try {
      const res = await fetch(`/api/encounters/${encounterId}/mar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error ||
            "Failed to record administration"
        );
      }
      closeAdminForm();
      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record administration"
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
          <p className="text-sm">Loading MAR...</p>
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
          This patient does not have an active admission. MAR is only available
          during an active encounter.
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

  const grouped = groupByDate(records);
  const dateKeys = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
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
          Medication Administration Record
        </h2>
      </div>

      {/* Administration Form Modal */}
      {adminScheduleId && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">
            Record Administration
          </h3>
          <form onSubmit={handleAdminister} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Dose Given *
                </label>
                <input
                  type="text"
                  value={adminDose}
                  onChange={(e) => setAdminDose(e.target.value)}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Site
                </label>
                <input
                  type="text"
                  value={adminSite}
                  onChange={(e) => setAdminSite(e.target.value)}
                  placeholder="e.g., Left arm, Right deltoid"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Notes
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAdminForm}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !adminDose.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Administration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MAR Timeline grouped by date */}
      {dateKeys.length === 0 ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <Pill className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No medication schedules found.
            </p>
          </div>
        </div>
      ) : (
        dateKeys.map((dateKey) => (
          <div key={dateKey} className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3">
              <h3 className="font-semibold text-card-foreground">{dateKey}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Medication
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Dose
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Route
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Frequency
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Administration
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {grouped[dateKey].map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-card-foreground">
                        {formatTime(row.scheduledTime)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-card-foreground">
                          {row.drugName}
                        </div>
                        {row.brandName && (
                          <div className="text-xs text-muted-foreground">
                            {row.brandName}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-card-foreground">
                        {row.dose}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-card-foreground uppercase">
                        {row.route}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-card-foreground uppercase">
                        {row.frequency}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                            getStatusBadge(row.status)
                          )}
                        >
                          {getStatusIcon(row.status)}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {row.administration ? (
                          <div>
                            <div>
                              Given: {row.administration.doseGiven} at{" "}
                              {formatTime(row.administration.administeredAt)}
                            </div>
                            {row.administration.site && (
                              <div>Site: {row.administration.site}</div>
                            )}
                            {row.administration.notes && (
                              <div className="italic">
                                {row.administration.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(row.status === "scheduled" ||
                          row.status === "due") && (
                          <button
                            onClick={() => openAdminForm(row)}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            <Plus className="h-3 w-3" />
                            Administer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
