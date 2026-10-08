"use client";

import { use, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { PatientHeader } from "@/components/clinical/patient-header";
import { ChartTabs } from "@/components/clinical/chart-tabs";
import { getAge } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";

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

interface PatientLayoutProps {
  children: React.ReactNode;
  params: Promise<{ uhid: string }>;
}

export default function PatientLayout({ children, params }: PatientLayoutProps) {
  const { uhid } = use(params);

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPatient() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/patients/${uhid}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Patient not found");
          }
          throw new Error("Failed to load patient data");
        }
        const data: PatientDetail = await res.json();
        if (!cancelled) {
          setPatient(data);
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

    fetchPatient();
    return () => {
      cancelled = true;
    };
  }, [uhid]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-64 flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading patient chart...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-64 flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">
              Unable to load patient
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {error || "Patient data could not be retrieved."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  const activeEncounter = patient.encounters.find(
    (e) => e.status === "admitted"
  );
  const isAdmitted = !!activeEncounter;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex flex-1 flex-col overflow-y-auto">
        <PatientHeader
          patientName={patient.name}
          uhid={patient.uhid}
          age={patient.dateOfBirth ? getAge(patient.dateOfBirth) : "N/A"}
          gender={patient.gender}
          bloodGroup={patient.bloodGroup ?? "Unknown"}
          allergies={patient.allergies}
          ipNo={activeEncounter?.visNo ?? null}
          wardName={activeEncounter?.bed?.ward.name ?? null}
          bedNumber={activeEncounter?.bed?.bedNumber ?? null}
          doctorName={null}
          admissionDate={activeEncounter?.admissionDate ?? null}
          isAdmitted={isAdmitted}
        />
        <ChartTabs uhid={uhid} />
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
