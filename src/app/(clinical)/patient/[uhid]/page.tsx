"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Pill,
  Stethoscope,
  Activity,
  FileText,
  AlertTriangle,
  Loader2,
  AlertCircle,
  BedDouble,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

// --- Types ---

interface Encounter {
  id: string;
  visNo: string;
  status: string;
  admissionDate: string;
  dischargeDate: string | null;
  admissionType: string;
  chiefComplaint: string | null;
  provisionalDiagnosis: string | null;
  attendingDoctorId: string;
  bed: { bedNumber: string; ward: { name: string } } | null;
}

interface PatientDetail {
  id: string;
  uhid: string;
  name: string;
  dateOfBirth: string | null;
  gender: string;
  bloodGroup: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  abhaId: string | null;
  allergies: string | null;
  encounters: Encounter[];
}

interface Diagnosis {
  id: string;
  name: string;
  icdCode: string | null;
  type: string;
}

interface Order {
  id: string;
  drug: string;
  dose: string;
  frequency: string;
  route: string;
  status: string;
}

interface VitalReading {
  id: string;
  recordedAt: string;
  temperature: number | null;
  pulse: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  spO2: number | null;
  respiratoryRate: number | null;
  painScore: number | null;
}

interface Note {
  id: string;
  type: string;
  author: string;
  createdAt: string;
  content: string;
}

// --- Vital Alert Logic ---

function getVitalAlert(
  label: string,
  value: number | null
): "red" | "amber" | null {
  if (value === null) return null;
  switch (label) {
    case "temperature":
      return value >= 99.5 || value <= 96 ? "red" : null;
    case "pulse":
      return value > 100 || value < 60 ? "red" : null;
    case "bpSystolic":
      return value >= 140 || value <= 90 ? "red" : null;
    case "spO2":
      return value < 95 ? "red" : null;
    case "respiratoryRate":
      return value > 20 ? "amber" : null;
    case "painScore":
      return value >= 7 ? "red" : null;
    default:
      return null;
  }
}

// --- Component ---

