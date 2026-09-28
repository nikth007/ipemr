"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  uhid: string;
  name: string;
  gender: string;
  dateOfBirth: string | null;
  phone: string | null;
  bloodGroup: string | null;
  encounters: {
    id: string;
    visNo: string;
    status: string;
    bed: { bedNumber: string; ward: { name: string } } | null;
  }[];
}

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setPatients([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/patients?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patient Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search by name, UHID, or phone number
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type at least 2 characters to search..."
          className="w-full rounded-lg border bg-card py-3 pl-10 pr-4 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          autoFocus
        />
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {!loading && searched && patients.length === 0 && (
        <div className="rounded-lg border bg-card px-6 py-10 text-center">
          <User className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            No patients found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {patients.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    UHID
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Blood Group
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {patients.map((p) => {
                  const active = p.encounters.find(
                    (e) => e.status === "admitted"
                  );
                  return (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                        {p.uhid}
                      </td>
                      <td className="px-6 py-3">
                        <Link
                          href={`/patient/${p.uhid}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 capitalize text-card-foreground">
                        {p.gender}
                      </td>
                      <td className="px-6 py-3 text-card-foreground">
                        {p.phone ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-card-foreground">
                        {p.bloodGroup ?? "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            active
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {active ? "Admitted" : "Not admitted"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
