"use client";
import { useParams } from "next/navigation";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  LogOut,
  Plus,
  X,
  FileText,
  Calendar,
  Pill,
} from "lucide-react";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

interface Drug {
  id: string;
  genericName: string;
  brandName: string | null;
  strength: string | null;
  form: string | null;
}

interface DischargeMedication {
  id: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  drug: { genericName: string; brandName: string | null; strength: string | null; form: string | null };
}

interface DischargeSummaryData {
  id: string;
  diagnosisSummary: string | null;
  courseInHospital: string | null;
  proceduresDone: string | null;
  conditionAtDischarge: string | null;
  instructions: string | null;
  followUpDate: string | null;
  followUpInstructions: string | null;
  preparedBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  dischargeMedications: DischargeMedication[];
}

interface MedRow {
  drugId: string;
  drugLabel: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Encounter {
  id: string;
  status: string;
}

interface PatientData {
  encounters: Encounter[];
}

const conditions = ["stable", "improved", "unchanged", "deteriorated", "critical"];

export default function DischargePage() {
  const { uhid } = useParams<{ uhid: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [encounterStatus, setEncounterStatus] = useState<string | null>(null);
  const [summary, setSummary] = useState<DischargeSummaryData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drugs, setDrugs] = useState<Drug[]>([]);

  const [diagnosisSummary, setDiagnosisSummary] = useState("");
  const [courseInHospital, setCourseInHospital] = useState("");
  const [proceduresDone, setProceduresDone] = useState("");
  const [conditionAtDischarge, setConditionAtDischarge] = useState("stable");
  const [instructions, setInstructions] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");
  const [medications, setMedications] = useState<MedRow[]>([]);
  const [drugSearch, setDrugSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const patientRes = await fetch(`/api/patients/${uhid}`);
      if (!patientRes.ok) throw new Error("Failed to load patient");
      const patient: PatientData = await patientRes.json();
      const active = patient.encounters.find(
        (e) => e.status === "admitted" || e.status === "discharged"
      );
      if (!active) {
        setEncounterId(null);
        setLoading(false);
        return;
      }
      setEncounterId(active.id);
      setEncounterStatus(active.status);

      const [dischargeRes, drugsRes] = await Promise.all([
        fetch(`/api/encounters/${active.id}/discharge`).catch(() => null),
        fetch("/api/drugs").catch(() => null),
      ]);

      if (dischargeRes?.ok) {
        const data = await dischargeRes.json();
        setSummary(data);
      }

      if (drugsRes?.ok) {
        setDrugs(await drugsRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [uhid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function addMedication(drug: Drug) {
    setMedications((prev) => [
      ...prev,
      {
        drugId: drug.id,
        drugLabel: `${drug.genericName}${drug.brandName ? ` (${drug.brandName})` : ""} ${drug.strength || ""}`.trim(),
        dose: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
    setDrugSearch("");
  }

  function removeMedication(index: number) {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMedication(index: number, field: keyof MedRow, value: string) {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!encounterId) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (diagnosisSummary) payload.diagnosisSummary = diagnosisSummary;
      if (courseInHospital) payload.courseInHospital = courseInHospital;
      if (proceduresDone) payload.proceduresDone = proceduresDone;
      if (conditionAtDischarge) payload.conditionAtDischarge = conditionAtDischarge;
      if (instructions) payload.instructions = instructions;
      if (followUpDate) payload.followUpDate = new Date(followUpDate).toISOString();
      if (followUpInstructions) payload.followUpInstructions = followUpInstructions;
      if (medications.length > 0) {
        payload.dischargeMedications = medications.map((m) => ({
          drugId: m.drugId,
          dose: m.dose,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions || undefined,
        }));
      }

      const res = await fetch(`/api/encounters/${encounterId}/discharge`, {
        method: summary ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save discharge summary");
      }

      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredDrugs = drugSearch.length >= 2
    ? drugs.filter(
        (d) =>
          d.genericName.toLowerCase().includes(drugSearch.toLowerCase()) ||
          (d.brandName?.toLowerCase().includes(drugSearch.toLowerCase()) ?? false)
      ).slice(0, 8)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !showForm) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={fetchData} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Retry
        </button>
      </div>
    );
  }

  if (!encounterId) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <LogOut className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">No active admission</p>
        <p className="text-xs text-muted-foreground">Discharge summary is available for admitted patients</p>
      </div>
    );
  }

  if (summary && !showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">Discharge Summary</h2>
          {encounterStatus === "admitted" && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="h-4 w-4" />
              Edit & Finalize
            </button>
          )}
        </div>

        <div className="rounded-xl border bg-card shadow-sm divide-y">
          {summary.diagnosisSummary && (
            <div className="px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Diagnosis Summary</h3>
              <p className="mt-1 text-sm text-card-foreground whitespace-pre-wrap">{summary.diagnosisSummary}</p>
            </div>
          )}
          {summary.courseInHospital && (
            <div className="px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Course in Hospital</h3>
              <p className="mt-1 text-sm text-card-foreground whitespace-pre-wrap">{summary.courseInHospital}</p>
            </div>
          )}
          {summary.proceduresDone && (
            <div className="px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Procedures Done</h3>
              <p className="mt-1 text-sm text-card-foreground whitespace-pre-wrap">{summary.proceduresDone}</p>
            </div>
          )}
          {summary.conditionAtDischarge && (
            <div className="px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Condition at Discharge</h3>
              <p className="mt-1 text-sm capitalize text-card-foreground">{summary.conditionAtDischarge}</p>
            </div>
          )}
          {summary.instructions && (
            <div className="px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instructions</h3>
              <p className="mt-1 text-sm text-card-foreground whitespace-pre-wrap">{summary.instructions}</p>
            </div>
          )}
          {(summary.followUpDate || summary.followUpInstructions) && (
            <div className="px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Follow-up</h3>
              {summary.followUpDate && (
                <div className="mt-1 flex items-center gap-2 text-sm text-card-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(summary.followUpDate)}
                </div>
              )}
              {summary.followUpInstructions && (
                <p className="mt-1 text-sm text-card-foreground whitespace-pre-wrap">{summary.followUpInstructions}</p>
              )}
            </div>
          )}
          {summary.dischargeMedications.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Discharge Medications</h3>
              <div className="space-y-2">
                {summary.dischargeMedications.map((med) => (
                  <div key={med.id} className="flex items-start gap-3 rounded-lg border px-4 py-3">
                    <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="text-sm">
                      <p className="font-medium text-card-foreground">
                        {med.drug.genericName}
                        {med.drug.brandName && <span className="text-muted-foreground"> ({med.drug.brandName})</span>}
                      </p>
                      <p className="text-muted-foreground">
                        {med.dose} &middot; {med.frequency} &middot; {med.duration}
                      </p>
                      {med.instructions && <p className="mt-0.5 text-xs text-muted-foreground">{med.instructions}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {summary.approvedAt && (
          <p className="text-xs text-muted-foreground">
            Finalized: {formatDateTime(summary.approvedAt)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">
          {summary ? "Edit Discharge Summary" : "Prepare Discharge Summary"}
        </h2>
        {summary && (
          <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">Diagnosis Summary</label>
            <textarea value={diagnosisSummary} onChange={(e) => setDiagnosisSummary(e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">Course in Hospital</label>
            <textarea value={courseInHospital} onChange={(e) => setCourseInHospital(e.target.value)} rows={4} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">Procedures Done</label>
            <textarea value={proceduresDone} onChange={(e) => setProceduresDone(e.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">Condition at Discharge</label>
            <select value={conditionAtDischarge} onChange={(e) => setConditionAtDischarge(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm capitalize focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
              {conditions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">Instructions</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Follow-up Date</label>
              <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">Follow-up Instructions</label>
              <textarea value={followUpInstructions} onChange={(e) => setFollowUpInstructions(e.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Discharge Medications
          </h3>

          <div className="relative mb-4">
            <input
              type="text"
              value={drugSearch}
              onChange={(e) => setDrugSearch(e.target.value)}
              placeholder="Search drugs to add..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {filteredDrugs.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-card shadow-lg">
                {filteredDrugs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => addMedication(d)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-muted"
                  >
                    <span className="font-medium text-card-foreground">
                      {d.genericName} {d.strength || ""}
                    </span>
                    <span className="text-xs text-muted-foreground">{d.brandName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {medications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No medications added yet</p>
          ) : (
            <div className="space-y-3">
              {medications.map((med, i) => (
                <div key={i} className="rounded-lg border px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground">{med.drugLabel}</p>
                    <button type="button" onClick={() => removeMedication(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <input type="text" placeholder="Dose" value={med.dose} onChange={(e) => updateMedication(i, "dose", e.target.value)} className="rounded border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none" />
                    <input type="text" placeholder="Frequency" value={med.frequency} onChange={(e) => updateMedication(i, "frequency", e.target.value)} className="rounded border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none" />
                    <input type="text" placeholder="Duration" value={med.duration} onChange={(e) => updateMedication(i, "duration", e.target.value)} className="rounded border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none" />
                    <input type="text" placeholder="Instructions" value={med.instructions} onChange={(e) => updateMedication(i, "instructions", e.target.value)} className="rounded border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          {summary && (
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {summary ? "Update & Finalize Discharge" : "Save Discharge Summary"}
          </button>
        </div>
      </form>
    </div>
  );
}
