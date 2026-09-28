-- IP EMR Seed Data for TiDB Cloud
-- Part 2: Seed data (run this AFTER init-schema.sql)
-- NOTE: Select your "ipemr" database in the SQL Editor dropdown before running

-- Roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
('role-admin', 'admin', 'System administrator'),
('role-physician', 'physician', 'Attending physician / consultant'),
('role-nurse', 'nurse', 'Staff nurse'),
('role-pharmacist', 'pharmacist', 'Clinical pharmacist');

-- Role Permissions
INSERT INTO `role_permissions` (`id`, `role_id`, `resource`, `action`) VALUES
('perm-01', 'role-admin', '*', '*'),
('perm-02', 'role-physician', 'encounters', 'read'),
('perm-03', 'role-physician', 'encounters', 'create'),
('perm-04', 'role-physician', 'encounters', 'update'),
('perm-05', 'role-physician', 'orders', 'read'),
('perm-06', 'role-physician', 'orders', 'create'),
('perm-07', 'role-physician', 'orders', 'update'),
('perm-08', 'role-physician', 'clinical_notes', 'read'),
('perm-09', 'role-physician', 'clinical_notes', 'create'),
('perm-10', 'role-physician', 'clinical_notes', 'update'),
('perm-11', 'role-physician', 'vitals', 'read'),
('perm-12', 'role-physician', 'investigation_results', 'read'),
('perm-13', 'role-physician', 'discharge', 'read'),
('perm-14', 'role-physician', 'discharge', 'create'),
('perm-15', 'role-physician', 'discharge', 'update'),
('perm-16', 'role-nurse', 'encounters', 'read'),
('perm-17', 'role-nurse', 'orders', 'read'),
('perm-18', 'role-nurse', 'vitals', 'read'),
('perm-19', 'role-nurse', 'vitals', 'create'),
('perm-20', 'role-nurse', 'clinical_notes', 'read'),
('perm-21', 'role-nurse', 'clinical_notes', 'create'),
('perm-22', 'role-nurse', 'mar', 'read'),
('perm-23', 'role-nurse', 'mar', 'update'),
('perm-24', 'role-nurse', 'intake_output', 'read'),
('perm-25', 'role-nurse', 'intake_output', 'create'),
('perm-26', 'role-nurse', 'nursing_assessments', 'read'),
('perm-27', 'role-nurse', 'nursing_assessments', 'create'),
('perm-28', 'role-pharmacist', 'orders', 'read'),
('perm-29', 'role-pharmacist', 'orders', 'update'),
('perm-30', 'role-pharmacist', 'encounters', 'read'),
('perm-31', 'role-pharmacist', 'vitals', 'read');

-- Departments
INSERT INTO `departments` (`id`, `name`, `code`) VALUES
('dept-med', 'General Medicine', 'MED'),
('dept-sur', 'General Surgery', 'SUR'),
('dept-ort', 'Orthopaedics', 'ORT'),
('dept-ped', 'Paediatrics', 'PED');

