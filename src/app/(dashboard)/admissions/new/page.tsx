"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Search, BedDouble } from "lucide-react";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  uhid: string;
  name: string;
  gender: string;
  phone: string | null;
}

interface Ward {
  id: string;
  name: string;
  wardType: string;
  floor: string | null;
  departmentName: string;
  availableBeds: number;
}

interface Bed {
  id: string;
  bedNumber: string;
  wardName: string;
  wardId: string;
  status: string;
  bedType: string;
}

interface Doctor {
  id: string;
  name: string;
  designation: string | null;
  department: { name: string } | null;
}

export default function NewAdmissionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [selectedWard, setSelectedWard] = useState("");
  const [selectedBed, setSelectedBed] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [admissionType, setAdmissionType] = useState<"elective" | "emergency">("elective");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/wards").then((r) => r.ok ? r.json() : []),
      fetch("/api/beds").then((r) => r.ok ? r.json() : []),
      fetch("/api/doctors").then((r) => r.ok ? r.json() : []),
    ]).then(([w, b, d]) => {
      setWards(w);
      setBeds(b);
      setDoctors(d);
    });
  }, []);

  useEffect(() => {
    if (patientSearch.length < 2) {
      setPatients([]);
      return;
    }
    const timeout = setTimeout(() => {
      setSearchingPatients(true);
      fetch(`/api/patients?q=${encodeURIComponent(patientSearch)}`)
        .then((r) => r.ok ? r.json() : [])
        .then(setPatients)
        .catch(() => setPatients([]))
        .finally(() => setSearchingPatients(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch]);

  const availableBeds = useMemo(() => {
    if (!selectedWard) return [];
    return beds.filter((b) => b.wardId === selectedWard && b.status === "available");
  }, [beds, selectedWard]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient || !selectedBed || !selectedDoctor) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          bedId: selectedBed,
          attendingDoctorId: selectedDoctor,
          admissionType,
          chiefComplaint: chiefComplaint || undefined,
          provisionalDiagnosis: provisionalDiagnosis || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Admission failed");
      }

      const encounter = await res.json();
      router.push(`/patient/${encounter.patient.uhid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admissions"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Admission</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Admit a patient to an inpatient bed
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Patient
          </h2>

          {selectedPatient ? (
            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <div>
                <p className="font-medium text-card-foreground">
                  {selectedPatient.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPatient.uhid} &middot; {selectedPatient.gender}
                  {selectedPatient.phone && ` &middot; ${selectedPatient.phone}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientSearch("");
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search by name, UHID, or phone..."
                className="w-full rounded-lg border bg-background py-2 pl-10 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchingPatients && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {patients.length > 0 && !selectedPatient && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-card shadow-lg">
                  {patients.map((p) => (
                    <button
                      key={p.uhid}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatients([]);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-medium text-card-foreground">
                        {p.name}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.uhid}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bed Selection */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Ward & Bed
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">
                Ward <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedWard}
                onChange={(e) => {
                  setSelectedWard(e.target.value);
                  setSelectedBed("");
                }}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select Ward</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.availableBeds} available)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">
                Bed <span className="text-red-500">*</span>
              </label>
              {selectedWard && availableBeds.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  No available beds in this ward
                </p>
              ) : (
                <select
                  value={selectedBed}
                  onChange={(e) => setSelectedBed(e.target.value)}
                  disabled={!selectedWard}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  <option value="">Select Bed</option>
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} ({b.bedType})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Doctor & Admission Details */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Admission Details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">
                Attending Doctor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.name}
                    {d.designation ? ` — ${d.designation}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">
                Admission Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {(["elective", "emergency"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAdmissionType(t)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors",
                      admissionType === t
                        ? t === "emergency"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-card-foreground">
                Chief Complaint
              </label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                rows={2}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Presenting complaint..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-card-foreground">
                Provisional Diagnosis
              </label>
              <textarea
                value={provisionalDiagnosis}
                onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                rows={2}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Initial diagnosis..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/admissions"
            className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !selectedPatient || !selectedBed || !selectedDoctor}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BedDouble className="h-4 w-4" />
            )}
            Admit Patient
          </button>
        </div>
      </form>
    </div>
  );
}
