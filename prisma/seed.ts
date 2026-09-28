import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Roles
  const admin = await prisma.role.create({
    data: {
      name: "admin",
      description: "System administrator",
      permissions: {
        create: [{ resource: "*", action: "*" }],
      },
    },
  });

  const physician = await prisma.role.create({
    data: {
      name: "physician",
      description: "Attending physician / consultant",
      permissions: {
        create: [
          { resource: "encounters", action: "read" },
          { resource: "encounters", action: "create" },
          { resource: "encounters", action: "update" },
          { resource: "orders", action: "read" },
          { resource: "orders", action: "create" },
          { resource: "orders", action: "update" },
          { resource: "clinical_notes", action: "read" },
          { resource: "clinical_notes", action: "create" },
          { resource: "clinical_notes", action: "update" },
          { resource: "vitals", action: "read" },
          { resource: "investigation_results", action: "read" },
          { resource: "discharge", action: "read" },
          { resource: "discharge", action: "create" },
          { resource: "discharge", action: "update" },
        ],
      },
    },
  });

  const nurse = await prisma.role.create({
    data: {
      name: "nurse",
      description: "Staff nurse",
      permissions: {
        create: [
          { resource: "encounters", action: "read" },
          { resource: "orders", action: "read" },
          { resource: "vitals", action: "read" },
          { resource: "vitals", action: "create" },
          { resource: "clinical_notes", action: "read" },
          { resource: "clinical_notes", action: "create" },
          { resource: "mar", action: "read" },
          { resource: "mar", action: "update" },
          { resource: "intake_output", action: "read" },
          { resource: "intake_output", action: "create" },
          { resource: "nursing_assessments", action: "read" },
          { resource: "nursing_assessments", action: "create" },
        ],
      },
    },
  });

  const pharmacist = await prisma.role.create({
    data: {
      name: "pharmacist",
      description: "Clinical pharmacist",
      permissions: {
        create: [
          { resource: "orders", action: "read" },
          { resource: "orders", action: "update" },
          { resource: "encounters", action: "read" },
          { resource: "vitals", action: "read" },
        ],
      },
    },
  });

  // Departments
  const genMed = await prisma.department.create({
    data: { name: "General Medicine", code: "MED" },
  });
  const surgery = await prisma.department.create({
    data: { name: "General Surgery", code: "SUR" },
  });
  const ortho = await prisma.department.create({
    data: { name: "Orthopaedics", code: "ORT" },
  });
  const paeds = await prisma.department.create({
    data: { name: "Paediatrics", code: "PED" },
  });

  // Wards & Beds
  const wards = [
    { name: "General Medicine Ward", departmentId: genMed.id, wardType: "general", floor: "2nd", beds: 16 },
    { name: "Surgical Ward", departmentId: surgery.id, wardType: "general", floor: "3rd", beds: 12 },
    { name: "ICU", departmentId: genMed.id, wardType: "icu", floor: "1st", beds: 8 },
    { name: "Paediatric Ward", departmentId: paeds.id, wardType: "general", floor: "2nd", beds: 10 },
  ];

  for (const w of wards) {
    const ward = await prisma.ward.create({
      data: { name: w.name, departmentId: w.departmentId, wardType: w.wardType, floor: w.floor },
    });

    const prefix = w.name === "ICU" ? "ICU" : w.name.split(" ")[0].substring(0, 3).toUpperCase();
    for (let i = 1; i <= w.beds; i++) {
      await prisma.bed.create({
        data: {
          bedNumber: `${prefix}-${String(i).padStart(2, "0")}`,
          wardId: ward.id,
          status: i <= Math.floor(w.beds * 0.6) ? "occupied" : "available",
          bedType: w.wardType === "icu" ? "monitored" : "general",
        },
      });
    }
  }

  // Users
  const hash = await bcrypt.hash("smf@2024", 10);

  await prisma.user.create({
    data: {
      employeeId: "ADM001",
      name: "System Admin",
      email: "admin@smf.org.in",
      passwordHash: hash,
      roleId: admin.id,
      designation: "IT Administrator",
    },
  });

  const drPriya = await prisma.user.create({
    data: {
      employeeId: "DOC001",
      name: "Dr. Priya Sharma",
      email: "priya.sharma@smf.org.in",
      passwordHash: hash,
      roleId: physician.id,
      departmentId: genMed.id,
      designation: "Consultant Physician",
    },
  });

  const drRavi = await prisma.user.create({
    data: {
      employeeId: "DOC002",
      name: "Dr. Ravi Krishnan",
      email: "ravi.k@smf.org.in",
      passwordHash: hash,
      roleId: physician.id,
      departmentId: surgery.id,
      designation: "Consultant Surgeon",
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "DOC003",
      name: "Dr. Anitha Venkatesh",
      email: "anitha.v@smf.org.in",
      passwordHash: hash,
      roleId: physician.id,
      departmentId: ortho.id,
      designation: "Consultant Orthopaedician",
    },
  });

  const nurseKavitha = await prisma.user.create({
    data: {
      employeeId: "NUR001",
      name: "Kavitha Ramanathan",
      email: "kavitha.r@smf.org.in",
      passwordHash: hash,
      roleId: nurse.id,
      departmentId: genMed.id,
      designation: "Senior Staff Nurse",
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "NUR002",
      name: "Meera Sundaram",
      email: "meera.s@smf.org.in",
      passwordHash: hash,
      roleId: nurse.id,
      departmentId: surgery.id,
      designation: "Staff Nurse",
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "PHR001",
      name: "Suresh Babu",
      email: "suresh.b@smf.org.in",
      passwordHash: hash,
      roleId: pharmacist.id,
      designation: "Clinical Pharmacist",
    },
  });

  // Drug Master
  const drugs = [
    { genericName: "Paracetamol", brandName: "Dolo", strength: "650mg", form: "tablet", route: "oral", category: "analgesic" },
    { genericName: "Amoxicillin", brandName: "Mox", strength: "500mg", form: "capsule", route: "oral", category: "antibiotic" },
    { genericName: "Pantoprazole", brandName: "Pan-D", strength: "40mg", form: "tablet", route: "oral", category: "antacid" },
    { genericName: "Metformin", brandName: "Glycomet", strength: "500mg", form: "tablet", route: "oral", category: "antidiabetic" },
    { genericName: "Amlodipine", brandName: "Amlong", strength: "5mg", form: "tablet", route: "oral", category: "antihypertensive" },
    { genericName: "Ceftriaxone", brandName: "Monocef", strength: "1g", form: "injection", route: "iv", category: "antibiotic" },
    { genericName: "Insulin Regular", brandName: "Actrapid", strength: "100IU/ml", form: "injection", route: "sc", category: "antidiabetic" },
    { genericName: "Enoxaparin", brandName: "Clexane", strength: "40mg", form: "injection", route: "sc", category: "anticoagulant" },
    { genericName: "Ondansetron", brandName: "Emeset", strength: "4mg", form: "tablet", route: "oral", category: "antiemetic" },
    { genericName: "Tramadol", brandName: "Ultracet", strength: "50mg", form: "capsule", route: "oral", category: "analgesic" },
  ];

  const createdDrugs = [];
  for (const d of drugs) {
    createdDrugs.push(await prisma.drugMaster.create({ data: d }));
  }

  // Drug Interactions
  await prisma.drugInteraction.create({
    data: {
      drugAId: createdDrugs[6].id, // Insulin
      drugBId: createdDrugs[3].id, // Metformin
      severity: "moderate",
      description: "Concurrent use may increase risk of hypoglycaemia. Monitor blood glucose closely.",
    },
  });

  // Investigation Master
  const investigations = [
    { name: "Complete Blood Count", category: "lab", specimenType: "Blood", unit: "" },
    { name: "Blood Urea", category: "lab", specimenType: "Blood", normalRange: "15-40", unit: "mg/dL" },
    { name: "Serum Creatinine", category: "lab", specimenType: "Blood", normalRange: "0.7-1.3", unit: "mg/dL" },
    { name: "Random Blood Sugar", category: "lab", specimenType: "Blood", normalRange: "70-140", unit: "mg/dL" },
    { name: "Liver Function Test", category: "lab", specimenType: "Blood", unit: "" },
    { name: "Chest X-Ray PA", category: "radiology", unit: "" },
    { name: "USG Abdomen", category: "radiology", unit: "" },
    { name: "ECG 12-Lead", category: "lab", unit: "" },
    { name: "Urine Routine", category: "lab", specimenType: "Urine", unit: "" },
    { name: "HbA1c", category: "lab", specimenType: "Blood", normalRange: "4.0-5.6", unit: "%" },
  ];

  for (const inv of investigations) {
    await prisma.investigationMaster.create({ data: inv });
  }

  // Patients
  const patients = [
    { uhid: "SMF-2024-001001", name: "Rajesh Kumar", dateOfBirth: new Date("1958-03-15"), gender: "male", bloodGroup: "B+", phone: "9841012345", allergies: "Penicillin, Sulfa drugs" },
    { uhid: "SMF-2024-001002", name: "Lakshmi Devi", dateOfBirth: new Date("1965-07-22"), gender: "female", bloodGroup: "O+", phone: "9841023456" },
    { uhid: "SMF-2024-001003", name: "Mohammed Irfan", dateOfBirth: new Date("1972-11-08"), gender: "male", bloodGroup: "A+", phone: "9841034567" },
    { uhid: "SMF-2024-001004", name: "Saroja Ammal", dateOfBirth: new Date("1948-01-30"), gender: "female", bloodGroup: "AB+", phone: "9841045678", allergies: "Aspirin" },
    { uhid: "SMF-2024-001005", name: "Venkatesh Iyer", dateOfBirth: new Date("1980-06-12"), gender: "male", bloodGroup: "O-", phone: "9841056789" },
    { uhid: "SMF-2024-001006", name: "Padma Rangarajan", dateOfBirth: new Date("1955-09-25"), gender: "female", bloodGroup: "B+", phone: "9841067890" },
  ];

  const createdPatients = [];
  for (const p of patients) {
    createdPatients.push(await prisma.patient.create({ data: p }));
  }

  // Encounters (admissions)
  const allBeds = await prisma.bed.findMany({
    where: { status: "occupied" },
    include: { ward: true },
    take: 6,
  });

  const encounters = [
    {
      visNo: "IP/2024/000001",
      patientId: createdPatients[0].id,
      bedId: allBeds[0]?.id,
      attendingDoctorId: drPriya.id,
      admissionType: "emergency",
      chiefComplaint: "Fever, cough, and breathlessness for 3 days",
      provisionalDiagnosis: "Community Acquired Pneumonia",
      admissionDate: new Date("2024-01-15"),
    },
    {
      visNo: "IP/2024/000002",
      patientId: createdPatients[1].id,
      bedId: allBeds[1]?.id,
      attendingDoctorId: drPriya.id,
      admissionType: "elective",
      chiefComplaint: "Uncontrolled diabetes with peripheral neuropathy",
      provisionalDiagnosis: "Type 2 Diabetes Mellitus with Diabetic Neuropathy",
      admissionDate: new Date("2024-01-16"),
    },
    {
      visNo: "IP/2024/000003",
      patientId: createdPatients[2].id,
      bedId: allBeds[2]?.id,
      attendingDoctorId: drRavi.id,
      admissionType: "emergency",
      chiefComplaint: "Acute pain abdomen since morning",
      provisionalDiagnosis: "Acute Appendicitis",
      admissionDate: new Date("2024-01-17"),
    },
    {
      visNo: "IP/2024/000004",
      patientId: createdPatients[3].id,
      bedId: allBeds[3]?.id,
      attendingDoctorId: drPriya.id,
      admissionType: "emergency",
      chiefComplaint: "Chest pain and breathlessness",
      provisionalDiagnosis: "Acute Coronary Syndrome",
      admissionDate: new Date("2024-01-17"),
    },
  ];

  const createdEncounters = [];
  for (const e of encounters) {
    if (e.bedId) {
      createdEncounters.push(await prisma.encounter.create({ data: e }));
    }
  }

  // Vitals for first patient
  if (createdEncounters[0]) {
    const vitalsData = [
      { temp: 101.2, pulse: 110, bpSys: 130, bpDia: 85, spo2: 93, rr: 24, pain: 3 },
      { temp: 100.8, pulse: 105, bpSys: 128, bpDia: 82, spo2: 94, rr: 22, pain: 2 },
      { temp: 100.2, pulse: 98, bpSys: 125, bpDia: 80, spo2: 95, rr: 20, pain: 2 },
      { temp: 99.6, pulse: 92, bpSys: 122, bpDia: 78, spo2: 96, rr: 18, pain: 1 },
      { temp: 99.0, pulse: 88, bpSys: 120, bpDia: 76, spo2: 97, rr: 18, pain: 1 },
      { temp: 98.8, pulse: 84, bpSys: 118, bpDia: 74, spo2: 98, rr: 16, pain: 0 },
    ];

    for (let i = 0; i < vitalsData.length; i++) {
      const v = vitalsData[i];
      const recordedAt = new Date("2024-01-15");
      recordedAt.setHours(6 + i * 4);

      await prisma.vitals.create({
        data: {
          encounterId: createdEncounters[0].id,
          recordedAt,
          temperature: v.temp,
          pulse: v.pulse,
          bpSystolic: v.bpSys,
          bpDiastolic: v.bpDia,
          spo2: v.spo2,
          respiratoryRate: v.rr,
          painScore: v.pain,
          recordedById: nurseKavitha.id,
        },
      });
    }
  }

  // Orders for first patient
  if (createdEncounters[0]) {
    const medOrders = [
      { drug: createdDrugs[5], dose: "1", unit: "g", route: "iv", frequency: "bd", isPrn: false },
      { drug: createdDrugs[0], dose: "650", unit: "mg", route: "oral", frequency: "tid", isPrn: false },
      { drug: createdDrugs[2], dose: "40", unit: "mg", route: "oral", frequency: "od", isPrn: false },
      { drug: createdDrugs[8], dose: "4", unit: "mg", route: "oral", frequency: "sos", isPrn: true, prnReason: "Nausea" },
    ];

    for (const mo of medOrders) {
      await prisma.order.create({
        data: {
          encounterId: createdEncounters[0].id,
          orderType: "medication",
          status: "active",
          priority: "routine",
          orderedById: drPriya.id,
          signedAt: new Date("2024-01-15T10:00:00"),
          medicationOrder: {
            create: {
              drugId: mo.drug.id,
              dose: mo.dose,
              unit: mo.unit,
              route: mo.route,
              frequency: mo.frequency,
              isPrn: mo.isPrn,
              prnReason: mo.prnReason,
            },
          },
        },
      });
    }
  }

  // Clinical notes for first patient
  if (createdEncounters[0]) {
    await prisma.clinicalNote.create({
      data: {
        encounterId: createdEncounters[0].id,
        noteType: "admission",
        content: {
          chiefComplaint: "Fever, cough, and breathlessness for 3 days",
          historyOfPresentIllness: "66-year-old male, known diabetic and hypertensive, presents with high-grade fever (102°F) for 3 days associated with productive cough with yellowish sputum and progressive breathlessness. No hemoptysis. No chest pain. Reduced oral intake for 2 days.",
          pastHistory: "Type 2 DM on OHA for 10 years. Hypertension on medication for 5 years. No history of TB, asthma or cardiac disease.",
          examination: "Febrile (101.2°F), tachycardic (110/min), tachypneic (24/min), SpO2 93% on RA. RS: Bilateral crepitations, more on right lower zone. CVS: S1S2 normal. P/A: Soft, non-tender.",
          provisionalDiagnosis: "Community Acquired Pneumonia with Type 2 DM, Systemic Hypertension",
          plan: "IV antibiotics, supportive care, blood investigations, CXR PA view, strict I/O charting",
        },
        authorId: drPriya.id,
        signedAt: new Date("2024-01-15T10:30:00"),
      },
    });

    await prisma.clinicalNote.create({
      data: {
        encounterId: createdEncounters[0].id,
        noteType: "progress",
        content: {
          subjective: "Patient reports mild improvement. Fever subsiding. Cough persists but sputum reducing. Appetite improving.",
          objective: "Temp 99.6°F, PR 92/min, BP 122/78, SpO2 96% on RA. RS: Crepitations reducing on right side. Good urine output.",
          assessment: "CAP — improving on IV antibiotics. DM — sugars controlled.",
          plan: "Continue current medications. Repeat CBC tomorrow. If afebrile for 24h, consider oral switch.",
        },
        authorId: drPriya.id,
        signedAt: new Date("2024-01-16T09:00:00"),
        createdAt: new Date("2024-01-16T09:00:00"),
      },
    });
  }

  // Diagnoses
  if (createdEncounters[0]) {
    await prisma.diagnosis.create({
      data: {
        encounterId: createdEncounters[0].id,
        icdCode: "J18.9",
        description: "Community Acquired Pneumonia, unspecified",
        type: "primary",
        diagnosedBy: drPriya.id,
      },
    });
    await prisma.diagnosis.create({
      data: {
        encounterId: createdEncounters[0].id,
        icdCode: "E11.9",
        description: "Type 2 Diabetes Mellitus without complications",
        type: "comorbidity",
        diagnosedBy: drPriya.id,
      },
    });
    await prisma.diagnosis.create({
      data: {
        encounterId: createdEncounters[0].id,
        icdCode: "I10",
        description: "Essential (primary) hypertension",
        type: "comorbidity",
        diagnosedBy: drPriya.id,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
