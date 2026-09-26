"use client";

import Link from "next/link";
import { User, Wrench } from "lucide-react";
import { cn, getBedStatusColor } from "@/lib/utils";

interface BedCardProps {
  bedNumber: string;
  status: "available" | "occupied" | "reserved" | "maintenance";
  patientName?: string;
  uhid?: string;
  doctor?: string;
  admissionDate?: string;
}

const statusBorder: Record<string, string> = {
  available: "border-emerald-300",
  occupied: "border-blue-300",
  reserved: "border-amber-300",
  maintenance: "border-gray-300",
};

const statusBg: Record<string, string> = {
  available: "bg-emerald-50",
  occupied: "bg-blue-50",
  reserved: "bg-amber-50",
  maintenance: "bg-gray-50",
};

export function BedCard({
  bedNumber,
  status,
  patientName,
  uhid,
  doctor,
  admissionDate,
}: BedCardProps) {
  const card = (
    <div
      className={cn(
        "rounded-xl border-2 p-4 transition-shadow hover:shadow-md",
        statusBorder[status],
        statusBg[status]
      )}
    >
      {/* Bed number + status */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-card-foreground">
          {bedNumber}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            getBedStatusColor(status)
          )}
        >
          {status}
        </span>
      </div>

      {/* Content */}
      {status === "occupied" && patientName && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-sm font-medium text-card-foreground truncate">
              {patientName}
            </span>
          </div>
          {doctor && (
            <p className="text-xs text-muted-foreground truncate">{doctor}</p>
          )}
          {admissionDate && (
            <p className="text-[10px] text-muted-foreground">
              Adm: {admissionDate}
            </p>
          )}
        </div>
      )}

      {status === "reserved" && patientName && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-sm font-medium text-card-foreground truncate">
              {patientName}
            </span>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700">
            Reserved
          </p>
        </div>
      )}

      {status === "available" && (
        <p className="text-xs text-emerald-700 font-medium">Ready</p>
      )}

      {status === "maintenance" && (
        <div className="flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs text-gray-600">Under maintenance</span>
        </div>
      )}
    </div>
  );

  if ((status === "occupied" || status === "reserved") && uhid) {
    return (
      <Link href={`/patient/${uhid}`} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
