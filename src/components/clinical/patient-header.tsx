"use client";

import { AlertTriangle } from "lucide-react";
import { cn, getInitials, formatDate } from "@/lib/utils";

interface PatientHeaderProps {
  patientName: string;
  uhid: string;
  age: string;
  gender: string;
  bloodGroup: string;
  allergies: string | null;
  ipNo: string | null;
  wardName: string | null;
  bedNumber: string | null;
  doctorName: string | null;
  admissionDate: string | null;
  isAdmitted: boolean;
}

export function PatientHeader({
  patientName,
  uhid,
  age,
  gender,
  bloodGroup,
  allergies,
  ipNo,
  wardName,
  bedNumber,
  doctorName,
  admissionDate,
  isAdmitted,
}: PatientHeaderProps) {
  return (
    <div className="sticky top-0 z-20 border-b bg-card px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Patient Info */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {getInitials(patientName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-card-foreground">
                {patientName}
              </h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  isAdmitted
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {isAdmitted ? "Admitted" : "Not Admitted"}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span>
                {age} / {gender}
              </span>
              <span className="font-mono text-xs">{uhid}</span>
              {ipNo && <span className="font-mono text-xs">{ipNo}</span>}
              <span>Blood: {bloodGroup}</span>
            </div>
          </div>
        </div>

        {/* Ward & Doctor */}
        {isAdmitted && (
          <div className="text-right text-sm">
            {wardName && bedNumber && (
              <p className="font-medium text-card-foreground">
                {wardName} &middot; Bed {bedNumber}
              </p>
            )}
            {doctorName && (
              <p className="text-muted-foreground">{doctorName}</p>
            )}
            {admissionDate && (
              <p className="text-xs text-muted-foreground">
                Admitted: {formatDate(admissionDate)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Allergy Banner */}
      {allergies && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span>
            <strong>Allergies:</strong> {allergies}
          </span>
        </div>
      )}
    </div>
  );
}
