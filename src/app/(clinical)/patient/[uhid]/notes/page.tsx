"use client";

import { use, useEffect, useState, useCallback } from "react";
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

// --- Types ---

type NoteTypeFilter =
  | "all"
  | "admission"
  | "progress"
  | "consultation"
  | "procedure"
  | "nursing";

interface NoteRecord {
  id: string;
  noteType: string;
  content: Record<string, string>;
  signedAt: string | null;
  createdAt: string;
  author: { name: string; designation: string | null };
}

interface PatientData {
  encounters: Array<{ id: string; status: string }>;
}

// --- Constants ---

const filterTabs: { key: NoteTypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "admission", label: "Admission" },
  { key: "progress", label: "Progress" },
  { key: "consultation", label: "Consultation" },
  { key: "procedure", label: "Procedure" },
  { key: "nursing", label: "Nursing" },
];

const noteTypes = [
  { value: "admission", label: "Admission Note" },
  { value: "progress", label: "Progress Note" },
  { value: "consultation", label: "Consultation Note" },
  { value: "procedure", label: "Procedure Note" },
  { value: "nursing", label: "Nursing Note" },
];

function getNoteTypeBadgeColor(type: string) {
  switch (type) {
    case "admission":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "progress":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "consultation":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "procedure":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "nursing":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

// Content field definitions per note type
const noteContentFields: Record<string, { key: string; label: string }[]> = {
  progress: [
    { key: "subjective", label: "Subjective" },
    { key: "objective", label: "Objective" },
    { key: "assessment", label: "Assessment" },
    { key: "plan", label: "Plan" },
  ],
  admission: [
    { key: "chiefComplaint", label: "Chief Complaint" },
    { key: "historyOfPresentIllness", label: "History of Present Illness" },
    { key: "pastMedicalHistory", label: "Past Medical History" },
    { key: "familyHistory", label: "Family History" },
    { key: "socialHistory", label: "Social History" },
    { key: "reviewOfSystems", label: "Review of Systems" },
    { key: "physicalExamination", label: "Physical Examination" },
    { key: "assessment", label: "Assessment" },
    { key: "plan", label: "Plan" },
  ],
  consultation: [
    { key: "reasonForConsultation", label: "Reason for Consultation" },
    { key: "findings", label: "Findings" },
    { key: "recommendations", label: "Recommendations" },
  ],
  procedure: [
    { key: "procedureName", label: "Procedure Name" },
    { key: "indication", label: "Indication" },
    { key: "technique", label: "Technique" },
    { key: "findings", label: "Findings" },
    { key: "complications", label: "Complications" },
    { key: "postProcedureInstructions", label: "Post-procedure Instructions" },
  ],
  nursing: [
    { key: "assessment", label: "Assessment" },
    { key: "interventions", label: "Interventions" },
    { key: "response", label: "Response" },
    { key: "plan", label: "Plan" },
  ],
};

// Section label formatting for display
function getSectionLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// --- Component ---

export default function NotesPage({
  params,
}: {
  params: Promise<{ uhid: string }>;
}) {
  const { uhid } = use(params);

  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [noAdmission, setNoAdmission] = useState(false);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<NoteTypeFilter>("all");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [noteType, setNoteType] = useState("progress");
  const [contentFields, setContentFields] = useState<Record<string, string>>(
    {}
  );

  const fetchNotes = useCallback(async (eid: string) => {
    const notesRes = await fetch(`/api/notes?encounterId=${eid}`);
    if (!notesRes.ok) throw new Error("Failed to load notes");
    const data: NoteRecord[] = await notesRes.json();
    setNotes(data);
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

        const notesRes = await fetch(`/api/notes?encounterId=${active.id}`);
        if (!notesRes.ok) throw new Error("Failed to load notes");
        const data: NoteRecord[] = await notesRes.json();
        if (!cancelled) setNotes(data);
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

  // Reset content fields when note type changes
  useEffect(() => {
    const fields = noteContentFields[noteType] || [];
    const init: Record<string, string> = {};
    for (const f of fields) {
      init[f.key] = "";
    }
    setContentFields(init);
  }, [noteType]);

  function toggleNote(id: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleContentChange(key: string, value: string) {
    setContentFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!encounterId) return;
    setSubmitting(true);

    // Build content object, stripping empty fields
    const content: Record<string, string> = {};
    for (const [key, value] of Object.entries(contentFields)) {
      if (value.trim()) {
        content[key] = value.trim();
      }
    }

    if (Object.keys(content).length === 0) {
      setError("Please fill in at least one content field");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encounterId, noteType, content }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || "Failed to create note"
        );
      }
      setNoteType("progress");
      setShowForm(false);
      if (encounterId) await fetchNotes(encounterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered =
    activeFilter === "all"
      ? notes
      : notes.filter((n) => n.noteType === activeFilter);

  // Sort newest first
  const sortedNotes = [...filtered].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading notes...</p>
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
          This patient does not have an active admission. Notes can only be
          added during an active encounter.
        </p>
      </div>
    );
  }

  if (error && notes.length === 0) {
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

  const currentFields = noteContentFields[noteType] || [];

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
        <h2 className="text-xl font-bold text-foreground">Clinical Notes</h2>
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
              Add Note
            </>
          )}
        </button>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">
            Add Clinical Note
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Note Type
              </label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-64"
              >
                {noteTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic content fields */}
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {noteType === "progress"
                  ? "SOAP Format"
                  : `${noteType.charAt(0).toUpperCase() + noteType.slice(1)} Note Content`}
              </h4>
              {currentFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  <textarea
                    value={contentFields[field.key] || ""}
                    onChange={(e) =>
                      handleContentChange(field.key, e.target.value)
                    }
                    rows={
                      field.key === "historyOfPresentIllness" ||
                      field.key === "physicalExamination" ||
                      field.key === "technique"
                        ? 4
                        : 3
                    }
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNoteType("progress");
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
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/50 p-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeFilter === tab.key
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-card-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {sortedNotes.map((note) => {
          const isExpanded = expandedNotes.has(note.id);
          // Show first available content section as snippet
          const contentEntries = Object.entries(note.content);
          const snippet =
            contentEntries.length > 0 ? contentEntries[0][1] : "";

          return (
            <div
              key={note.id}
              className="rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header */}
              <button
                onClick={() => toggleNote(note.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        getNoteTypeBadgeColor(note.noteType)
                      )}
                    >
                      {note.noteType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(note.createdAt)}
                    </span>
                    {note.signedAt && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Signed
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-card-foreground">
                    {note.author.name}
                  </p>
                  {note.author.designation && (
                    <p className="text-xs text-muted-foreground">
                      {note.author.designation}
                    </p>
                  )}
                  {!isExpanded && snippet && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                      {snippet}
                    </p>
                  )}
                </div>
                <div className="ml-4 shrink-0 text-muted-foreground">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t px-5 py-4">
                  <div className="space-y-4">
                    {Object.entries(note.content).map(([key, value]) => (
                      <div key={key}>
                        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {getSectionLabel(key)}
                        </h4>
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-card-foreground">
                          {value}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sortedNotes.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border bg-card px-5 py-12 text-center shadow-sm">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No notes found for this filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
