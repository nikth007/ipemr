"use client";
import { useParams } from "next/navigation";

import { useEffect, useState, useCallback } from "react";
import { Plus, Loader2, AlertCircle, X, Thermometer } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { VitalsChart } from "@/components/clinical/vitals-chart";

interface VitalRecord {
  id: string;
  recordedAt: string;
  temperature: number | null;
  pulse: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  spo2: number | null;
  respiratoryRate: number | null;
  painScore: number | null;
  gcs: number | null;
  weight: number | null;
  bloodSugar: number | null;
  notes: string | null;
  recordedBy: { name: string };
}

interface PatientData {
  encounters: Array<{ id: string; status: string }>;
}

function isAbnormal(
  field: string,
  value: number | null
): boolean {
  if (value === null) return false;
  switch (field) {
    case "temperature":
      return value >= 99.5;
    case "pulse":
      return value > 100 || value < 60;
    case "bpSystolic":
      return value >= 140 || value <= 90;
    case "spo2":
      return value < 95;
    case "respiratoryRate":
      return value > 20;
    case "painScore":
      return value >= 7;
    default:
      return false;
  }
}

function ValueCell({
  field,
  value,
  suffix,
}: {
  field: string;
  value: number | null;
  suffix?: string;
}) {
  if (value === null) return <span className="text-muted-foreground">--</span>;
  const abnormal = isAbnormal(field, value);
  return (
    <span
      className={cn(
        abnormal
          ? "font-semibold text-red-600 dark:text-red-400"
          : "text-card-foreground"
      )}
    >
      {value}
      {suffix}
    </span>
  );
}

const initialFormState = {
  temperature: "",
  pulse: "",
  bpSystolic: "",
  bpDiastolic: "",
  spo2: "",
  respiratoryRate: "",
  painScore: "",
  gcs: "",
  weight: "",
  bloodSugar: "",
  notes: "",
};