-- Users (password: smf@2024)
INSERT INTO `users` (`id`, `employee_id`, `name`, `email`, `password_hash`, `role_id`, `department_id`, `designation`, `updated_at`) VALUES
('usr-admin', 'ADM001', 'System Admin', 'admin@smf.org.in', '$2a$10$8KzaNdKIMyOkASCPPBD8kuLkCrIHjlBMnMcv4D6v/4VFbkneVRtCe', 'role-admin', NULL, 'IT Administrator', NOW()),
('usr-priya', 'DOC001', 'Dr. Priya Sharma', 'priya.sharma@smf.org.in', '$2a$10$8KzaNdKIMyOkASCPPBD8kuLkCrIHjlBMnMcv4D6v/4VFbkneVRtCe', 'role-physician', 'dept-med', 'Consultant Physician', NOW()),
('usr-ravi', 'DOC002', 'Dr. Ravi Krishnan', 'ravi.k@smf.org.in', '$2a$10$8KzaNdKIMyOkASCPPBD8kuLkCrIHjlBMnMcv4D6v/4VFbkneVRtCe', 'role-physician', 'dept-sur', 'Consultant Surgeon', NOW()),
('usr-anitha', 'DOC003', 'Dr. Anitha Venkatesh', 'anitha.v@smf.org.in', '$2a$10$8KzaNdKIMyOkASCPPBD8kuLkCrIHjlBMnMcv4D6v/4VFbkneVRtCe', 'role-physician', 'dept-ort', 'Consultant Orthopaedician', NOW()),
('usr-kavitha', 'NUR001', 'Kavitha Ramanathan', 'kavitha.r@smf.org.in', '$2a$10$8KzaNdKIMyOkASCPPBD8kuLkCrIHjlBMnMcv4D6v/4VFbkneVRtCe', 'role-nurse', 'dept-med', 'Senior Staff Nurse', NOW()),
('usr-meera', 'NUR002', 'Meera Sundaram', 'meera.s@smf.org.in', '$2a$10$8KzaNdKIMyOkASCPPBD8kuLkCrIHjlBMnMcv4D6v/4VFbkneVRtCe', 'role-nurse', 'dept-sur', 'Staff Nurse', NOW()),
('usr-suresh', 'PHR001', 'Suresh Babu', 'suresh.b@smf.org.in', '$2a$10$8KzaNdKIMyOkASCPPBD8kuLkCrIHjlBMnMcv4D6v/4VFbkneVRtCe', 'role-pharmacist', NULL, 'Clinical Pharmacist', NOW());

-- Wards
INSERT INTO `wards` (`id`, `name`, `department_id`, `ward_type`, `floor`) VALUES
('ward-gm', 'General Medicine Ward', 'dept-med', 'general', '2nd'),
('ward-su', 'Surgical Ward', 'dept-sur', 'general', '3rd'),
('ward-icu', 'ICU', 'dept-med', 'icu', '1st'),
('ward-pd', 'Paediatric Ward', 'dept-ped', 'general', '2nd');

-- Beds (General Medicine - 16)
INSERT INTO `beds` (`id`, `bed_number`, `ward_id`, `status`, `bed_type`) VALUES
('bed-gm01', 'GM-01', 'ward-gm', 'occupied', 'general'),
('bed-gm02', 'GM-02', 'ward-gm', 'occupied', 'general'),
('bed-gm03', 'GM-03', 'ward-gm', 'occupied', 'general'),
('bed-gm04', 'GM-04', 'ward-gm', 'occupied', 'general'),
('bed-gm05', 'GM-05', 'ward-gm', 'occupied', 'general'),
('bed-gm06', 'GM-06', 'ward-gm', 'occupied', 'general'),
('bed-gm07', 'GM-07', 'ward-gm', 'occupied', 'general'),
('bed-gm08', 'GM-08', 'ward-gm', 'occupied', 'general'),
('bed-gm09', 'GM-09', 'ward-gm', 'occupied', 'general'),
('bed-gm10', 'GM-10', 'ward-gm', 'available', 'general'),
('bed-gm11', 'GM-11', 'ward-gm', 'available', 'general'),
('bed-gm12', 'GM-12', 'ward-gm', 'available', 'general'),
('bed-gm13', 'GM-13', 'ward-gm', 'available', 'general'),
('bed-gm14', 'GM-14', 'ward-gm', 'available', 'general'),
('bed-gm15', 'GM-15', 'ward-gm', 'available', 'general'),
('bed-gm16', 'GM-16', 'ward-gm', 'available', 'general');

-- Beds (Surgical - 12)
INSERT INTO `beds` (`id`, `bed_number`, `ward_id`, `status`, `bed_type`) VALUES
('bed-su01', 'SU-01', 'ward-su', 'occupied', 'general'),
('bed-su02', 'SU-02', 'ward-su', 'occupied', 'general'),
('bed-su03', 'SU-03', 'ward-su', 'occupied', 'general'),
('bed-su04', 'SU-04', 'ward-su', 'occupied', 'general'),
('bed-su05', 'SU-05', 'ward-su', 'occupied', 'general'),
('bed-su06', 'SU-06', 'ward-su', 'occupied', 'general'),
('bed-su07', 'SU-07', 'ward-su', 'occupied', 'general'),
('bed-su08', 'SU-08', 'ward-su', 'available', 'general'),
('bed-su09', 'SU-09', 'ward-su', 'available', 'general'),
('bed-su10', 'SU-10', 'ward-su', 'available', 'general'),
('bed-su11', 'SU-11', 'ward-su', 'available', 'general'),
('bed-su12', 'SU-12', 'ward-su', 'available', 'general');

