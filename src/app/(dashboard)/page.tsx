"use client";

import Link from "next/link";
import {
  BedDouble,
  Users,
  CheckCircle2,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Total Beds",
    value: 120,
    icon: BedDouble,
    color: "text-blue-600 bg-blue-50",
  },
  {
    label: "Occupied",
    value: 87,
    icon: Users,
    color: "text-amber-600 bg-amber-50",
  },
  {
    label: "Available",
    value: 28,
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    label: "Today's Admissions",
    value: 6,
    icon: UserPlus,
    color: "text-purple-600 bg-purple-50",
  },
];

const recentAdmissions = [
  {
    ipNo: "IP/2024/001234",
    uhid: "UHID001",
    patient: "Rajesh Kumar",
    ward: "General Medicine",
    bed: "GM-12",
    doctor: "Dr. Priya Sharma",
    admitted: "2024-01-15",
    status: "admitted",
  },
  {
    ipNo: "IP/2024/001235",
    uhid: "UHID002",
    patient: "Lakshmi Devi",
    ward: "Surgery",
    bed: "SU-04",
    doctor: "Dr. Venkatesh Rao",
    admitted: "2024-01-15",
    status: "admitted",
  },
  {
    ipNo: "IP/2024/001236",
    uhid: "UHID003",
    patient: "Mohammed Farooq",
    ward: "ICU",
    bed: "ICU-02",
    doctor: "Dr. Anitha Menon",
    admitted: "2024-01-14",
    status: "critical",
  },
  {
    ipNo: "IP/2024/001237",
    uhid: "UHID004",
    patient: "Srinivasan Iyer",
    ward: "General Medicine",
    bed: "GM-05",
    doctor: "Dr. Priya Sharma",
    admitted: "2024-01-14",
    status: "admitted",
  },
  {
    ipNo: "IP/2024/001238",
    uhid: "UHID005",
    patient: "Ananya Reddy",
    ward: "Paediatrics",
    bed: "PD-08",
    doctor: "Dr. Suresh Babu",
    admitted: "2024-01-14",
    status: "admitted",
  },
  {
    ipNo: "IP/2024/001239",
    uhid: "UHID006",
    patient: "Geetha Krishnan",
    ward: "Surgery",
    bed: "SU-11",
    doctor: "Dr. Venkatesh Rao",
    admitted: "2024-01-13",
    status: "discharged",
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "admitted":
      return "bg-blue-100 text-blue-800";
    case "critical":
      return "bg-red-100 text-red-800";
    case "discharged":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function WardDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ward Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of inpatient admissions and bed occupancy
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-3xl font-bold text-card-foreground">
                  {stat.value}
                </p>
              </div>
              <div className={cn("rounded-lg p-3", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Admissions Table */}
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
                  Doctor
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
              {recentAdmissions.map((row) => (
                <tr
                  key={row.ipNo}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                    {row.ipNo}
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/patient/${row.uhid}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.patient}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-card-foreground">
                    {row.ward}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      ({row.bed})
                    </span>
                  </td>
                  <td className="px-6 py-3 text-card-foreground">
                    {row.doctor}
                  </td>
                  <td className="px-6 py-3 text-card-foreground">
                    {new Date(row.admitted).toLocaleDateString("en-IN", {
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
