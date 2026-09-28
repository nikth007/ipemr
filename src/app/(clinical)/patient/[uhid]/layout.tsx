import { Sidebar } from "@/components/layout/sidebar";
import { PatientHeader } from "@/components/clinical/patient-header";
import { ChartTabs } from "@/components/clinical/chart-tabs";

interface PatientLayoutProps {
  children: React.ReactNode;
  params: Promise<{ uhid: string }>;
}

export default async function PatientLayout({
  children,
  params,
}: PatientLayoutProps) {
  const { uhid } = await params;

  // Mock patient data - will be replaced with real API calls later
  const patient = {
    uhid,
    name: "Rajesh Kumar",
    gender: "Male",
    dateOfBirth: "1958-03-15",
    bloodGroup: "B+",
    allergies: "Penicillin, Sulfa drugs",
    encounterStatus: "admitted",
    bedNumber: "GM-12",
    wardName: "General Medicine",
    attendingDoctor: "Dr. Priya Sharma",
    ipNo: "IP/2024/001234",
    admissionDate: "2024-01-15",
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex flex-1 flex-col overflow-y-auto">
        <PatientHeader patient={patient} />
        <ChartTabs uhid={uhid} />
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