-- Beds (ICU - 8)
INSERT INTO `beds` (`id`, `bed_number`, `ward_id`, `status`, `bed_type`) VALUES
('bed-icu01', 'ICU-01', 'ward-icu', 'occupied', 'monitored'),
('bed-icu02', 'ICU-02', 'ward-icu', 'occupied', 'monitored'),
('bed-icu03', 'ICU-03', 'ward-icu', 'occupied', 'monitored'),
('bed-icu04', 'ICU-04', 'ward-icu', 'occupied', 'monitored'),
('bed-icu05', 'ICU-05', 'ward-icu', 'available', 'monitored'),
('bed-icu06', 'ICU-06', 'ward-icu', 'available', 'monitored'),
('bed-icu07', 'ICU-07', 'ward-icu', 'available', 'monitored'),
('bed-icu08', 'ICU-08', 'ward-icu', 'available', 'monitored');

-- Beds (Paediatric - 10)
INSERT INTO `beds` (`id`, `bed_number`, `ward_id`, `status`, `bed_type`) VALUES
('bed-pd01', 'PD-01', 'ward-pd', 'occupied', 'general'),
('bed-pd02', 'PD-02', 'ward-pd', 'occupied', 'general'),
('bed-pd03', 'PD-03', 'ward-pd', 'occupied', 'general'),
('bed-pd04', 'PD-04', 'ward-pd', 'occupied', 'general'),
('bed-pd05', 'PD-05', 'ward-pd', 'occupied', 'general'),
('bed-pd06', 'PD-06', 'ward-pd', 'occupied', 'general'),
('bed-pd07', 'PD-07', 'ward-pd', 'available', 'general'),
('bed-pd08', 'PD-08', 'ward-pd', 'available', 'general'),
('bed-pd09', 'PD-09', 'ward-pd', 'available', 'general'),
('bed-pd10', 'PD-10', 'ward-pd', 'available', 'general');

-- Drug Master
INSERT INTO `drug_master` (`id`, `generic_name`, `brand_name`, `strength`, `form`, `route`, `category`) VALUES
('drug-01', 'Paracetamol', 'Dolo', '650mg', 'tablet', 'oral', 'analgesic'),
('drug-02', 'Amoxicillin', 'Mox', '500mg', 'capsule', 'oral', 'antibiotic'),
('drug-03', 'Pantoprazole', 'Pan-D', '40mg', 'tablet', 'oral', 'antacid'),
('drug-04', 'Metformin', 'Glycomet', '500mg', 'tablet', 'oral', 'antidiabetic'),
('drug-05', 'Amlodipine', 'Amlong', '5mg', 'tablet', 'oral', 'antihypertensive'),
('drug-06', 'Ceftriaxone', 'Monocef', '1g', 'injection', 'iv', 'antibiotic'),
('drug-07', 'Insulin Regular', 'Actrapid', '100IU/ml', 'injection', 'sc', 'antidiabetic'),
('drug-08', 'Enoxaparin', 'Clexane', '40mg', 'injection', 'sc', 'anticoagulant'),
('drug-09', 'Ondansetron', 'Emeset', '4mg', 'tablet', 'oral', 'antiemetic'),
('drug-10', 'Tramadol', 'Ultracet', '50mg', 'capsule', 'oral', 'analgesic');

-- Drug Interactions
INSERT INTO `drug_interactions` (`id`, `drug_a_id`, `drug_b_id`, `severity`, `description`) VALUES
('di-01', 'drug-07', 'drug-04', 'moderate', 'Concurrent use may increase risk of hypoglycaemia. Monitor blood glucose closely.');

