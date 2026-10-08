"use client";

import { use, useEffect, useState, useCallback } from "react";
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  Pill,
  FlaskConical,
  UtensilsCrossed,
  Heart,
  ClipboardList,
  Search,
  Ban,
  XCircle,
} from "lucide-react";
import { cn, formatDateTime, getOrderStatusColor, getPriorityColor } from "@/lib/utils";

// --- Types ---

type OrderTypeFilter = "all" | "medication" | "investigation" | "diet" | "nursing";
type StatusFilter = "all" | "active" | "completed" | "discontinued";

interface Drug {
  id: string;
  genericName: string;
  brandName: string | null;
  strength: string | null;
  form: string | null;
}

interface InvestigationMaster {
  id: string;
  name: string;
  category: string;
}

interface OrderRecord {
  id: string;
  orderType: string;
  status: string;
  priority: string;
  notes: string | null;
  orderedAt: string;
  signedAt: string | null;
  orderedBy: { name: string; designation: string | null };
  medicationOrder?: {
    dose: string;
    unit: string;
    route: string;
    frequency: string;
    duration: string | null;
    isPrn: boolean;
    instructions: string | null;
    drug: {
      genericName: string;
      brandName: string | null;
      strength: string | null;
      form: string | null;
    };
  };
  investigationOrder?: {
    specimenType: string | null;
    clinicalIndication: string | null;
    investigation: { name: string; category: string };
  };
  dietOrder?: {
    dietType: string;
    restrictions: string | null;
    specialInstructions: string | null;
  };
  nursingOrder?: {
    instruction: string;
    frequency: string | null;
    category: string | null;
  };
}

interface PatientData {
  encounters: Array<{ id: string; status: string }>;
}

// --- Constants ---

const typeFilterTabs: { key: OrderTypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "medication", label: "Medications" },
  { key: "investigation", label: "Investigations" },
  { key: "diet", label: "Diet" },
  { key: "nursing", label: "Nursing" },
];

const statusFilterTabs: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "discontinued", label: "Discontinued" },
];

const orderTypes = [
  { value: "medication", label: "Medication" },
  { value: "investigation", label: "Investigation" },
  { value: "diet", label: "Diet" },
  { value: "nursing", label: "Nursing" },
];

const priorities = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "stat", label: "STAT" },
];

const routes = ["oral", "iv", "im", "sc", "topical", "inhalation"];
const frequencies = ["od", "bd", "tid", "qid", "sos", "stat", "prn"];
const dietTypes = [
  "regular",
  "soft",
  "liquid",
  "npo",
  "diabetic",
  "renal",
  "cardiac",
];
const nursingCategories = [
  "monitoring",
  "positioning",
  "wound_care",
  "catheter",
  "drain",
];

// --- Helpers ---

function getTypeIcon(type: string) {
  switch (type) {
    case "medication":
      return <Pill className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    case "investigation":
      return <FlaskConical className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
    case "diet":
      return <UtensilsCrossed className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    case "nursing":
      return <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />;
    default:
      return <ClipboardList className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
  }
}

function getOrderName(order: OrderRecord): string {
  switch (order.orderType) {
    case "medication":
      if (order.medicationOrder) {
        const drug = order.medicationOrder.drug;
        return drug.brandName
          ? `${drug.genericName} (${drug.brandName})`
          : drug.genericName;
      }
      return "Medication Order";
    case "investigation":
      return order.investigationOrder?.investigation.name ?? "Investigation";
    case "diet":
      return `${(order.dietOrder?.dietType ?? "regular").replace(/_/g, " ")} diet`;
    case "nursing":
      return order.nursingOrder?.instruction ?? "Nursing Order";
    default:
      return "Order";
  }
}

// --- Component ---

