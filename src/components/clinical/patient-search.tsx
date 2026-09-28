"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn, getAge } from "@/lib/utils";

type SearchType = "name" | "uhid" | "phone";

interface PatientResult {
  uhid: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  phone?: string | null;
}

async function searchPatients(
  query: string,
  type: SearchType
): Promise<PatientResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `/api/patients?q=${encodeURIComponent(query)}&type=${type}`
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export function PatientSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("name");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setDebouncedQuery(value);
      }, 300);
    },
    []
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["patient-search", debouncedQuery, searchType],
    queryFn: () => searchPatients(debouncedQuery, searchType),
    enabled: debouncedQuery.trim().length > 0,
  });

  const searchTypes: { value: SearchType; label: string }[] = [
    { value: "name", label: "Name" },
    { value: "uhid", label: "UHID" },
    { value: "phone", label: "Phone" },
  ];

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      {/* Search type tabs */}
      <div className="mb-2 flex gap-1 rounded-md bg-muted p-1">
        {searchTypes.map((st) => (
          <button
            key={st.value}
            onClick={() => {
              setSearchType(st.value);
              setDebouncedQuery(query);
            }}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors",
              searchType === st.value
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-card-foreground"
            )}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={`Search by ${searchType}...`}
          className="w-full rounded-md border bg-card py-2.5 pl-10 pr-4 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && debouncedQuery.trim().length > 0 && (
        <div className="absolute left-0 right-0 z-40 mt-1 max-h-80 overflow-y-auto rounded-md border bg-card shadow-lg">
          {isLoading && results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No patients found
            </div>
          ) : (
            <ul>
              {results.map((patient) => (
                <li key={patient.uhid}>
                  <Link
                    href={`/patient/${patient.uhid}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-card-foreground">
                        {patient.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {patient.uhid} &middot; {getAge(patient.dateOfBirth)} /{" "}
                        {patient.gender === "male"
                          ? "M"
                          : patient.gender === "female"
                            ? "F"
                            : "O"}
                        {patient.phone && ` · ${patient.phone}`}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
