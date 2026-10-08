"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BedDouble,
  Users,
  CheckCircle2,
  UserPlus,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  LogOut,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WardCensus {
  id: string;
  name: string;
  wardType: string;
  total: number;
  occupied: number;
  available: number;
}

interface DashboardData {
  totalBeds: number;
  occupied: number;
  available: number;
  maintenance: number;
  todayAdmissions: number;
  todayDischarges: number;
  pendingOrders: number;
  criticalAlerts: number;
  censusByWard: WardCensus[];
  recentAdmissions: {
    id: string;
    visNo: string;
    status: string;
    admissionDate: string;
    patient: { uhid: string; name: string };
    bed: { bedNumber: string; ward: { name: string } } | null;
  }[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "admitted":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "discharged":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

function getOccupancyColor(pct: number) {
  if (pct >= 90) return "bg-red-500";
  if (pct >= 75) return "bg-amber-500";
  return "bg-emerald-500";
}

export default function WardDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  const stats = [
    {
      label: "Total Beds",
      value: data?.totalBeds ?? "—",
      icon: BedDouble,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    },
    {
      label: "Occupied",
      value: data?.occupied ?? "—",
      icon: Users,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
    },
    {
      label: "Available",
      value: data?.available ?? "—",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    },
    {
      label: "Today Admissions",
      value: data?.todayAdmissions ?? "—",
      icon: UserPlus,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
    },
    {
      label: "Today Discharges",
      value: data?.todayDischarges ?? "—",
      icon: LogOut,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
    },
    {
      label: "Pending Orders",
      value: data?.pendingOrders ?? "—",
      icon: ClipboardList,
      color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30",
    },
    {
      label: "Critical Alerts",
      value: data?.criticalAlerts ?? "—",
      icon: AlertTriangle,
      color:
        (data?.criticalAlerts ?? 0) > 0
          ? "text-red-600 bg-red-50 dark:bg-red-900/30"
          : "text-gray-500 bg-gray-50 dark:bg-gray-800",
    },
    {
      label: "Maintenance",
      value: data?.maintenance ?? "—",
      icon: Wrench,
      color: "text-gray-600 bg-gray-50 dark:bg-gray-800",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ward Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of inpatient admissions and bed occupancy
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-card-foreground">
                  {stat.value}
                </p>
              </div>
              <div className={cn("rounded-lg p-2.5", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ward Census */}
      {data && data.censusByWard.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              Ward Census
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.censusByWard.map((ward) => {
              const pct =
                ward.total > 0
                  ? Math.round((ward.occupied / ward.total) * 100)
                  : 0;
              return (
                <div key={ward.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {ward.name}
                    </h3>
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {ward.wardType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {ward.occupied}/{ward.total} occupied
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          getOccupancyColor(pct)
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      {ward.available} beds available
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Admissions */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            Recent Admissions
          </h2>
          <Link
            href="/admissions"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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
                  Admitted
                </th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!data ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : data.recentAdmissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    No admissions yet
                  </td>
                </tr>
              ) : (
                data.recentAdmissions.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                      {row.visNo}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/patient/${row.patient.uhid}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.patient.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-card-foreground">
                      {row.bed ? (
                        <>
                          {row.bed.ward.name}{" "}
                          <span className="font-mono text-xs text-muted-foreground">
                            ({row.bed.bedNumber})
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-3 text-card-foreground">
                      {new Date(row.admissionDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          getStatusBadge(row.status)
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
