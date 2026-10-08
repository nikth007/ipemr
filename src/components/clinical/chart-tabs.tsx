"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  HeartPulse,
  ClipboardList,
  FileText,
  Pill,
  Droplets,
  FlaskConical,
  ClipboardCheck,
  Stethoscope,
  LogOut,
} from "lucide-react";

interface ChartTabsProps {
  uhid: string;
}

const tabs = [
  { label: "Summary", segment: "", icon: LayoutDashboard },
  { label: "Vitals", segment: "/vitals", icon: HeartPulse },
  { label: "Orders", segment: "/orders", icon: ClipboardList },
  { label: "Notes", segment: "/notes", icon: FileText },
  { label: "MAR", segment: "/mar", icon: Pill },
  { label: "I/O", segment: "/io", icon: Droplets },
  { label: "Investigations", segment: "/investigations", icon: FlaskConical },
  { label: "Assessments", segment: "/assessments", icon: ClipboardCheck },
  { label: "Diagnoses", segment: "/diagnoses", icon: Stethoscope },
  { label: "Discharge", segment: "/discharge", icon: LogOut },
];

export function ChartTabs({ uhid }: ChartTabsProps) {
  const pathname = usePathname();
  const basePath = `/patient/${uhid}`;

  return (
    <div className="border-b bg-card px-6">
      <nav
        className="-mb-px flex gap-1 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {tabs.map((tab) => {
          const href = `${basePath}${tab.segment}`;
          const isActive =
            tab.segment === ""
              ? pathname === basePath
              : pathname.startsWith(href);

          const Icon = tab.icon;

          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-card-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
