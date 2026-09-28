"use client";

import { cn } from "@/lib/utils";

interface VitalDataPoint {
  dateTime: string;
  temp: number;
  pulse: number;
  bpSystolic: number;
  bpDiastolic: number;
  spO2: number;
  rr: number;
}

interface VitalsChartProps {
  data: VitalDataPoint[];
}

/**
 * A simple visual vitals trend chart using CSS/HTML.
 * For Phase 1 we render a clean bar-chart style display.
 * A full charting library (recharts, etc.) can replace this later.
 */
export function VitalsChart({ data }: VitalsChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No vitals data available.</p>
    );
  }

  const metrics = [
    {
      key: "temp" as const,
      label: "Temperature (°F)",
      color: "bg-red-500",
      min: 96,
      max: 104,
      alertAbove: 99.5,
    },
    {
      key: "pulse" as const,
      label: "Pulse (bpm)",
      color: "bg-pink-500",
      min: 50,
      max: 130,
      alertAbove: 100,
    },
    {
      key: "bpSystolic" as const,
      label: "BP Systolic (mmHg)",
      color: "bg-blue-500",
      min: 80,
      max: 180,
      alertAbove: 140,
    },
    {
      key: "spO2" as const,
      label: "SpO2 (%)",
      color: "bg-emerald-500",
      min: 85,
      max: 100,
      alertBelow: 95,
    },
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <div key={metric.key}>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            {metric.label}
          </p>
          <div className="flex items-end gap-1">
            {data.map((point, i) => {
              const value = point[metric.key];
              const range = metric.max - metric.min;
              const pct = Math.max(
                5,
                Math.min(100, ((value - metric.min) / range) * 100)
              );
              const isAlert =
                (metric.alertAbove !== undefined &&
                  value >= metric.alertAbove) ||
                (metric.alertBelow !== undefined && value < metric.alertBelow);

              return (
                <div
                  key={i}
                  className="group relative flex flex-1 flex-col items-center"
                >
                  {/* Bar */}
                  <div
                    className={cn(
                      "w-full max-w-[32px] rounded-t transition-all",
                      isAlert ? "bg-red-400" : metric.color
                    )}
                    style={{ height: `${pct * 0.6}px`, minHeight: "4px" }}
                  />
                  {/* Value tooltip on hover */}
                  <div className="absolute -top-7 hidden rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background shadow group-hover:block">
                    {value}
                  </div>
                  {/* X label */}
                  <span className="mt-1 text-[9px] text-muted-foreground leading-tight text-center">
                    {point.dateTime.split(" ")[1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Date labels */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        {data.map((point, i) => {
          const date = point.dateTime.split(" ")[0];
          const prevDate = i > 0 ? data[i - 1].dateTime.split(" ")[0] : "";
          if (date !== prevDate) {
            return (
              <span key={i} className="flex-1 text-center font-medium">
                {new Date(date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            );
          }
          return <span key={i} className="flex-1" />;
        })}
      </div>
    </div>
  );
}
