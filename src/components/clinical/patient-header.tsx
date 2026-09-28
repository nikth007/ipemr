"use client";

import { AlertTriangle } from "lucide-react";
import { cn, getAge } from "@/lib/utils";

interface PatientData {
  uhid: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  allergies: string;
  encounterStatus: string;
  bedNumber: string;
  wardName: string;
  attendingDoctor: string;
  ipNo: string;
  admissionDate: string;
}

interface PatientHeaderProps {
  patient: PatientData;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const age = getAge(patient.dateOfBirth);

  return (
    <div className="sticky top-0 z-20 border-b bg-card px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Patient Info */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {patient.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-card-foreground">
                {patient.name}
              </h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                  patient.encounterStatus === "admitted"
                    ? "bg-blue-100 text-blue-800"
                    : patient.encounterStatus === "discharged"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-emerald-100 text-emerald-800"
                )}
              >
                {patient.encounterStatus}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span>
                {age} / {patient.gender}
              </span>
              <span className="font-mono text-xs">{patient.uhid}</span>
              <span className="font-mono text-xs">{patient.ipNo}</span>
              <span>Blood: {patient.bloodGroup}</span>
            </div>
          </div>
        </div>

        {/* Ward & Doctor */}
        <div className="text-right text-sm">
          <p className="font-medium text-card-foreground">
            {patient.wardName} &middot; Bed {patient.bedNumber}
          </p>
          <p className="text-muted-foreground">{patient.attendingDoctor}</p>
          <p className="text-xs text-muted-foreground">
            Admitted:{" "}
            {new Date(patient.admissionDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Allergy Banner */}
      {patient.allergies && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span>
            <strong>Allergies:</strong> {patient.allergies}
          </span>
        </div>
      )}
    </div>
  );
}
