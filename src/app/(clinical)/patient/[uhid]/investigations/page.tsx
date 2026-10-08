"use client";
import { useParams } from "next/navigation";

import { useEffect, useState, useCallback } from "react";
import { Loader2, AlertCircle, FlaskConical, AlertTriangle } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

interface InvestigationResult {
  id: string;
  resultData: Record<string, unknown>;
  resultStatus: string;
  isAbnormal: boolean;
  isCritical: boolean;
  reportedAt: string;
}

interface Investigation {
  orderId: string;
  orderStatus: string;
  orderedAt: string;
  investigationName: string;
  category: string;
  results: InvestigationResult[];
}

interface Encounter {
  id: string;
  status: string;
}

interface PatientData {
  encounters: Encounter[];
}

const categoryFilters = ["all", "lab", "radiology", "pathology"];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  signed: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-gray-100 text-gray-600",
};

const resultStatusColors: Record<string, string> = {
  preliminary: "bg-amber-100 text-amber-800",
  final: "bg-emerald-100 text-emerald-800",
  amended: "bg-purple-100 text-purple-800",
};

export default function InvestigationsPage() {
  const { uhid } = useParams<{ uhid: string }>();

  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const patientRes = await fetch(`/api/patients/${uhid}`);
      if (!patientRes.ok) throw new Error("Failed to load patient");
      const patient: PatientData = await patientRes.json();
      const active = patient.encounters.find((e) => e.status === "admitted");
      if (!active) {
        setEncounterId(null);
        setInvestigations([]);
        setLoading(false);
        return;
      }
      setEncounterId(active.id);

      const res = await fetch(`/api/encounters/${active.id}/investigations`);
      if (!res.ok) throw new Error("Failed to load investigations");
      const data = await res.json();
      setInvestigations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [uhid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered =
    categoryFilter === "all"
      ? investigations
      : investigations.filter(
          (inv) => inv.category.toLowerCase() === categoryFilter
        );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={fetchData}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!encounterId) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <FlaskConical className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          No active admission
        </p>
        <p className="text-xs text-muted-foreground">
          Investigation results are shown for admitted patients
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">
          Investigations
        </h2>
      </div>

      <div className="flex gap-2">
        {categoryFilters.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              categoryFilter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card px-6 py-10 text-center">
          <FlaskConical className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No investigations ordered
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inv) => (
            <div
              key={inv.orderId}
              className={cn(
                "rounded-xl border bg-card shadow-sm",
                inv.results.some((r) => r.isCritical) &&
                  "border-red-300 ring-1 ring-red-200"
              )}
            >
              <div className="flex items-start justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <FlaskConical className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-card-foreground">
                      {inv.investigationName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{inv.category}</span>
                      <span>&middot;</span>
                      <span>{formatDateTime(inv.orderedAt)}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                    statusColors[inv.orderStatus] || statusColors.draft
                  )}
                >
                  {inv.orderStatus}
                </span>
              </div>

              {inv.results.length > 0 && (
                <div className="border-t px-5 py-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Results
                  </p>
                  <div className="space-y-2">
                    {inv.results.map((result) => (
                      <div
                        key={result.id}
                        className={cn(
                          "rounded-lg border px-4 py-3",
                          result.isCritical
                            ? "border-red-200 bg-red-50"
                            : result.isAbnormal
                              ? "border-amber-200 bg-amber-50"
                              : "bg-muted/30"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {(result.isCritical || result.isAbnormal) && (
                              <AlertTriangle
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  result.isCritical
                                    ? "text-red-600"
                                    : "text-amber-600"
                                )}
                              />
                            )}
                            <div className="text-sm">
                              {typeof result.resultData === "object" &&
                              result.resultData !== null ? (
                                <div className="space-y-0.5">
                                  {Object.entries(
                                    result.resultData as Record<string, unknown>
                                  ).map(([key, val]) => (
                                    <p key={key}>
                                      <span className="font-medium text-card-foreground">
                                        {key}:
                                      </span>{" "}
                                      <span className="text-muted-foreground">
                                        {String(val)}
                                      </span>
                                    </p>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-card-foreground">
                                  {String(result.resultData)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                                resultStatusColors[result.resultStatus] ||
                                  resultStatusColors.preliminary
                              )}
                            >
                              {result.resultStatus}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Reported: {formatDateTime(result.reportedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