export default function OrdersPage({
  params,
}: {
  params: Promise<{ uhid: string }>;
}) {
  const { uhid } = use(params);

  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [noAdmission, setNoAdmission] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<OrderTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [orderType, setOrderType] = useState("medication");
  const [priority, setPriority] = useState("routine");
  const [orderNotes, setOrderNotes] = useState("");

  // Medication fields
  const [drugId, setDrugId] = useState("");
  const [drugSearch, setDrugSearch] = useState("");
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [drugsLoading, setDrugsLoading] = useState(false);
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("");
  const [route, setRoute] = useState("oral");
  const [frequency, setFrequency] = useState("od");
  const [duration, setDuration] = useState("");
  const [isPrn, setIsPrn] = useState(false);
  const [prnReason, setPrnReason] = useState("");
  const [instructions, setInstructions] = useState("");

  // Investigation fields
  const [investigationId, setInvestigationId] = useState("");
  const [investigationSearch, setInvestigationSearch] = useState("");
  const [investigations, setInvestigations] = useState<InvestigationMaster[]>([]);
  const [investigationsLoading, setInvestigationsLoading] = useState(false);
  const [specimenType, setSpecimenType] = useState("");
  const [clinicalIndication, setClinicalIndication] = useState("");

  // Diet fields
  const [dietType, setDietType] = useState("regular");
  const [restrictions, setRestrictions] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Nursing fields
  const [nursingInstruction, setNursingInstruction] = useState("");
  const [nursingFrequency, setNursingFrequency] = useState("");
  const [nursingCategory, setNursingCategory] = useState("monitoring");

  // Discontinue state
  const [discontinueOrderId, setDiscontinueOrderId] = useState<string | null>(null);
  const [discontinueAction, setDiscontinueAction] = useState<"discontinue" | "cancel">("discontinue");
  const [discontinueReason, setDiscontinueReason] = useState("");
  const [discontinuing, setDiscontinuing] = useState(false);

  async function handleDiscontinue() {
    if (!discontinueOrderId || !discontinueReason.trim()) return;
    setDiscontinuing(true);
    try {
      const res = await fetch(`/api/orders/${discontinueOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: discontinueAction,
          reason: discontinueReason.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || "Failed to update order"
        );
      }
      setDiscontinueOrderId(null);
      setDiscontinueReason("");
      if (encounterId) await fetchOrders(encounterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setDiscontinuing(false);
    }
  }

  const fetchOrders = useCallback(async (eid: string) => {
    const ordersRes = await fetch(`/api/orders?encounterId=${eid}`);
    if (!ordersRes.ok) throw new Error("Failed to load orders");
    const data: OrderRecord[] = await ordersRes.json();
    setOrders(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const patientRes = await fetch(`/api/patients/${uhid}`);
        if (!patientRes.ok) throw new Error("Failed to load patient");
        const patient: PatientData = await patientRes.json();
        const active = patient.encounters.find((e) => e.status === "admitted");
        if (!active) {
          if (!cancelled) setNoAdmission(true);
          return;
        }
        if (!cancelled) setEncounterId(active.id);

        const ordersRes = await fetch(`/api/orders?encounterId=${active.id}`);
        if (!ordersRes.ok) throw new Error("Failed to load orders");
        const data: OrderRecord[] = await ordersRes.json();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [uhid]);

  // Fetch drugs when searching
  useEffect(() => {
    if (orderType !== "medication" || drugSearch.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setDrugsLoading(true);
      try {
        const res = await fetch(`/api/drugs?search=${encodeURIComponent(drugSearch)}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setDrugs(Array.isArray(data) ? data : []);
        }
      } catch {
        // Silently fail for search
      } finally {
        if (!cancelled) setDrugsLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [drugSearch, orderType]);

  // Fetch investigations when searching
  useEffect(() => {
    if (orderType !== "investigation" || investigationSearch.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setInvestigationsLoading(true);
      try {
        const res = await fetch(
          `/api/investigations-master?search=${encodeURIComponent(investigationSearch)}`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setInvestigations(Array.isArray(data) ? data : []);
        }
      } catch {
        // Silently fail for search
      } finally {
        if (!cancelled) setInvestigationsLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [investigationSearch, orderType]);

  function resetForm() {
    setOrderType("medication");
    setPriority("routine");
    setOrderNotes("");
    setDrugId("");
    setDrugSearch("");
    setDose("");
    setUnit("");
    setRoute("oral");
    setFrequency("od");
    setDuration("");
    setIsPrn(false);
    setPrnReason("");
    setInstructions("");
    setInvestigationId("");
    setInvestigationSearch("");
    setSpecimenType("");
    setClinicalIndication("");
    setDietType("regular");
    setRestrictions("");
    setSpecialInstructions("");
    setNursingInstruction("");
    setNursingFrequency("");
    setNursingCategory("monitoring");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!encounterId) return;
    setSubmitting(true);

    const body: Record<string, unknown> = {
      encounterId,
      orderType,
      priority,
    };
    if (orderNotes.trim()) body.notes = orderNotes.trim();

    switch (orderType) {
      case "medication": {
        if (!drugId) {
          setError("Please select a drug");
          setSubmitting(false);
          return;
        }
        const medOrder: Record<string, unknown> = {
          drugId,
          dose,
          unit,
          route,
          frequency,
          isPrn,
        };
        if (duration) medOrder.duration = duration;
        if (isPrn && prnReason) medOrder.prnReason = prnReason;
        if (instructions) medOrder.instructions = instructions;
        body.medicationOrder = medOrder;
        break;
      }
      case "investigation": {
        if (!investigationId) {
          setError("Please select an investigation");
          setSubmitting(false);
          return;
        }
        const invOrder: Record<string, unknown> = { investigationId };
        if (specimenType) invOrder.specimenType = specimenType;
        if (clinicalIndication) invOrder.clinicalIndication = clinicalIndication;
        body.investigationOrder = invOrder;
        break;
      }
      case "diet": {
        const dOrder: Record<string, unknown> = { dietType };
        if (restrictions) dOrder.restrictions = restrictions;
        if (specialInstructions) dOrder.specialInstructions = specialInstructions;
        body.dietOrder = dOrder;
        break;
      }
      case "nursing": {
        if (!nursingInstruction.trim()) {
          setError("Please enter a nursing instruction");
          setSubmitting(false);
          return;
        }
        const nOrder: Record<string, unknown> = {
          instruction: nursingInstruction,
          category: nursingCategory,
        };
        if (nursingFrequency) nOrder.frequency = nursingFrequency;
        body.nursingOrder = nOrder;
        break;
      }
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || "Failed to create order"
        );
      }
      resetForm();
      setShowForm(false);
      if (encounterId) await fetchOrders(encounterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = orders.filter((o) => {
    if (typeFilter !== "all" && o.orderType !== typeFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (noAdmission) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-3 text-lg font-semibold text-foreground">
          No Active Admission
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This patient does not have an active admission. Orders can only be
          placed during an active encounter.
        </p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h3 className="mt-3 text-lg font-semibold text-foreground">Error</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Orders</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Order
            </>
          )}
        </button>
      </div>

      {/* New Order Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">
            Create New Order
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Order Type and Priority */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {orderTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Medication Fields */}
            {orderType === "medication" && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Medication Details
                </h4>
                {/* Drug search */}
                <div className="relative">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Drug
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={drugSearch}
                      onChange={(e) => {
                        setDrugSearch(e.target.value);
                        setDrugId("");
                      }}
                      placeholder="Search drug name..."
                      className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {drugsLoading && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Searching...
                    </div>
                  )}
                  {drugs.length > 0 && !drugId && (
                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-card shadow-lg">
                      {drugs.map((d) => (
                        <li key={d.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setDrugId(d.id);
                              setDrugSearch(
                                `${d.genericName}${d.brandName ? ` (${d.brandName})` : ""}${d.strength ? ` ${d.strength}` : ""}`
                              );
                              setDrugs([]);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            <span className="font-medium text-card-foreground">
                              {d.genericName}
                            </span>
                            {d.brandName && (
                              <span className="text-muted-foreground">
                                {" "}
                                ({d.brandName})
                              </span>
                            )}
                            {d.strength && (
                              <span className="text-muted-foreground">
                                {" "}
                                - {d.strength}
                              </span>
                            )}
                            {d.form && (
                              <span className="text-muted-foreground">
                                {" "}
                                [{d.form}]
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Dose
                    </label>
                    <input
                      type="text"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                      placeholder="500"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="mg"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Route
                    </label>
                    <select
                      value={route}
                      onChange={(e) => setRoute(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {routes.map((r) => (
                        <option key={r} value={r}>
                          {r.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Frequency
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {frequencies.map((f) => (
                        <option key={f} value={f}>
                          {f.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="5 days"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={isPrn}
                        onChange={(e) => setIsPrn(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      PRN (as needed)
                    </label>
                  </div>
                </div>

                {isPrn && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      PRN Reason
                    </label>
                    <input
                      type="text"
                      value={prnReason}
                      onChange={(e) => setPrnReason(e.target.value)}
                      placeholder="e.g., for pain, for fever > 100F"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Instructions
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={2}
                    placeholder="Special instructions..."
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Investigation Fields */}
            {orderType === "investigation" && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Investigation Details
                </h4>
                <div className="relative">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Investigation
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={investigationSearch}
                      onChange={(e) => {
                        setInvestigationSearch(e.target.value);
                        setInvestigationId("");
                      }}
                      placeholder="Search investigation..."
                      className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {investigationsLoading && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Searching...
                    </div>
                  )}
                  {investigations.length > 0 && !investigationId && (
                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-card shadow-lg">
                      {investigations.map((inv) => (
                        <li key={inv.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setInvestigationId(inv.id);
                              setInvestigationSearch(inv.name);
                              setInvestigations([]);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            <span className="font-medium text-card-foreground">
                              {inv.name}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {inv.category}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Specimen Type
                    </label>
                    <input
                      type="text"
                      value={specimenType}
                      onChange={(e) => setSpecimenType(e.target.value)}
                      placeholder="e.g., Blood, Urine, Sputum"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Clinical Indication
                    </label>
                    <input
                      type="text"
                      value={clinicalIndication}
                      onChange={(e) => setClinicalIndication(e.target.value)}
                      placeholder="Reason for investigation"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Diet Fields */}
            {orderType === "diet" && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Diet Details
                </h4>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Diet Type
                  </label>
                  <select
                    value={dietType}
                    onChange={(e) => setDietType(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {dietTypes.map((dt) => (
                      <option key={dt} value={dt}>
                        {dt.charAt(0).toUpperCase() + dt.slice(1).replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Restrictions
                  </label>
                  <input
                    type="text"
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    placeholder="e.g., low salt, low fat"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Special Instructions
                  </label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={2}
                    placeholder="Any special diet instructions..."
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Nursing Fields */}
            {orderType === "nursing" && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nursing Order Details
                </h4>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Instruction
                  </label>
                  <textarea
                    value={nursingInstruction}
                    onChange={(e) => setNursingInstruction(e.target.value)}
                    rows={2}
                    placeholder="Nursing instruction..."
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Frequency
                    </label>
                    <input
                      type="text"
                      value={nursingFrequency}
                      onChange={(e) => setNursingFrequency(e.target.value)}
                      placeholder="e.g., Every 4 hours, QID"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Category
                    </label>
                    <select
                      value={nursingCategory}
                      onChange={(e) => setNursingCategory(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {nursingCategories.map((c) => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Notes
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
                placeholder="Additional notes..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Place Order
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
          {typeFilterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                typeFilter === tab.key
                  ? "bg-card text-card-foreground shadow-sm"
                  : "text-muted-foreground hover:text-card-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
          {statusFilterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                statusFilter === tab.key
                  ? "bg-card text-card-foreground shadow-sm"
                  : "text-muted-foreground hover:text-card-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
                {getTypeIcon(order.orderType)}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-card-foreground">
                    {getOrderName(order)}
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
                {order.orderType === "medication" && order.medicationOrder && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.medicationOrder.dose} {order.medicationOrder.unit}{" "}
                    &middot; {order.medicationOrder.route.toUpperCase()} &middot;{" "}
                    {order.medicationOrder.frequency.toUpperCase()}
                    {order.medicationOrder.duration &&
                      ` &middot; ${order.medicationOrder.duration}`}
                    {order.medicationOrder.isPrn && (
                      <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">
                        (PRN)
                      </span>
                    )}
                  </p>
                )}

                {/* Investigation details */}
                {order.orderType === "investigation" &&
                  order.investigationOrder && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.investigationOrder.investigation.category}
                      {order.investigationOrder.specimenType &&
                        ` · ${order.investigationOrder.specimenType}`}
                      {order.investigationOrder.clinicalIndication &&
                        ` · ${order.investigationOrder.clinicalIndication}`}
                    </p>
                  )}

                {/* Diet details */}
                {order.orderType === "diet" && order.dietOrder && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.dietOrder.dietType.replace(/_/g, " ")}
                    {order.dietOrder.restrictions &&
                      ` · ${order.dietOrder.restrictions}`}
                    {order.dietOrder.specialInstructions &&
                      ` · ${order.dietOrder.specialInstructions}`}
                  </p>
                )}

                {/* Nursing details */}
                {order.orderType === "nursing" && order.nursingOrder && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.nursingOrder.category &&
                      `${order.nursingOrder.category.replace(/_/g, " ")} · `}
                    {order.nursingOrder.frequency &&
                      `${order.nursingOrder.frequency}`}
                  </p>
                )}

                {/* Notes */}
                {order.notes && (
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    {order.notes}
                  </p>
                )}

                {/* Meta */}
                <p className="mt-1 text-xs text-muted-foreground">
                  Ordered by {order.orderedBy.name}
                  {order.orderedBy.designation &&
                    `, ${order.orderedBy.designation}`}{" "}
                  &middot; {formatDateTime(order.orderedAt)}
                </p>
              </div>

              {/* Discontinue / Cancel buttons */}
              {!["discontinued", "cancelled", "completed"].includes(order.status) && (
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscontinueOrderId(order.id);
                      setDiscontinueAction("discontinue");
                      setDiscontinueReason("");
                    }}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-400"
                    title="Discontinue"
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscontinueOrderId(order.id);
                      setDiscontinueAction("cancel");
                      setDiscontinueReason("");
                    }}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    title="Cancel Order"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No orders found for the selected filters.
          </div>
        )}
      </div>

      {/* Discontinue / Cancel Modal */}
      {discontinueOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-card-foreground">
              {discontinueAction === "discontinue"
                ? "Discontinue Order"
                : "Cancel Order"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {discontinueAction === "discontinue"
                ? "This will mark the order as discontinued. Active MAR schedules will remain for documentation."
                : "This will cancel the order. Use this for orders that should not have been placed."}
            </p>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={discontinueReason}
                onChange={(e) => setDiscontinueReason(e.target.value)}
                rows={3}
                placeholder={
                  discontinueAction === "discontinue"
                    ? "e.g., Patient developed adverse reaction, switched to alternative..."
                    : "e.g., Duplicate order, entered in error..."
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDiscontinueOrderId(null);
                  setDiscontinueReason("");
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleDiscontinue}
                disabled={discontinuing || !discontinueReason.trim()}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50",
                  discontinueAction === "discontinue"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                {discontinuing && <Loader2 className="h-4 w-4 animate-spin" />}
                {discontinueAction === "discontinue"
                  ? "Discontinue"
                  : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