-- Investigation Master
INSERT INTO `investigation_master` (`id`, `name`, `category`, `specimen_type`, `normal_range`, `unit`) VALUES
('inv-01', 'Complete Blood Count', 'lab', 'Blood', NULL, ''),
('inv-02', 'Blood Urea', 'lab', 'Blood', '15-40', 'mg/dL'),
('inv-03', 'Serum Creatinine', 'lab', 'Blood', '0.7-1.3', 'mg/dL'),
('inv-04', 'Random Blood Sugar', 'lab', 'Blood', '70-140', 'mg/dL'),
('inv-05', 'Liver Function Test', 'lab', 'Blood', NULL, ''),
('inv-06', 'Chest X-Ray PA', 'radiology', NULL, NULL, ''),
('inv-07', 'USG Abdomen', 'radiology', NULL, NULL, ''),
('inv-08', 'ECG 12-Lead', 'lab', NULL, NULL, ''),
('inv-09', 'Urine Routine', 'lab', 'Urine', NULL, ''),
('inv-10', 'HbA1c', 'lab', 'Blood', '4.0-5.6', '%');

-- Patients
INSERT INTO `patients` (`id`, `uhid`, `name`, `date_of_birth`, `gender`, `blood_group`, `phone`, `allergies`, `updated_at`) VALUES
('pat-01', 'SMF-2024-001001', 'Rajesh Kumar', '1958-03-15', 'male', 'B+', '9841012345', 'Penicillin, Sulfa drugs', NOW()),
('pat-02', 'SMF-2024-001002', 'Lakshmi Devi', '1965-07-22', 'female', 'O+', '9841023456', NULL, NOW()),
('pat-03', 'SMF-2024-001003', 'Mohammed Irfan', '1972-11-08', 'male', 'A+', '9841034567', NULL, NOW()),
('pat-04', 'SMF-2024-001004', 'Saroja Ammal', '1948-01-30', 'female', 'AB+', '9841045678', 'Aspirin', NOW()),
('pat-05', 'SMF-2024-001005', 'Venkatesh Iyer', '1980-06-12', 'male', 'O-', '9841056789', NULL, NOW()),
('pat-06', 'SMF-2024-001006', 'Padma Rangarajan', '1955-09-25', 'female', 'B+', '9841067890', NULL, NOW());

-- Encounters (Admissions)
INSERT INTO `encounters` (`id`, `ip_no`, `patient_id`, `bed_id`, `attending_doctor_id`, `admission_date`, `status`, `admission_type`, `chief_complaint`, `provisional_diagnosis`, `updated_at`) VALUES
('enc-01', 'IP/2024/000001', 'pat-01', 'bed-gm01', 'usr-priya', '2024-01-15', 'admitted', 'emergency', 'Fever, cough, and breathlessness for 3 days', 'Community Acquired Pneumonia', NOW()),
('enc-02', 'IP/2024/000002', 'pat-02', 'bed-gm02', 'usr-priya', '2024-01-16', 'admitted', 'elective', 'Uncontrolled diabetes with peripheral neuropathy', 'Type 2 Diabetes Mellitus with Diabetic Neuropathy', NOW()),
('enc-03', 'IP/2024/000003', 'pat-03', 'bed-su01', 'usr-ravi', '2024-01-17', 'admitted', 'emergency', 'Acute pain abdomen since morning', 'Acute Appendicitis', NOW()),
('enc-04', 'IP/2024/000004', 'pat-04', 'bed-icu01', 'usr-priya', '2024-01-17', 'admitted', 'emergency', 'Chest pain and breathlessness', 'Acute Coronary Syndrome', NOW());

-- Vitals
INSERT INTO `vitals` (`id`, `encounter_id`, `recorded_at`, `temperature`, `pulse`, `bp_systolic`, `bp_diastolic`, `spo2`, `respiratory_rate`, `pain_score`, `recorded_by`) VALUES
('vit-01', 'enc-01', '2024-01-15 06:00:00', 101.2, 110, 130, 85, 93, 24, 3, 'usr-kavitha'),
('vit-02', 'enc-01', '2024-01-15 10:00:00', 100.8, 105, 128, 82, 94, 22, 2, 'usr-kavitha'),
('vit-03', 'enc-01', '2024-01-15 14:00:00', 100.2, 98, 125, 80, 95, 20, 2, 'usr-kavitha'),
('vit-04', 'enc-01', '2024-01-15 18:00:00', 99.6, 92, 122, 78, 96, 18, 1, 'usr-kavitha'),
('vit-05', 'enc-01', '2024-01-15 22:00:00', 99.0, 88, 120, 76, 97, 18, 1, 'usr-kavitha'),
('vit-06', 'enc-01', '2024-01-16 06:00:00', 98.8, 84, 118, 74, 98, 16, 0, 'usr-kavitha');