export default function PatientChartSummaryPage() {
  const { uhid } = useParams<{ uhid: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(
    null
  );
  const [allergies, setAllergies] = useState<string | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [latestVitals, setLatestVitals] = useState<VitalReading | null>(null);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        // First fetch patient to get active encounter
        const patientRes = await fetch(`/api/patients/${uhid}`);
        if (!patientRes.ok) {
          throw new Error("Failed to load patient data");
        }
        const patient: PatientDetail = await patientRes.json();

        if (cancelled) return;

        setAllergies(patient.allergies);

        const encounter = patient.encounters.find(
          (e) => e.status === "admitted"
        );
        setActiveEncounter(encounter ?? null);

        if (!encounter) {
          setLoading(false);
          return;
        }

        // Fetch clinical data in parallel
        const [diagRes, ordersRes, vitalsRes, notesRes] = await Promise.all([
          fetch(`/api/encounters/${encounter.id}/diagnoses`).catch(() => null),
          fetch(
            `/api/orders?encounterId=${encounter.id}&status=active`
          ).catch(() => null),
          fetch(`/api/vitals?encounterId=${encounter.id}`).catch(() => null),
          fetch(`/api/notes?encounterId=${encounter.id}`).catch(() => null),
        ]);

        if (cancelled) return;

        if (diagRes?.ok) {
          const diagData = await diagRes.json();
          setDiagnoses(Array.isArray(diagData) ? diagData : diagData.data ?? []);
        }

        if (ordersRes?.ok) {
          const ordersData = await ordersRes.json();
          setOrders(
            Array.isArray(ordersData) ? ordersData : ordersData.data ?? []
          );
        }

        if (vitalsRes?.ok) {
          const vitalsData = await vitalsRes.json();
          const vitalsArr = Array.isArray(vitalsData)
            ? vitalsData
            : vitalsData.data ?? [];
          setLatestVitals(vitalsArr.length > 0 ? vitalsArr[0] : null);
        }

        if (notesRes?.ok) {
          const notesData = await notesRes.json();
          const notesArr = Array.isArray(notesData)
            ? notesData
            : notesData.data ?? [];
          setRecentNotes(notesArr.slice(0, 3));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [uhid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading chart summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">
            Failed to load summary
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!activeEncounter) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Chart Summary</h2>

        {/* Allergies banner even without admission */}
        {allergies && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>
              <strong>Allergies:</strong> {allergies}
            </span>
          </div>
        )}

        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-16 shadow-sm">
          <BedDouble className="h-12 w-12 text-muted-foreground/40" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-card-foreground">
              No Active Admission
            </h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              This patient does not have an active inpatient encounter. Clinical
              chart data such as orders, vitals, and notes will be available when
              the patient is admitted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Chart Summary</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Active Orders */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-3">
              <Pill className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-card-foreground">
                Active Medication Orders
              </h3>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {orders.length}
              </span>
            </div>
            {orders.length > 0 ? (
              <ul className="divide-y">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        {order.drug}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.dose} &middot; {order.route} &middot;{" "}
                        {order.frequency}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      {order.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No active medication orders
              </p>
            )}
          </div>

          {/* Active Diagnoses */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-3">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-card-foreground">
                Active Diagnoses
              </h3>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {diagnoses.length}
              </span>
            </div>
            {diagnoses.length > 0 ? (
              <ul className="divide-y">
                {diagnoses.map((dx) => (
                  <li key={dx.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-card-foreground">
                        {dx.name}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          dx.type === "Primary"
                            ? "bg-blue-100 text-blue-800"
                            : dx.type === "Secondary"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {dx.type}
                      </span>
                    </div>
                    {dx.icdCode && (
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        ICD-10: {dx.icdCode}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No diagnoses recorded
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Latest Vitals */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-card-foreground">
                  Latest Vitals
                </h3>
              </div>
              {latestVitals && (
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(latestVitals.recordedAt)}
                </span>
              )}
            </div>
            {latestVitals ? (
              <div className="grid grid-cols-3 gap-4 p-5">
                <VitalItem
                  label="Temp"
                  value={
                    latestVitals.temperature !== null
                      ? `${latestVitals.temperature}°F`
                      : "--"
                  }
                  alertLevel={getVitalAlert(
                    "temperature",
                    latestVitals.temperature
                  )}
                />
                <VitalItem
                  label="Pulse"
                  value={
                    latestVitals.pulse !== null
                      ? `${latestVitals.pulse}/min`
                      : "--"
                  }
                  alertLevel={getVitalAlert("pulse", latestVitals.pulse)}
                />
                <VitalItem
                  label="BP"
                  value={
                    latestVitals.bpSystolic !== null &&
                    latestVitals.bpDiastolic !== null
                      ? `${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}`
                      : "--"
                  }
                  alertLevel={getVitalAlert(
                    "bpSystolic",
                    latestVitals.bpSystolic
                  )}
                />
                <VitalItem
                  label="SpO2"
                  value={
                    latestVitals.spO2 !== null
                      ? `${latestVitals.spO2}%`
                      : "--"
                  }
                  alertLevel={getVitalAlert("spO2", latestVitals.spO2)}
                />
                <VitalItem
                  label="RR"
                  value={
                    latestVitals.respiratoryRate !== null
                      ? `${latestVitals.respiratoryRate}/min`
                      : "--"
                  }
                  alertLevel={getVitalAlert(
                    "respiratoryRate",
                    latestVitals.respiratoryRate
                  )}
                />
                <VitalItem
                  label="Pain"
                  value={
                    latestVitals.painScore !== null
                      ? `${latestVitals.painScore}/10`
                      : "--"
                  }
                  alertLevel={getVitalAlert(
                    "painScore",
                    latestVitals.painScore
                  )}
                />
              </div>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No vitals recorded
              </p>
            )}
          </div>

          {/* Recent Notes */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-3">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-card-foreground">
                Recent Notes
              </h3>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {recentNotes.length}
              </span>
            </div>
            {recentNotes.length > 0 ? (
              <ul className="divide-y">
                {recentNotes.map((note) => (
                  <li key={note.id} className="px-5 py-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {note.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(note.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-card-foreground line-clamp-2">
                      {note.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {note.author}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No notes recorded
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalItem({
  label,
  value,
  alertLevel,
}: {
  label: string;
  value: string;
  alertLevel: "red" | "amber" | null;
}) {
  return (
    <div className="text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-bold",
          alertLevel === "red"
            ? "text-red-600"
            : alertLevel === "amber"
              ? "text-amber-600"
              : "text-card-foreground"
        )}
      >
        {value}
      </p>
      {alertLevel === "red" && (
        <AlertTriangle className="mx-auto mt-0.5 h-3.5 w-3.5 text-red-500" />
      )}
      {alertLevel === "amber" && (
        <AlertTriangle className="mx-auto mt-0.5 h-3.5 w-3.5 text-amber-500" />
      )}
    </div>
  );
}
