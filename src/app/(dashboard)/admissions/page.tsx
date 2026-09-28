"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface Encounter {
  id: string;
  visNo: string;
  status: string;
  admissionDate: string;
  admissionType: string;
  chiefComplaint: string | null;
  patient: {
    uhid: string;
    name: string;
    gender: string;
    dateOfBirth: string | null;
  };
  bed: {
    bedNumber: string;
    ward: { name: string };
  } | null;
}

const statusFilters = [
  { value: "admitted", label: "Admitted" },
  { value: "discharged", label: "Discharged" },
  { value: "transferred", label: "Transferred" },
  { value: "lama", label: "LAMA" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "admitted":
      return "bg-blue-100 text-blue-800";
    case "discharged":
      return "bg-gray-100 text-gray-600";
    case "transferred":
      return "bg-amber-100 text-amber-800";
    case "lama":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdmissionsPage() {
  const [status, setStatus] = useState("admitted");
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admissions?status=${status}&limit=50`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setEncounters)
      .catch(() => setEncounters([]))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Current and past inpatient admissions
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              status === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : encounters.length === 0 ? (
        <div className="rounded-lg border bg-card px-6 py-10 text-center">
          <UserPlus className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            No {status} patients found
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    IP No
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Ward / Bed
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Admitted
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {encounters.map((enc) => (
                  <tr
                    key={enc.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                      {enc.visNo}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/patient/${enc.patient.uhid}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {enc.patient.name}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {enc.patient.uhid}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-card-foreground">
                      {enc.bed ? (
                        <>
                          {enc.bed.ward.name}{" "}
                          <span className="font-mono text-xs text-muted-foreground">
                            ({enc.bed.bedNumber})
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-3 capitalize text-card-foreground">
                      {enc.admissionType}
                    </td>
                    <td className="px-6 py-3 text-card-foreground">
                      {new Date(enc.admissionDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          getStatusBadge(enc.status)
                        )}
                      >
                        {enc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