-- Orders
INSERT INTO `orders` (`id`, `encounter_id`, `order_type`, `status`, `priority`, `ordered_by`, `ordered_at`, `signed_at`, `updated_at`) VALUES
('ord-01', 'enc-01', 'medication', 'active', 'routine', 'usr-priya', '2024-01-15 10:00:00', '2024-01-15 10:00:00', NOW()),
('ord-02', 'enc-01', 'medication', 'active', 'routine', 'usr-priya', '2024-01-15 10:00:00', '2024-01-15 10:00:00', NOW()),
('ord-03', 'enc-01', 'medication', 'active', 'routine', 'usr-priya', '2024-01-15 10:00:00', '2024-01-15 10:00:00', NOW()),
('ord-04', 'enc-01', 'medication', 'active', 'routine', 'usr-priya', '2024-01-15 10:00:00', '2024-01-15 10:00:00', NOW());

-- Medication Orders
INSERT INTO `medication_orders` (`id`, `order_id`, `drug_id`, `dose`, `unit`, `route`, `frequency`, `is_prn`, `prn_reason`) VALUES
('mord-01', 'ord-01', 'drug-06', '1', 'g', 'iv', 'bd', false, NULL),
('mord-02', 'ord-02', 'drug-01', '650', 'mg', 'oral', 'tid', false, NULL),
('mord-03', 'ord-03', 'drug-03', '40', 'mg', 'oral', 'od', false, NULL),
('mord-04', 'ord-04', 'drug-09', '4', 'mg', 'oral', 'sos', true, 'Nausea');

-- Clinical Notes
INSERT INTO `clinical_notes` (`id`, `encounter_id`, `note_type`, `content`, `author_id`, `signed_at`, `created_at`, `updated_at`) VALUES
('note-01', 'enc-01', 'admission', '{"chiefComplaint":"Fever, cough, and breathlessness for 3 days","historyOfPresentIllness":"66-year-old male, known diabetic and hypertensive, presents with high-grade fever for 3 days associated with productive cough with yellowish sputum and progressive breathlessness.","pastHistory":"Type 2 DM on OHA for 10 years. Hypertension on medication for 5 years.","examination":"Febrile, tachycardic, tachypneic, SpO2 93% on RA. RS: Bilateral crepitations, more on right lower zone.","provisionalDiagnosis":"Community Acquired Pneumonia with Type 2 DM, Systemic Hypertension","plan":"IV antibiotics, supportive care, blood investigations, CXR PA view, strict I/O charting"}', 'usr-priya', '2024-01-15 10:30:00', '2024-01-15 10:30:00', NOW()),
('note-02', 'enc-01', 'progress', '{"subjective":"Patient reports mild improvement. Fever subsiding. Cough persists but sputum reducing.","objective":"Temp 99.6F, PR 92/min, BP 122/78, SpO2 96% on RA. RS: Crepitations reducing on right side.","assessment":"CAP improving on IV antibiotics. DM sugars controlled.","plan":"Continue current medications. Repeat CBC tomorrow. If afebrile for 24h, consider oral switch."}', 'usr-priya', '2024-01-16 09:00:00', '2024-01-16 09:00:00', NOW());

-- Diagnoses
INSERT INTO `diagnoses` (`id`, `encounter_id`, `icd_code`, `description`, `type`, `diagnosed_by`) VALUES
('dx-01', 'enc-01', 'J18.9', 'Community Acquired Pneumonia, unspecified', 'primary', 'usr-priya'),
('dx-02', 'enc-01', 'E11.9', 'Type 2 Diabetes Mellitus without complications', 'comorbidity', 'usr-priya'),
('dx-03', 'enc-01', 'I10', 'Essential (primary) hypertension', 'comorbidity', 'usr-priya');
