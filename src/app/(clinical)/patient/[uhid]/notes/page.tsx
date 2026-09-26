"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type NoteType = "all" | "admission" | "progress" | "consultation" | "procedure";

interface ClinicalNote {
  id: number;
  type: Exclude<NoteType, "all">;
  dateTime: string;
  author: string;
  designation: string;
  content: string;
}

const notes: ClinicalNote[] = [
  {
    id: 1,
    type: "admission",
    dateTime: "2024-01-13 10:30",
    author: "Dr. Priya Sharma",
    designation: "Consultant, General Medicine",
    content: `Chief Complaint: Fever with cough and breathlessness for 3 days.

History of Present Illness: 65-year-old male, known diabetic and hypertensive, presents with high-grade fever (documented up to 102°F at home) for 3 days, productive cough with yellowish sputum, and progressive breathlessness on exertion. No hemoptysis. No chest pain. Decreased oral intake. Known T2DM on OHA for 8 years, HTN on Amlodipine 5mg.

Past Medical History:
- Type 2 Diabetes Mellitus - 8 years, on Tab. Metformin 500mg BD
- Essential Hypertension - 5 years, on Tab. Amlodipine 5mg OD
- No prior surgeries, no known drug allergies (Penicillin, Sulfa drugs - ALLERGY NOTED)

Examination:
- Febrile (100.4°F), PR 98/min, BP 148/92 mmHg, SpO2 94% on RA
- RS: Reduced breath sounds right lower zone, crepitations present
- CVS: S1S2 normal, no murmur
- P/A: Soft, non-tender

Assessment: Community Acquired Pneumonia with uncontrolled T2DM
Plan: IV antibiotics, blood glucose monitoring, diabetic diet, chest X-ray, blood work-up`,
  },
  {
    id: 2,
    type: "progress",
    dateTime: "2024-01-14 09:00",
    author: "Dr. Priya Sharma",
    designation: "Consultant, General Medicine",
    content: `Day 2 of admission. Patient continues to have low-grade fever (99.6°F). Cough persisting but sputum production has reduced. Breathlessness improving. SpO2 maintained 95% on room air. Blood glucose: FBS 186 mg/dL, PPBS 242 mg/dL - suboptimal control. Chest X-ray shows right lower lobe consolidation. WBC 14,200 with neutrophilic predominance.

Plan:
- Continue Inj. Ceftriaxone 1g IV BD
- Pulmonology consultation requested
- Increase Metformin to 500mg BD, add Glimepiride 1mg OD
- Repeat CBC after 48 hours
- Monitor SpO2, I/O chart`,
  },
  {
    id: 3,
    type: "consultation",
    dateTime: "2024-01-14 16:00",
    author: "Dr. Sunil Varma",
    designation: "Consultant, Pulmonology",
    content: `Consultation note - Called for management of community acquired pneumonia.

Reviewed: 65-year-old male, diabetic, HTN, admitted with fever, cough, and breathlessness. CXR shows right lower lobe consolidation. WBC elevated with neutrophilia. SpO2 improving on room air.

Opinion: Moderate severity CAP (CURB-65 score = 2). Current antibiotic coverage with Ceftriaxone is appropriate. If no clinical improvement in 48 hours, consider adding Azithromycin 500mg OD or escalating to Piperacillin-Tazobactam. Recommend sputum culture and sensitivity if not already sent. No indication for CT chest at this point. Follow up in 2 days.`,
  },
  {
    id: 4,
    type: "progress",
    dateTime: "2024-01-15 09:00",
    author: "Dr. Priya Sharma",
    designation: "Consultant, General Medicine",
    content: `Day 3 of admission. Significant improvement. Patient afebrile this morning (98.6°F). Cough decreasing, minimal sputum. No breathlessness at rest. Appetite improving. SpO2 96-97% on room air consistently. Blood glucose improving: FBS 148 mg/dL, PPBS 198 mg/dL.

Examination: Chest - air entry improving bilaterally, crepitations diminishing.

Plan:
- Continue IV Ceftriaxone for total 5 days, then step down to oral
- Continue diabetic medications with current doses
- If afebrile for 48 hours, plan discharge on Day 5
- Repeat CXR before discharge`,
  },
  {
    id: 5,
    type: "procedure",
    dateTime: "2024-01-14 11:00",
    author: "Nurse Preethi",
    designation: "Staff Nurse, General Medicine",
    content: `Procedure: IV cannula insertion

Site: Left dorsal metacarpal vein
Gauge: 20G
Attempts: 1
Secured with: Tegaderm dressing
Observation: Good flashback obtained, no infiltration, site clean and dry. Patient tolerated procedure well. IV Ceftriaxone started as ordered.`,
  },
];

const filterTabs: { key: NoteType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "admission", label: "Admission" },
  { key: "progress", label: "Progress" },
  { key: "consultation", label: "Consultation" },
  { key: "procedure", label: "Procedure" },
];

function getNoteTypeBadgeColor(type: string) {
  switch (type) {
    case "admission":
      return "bg-blue-100 text-blue-800";
    case "progress":
      return "bg-emerald-100 text-emerald-800";
    case "consultation":
      return "bg-purple-100 text-purple-800";
    case "procedure":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function NotesPage() {
  const [activeFilter, setActiveFilter] = useState<NoteType>("all");
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const filtered =
    activeFilter === "all"
      ? notes
      : notes.filter((n) => n.type === activeFilter);

  function toggleNote(id: number) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Clinical Notes</h2>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Note
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

      {/* Notes List */}
      <div className="space-y-3">
        {filtered.map((note) => {
          const isExpanded = expandedNotes.has(note.id);
          // Show first line as snippet when collapsed
          const snippet = note.content.split("\n")[0];

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
                        getNoteTypeBadgeColor(note.type)
                      )}
                    >
                      {note.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {note.dateTime}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-card-foreground">
                    {note.author}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {note.designation}
                  </p>
                  {!isExpanded && (
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
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-card-foreground">
                    {note.content}
                  </pre>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border bg-card px-5 py-12 text-center text-sm text-muted-foreground shadow-sm">
            No notes found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
