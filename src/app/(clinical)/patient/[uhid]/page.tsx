"use client";

import {
  Pill,
  Stethoscope,
  Activity,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const activeOrders = [
  {
    id: 1,
    drug: "Tab. Metformin 500mg",
    dose: "500mg",
    frequency: "BD (twice daily)",
    route: "Oral",
    status: "active",
  },
  {
    id: 2,
    drug: "Inj. Ceftriaxone 1g",
    dose: "1g",
    frequency: "BD",
    route: "IV",
    status: "active",
  },
  {
    id: 3,
    drug: "Tab. Pantoprazole 40mg",
    dose: "40mg",
    frequency: "OD (once daily)",
    route: "Oral",
    status: "active",
  },
  {
    id: 4,
    drug: "Tab. Paracetamol 650mg",
    dose: "650mg",
    frequency: "SOS",
    route: "Oral",
    status: "active",
  },
];

const activeDiagnoses = [
  {
    id: 1,
    name: "Type 2 Diabetes Mellitus",
    icdCode: "E11.9",
    type: "Primary",
  },
  {
    id: 2,
    name: "Community Acquired Pneumonia",
    icdCode: "J18.9",
    type: "Secondary",
  },
  {
    id: 3,
    name: "Essential Hypertension",
    icdCode: "I10",
    type: "Comorbidity",
  },
];

const latestVitals = {
  recordedAt: "2024-01-15 14:30",
  temperature: "99.2",
  pulse: "88",
  bpSystolic: "142",
  bpDiastolic: "88",
  spO2: "96",
  respiratoryRate: "20",
  painScore: "3",
};

const recentNotes = [
  {
    id: 1,
    type: "Progress",
    author: "Dr. Priya Sharma",
    time: "2024-01-15 09:00",
    snippet:
      "Patient improving. Fever subsided. Lung sounds clearer on auscultation. Continue current antibiotics for 3 more days. Monitor blood glucose closely.",
  },
  {
    id: 2,
    type: "Nursing",
    author: "Sr. Nurse Kavitha",
    time: "2024-01-15 06:00",
    snippet:
      "Patient slept well. Oral intake adequate. IV site clean, no signs of phlebitis. Morning medications administered as ordered.",
  },
  {
    id: 3,
    type: "Consultation",
    author: "Dr. Sunil Varma (Pulmonology)",
    time: "2024-01-14 16:00",
    snippet:
      "Reviewed chest X-ray. Right lower lobe consolidation noted. Suggest continuing IV Ceftriaxone. Add Azithromycin if no improvement in 48 hours.",
  },
];

// --- Component ---

export default function PatientChartSummaryPage() {
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
            </div>
            <ul className="divide-y">
              {activeOrders.map((order) => (
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
          </div>

          {/* Active Diagnoses */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-3">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-card-foreground">
                Active Diagnoses
              </h3>
            </div>
            <ul className="divide-y">
              {activeDiagnoses.map((dx) => (
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
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    ICD-10: {dx.icdCode}
                  </p>
                </li>
              ))}
            </ul>
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
              <span className="text-xs text-muted-foreground">
                {latestVitals.recordedAt}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-5">
              <VitalItem
                label="Temp"
                value={`${latestVitals.temperature}°F`}
                alert={parseFloat(latestVitals.temperature) >= 99}
              />
              <VitalItem label="Pulse" value={`${latestVitals.pulse}/min`} />
              <VitalItem
                label="BP"
                value={`${latestVitals.bpSystolic}/${latestVitals.bpDiastolic}`}
                alert={parseInt(latestVitals.bpSystolic) >= 140}
              />
              <VitalItem
                label="SpO2"
                value={`${latestVitals.spO2}%`}
                alert={parseInt(latestVitals.spO2) < 95}
              />
              <VitalItem
                label="RR"
                value={`${latestVitals.respiratoryRate}/min`}
              />
              <VitalItem
                label="Pain"
                value={`${latestVitals.painScore}/10`}
              />
            </div>
          </div>

          {/* Recent Notes */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b px-5 py-3">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-card-foreground">
                Recent Notes
              </h3>
            </div>
            <ul className="divide-y">
              {recentNotes.map((note) => (
                <li key={note.id} className="px-5 py-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {note.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {note.time}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-card-foreground line-clamp-2">
                    {note.snippet}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {note.author}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalItem({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-bold",
          alert ? "text-red-600" : "text-card-foreground"
        )}
      >
        {value}
      </p>
      {alert && (
        <AlertTriangle className="mx-auto mt-0.5 h-3.5 w-3.5 text-red-500" />
      )}
    </div>
  );
}
