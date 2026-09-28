"use client";

import { useState } from "react";
import {
  Plus,
  Pill,
  FlaskConical,
  UtensilsCrossed,
  Heart,
  ClipboardList,
} from "lucide-react";
import { cn, getOrderStatusColor, getPriorityColor } from "@/lib/utils";

type OrderType = "all" | "medication" | "investigation" | "diet" | "nursing";

interface Order {
  id: number;
  type: OrderType;
  description: string;
  dose?: string;
  route?: string;
  frequency?: string;
  priority: "routine" | "urgent" | "stat";
  status: "active" | "completed" | "discontinued" | "signed";
  orderedBy: string;
  orderedAt: string;
}

const orders: Order[] = [
  {
    id: 1,
    type: "medication",
    description: "Tab. Metformin 500mg",
    dose: "500mg",
    route: "Oral",
    frequency: "BD (twice daily)",
    priority: "routine",
    status: "active",
    orderedBy: "Dr. Priya Sharma",
    orderedAt: "2024-01-15 09:00",
  },
  {
    id: 2,
    type: "medication",
    description: "Inj. Ceftriaxone 1g",
    dose: "1g",
    route: "IV",
    frequency: "BD",
    priority: "urgent",
    status: "active",
    orderedBy: "Dr. Priya Sharma",
    orderedAt: "2024-01-13 10:30",
  },
  {
    id: 3,
    type: "investigation",
    description: "CBC with ESR",
    priority: "routine",
    status: "completed",
    orderedBy: "Dr. Priya Sharma",
    orderedAt: "2024-01-15 06:00",
  },
  {
    id: 4,
    type: "investigation",
    description: "Chest X-Ray PA view",
    priority: "urgent",
    status: "completed",
    orderedBy: "Dr. Sunil Varma",
    orderedAt: "2024-01-14 16:00",
  },
  {
    id: 5,
    type: "medication",
    description: "Tab. Pantoprazole 40mg",
    dose: "40mg",
    route: "Oral",
    frequency: "OD (before breakfast)",
    priority: "routine",
    status: "active",
    orderedBy: "Dr. Priya Sharma",
    orderedAt: "2024-01-13 10:30",
  },
  {
    id: 6,
    type: "diet",
    description: "Diabetic diet 1800 kcal, low salt",
    priority: "routine",
    status: "active",
    orderedBy: "Dr. Priya Sharma",
    orderedAt: "2024-01-13 10:30",
  },
  {
    id: 7,
    type: "nursing",
    description: "Monitor I/O chart, blood glucose QID",
    priority: "routine",
    status: "active",
    orderedBy: "Dr. Priya Sharma",
    orderedAt: "2024-01-13 10:30",
  },
  {
    id: 8,
    type: "medication",
    description: "Tab. Paracetamol 650mg",
    dose: "650mg",
    route: "Oral",
    frequency: "SOS (if temp > 100F)",
    priority: "routine",
    status: "active",
    orderedBy: "Dr. Priya Sharma",
    orderedAt: "2024-01-13 10:30",
  },
];

const filterTabs: { key: OrderType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "medication", label: "Medications" },
  { key: "investigation", label: "Investigations" },
  { key: "diet", label: "Diet" },
  { key: "nursing", label: "Nursing" },
];

function getTypeIcon(type: OrderType) {
  switch (type) {
    case "medication":
      return <Pill className="h-5 w-5 text-blue-600" />;
    case "investigation":
      return <FlaskConical className="h-5 w-5 text-purple-600" />;
    case "diet":
      return <UtensilsCrossed className="h-5 w-5 text-amber-600" />;
    case "nursing":
      return <Heart className="h-5 w-5 text-pink-600" />;
    default:
      return <ClipboardList className="h-5 w-5 text-gray-600" />;
  }
}

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<OrderType>("all");

  const filtered =
    activeFilter === "all"
      ? orders
      : orders.filter((o) => o.type === activeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Orders</h2>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          New Order
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeFilter === tab.key
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-card-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="rounded-xl border bg-card shadow-sm">
        <ul className="divide-y">
          {filtered.map((order) => (
            <li
              key={order.id}
              className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
            >
              {/* Icon */}
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                {getTypeIcon(order.type)}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-card-foreground">
                    {order.description}
                  </p>
                  {/* Priority badge */}
                  {order.priority !== "routine" && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium uppercase",
                        getPriorityColor(order.priority)
                      )}
                    >
                      {order.priority}
                    </span>
                  )}
                  {/* Status badge */}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      getOrderStatusColor(order.status)
                    )}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Medication details */}
                {order.type === "medication" && order.dose && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.dose} &middot; {order.route} &middot;{" "}
                    {order.frequency}
                  </p>
                )}

                {/* Meta */}
                <p className="mt-1 text-xs text-muted-foreground">
                  Ordered by {order.orderedBy} &middot; {order.orderedAt}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No orders found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
