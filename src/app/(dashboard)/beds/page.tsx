"use client";

import { useState } from "react";
import { BedCard } from "@/components/clinical/bed-card";
import { cn } from "@/lib/utils";

type BedStatus = "available" | "occupied" | "reserved" | "maintenance";

interface BedData {
  bedNumber: string;
  status: BedStatus;
  patientName?: string;
  uhid?: string;
  doctor?: string;
  admissionDate?: string;
}

const wards: Record<string, BedData[]> = {
  "General Medicine": [
    { bedNumber: "GM-01", status: "occupied", patientName: "Rajesh Kumar", uhid: "UHID001", doctor: "Dr. Priya Sharma", admissionDate: "2024-01-15" },
    { bedNumber: "GM-02", status: "occupied", patientName: "Meena Sundaram", uhid: "UHID010", doctor: "Dr. Priya Sharma", admissionDate: "2024-01-13" },
    { bedNumber: "GM-03", status: "available" },
    { bedNumber: "GM-04", status: "occupied", patientName: "Ramachandran K", uhid: "UHID011", doctor: "Dr. Arun Kumar", admissionDate: "2024-01-14" },
    { bedNumber: "GM-05", status: "occupied", patientName: "Srinivasan Iyer", uhid: "UHID004", doctor: "Dr. Priya Sharma", admissionDate: "2024-01-14" },
    { bedNumber: "GM-06", status: "available" },
    { bedNumber: "GM-07", status: "reserved", patientName: "Savithri Devi", uhid: "UHID012" },
    { bedNumber: "GM-08", status: "maintenance" },
    { bedNumber: "GM-09", status: "occupied", patientName: "Balasubramanian P", uhid: "UHID013", doctor: "Dr. Arun Kumar", admissionDate: "2024-01-12" },
    { bedNumber: "GM-10", status: "available" },
    { bedNumber: "GM-11", status: "occupied", patientName: "Padmavathi R", uhid: "UHID014", doctor: "Dr. Priya Sharma", admissionDate: "2024-01-15" },
    { bedNumber: "GM-12", status: "occupied", patientName: "Rajesh Kumar", uhid: "UHID001", doctor: "Dr. Priya Sharma", admissionDate: "2024-01-15" },
    { bedNumber: "GM-13", status: "available" },
    { bedNumber: "GM-14", status: "occupied", patientName: "Karthik Narayan", uhid: "UHID015", doctor: "Dr. Arun Kumar", admissionDate: "2024-01-13" },
    { bedNumber: "GM-15", status: "reserved", patientName: "Vijayalakshmi S", uhid: "UHID016" },
    { bedNumber: "GM-16", status: "available" },
  ],
  Surgery: [
    { bedNumber: "SU-01", status: "occupied", patientName: "Lakshmi Devi", uhid: "UHID002", doctor: "Dr. Venkatesh Rao", admissionDate: "2024-01-15" },
    { bedNumber: "SU-02", status: "available" },
    { bedNumber: "SU-03", status: "occupied", patientName: "Arjun Nair", uhid: "UHID017", doctor: "Dr. Venkatesh Rao", admissionDate: "2024-01-14" },
    { bedNumber: "SU-04", status: "occupied", patientName: "Deepa Krishnamurthy", uhid: "UHID018", doctor: "Dr. Venkatesh Rao", admissionDate: "2024-01-15" },
    { bedNumber: "SU-05", status: "available" },
    { bedNumber: "SU-06", status: "maintenance" },
    { bedNumber: "SU-07", status: "occupied", patientName: "Prakash Yadav", uhid: "UHID019", doctor: "Dr. Kavitha Rajan", admissionDate: "2024-01-13" },
    { bedNumber: "SU-08", status: "available" },
    { bedNumber: "SU-09", status: "occupied", patientName: "Revathi Mohan", uhid: "UHID020", doctor: "Dr. Kavitha Rajan", admissionDate: "2024-01-12" },
    { bedNumber: "SU-10", status: "reserved", patientName: "Ganesh Murthy", uhid: "UHID021" },
    { bedNumber: "SU-11", status: "available" },
    { bedNumber: "SU-12", status: "occupied", patientName: "Saroja Bai", uhid: "UHID022", doctor: "Dr. Venkatesh Rao", admissionDate: "2024-01-14" },
  ],
  ICU: [
    { bedNumber: "ICU-01", status: "occupied", patientName: "Ravi Shankar", uhid: "UHID023", doctor: "Dr. Anitha Menon", admissionDate: "2024-01-14" },
    { bedNumber: "ICU-02", status: "occupied", patientName: "Mohammed Farooq", uhid: "UHID003", doctor: "Dr. Anitha Menon", admissionDate: "2024-01-14" },
    { bedNumber: "ICU-03", status: "available" },
    { bedNumber: "ICU-04", status: "occupied", patientName: "Kamala Devi", uhid: "UHID024", doctor: "Dr. Anitha Menon", admissionDate: "2024-01-15" },
    { bedNumber: "ICU-05", status: "occupied", patientName: "Gopal Krishna", uhid: "UHID025", doctor: "Dr. Sunil Varma", admissionDate: "2024-01-13" },
    { bedNumber: "ICU-06", status: "available" },
    { bedNumber: "ICU-07", status: "maintenance" },
    { bedNumber: "ICU-08", status: "occupied", patientName: "Jaya Lakshmi", uhid: "UHID026", doctor: "Dr. Sunil Varma", admissionDate: "2024-01-15" },
    { bedNumber: "ICU-09", status: "available" },
    { bedNumber: "ICU-10", status: "occupied", patientName: "Thiruvenkatam R", uhid: "UHID027", doctor: "Dr. Anitha Menon", admissionDate: "2024-01-12" },
    { bedNumber: "ICU-11", status: "reserved", patientName: "Bharathi N", uhid: "UHID028" },
    { bedNumber: "ICU-12", status: "occupied", patientName: "Sundaram Pillai", uhid: "UHID029", doctor: "Dr. Sunil Varma", admissionDate: "2024-01-14" },
  ],
  Paediatrics: [
    { bedNumber: "PD-01", status: "occupied", patientName: "Aditya Verma", uhid: "UHID030", doctor: "Dr. Suresh Babu", admissionDate: "2024-01-15" },
    { bedNumber: "PD-02", status: "available" },
    { bedNumber: "PD-03", status: "occupied", patientName: "Kavya Shree", uhid: "UHID031", doctor: "Dr. Suresh Babu", admissionDate: "2024-01-14" },
    { bedNumber: "PD-04", status: "available" },
    { bedNumber: "PD-05", status: "occupied", patientName: "Pranav Gupta", uhid: "UHID032", doctor: "Dr. Meera Nair", admissionDate: "2024-01-14" },
    { bedNumber: "PD-06", status: "reserved", patientName: "Divya R", uhid: "UHID033" },
    { bedNumber: "PD-07", status: "available" },
    { bedNumber: "PD-08", status: "occupied", patientName: "Ananya Reddy", uhid: "UHID005", doctor: "Dr. Suresh Babu", admissionDate: "2024-01-14" },
    { bedNumber: "PD-09", status: "maintenance" },
    { bedNumber: "PD-10", status: "occupied", patientName: "Vignesh S", uhid: "UHID034", doctor: "Dr. Meera Nair", admissionDate: "2024-01-13" },
    { bedNumber: "PD-11", status: "available" },
    { bedNumber: "PD-12", status: "occupied", patientName: "Ishaan Kumar", uhid: "UHID035", doctor: "Dr. Suresh Babu", admissionDate: "2024-01-15" },
  ],
};