export default function VitalsPage({
  params,
}: {
  params: Promise<{ uhid: string }>;
}) {
  const { uhid } = useParams<{ uhid: string }>();

  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [noAdmission, setNoAdmission] = useState(false);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  const fetchVitals = useCallback(async (eid: string) => {
    const vitalsRes = await fetch(`/api/vitals?encounterId=${eid}`);
    if (!vitalsRes.ok) throw new Error("Failed to load vitals");
    const data: VitalRecord[] = await vitalsRes.json();
    setVitals(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const patientRes = await fetch(`/api/patients/${uhid}`);
        if (!patientRes.ok) throw new Error("Failed to load patient");
        const patient: PatientData = await patientRes.json();
        const active = patient.encounters.find(
          (e) => e.status === "admitted"
        );
        if (!active) {
          if (!cancelled) setNoAdmission(true);
          return;
        }
        if (!cancelled) setEncounterId(active.id);

        const vitalsRes = await fetch(
          `/api/vitals?encounterId=${active.id}`
        );
        if (!vitalsRes.ok) throw new Error("Failed to load vitals");
        const data: VitalRecord[] = await vitalsRes.json();
        if (!cancelled) setVitals(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [uhid]);

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!encounterId) return;
    setSubmitting(true);

    const body: Record<string, unknown> = { encounterId };
    const numericFields = [
      "temperature",
      "pulse",
      "bpSystolic",
      "bpDiastolic",
      "spo2",
      "respiratoryRate",
      "painScore",
      "gcs",
      "weight",
      "bloodSugar",
    ] as const;
    for (const field of numericFields) {
      const val = formData[field].trim();
      if (val !== "") body[field] = parseFloat(val);
    }
    if (formData.notes.trim()) body.notes = formData.notes.trim();

    try {
      const res = await fetch("/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || "Failed to record vitals"
        );
      }
      setFormData(initialFormState);
      setShowForm(false);
      if (encounterId) await fetchVitals(encounterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record vitals");
    } finally {
      setSubmitting(false);
    }
  }

  // Map API data to chart format
  const chartData = vitals
    .filter(
      (v) =>
        v.temperature !== null &&
        v.pulse !== null &&
        v.bpSystolic !== null &&
        v.bpDiastolic !== null &&
        v.spo2 !== null &&
        v.respiratoryRate !== null
    )
    .map((v) => ({
      dateTime: v.recordedAt,
      temp: v.temperature!,
      pulse: v.pulse!,
      bpSystolic: v.bpSystolic!,
      bpDiastolic: v.bpDiastolic!,
      spO2: v.spo2!,
      rr: v.respiratoryRate!,
    }))
    .sort(
      (a, b) =>
        new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading vitals...</p>
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
          This patient does not have an active admission. Vitals can only be
          recorded during an active encounter.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h3 className="mt-3 text-lg font-semibold text-foreground">Error</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const sortedVitals = [...vitals].sort(
    (a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Vitals</h2>
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
              Record Vitals
            </>
          )}
        </button>
      </div>

      {/* Record Vitals Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">
            Record New Vitals
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <FormField
                label="Temperature (°F)"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                placeholder="98.6"
                step="0.1"
              />
              <FormField
                label="Pulse (bpm)"
                name="pulse"
                value={formData.pulse}
                onChange={handleInputChange}
                placeholder="72"
              />
              <FormField
                label="BP Systolic"
                name="bpSystolic"
                value={formData.bpSystolic}
                onChange={handleInputChange}
                placeholder="120"
              />
              <FormField
                label="BP Diastolic"
                name="bpDiastolic"
                value={formData.bpDiastolic}
                onChange={handleInputChange}
                placeholder="80"
              />
              <FormField
                label="SpO2 (%)"
                name="spo2"
                value={formData.spo2}
                onChange={handleInputChange}
                placeholder="98"
                min="0"
                max="100"
              />
              <FormField
                label="Respiratory Rate"
                name="respiratoryRate"
                value={formData.respiratoryRate}
                onChange={handleInputChange}
                placeholder="16"
              />
              <FormField
                label="Pain Score (0-10)"
                name="painScore"
                value={formData.painScore}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                max="10"
              />
              <FormField
                label="GCS (3-15)"
                name="gcs"
                value={formData.gcs}
                onChange={handleInputChange}
                placeholder="15"
                min="3"
                max="15"
              />
              <FormField
                label="Weight (kg)"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="70"
                step="0.1"
              />
              <FormField
                label="Blood Sugar (mg/dL)"
                name="bloodSugar"
                value={formData.bloodSugar}
                onChange={handleInputChange}
                placeholder="100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Additional observations..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormState);
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
                Save Vitals
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">
            Vitals Trend
          </h3>
          <VitalsChart data={chartData} />
        </div>
      )}

      {/* Vitals Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-3">
          <h3 className="font-semibold text-card-foreground">
            All Vitals Entries
          </h3>
        </div>
        {sortedVitals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
            <Thermometer className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No vitals recorded yet.
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
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Temp (&deg;F)
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Pulse
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    BP
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    SpO2 (%)
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    RR
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Pain
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    GCS
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Weight
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Blood Sugar
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Recorded By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedVitals.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-card-foreground">
                      {formatDateTime(row.recordedAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ValueCell field="temperature" value={row.temperature} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ValueCell field="pulse" value={row.pulse} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.bpSystolic !== null && row.bpDiastolic !== null ? (
                        <span
                          className={cn(
                            isAbnormal("bpSystolic", row.bpSystolic)
                              ? "font-semibold text-red-600 dark:text-red-400"
                              : "text-card-foreground"
                          )}
                        >
                          {row.bpSystolic}/{row.bpDiastolic}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ValueCell field="spo2" value={row.spo2} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ValueCell
                        field="respiratoryRate"
                        value={row.respiratoryRate}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.painScore !== null ? (
                        <span
                          className={cn(
                            isAbnormal("painScore", row.painScore)
                              ? "font-semibold text-red-600 dark:text-red-400"
                              : "text-card-foreground"
                          )}
                        >
                          {row.painScore}/10
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.gcs !== null ? (
                        <span className="text-card-foreground">{row.gcs}</span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.weight !== null ? (
                        <span className="text-card-foreground">
                          {row.weight} kg
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.bloodSugar !== null ? (
                        <span className="text-card-foreground">
                          {row.bloodSugar}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.recordedBy.name}
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

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  step,
  min,
  max,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step || "1"}
        min={min}
        max={max}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
