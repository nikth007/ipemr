"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ChartTabsProps {
  uhid: string;
}

const tabs = [
  { label: "Summary", segment: "" },
  { label: "Vitals", segment: "/vitals" },
  { label: "Orders", segment: "/orders" },
  { label: "Notes", segment: "/notes" },
];

export function ChartTabs({ uhid }: ChartTabsProps) {
  const pathname = usePathname();
  const basePath = `/patient/${uhid}`;

  return (
    <div className="border-b bg-card px-6">
      <nav className="-mb-px flex gap-1">
        {tabs.map((tab) => {
          const href = `${basePath}${tab.segment}`;
          const isActive =
            tab.segment === ""
              ? pathname === basePath
              : pathname.startsWith(href);

          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "inline-flex items-center border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-card-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
