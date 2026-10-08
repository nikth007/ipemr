import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // Find Dr. Priya, Dr. Ravi, and Nurse Kavitha
    const drPriya = await prisma.user.findUnique({ where: { employeeId: "DOC001" } });
    const drRavi = await prisma.user.findUnique({ where: { employeeId: "DOC002" } });
    const drAnitha = await prisma.user.findUnique({ where: { employeeId: "DOC003" } });
    const nurseKavitha = await prisma.user.findUnique({ where: { employeeId: "NUR001" } });
    if (!drPriya || !drRavi || !nurseKavitha || !drAnitha) {
      return NextResponse.json({ error: "Required staff not found" }, { status: 400 });
    }

    // Find drugs
    const allDrugs = await prisma.drugMaster.findMany();
    const drug = (name: string) => allDrugs.find((d) => d.genericName.includes(name))!;

    // Find all encounters
    const encounters = await prisma.encounter.findMany({
      include: { patient: true },
      orderBy: { visNo: "asc" },
    });

    // Find available beds for new encounter
    const availableBeds = await prisma.bed.findMany({
      where: { status: "available" },
      include: { ward: true },
      take: 5,
    });

    const now = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      return d;
    };
    const hoursAgo = (n: number) => {
      const d = new Date(now);
      d.setHours(d.getHours() - n);
      return d;
    };

    // ──────────────────────────────────────────────────────
    // 1. UPDATE ENCOUNTER 1 (Rajesh Kumar — CAP) with admission fields
    // ──────────────────────────────────────────────────────
    if (encounters[0]) {
      await prisma.encounter.update({
        where: { id: encounters[0].id },
        data: {
          admissionSource: "er_ambulance",
          modeOfArrival: "ambulance",
          triageLevel: 3,
          triageNotes: "Febrile, tachypneic, SpO2 93% on room air. Started O2 via nasal prongs.",
          triageAt: encounters[0].admissionDate,
          admissionDate: daysAgo(3),
        },
      });
    }

    // ──────────────────────────────────────────────────────
    // 2. ENCOUNTER 2 (Lakshmi Devi — Diabetic Crisis)
    // ──────────────────────────────────────────────────────
    if (encounters[1]) {
      const enc2 = encounters[1];
      await prisma.encounter.update({
        where: { id: enc2.id },
        data: {
          admissionSource: "elective",
          modeOfArrival: "walk_in",
          admissionDate: daysAgo(2),
          chiefComplaint: "Uncontrolled blood sugars, tingling and numbness in both feet for 2 weeks",
          provisionalDiagnosis: "Type 2 DM with Diabetic Peripheral Neuropathy, HbA1c 11.2%",
        },
      });

      // Check if clinical data already exists
      const existingNotes = await prisma.clinicalNote.count({ where: { encounterId: enc2.id } });
      if (existingNotes === 0) {
        // Vitals
        const vitals2 = [
          { temp: 98.6, pulse: 88, bpSys: 148, bpDia: 92, spo2: 98, rr: 16, pain: 4, bs: 342, h: 48 },
          { temp: 98.4, pulse: 84, bpSys: 142, bpDia: 88, spo2: 98, rr: 16, pain: 3, bs: 286, h: 40 },
          { temp: 98.6, pulse: 80, bpSys: 138, bpDia: 86, spo2: 99, rr: 14, pain: 3, bs: 224, h: 32 },
          { temp: 98.4, pulse: 78, bpSys: 134, bpDia: 82, spo2: 98, rr: 14, pain: 2, bs: 188, h: 24 },
          { temp: 98.6, pulse: 76, bpSys: 130, bpDia: 80, spo2: 99, rr: 14, pain: 2, bs: 162, h: 16 },
          { temp: 98.4, pulse: 74, bpSys: 128, bpDia: 78, spo2: 98, rr: 14, pain: 1, bs: 148, h: 8 },
        ];
        for (const v of vitals2) {
          await prisma.vitals.create({
            data: {
              encounterId: enc2.id, recordedAt: hoursAgo(v.h),
              temperature: v.temp, pulse: v.pulse, bpSystolic: v.bpSys, bpDiastolic: v.bpDia,
              spo2: v.spo2, respiratoryRate: v.rr, painScore: v.pain, bloodSugar: v.bs,
              recordedById: nurseKavitha.id,
            },
          });
        }

        // Orders
        await prisma.order.create({
          data: {
            encounterId: enc2.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: daysAgo(2),
            medicationOrder: { create: { drugId: drug("Insulin").id, dose: "10", unit: "units", route: "sc", frequency: "tid", isPrn: false, instructions: "Before meals, sliding scale" } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc2.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: daysAgo(2),
            medicationOrder: { create: { drugId: drug("Metformin").id, dose: "500", unit: "mg", route: "oral", frequency: "bd", isPrn: false } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc2.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: daysAgo(2),
            medicationOrder: { create: { drugId: drug("Amlodipine").id, dose: "5", unit: "mg", route: "oral", frequency: "od", isPrn: false } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc2.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: daysAgo(2),
            medicationOrder: { create: { drugId: drug("Tramadol").id, dose: "50", unit: "mg", route: "oral", frequency: "sos", isPrn: true, prnReason: "Neuropathic pain" } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc2.id, orderType: "diet", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: daysAgo(2),
            dietOrder: { create: { dietType: "diabetic", restrictions: "No sugar, low carb", specialInstructions: "1800 kcal/day ADA diet. Small frequent meals." } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc2.id, orderType: "nursing", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: daysAgo(2),
            nursingOrder: { create: { instruction: "Blood sugar monitoring QID (before meals and bedtime). Maintain sliding scale chart.", frequency: "QID", category: "monitoring" } },
          },
        });

        // Notes
        await prisma.clinicalNote.create({
          data: {
            encounterId: enc2.id, noteType: "admission",
            content: {
              chiefComplaint: "Uncontrolled blood sugars, tingling and numbness in both feet for 2 weeks",
              historyOfPresentIllness: "59-year-old female, known T2DM for 15 years on irregular OHA. Presents with fasting sugars 300-350 mg/dL for past 2 weeks. Progressive tingling, numbness and burning sensation in both feet. Recent HbA1c 11.2%. Weight loss of 4 kg in past month. No DKA symptoms.",
              pastHistory: "T2DM for 15 years — irregular compliance. Hypertension for 8 years on Amlodipine. No cardiac or renal disease. Last eye check: mild NPDR.",
              examination: "Vitals stable. BMI 28.4. Bilateral pedal edema absent. Peripheral pulses palpable. Reduced sensation in stocking distribution bilaterally. Monofilament test: 3/10 sites insensate bilaterally.",
              provisionalDiagnosis: "T2DM uncontrolled with Diabetic Peripheral Neuropathy, Systemic Hypertension, Mild NPDR",
              plan: "Insulin initiation with sliding scale. Optimize OHA. Neuropathy workup. HbA1c, renal function, lipid profile. Diabetologist and ophthalmology review. Diabetic diet counseling.",
            },
            authorId: drPriya.id, signedAt: daysAgo(2),
          },
        });
        await prisma.clinicalNote.create({
          data: {
            encounterId: enc2.id, noteType: "progress", createdAt: daysAgo(1),
            content: {
              subjective: "Tingling persists but less intense. Appetite good. No hypoglycemia episodes. Sleeping better.",
              objective: "Temp 98.4°F, PR 78/min, BP 134/82. FBS 188 mg/dL (improved from 342). PPBS 224 mg/dL. Feet exam unchanged.",
              assessment: "DM control improving on insulin. Neuropathy stable. BP trending toward target.",
              plan: "Continue insulin sliding scale. Add Pregabalin 75mg HS for neuropathy. Repeat FBS/PPBS. Diabetic educator visit today.",
            },
            authorId: drPriya.id, signedAt: daysAgo(1),
          },
        });

        // Diagnoses
        await prisma.diagnosis.create({
          data: { encounterId: enc2.id, icdCode: "E11.42", description: "Type 2 DM with diabetic polyneuropathy", type: "primary", diagnosedBy: drPriya.id },
        });
        await prisma.diagnosis.create({
          data: { encounterId: enc2.id, icdCode: "I10", description: "Essential hypertension", type: "comorbidity", diagnosedBy: drPriya.id },
        });
        await prisma.diagnosis.create({
          data: { encounterId: enc2.id, icdCode: "E11.319", description: "T2DM with mild NPDR, unspecified eye", type: "secondary", diagnosedBy: drPriya.id },
        });
      }
    }

    // ──────────────────────────────────────────────────────
    // 3. ENCOUNTER 3 (Mohammed Irfan — Acute Appendicitis)
    // ──────────────────────────────────────────────────────
    if (encounters[2]) {
      const enc3 = encounters[2];
      await prisma.encounter.update({
        where: { id: enc3.id },
        data: {
          admissionSource: "er_walk_in",
          modeOfArrival: "walk_in",
          triageLevel: 2,
          triageNotes: "Acute abdomen. Guarding present. Tachycardic. Rebound tenderness RIF. Surgical consult stat.",
          triageAt: daysAgo(1),
          admissionDate: daysAgo(1),
        },
      });

      const existingNotes = await prisma.clinicalNote.count({ where: { encounterId: enc3.id } });
      if (existingNotes === 0) {
        // Vitals
        const vitals3 = [
          { temp: 100.8, pulse: 104, bpSys: 138, bpDia: 88, spo2: 98, rr: 20, pain: 8, h: 24 },
          { temp: 100.4, pulse: 100, bpSys: 132, bpDia: 84, spo2: 99, rr: 18, pain: 7, h: 20 },
          { temp: 99.8, pulse: 92, bpSys: 126, bpDia: 80, spo2: 99, rr: 16, pain: 5, h: 12 },
          { temp: 99.2, pulse: 86, bpSys: 122, bpDia: 78, spo2: 99, rr: 16, pain: 4, h: 6 },
        ];
        for (const v of vitals3) {
          await prisma.vitals.create({
            data: {
              encounterId: enc3.id, recordedAt: hoursAgo(v.h),
              temperature: v.temp, pulse: v.pulse, bpSystolic: v.bpSys, bpDiastolic: v.bpDia,
              spo2: v.spo2, respiratoryRate: v.rr, painScore: v.pain,
              recordedById: nurseKavitha.id,
            },
          });
        }

        // Orders
        await prisma.order.create({
          data: {
            encounterId: enc3.id, orderType: "medication", status: "active", priority: "stat",
            orderedById: drRavi.id, signedAt: daysAgo(1),
            medicationOrder: { create: { drugId: drug("Ceftriaxone").id, dose: "1", unit: "g", route: "iv", frequency: "bd", isPrn: false, instructions: "Pre-operative prophylaxis" } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc3.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drRavi.id, signedAt: daysAgo(1),
            medicationOrder: { create: { drugId: drug("Pantoprazole").id, dose: "40", unit: "mg", route: "iv", frequency: "od", isPrn: false } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc3.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drRavi.id, signedAt: daysAgo(1),
            medicationOrder: { create: { drugId: drug("Ondansetron").id, dose: "4", unit: "mg", route: "iv", frequency: "sos", isPrn: true, prnReason: "Nausea or vomiting" } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc3.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drRavi.id, signedAt: daysAgo(1),
            medicationOrder: { create: { drugId: drug("Tramadol").id, dose: "50", unit: "mg", route: "iv", frequency: "tid", isPrn: false, instructions: "Post-operative analgesia" } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc3.id, orderType: "diet", status: "active", priority: "stat",
            orderedById: drRavi.id, signedAt: daysAgo(1),
            dietOrder: { create: { dietType: "npo", restrictions: "Nil by mouth", specialInstructions: "Post-op: sips of water after 6 hours, then liquid diet if tolerated" } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc3.id, orderType: "nursing", status: "active", priority: "routine",
            orderedById: drRavi.id, signedAt: daysAgo(1),
            nursingOrder: { create: { instruction: "Strict I/O charting. Monitor drain output. Wound inspection Q8H. Ambulate post-op day 1.", frequency: "Q8H", category: "wound_care" } },
          },
        });

        // Notes
        await prisma.clinicalNote.create({
          data: {
            encounterId: enc3.id, noteType: "admission",
            content: {
              chiefComplaint: "Acute pain abdomen since early morning, initially periumbilical, now localized to right iliac fossa",
              historyOfPresentIllness: "52-year-old male presents with acute onset periumbilical pain since 4 AM, which migrated to RIF over 6 hours. Associated with nausea (2 episodes of vomiting), low-grade fever. No similar episodes in past. No dysuria, no altered bowel habits prior to onset. Last meal 10 hours ago.",
              pastHistory: "No known comorbidities. No prior surgeries. Non-smoker, occasional alcohol.",
              examination: "Febrile (100.8°F), tachycardic. Abdomen: Guarding in RIF, Rebound tenderness +, McBurney's point tenderness +, Rovsing sign +, Psoas sign +. Bowel sounds present but reduced. PR: Tender on right side.",
              provisionalDiagnosis: "Acute Appendicitis — for emergency laparoscopic appendectomy",
              plan: "NPO, IV fluids, IV antibiotics, urgent surgery. Pre-op labs: CBC, RFT, coagulation profile. Consent for laparoscopic appendectomy. Anaesthesia fitness.",
            },
            authorId: drRavi.id, signedAt: daysAgo(1),
          },
        });
        await prisma.clinicalNote.create({
          data: {
            encounterId: enc3.id, noteType: "procedure", createdAt: hoursAgo(18),
            content: {
              procedure: "Laparoscopic Appendectomy",
              indication: "Acute Appendicitis",
              findings: "Inflamed appendix with fibrinous exudate. No perforation. Minimal free fluid in pelvis. Base of appendix healthy.",
              technique: "Standard 3-port laparoscopic appendectomy. Mesoappendix divided with harmonic scalpel. Base ligated with endoloop x2 and divided. Specimen retrieved in endobag. Peritoneal wash given. Haemostasis confirmed.",
              complications: "None",
              estimatedBloodLoss: "Minimal (< 20 ml)",
              postOpOrders: "NPO for 6 hours, then clear liquids. IV antibiotics x 24 hours. Analgesics. Ambulate evening of surgery.",
            },
            authorId: drRavi.id, signedAt: hoursAgo(18),
          },
        });
        await prisma.clinicalNote.create({
          data: {
            encounterId: enc3.id, noteType: "progress", createdAt: hoursAgo(4),
            content: {
              subjective: "Pain much improved post-surgery. Tolerating oral liquids. Passed flatus. No nausea. Ambulated with assistance.",
              objective: "Temp 99.2°F, PR 86/min, BP 122/78. Abdomen soft, mild port-site tenderness. Drain — minimal serous output (15 ml). Wound clean.",
              assessment: "Post lap appendectomy day 1 — recovering well.",
              plan: "Upgrade to soft diet. Remove drain if output < 25 ml. Switch to oral analgesics. Plan discharge tomorrow if afebrile.",
            },
            authorId: drRavi.id, signedAt: hoursAgo(4),
          },
        });

        // Diagnoses
        await prisma.diagnosis.create({
          data: { encounterId: enc3.id, icdCode: "K35.80", description: "Acute appendicitis, unspecified", type: "primary", diagnosedBy: drRavi.id },
        });
      }
    }

    // ──────────────────────────────────────────────────────
    // 4. ENCOUNTER 4 (Saroja Ammal — Acute Coronary Syndrome)
    // ──────────────────────────────────────────────────────
    if (encounters[3]) {
      const enc4 = encounters[3];
      await prisma.encounter.update({
        where: { id: enc4.id },
        data: {
          admissionSource: "er_ambulance",
          modeOfArrival: "ambulance",
          triageLevel: 1,
          triageNotes: "76F, crushing chest pain, diaphoresis, ECG shows ST elevation V1-V4. Code STEMI activated. Aspirin + Clopidogrel loading given in ER.",
          triageAt: daysAgo(2),
          admissionDate: daysAgo(2),
        },
      });

      const existingNotes = await prisma.clinicalNote.count({ where: { encounterId: enc4.id } });
      if (existingNotes === 0) {
        // Vitals — ICU level monitoring
        const vitals4 = [
          { temp: 98.8, pulse: 112, bpSys: 92, bpDia: 60, spo2: 91, rr: 26, pain: 9, h: 48 },
          { temp: 98.6, pulse: 108, bpSys: 98, bpDia: 64, spo2: 93, rr: 24, pain: 7, h: 44 },
          { temp: 98.8, pulse: 100, bpSys: 106, bpDia: 68, spo2: 95, rr: 22, pain: 5, h: 36 },
          { temp: 98.6, pulse: 94, bpSys: 110, bpDia: 72, spo2: 96, rr: 20, pain: 4, h: 28 },
          { temp: 98.4, pulse: 88, bpSys: 114, bpDia: 74, spo2: 97, rr: 18, pain: 3, h: 20 },
          { temp: 98.6, pulse: 82, bpSys: 118, bpDia: 76, spo2: 97, rr: 16, pain: 2, h: 12 },
          { temp: 98.4, pulse: 78, bpSys: 116, bpDia: 74, spo2: 98, rr: 16, pain: 1, h: 4 },
        ];
        for (const v of vitals4) {
          await prisma.vitals.create({
            data: {
              encounterId: enc4.id, recordedAt: hoursAgo(v.h),
              temperature: v.temp, pulse: v.pulse, bpSystolic: v.bpSys, bpDiastolic: v.bpDia,
              spo2: v.spo2, respiratoryRate: v.rr, painScore: v.pain, gcs: 15,
              recordedById: nurseKavitha.id,
            },
          });
        }

        // Orders — cardiac care
        await prisma.order.create({
          data: {
            encounterId: enc4.id, orderType: "medication", status: "active", priority: "stat",
            orderedById: drPriya.id, signedAt: daysAgo(2),
            medicationOrder: { create: { drugId: drug("Enoxaparin").id, dose: "60", unit: "mg", route: "sc", frequency: "bd", isPrn: false, instructions: "LMWH anticoagulation. Monitor anti-Xa if renal impairment." } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc4.id, orderType: "medication", status: "active", priority: "stat",
            orderedById: drPriya.id, signedAt: daysAgo(2),
            medicationOrder: { create: { drugId: drug("Pantoprazole").id, dose: "40", unit: "mg", route: "iv", frequency: "od", isPrn: false, instructions: "GI prophylaxis on dual antiplatelet" } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc4.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: daysAgo(2),
            medicationOrder: { create: { drugId: drug("Paracetamol").id, dose: "650", unit: "mg", route: "oral", frequency: "sos", isPrn: true, prnReason: "Fever or chest discomfort" } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc4.id, orderType: "diet", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: daysAgo(2),
            dietOrder: { create: { dietType: "cardiac", restrictions: "Low salt, low fat", specialInstructions: "1500 kcal cardiac diet. No caffeine. Small frequent meals." } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc4.id, orderType: "nursing", status: "active", priority: "stat",
            orderedById: drPriya.id, signedAt: daysAgo(2),
            nursingOrder: { create: { instruction: "Continuous cardiac monitoring. Strict bed rest. I/O charting Q2H. Report any chest pain, arrhythmia, or drop in BP immediately. Maintain IV access x2.", frequency: "Continuous", category: "monitoring" } },
          },
        });

        // Notes
        await prisma.clinicalNote.create({
          data: {
            encounterId: enc4.id, noteType: "admission",
            content: {
              chiefComplaint: "Crushing retrosternal chest pain radiating to left arm and jaw since 2 hours, with profuse sweating",
              historyOfPresentIllness: "76-year-old female, known hypertensive, brought by 108 ambulance with acute onset severe crushing chest pain for 2 hours. Pain radiating to left arm and jaw. Associated with profuse sweating, nausea, and one episode of vomiting. No syncope. No palpitations. ECG in ambulance showed ST elevation V1-V4. Aspirin 325mg and Clopidogrel 300mg given in ER. Pain 9/10 on arrival.",
              pastHistory: "Hypertension for 20 years on Amlodipine 10mg. Known allergy to Aspirin (rash — given with precaution given STEMI). No DM. No prior cardiac history. Post-menopausal.",
              examination: "Anxious, diaphoretic. BP 92/60 (initial), PR 112/min irregular, SpO2 91% on RA. JVP not raised. CVS: S1S2 present, S3 gallop heard, no murmur. RS: Bilateral basal fine creps. P/A: Soft.",
              provisionalDiagnosis: "Anterior Wall STEMI (Killip Class II). Acute LV dysfunction.",
              plan: "Code STEMI — Cardiology consulted for primary PCI. If not feasible, thrombolysis. DAPT, anticoagulation, statin. Continuous monitoring in ICCU. Strict bed rest. O2 to maintain SpO2 > 94%. Serial ECG, Troponin, Echo.",
            },
            authorId: drPriya.id, signedAt: daysAgo(2),
          },
        });
        await prisma.clinicalNote.create({
          data: {
            encounterId: enc4.id, noteType: "progress", createdAt: daysAgo(1),
            content: {
              subjective: "Chest pain resolved after PCI. No recurrence. Mild fatigue. Able to take oral medications and diet. No breathlessness at rest.",
              objective: "Afebrile, PR 88/min regular, BP 114/74, SpO2 97% on 2L O2. CVS: S3 no longer audible. RS: Creps clearing. ECG: Resolving ST elevation, developing Q waves V1-V3. Troponin trending down.",
              assessment: "Anterior STEMI post primary PCI to LAD — Day 1. Hemodynamically stable. LV function improving.",
              plan: "Continue DAPT, statin, ACE inhibitor, beta-blocker (titrate). Wean O2. Echocardiogram today. Step down from ICCU to ward if stable. Cardiac rehab referral.",
            },
            authorId: drPriya.id, signedAt: daysAgo(1),
          },
        });

        // Diagnoses
        await prisma.diagnosis.create({
          data: { encounterId: enc4.id, icdCode: "I21.0", description: "Acute ST-elevation myocardial infarction of anterior wall", type: "primary", diagnosedBy: drPriya.id },
        });
        await prisma.diagnosis.create({
          data: { encounterId: enc4.id, icdCode: "I50.9", description: "Heart failure, unspecified (Killip II on presentation)", type: "secondary", diagnosedBy: drPriya.id },
        });
        await prisma.diagnosis.create({
          data: { encounterId: enc4.id, icdCode: "I10", description: "Essential hypertension", type: "comorbidity", diagnosedBy: drPriya.id },
        });
      }
    }

    // ──────────────────────────────────────────────────────
    // 5. NEW ENCOUNTER for Venkatesh Iyer — Dengue Fever
    // ──────────────────────────────────────────────────────
    const venkatesh = await prisma.patient.findUnique({ where: { uhid: "SMF-2024-001005" } });
    if (venkatesh && availableBeds.length > 0) {
      const existingEnc = await prisma.encounter.findFirst({
        where: { patientId: venkatesh.id, status: "admitted" },
      });

      if (!existingEnc) {
        const bed5 = availableBeds[0];

        // Generate IP number inside transaction
        const enc5 = await prisma.$transaction(async (tx) => {
          const lastEnc = await tx.encounter.findFirst({
            orderBy: { createdAt: "desc" },
            select: { visNo: true },
          });
          const nextNum = lastEnc
            ? parseInt(lastEnc.visNo.split("/").pop() ?? "0") + 1
            : 1;
          const ipNo = `IP/${new Date().getFullYear()}/${String(nextNum).padStart(6, "0")}`;

          await tx.bed.update({
            where: { id: bed5.id },
            data: { status: "occupied" },
          });

          return tx.encounter.create({
            data: {
              visNo: ipNo,
              patientId: venkatesh.id,
              bedId: bed5.id,
              attendingDoctorId: drPriya.id,
              admissionType: "emergency",
              admissionSource: "er_walk_in",
              modeOfArrival: "walk_in",
              triageLevel: 3,
              triageNotes: "High fever day 5, platelet count 62,000. Petechiae on both arms. No active bleeding. Hydration status fair.",
              triageAt: hoursAgo(36),
              admissionDate: hoursAgo(36),
              chiefComplaint: "High-grade fever for 5 days, body aches, rash on arms",
              provisionalDiagnosis: "Dengue Fever with Thrombocytopenia — Warning Signs",
            },
          });
        });

        // Vitals — dengue monitoring
        const vitals5 = [
          { temp: 102.4, pulse: 108, bpSys: 108, bpDia: 68, spo2: 97, rr: 20, pain: 6, h: 36 },
          { temp: 101.8, pulse: 104, bpSys: 104, bpDia: 66, spo2: 97, rr: 18, pain: 5, h: 30 },
          { temp: 101.2, pulse: 100, bpSys: 106, bpDia: 68, spo2: 98, rr: 18, pain: 5, h: 24 },
          { temp: 100.6, pulse: 96, bpSys: 110, bpDia: 70, spo2: 98, rr: 16, pain: 4, h: 18 },
          { temp: 100.0, pulse: 92, bpSys: 112, bpDia: 72, spo2: 98, rr: 16, pain: 3, h: 12 },
          { temp: 99.4, pulse: 88, bpSys: 114, bpDia: 74, spo2: 99, rr: 16, pain: 2, h: 6 },
        ];
        for (const v of vitals5) {
          await prisma.vitals.create({
            data: {
              encounterId: enc5.id, recordedAt: hoursAgo(v.h),
              temperature: v.temp, pulse: v.pulse, bpSystolic: v.bpSys, bpDiastolic: v.bpDia,
              spo2: v.spo2, respiratoryRate: v.rr, painScore: v.pain,
              recordedById: nurseKavitha.id,
            },
          });
        }

        // Orders
        await prisma.order.create({
          data: {
            encounterId: enc5.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: hoursAgo(36),
            medicationOrder: { create: { drugId: drug("Paracetamol").id, dose: "650", unit: "mg", route: "oral", frequency: "qid", isPrn: false, instructions: "For fever. Avoid NSAIDs — risk of bleeding." } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc5.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: hoursAgo(36),
            medicationOrder: { create: { drugId: drug("Pantoprazole").id, dose: "40", unit: "mg", route: "oral", frequency: "od", isPrn: false } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc5.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: hoursAgo(36),
            medicationOrder: { create: { drugId: drug("Ondansetron").id, dose: "4", unit: "mg", route: "oral", frequency: "sos", isPrn: true, prnReason: "Nausea or vomiting" } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc5.id, orderType: "diet", status: "active", priority: "routine",
            orderedById: drPriya.id, signedAt: hoursAgo(36),
            dietOrder: { create: { dietType: "soft", restrictions: "No spicy or fried food", specialInstructions: "High fluid intake — ORS, tender coconut water, fruit juices. Papaya leaf extract if available." } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc5.id, orderType: "nursing", status: "active", priority: "urgent",
            orderedById: drPriya.id, signedAt: hoursAgo(36),
            nursingOrder: { create: { instruction: "Strict I/O charting. Platelet count Q12H. Monitor for warning signs: abdominal pain, persistent vomiting, mucosal bleed, restlessness, hepatomegaly. Hourly BP if platelet < 50,000.", frequency: "Q4H vitals, Q12H platelet", category: "monitoring" } },
          },
        });

        // Notes
        await prisma.clinicalNote.create({
          data: {
            encounterId: enc5.id, noteType: "admission",
            content: {
              chiefComplaint: "High-grade fever for 5 days with body aches, headache, and petechial rash on both forearms",
              historyOfPresentIllness: "44-year-old male, previously healthy, presents with high-grade continuous fever (102-103°F) for 5 days. Severe myalgia, arthralgia, and retro-orbital headache. Noticed petechial spots on forearms since yesterday. Decreased appetite, mild nausea. Dengue NS1 positive on Day 2 (outside). Today's platelet count 62,000/cumm (was 1.8 lakh 2 days ago). No bleeding from gums, no hematemesis, no melena. Adequate urine output.",
              pastHistory: "No known comorbidities. No allergies. Non-smoker, social drinker.",
              examination: "Febrile (102.4°F), tachycardic but hemodynamically stable. Petechiae on bilateral forearms. No palpable liver or spleen. No ascites. Tourniquet test positive (>20 petechiae). No pleural effusion clinically. Hct 42%.",
              provisionalDiagnosis: "Dengue Fever with Warning Signs (thrombocytopenia, positive tourniquet test). Day 5 of illness — approaching critical phase.",
              plan: "IV NS maintenance. Serial platelet, HCT Q12H. Strict I/O. Paracetamol for fever (avoid NSAIDs). Dengue IgM/IgG. Watch for plasma leak — daily USG if worsening. Trigger for platelet transfusion: <20,000 or active bleeding.",
            },
            authorId: drPriya.id, signedAt: hoursAgo(36),
          },
        });
        await prisma.clinicalNote.create({
          data: {
            encounterId: enc5.id, noteType: "progress", createdAt: hoursAgo(8),
            content: {
              subjective: "Fever coming down. Body ache improving. Appetite slightly better — taking ORS and juices. No bleeding episodes. Good urine output.",
              objective: "Temp 99.4°F (trending down), PR 88/min, BP 114/74. Platelet count 48,000 (from 62,000 — expected nadir). HCT 41% (stable — no hemoconcentration). No new petechiae. Abdomen soft, no organomegaly.",
              assessment: "Dengue fever Day 6 — entering critical phase. Platelets dropping as expected. No plasma leak clinically. Hemodynamically stable.",
              plan: "Continue IV fluids, monitor Q6H. Repeat CBC with platelet at 6 PM. USG abdomen to check for free fluid. Alert blood bank for possible platelet transfusion if <20,000. Continue fever chart. Expected recovery in 24-48 hours if no complications.",
            },
            authorId: drPriya.id, signedAt: hoursAgo(8),
          },
        });

        // Diagnoses
        await prisma.diagnosis.create({
          data: { encounterId: enc5.id, icdCode: "A90", description: "Dengue fever with warning signs", type: "primary", diagnosedBy: drPriya.id },
        });
        await prisma.diagnosis.create({
          data: { encounterId: enc5.id, icdCode: "D69.6", description: "Thrombocytopenia, unspecified", type: "secondary", diagnosedBy: drPriya.id },
        });
      }
    }

    // ──────────────────────────────────────────────────────
    // 6. NEW ENCOUNTER for Padma Rangarajan — Elective Knee Replacement (Ortho)
    // ──────────────────────────────────────────────────────
    const padma = await prisma.patient.findUnique({ where: { uhid: "SMF-2024-001006" } });
    if (padma && availableBeds.length > 1) {
      const existingEnc = await prisma.encounter.findFirst({
        where: { patientId: padma.id, status: "admitted" },
      });

      if (!existingEnc) {
        const bed6 = availableBeds[1];

        const enc6 = await prisma.$transaction(async (tx) => {
          const lastEnc = await tx.encounter.findFirst({
            orderBy: { createdAt: "desc" },
            select: { visNo: true },
          });
          const nextNum = lastEnc
            ? parseInt(lastEnc.visNo.split("/").pop() ?? "0") + 1
            : 1;
          const ipNo = `IP/${new Date().getFullYear()}/${String(nextNum).padStart(6, "0")}`;

          await tx.bed.update({
            where: { id: bed6.id },
            data: { status: "occupied" },
          });

          return tx.encounter.create({
            data: {
              visNo: ipNo,
              patientId: padma.id,
              bedId: bed6.id,
              attendingDoctorId: drAnitha.id,
              admissionType: "elective",
              admissionSource: "elective",
              modeOfArrival: "walk_in",
              admissionDate: daysAgo(1),
              chiefComplaint: "Severe bilateral knee pain for 2 years, progressive difficulty walking, planned for right total knee replacement",
              provisionalDiagnosis: "Severe Bilateral Osteoarthritis of Knee (Kellgren-Lawrence Grade IV right, Grade III left)",
            },
          });
        });

        // Vitals
        const vitals6 = [
          { temp: 98.6, pulse: 76, bpSys: 136, bpDia: 84, spo2: 98, rr: 14, pain: 7, h: 24 },
          { temp: 98.4, pulse: 82, bpSys: 142, bpDia: 88, spo2: 99, rr: 16, pain: 6, h: 16 },
          { temp: 98.8, pulse: 78, bpSys: 132, bpDia: 82, spo2: 98, rr: 14, pain: 5, h: 8 },
        ];
        for (const v of vitals6) {
          await prisma.vitals.create({
            data: {
              encounterId: enc6.id, recordedAt: hoursAgo(v.h),
              temperature: v.temp, pulse: v.pulse, bpSystolic: v.bpSys, bpDiastolic: v.bpDia,
              spo2: v.spo2, respiratoryRate: v.rr, painScore: v.pain, weight: 72,
              recordedById: nurseKavitha.id,
            },
          });
        }

        // Orders
        await prisma.order.create({
          data: {
            encounterId: enc6.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drAnitha.id, signedAt: daysAgo(1),
            medicationOrder: { create: { drugId: drug("Paracetamol").id, dose: "650", unit: "mg", route: "oral", frequency: "tid", isPrn: false, instructions: "Analgesic — pre-operative pain management" } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc6.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drAnitha.id, signedAt: daysAgo(1),
            medicationOrder: { create: { drugId: drug("Pantoprazole").id, dose: "40", unit: "mg", route: "oral", frequency: "od", isPrn: false } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc6.id, orderType: "medication", status: "active", priority: "routine",
            orderedById: drAnitha.id, signedAt: daysAgo(1),
            medicationOrder: { create: { drugId: drug("Enoxaparin").id, dose: "40", unit: "mg", route: "sc", frequency: "od", isPrn: false, instructions: "DVT prophylaxis — start 12 hours pre-op" } },
          },
        });
        await prisma.order.create({
          data: {
            encounterId: enc6.id, orderType: "nursing", status: "active", priority: "routine",
            orderedById: drAnitha.id, signedAt: daysAgo(1),
            nursingOrder: { create: { instruction: "Pre-op checklist. Skin preparation bilateral knees. TED stockings left leg. Mark right knee. NPO from midnight before surgery. Consent verified.", frequency: "Pre-op", category: "positioning" } },
          },
        });

        // Notes
        await prisma.clinicalNote.create({
          data: {
            encounterId: enc6.id, noteType: "admission",
            content: {
              chiefComplaint: "Severe bilateral knee pain, worse on right, for 2 years. Difficulty walking, climbing stairs, and squatting. Failed conservative management.",
              historyOfPresentIllness: "69-year-old female, admitted for planned right total knee replacement. Progressive bilateral knee pain for 2 years, right worse than left. Tried physiotherapy, NSAIDs, intra-articular injections (viscosupplementation x3) — temporary relief only. Now pain at rest, night pain disturbing sleep. Walking distance reduced to < 100 meters. X-ray shows Kellgren-Lawrence Grade IV right knee, Grade III left.",
              pastHistory: "Hypertension on Telmisartan 40mg. Hypothyroidism on Eltroxin 50mcg. No DM. No cardiac or respiratory disease. Previous surgery: cholecystectomy (2015). Allergy: Aspirin (gastric intolerance).",
              examination: "BMI 28.6. Gait: antalgic, uses walking stick. Right knee: fixed flexion deformity 10°, varus 12°, crepitus +++, ROM 10-100°, ligaments stable. Left knee: mild effusion, ROM 0-110°, varus 8°. Neurovascular intact bilaterally.",
              provisionalDiagnosis: "Severe OA right knee (KL Grade IV) for Total Knee Arthroplasty. OA left knee (KL Grade III).",
              plan: "Pre-op workup: CBC, RFT, LFT, coagulation, blood grouping & cross-match 2 units. ECG, 2D Echo, chest X-ray. Anaesthesia fitness. Physiotherapy assessment. DVT prophylaxis. Surgery planned for tomorrow AM. Right knee TKR — cemented, posterior stabilized.",
            },
            authorId: drAnitha.id, signedAt: daysAgo(1),
          },
        });

        // Diagnoses
        await prisma.diagnosis.create({
          data: { encounterId: enc6.id, icdCode: "M17.11", description: "Primary osteoarthritis, right knee (KL Grade IV)", type: "primary", diagnosedBy: drAnitha.id },
        });
        await prisma.diagnosis.create({
          data: { encounterId: enc6.id, icdCode: "M17.12", description: "Primary osteoarthritis, left knee (KL Grade III)", type: "secondary", diagnosedBy: drAnitha.id },
        });
        await prisma.diagnosis.create({
          data: { encounterId: enc6.id, icdCode: "I10", description: "Essential hypertension", type: "comorbidity", diagnosedBy: drAnitha.id },
        });
        await prisma.diagnosis.create({
          data: { encounterId: enc6.id, icdCode: "E03.9", description: "Hypothyroidism, unspecified", type: "comorbidity", diagnosedBy: drAnitha.id },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully. 6 patients with full clinical data.",
      patients: [
        "Rajesh Kumar — CAP (ER Ambulance, ESI-3)",
        "Lakshmi Devi — Diabetic Neuropathy (Elective)",
        "Mohammed Irfan — Acute Appendicitis post-op (ER Walk-in, ESI-2)",
        "Saroja Ammal — STEMI/ACS in ICU (ER Ambulance, ESI-1)",
        "Venkatesh Iyer — Dengue Fever (ER Walk-in, ESI-3)",
        "Padma Rangarajan — Knee Replacement pre-op (Elective)",
      ],
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: "Seed failed", details: String(err) },
      { status: 500 }
    );
  }
}
