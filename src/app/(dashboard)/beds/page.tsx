"use client";

import { useState, useEffect, useMemo } from "react";
import { BedCard } from "@/components/clinical/bed-card";
import { cn } from "@/lib/utils";

type BedStatus = "available" | "occupied" | "reserved" | "maintenance";

interface BedData {
  id: string;
  bedNumber: string;
  wardName: string;
  wardId: string;
  status: BedStatus;
  bedType: string;
  patient: { uhid: string; name: string; gender: string } | null;
}

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
  const [beds, setBeds] = useState<BedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState<string>("all");

  useEffect(() => {
    fetch("/api/beds")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: BedData[]) => {
        setBeds(data);
        if (data.length > 0) setSelectedWard("all");
      })
      .catch(() => setBeds([]))
      .finally(() => setLoading(false));
  }, []);

  const wardNames = useMemo(() => {
    const names = [...new Set(beds.map((b) => b.wardName))];
    names.sort();
    return names;
  }, [beds]);

  const filteredBeds =
    selectedWard === "all"
      ? beds
      : beds.filter((b) => b.wardName === selectedWard);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bed Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visual bed occupancy across wards
          </p>
        </div>

        <select
          value={selectedWard}
          onChange={(e) => setSelectedWard(e.target.value)}
          className="rounded-lg border bg-card px-4 py-2 text-sm font-medium text-card-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Wards</option>
          {wardNames.map((ward) => (
            <option key={ward} value={ward}>
              {ward}
            </option>
          ))}
        </select>
      </div>

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

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading beds...</p>
      ) : filteredBeds.length === 0 ? (
        <div className="rounded-lg border bg-card px-6 py-10 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No beds found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {filteredBeds.map((bed) => (
            <BedCard
              key={bed.id}
              bedNumber={bed.bedNumber}
              status={bed.status}
              patientName={bed.patient?.name}
              uhid={bed.patient?.uhid}
            />
          ))}
        </div>
      )}
    </div>
  );
}
