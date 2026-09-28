"use client";

import { Plus } from "lucide-react";
import { VitalsChart } from "@/components/clinical/vitals-chart";

// Mock vitals data over 3 days (10 readings)
const vitalsData = [
  {
    id: 1,
    dateTime: "2024-01-13 06:00",
    temp: 100.4,
    pulse: 98,
    bpSystolic: 148,
    bpDiastolic: 92,
    spO2: 94,
    rr: 22,
    pain: 5,
    gcs: 15,
    recordedBy: "Sr. Nurse Kavitha",
  },
  {
    id: 2,
    dateTime: "2024-01-13 14:00",
    temp: 101.2,
    pulse: 102,
    bpSystolic: 150,
    bpDiastolic: 94,
    spO2: 93,
    rr: 24,
    pain: 6,
    gcs: 15,
    recordedBy: "Nurse Preethi",
  },
  {
    id: 3,
    dateTime: "2024-01-13 22:00",
    temp: 100.8,
    pulse: 96,
    bpSystolic: 146,
    bpDiastolic: 90,
    spO2: 94,
    rr: 22,
    pain: 5,
    gcs: 15,
    recordedBy: "Nurse Deepa",
  },
  {
    id: 4,
    dateTime: "2024-01-14 06:00",
    temp: 100.0,
    pulse: 92,
    bpSystolic: 144,
    bpDiastolic: 88,
    spO2: 95,
    rr: 20,
    pain: 4,
    gcs: 15,
    recordedBy: "Sr. Nurse Kavitha",
  },
  {
    id: 5,
    dateTime: "2024-01-14 14:00",
    temp: 99.6,
    pulse: 90,
    bpSystolic: 142,
    bpDiastolic: 88,
    spO2: 95,
    rr: 20,
    pain: 4,
    gcs: 15,
    recordedBy: "Nurse Preethi",
  },
  {
    id: 6,
    dateTime: "2024-01-14 22:00",
    temp: 99.4,
    pulse: 88,
    bpSystolic: 140,
    bpDiastolic: 86,
    spO2: 96,
    rr: 18,
    pain: 3,
    gcs: 15,
    recordedBy: "Nurse Deepa",
  },
  {
    id: 7,
    dateTime: "2024-01-15 06:00",
    temp: 99.0,
    pulse: 86,
    bpSystolic: 138,
    bpDiastolic: 86,
    spO2: 96,
    rr: 18,
    pain: 3,
    gcs: 15,
    recordedBy: "Sr. Nurse Kavitha",
  },
  {
    id: 8,
    dateTime: "2024-01-15 10:00",
    temp: 99.2,
    pulse: 88,
    bpSystolic: 142,
    bpDiastolic: 88,
    spO2: 96,
    rr: 20,
    pain: 3,
    gcs: 15,
    recordedBy: "Nurse Preethi",
  },
  {
    id: 9,
    dateTime: "2024-01-15 14:30",
    temp: 98.8,
    pulse: 84,
    bpSystolic: 136,
    bpDiastolic: 84,
    spO2: 97,
    rr: 18,
    pain: 2,
    gcs: 15,
    recordedBy: "Nurse Preethi",
  },
  {
    id: 10,
    dateTime: "2024-01-15 18:00",
    temp: 98.6,
    pulse: 82,
    bpSystolic: 134,
    bpDiastolic: 82,
    spO2: 97,
    rr: 16,
    pain: 2,
    gcs: 15,
    recordedBy: "Nurse Deepa",
  },
];

export default function VitalsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Vitals</h2>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Record Vitals
        </button>
      </div>

      {/* Chart */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">
          Vitals Trend (Last 3 Days)
        </h3>
        <VitalsChart data={vitalsData} />
      </div>

      {/* Vitals Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-3">
          <h3 className="font-semibold text-card-foreground">
            All Vitals Entries
          </h3>
        </div>
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vitalsData.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-card-foreground">
                    {row.dateTime}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={
                        row.temp >= 99.5
                          ? "font-semibold text-red-600"
                          : "text-card-foreground"
                      }
                    >
                      {row.temp.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={
                        row.pulse > 100
                          ? "font-semibold text-red-600"
                          : "text-card-foreground"
                      }
                    >
                      {row.pulse}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={
                        row.bpSystolic >= 140
                          ? "font-semibold text-red-600"
                          : "text-card-foreground"
                      }
                    >
                      {row.bpSystolic}/{row.bpDiastolic}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={
                        row.spO2 < 95
                          ? "font-semibold text-red-600"
                          : "text-card-foreground"
                      }
                    >
                      {row.spO2}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-card-foreground">
                    {row.rr}
                  </td>
                  <td className="px-4 py-3 text-center text-card-foreground">
                    {row.pain}/10
                  </td>
                  <td className="px-4 py-3 text-center text-card-foreground">
                    {row.gcs}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {row.recordedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