const wardNames = Object.keys(wards);

const legend: { label: string; status: BedStatus }[] = [
  { label: "Available", status: "available" },
  { label: "Occupied", status: "occupied" },
  { label: "Reserved", status: "reserved" },
  { label: "Maintenance", status: "maintenance" },
];

const legendColors: Record<BedStatus, string> = {
  available: "bg-emerald-500",
  occupied: "bg-blue-500",
  reserved: "bg-amber-500",
  maintenance: "bg-gray-400",
};

export default function BedMapPage() {
  const [selectedWard, setSelectedWard] = useState(wardNames[0]);
  const beds = wards[selectedWard];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bed Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visual bed occupancy across wards
          </p>
        </div>

        {/* Ward Selector */}
        <select
          value={selectedWard}
          onChange={(e) => setSelectedWard(e.target.value)}
          className="rounded-lg border bg-card px-4 py-2 text-sm font-medium text-card-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {wardNames.map((ward) => (
            <option key={ward} value={ward}>
              {ward}
            </option>
          ))}
        </select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Legend:
        </span>
        {legend.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <span
              className={cn("h-3 w-3 rounded-full", legendColors[item.status])}
            />
            <span className="text-sm text-card-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Bed Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {beds.map((bed) => (
          <BedCard
            key={bed.bedNumber}
            bedNumber={bed.bedNumber}
            status={bed.status}
            patientName={bed.patientName}
            uhid={bed.uhid}
            doctor={bed.doctor}
            admissionDate={bed.admissionDate}
          />
        ))}
      </div>
    </div>
  );
}
