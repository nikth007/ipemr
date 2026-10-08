import { z } from "zod";

export const patientSearchSchema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum(["uhid", "name", "phone"]).default("name"),
});

export const admissionSchema = z.object({
  patientId: z.string().min(1),
  bedId: z.string().min(1),
  attendingDoctorId: z.string().min(1),
  admissionType: z.enum(["emergency", "elective"]).default("elective"),
  admissionSource: z
    .enum([
      "er_ambulance",
      "er_walk_in",
      "elective",
      "day_case",
      "inter_hospital_transfer",
      "direct",
    ])
    .optional(),
  modeOfArrival: z
    .enum(["ambulance", "walk_in", "brought_by_police", "referred"])
    .optional(),
  referralSource: z.string().optional(),
  triageLevel: z.number().int().min(1).max(5).optional(),
  triageNotes: z.string().optional(),
  chiefComplaint: z.string().optional(),
  provisionalDiagnosis: z.string().optional(),
});

export type PatientSearch = z.infer<typeof patientSearchSchema>;
export type AdmissionInput = z.infer<typeof admissionSchema>;
