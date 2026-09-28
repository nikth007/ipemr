-- IP EMR Schema + Seed Data for TiDB Cloud
-- Run this in TiDB Cloud SQL Editor (Chat2Query)

CREATE DATABASE IF NOT EXISTS `ipemr`;
USE `ipemr`;

-- ═══════════════════════════════════════════════════════════
-- SCHEMA (30 tables)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,
    UNIQUE INDEX `accounts_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    UNIQUE INDEX `sessions_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `verification_tokens` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    UNIQUE INDEX `verification_tokens_token_key`(`token`),
    UNIQUE INDEX `verification_tokens_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `departments` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `departments_name_key`(`name`),
    UNIQUE INDEX `departments_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `email_verified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `department_id` VARCHAR(191) NULL,
    `designation` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `users_employee_id_key`(`employee_id`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    UNIQUE INDEX `role_permissions_role_id_resource_action_key`(`role_id`, `resource`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `wards` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `department_id` VARCHAR(191) NOT NULL,
    `ward_type` VARCHAR(191) NOT NULL,
    `floor` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `wards_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `beds` (
    `id` VARCHAR(191) NOT NULL,
    `bed_number` VARCHAR(191) NOT NULL,
    `ward_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'available',
    `bed_type` VARCHAR(191) NOT NULL DEFAULT 'general',
    `gender_restriction` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `beds_ward_id_bed_number_key`(`ward_id`, `bed_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `patients` (
    `id` VARCHAR(191) NOT NULL,
    `uhid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `date_of_birth` DATETIME(3) NULL,
    `gender` VARCHAR(191) NOT NULL,
    `blood_group` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `abha_id` VARCHAR(191) NULL,
    `allergies` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `patients_uhid_key`(`uhid`),
    UNIQUE INDEX `patients_abha_id_key`(`abha_id`),
    INDEX `patients_name_idx`(`name`),
    INDEX `patients_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `encounters` (
    `id` VARCHAR(191) NOT NULL,
    `ip_no` VARCHAR(191) NOT NULL,
    `patient_id` VARCHAR(191) NOT NULL,
    `bed_id` VARCHAR(191) NULL,
    `attending_doctor_id` VARCHAR(191) NOT NULL,
    `admission_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `discharge_date` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'admitted',
    `admission_type` VARCHAR(191) NOT NULL DEFAULT 'elective',
    `chief_complaint` TEXT NULL,
    `provisional_diagnosis` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `encounters_ip_no_key`(`ip_no`),
    INDEX `encounters_patient_id_idx`(`patient_id`),
    INDEX `encounters_status_idx`(`status`),
    INDEX `encounters_admission_date_idx`(`admission_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `transfers` (
    `id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `from_bed_id` VARCHAR(191) NOT NULL,
    `to_bed_id` VARCHAR(191) NOT NULL,
    `transfer_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reason` VARCHAR(191) NULL,
    `transferred_by` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `order_type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'routine',
    `ordered_by` VARCHAR(191) NOT NULL,
    `ordered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `signed_at` DATETIME(3) NULL,
    `discontinued_at` DATETIME(3) NULL,
    `discontinued_reason` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `orders_encounter_id_idx`(`encounter_id`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_order_type_idx`(`order_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `medication_orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `drug_id` VARCHAR(191) NOT NULL,
    `dose` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `route` VARCHAR(191) NOT NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `duration` VARCHAR(191) NULL,
    `is_prn` BOOLEAN NOT NULL DEFAULT false,
    `prn_reason` VARCHAR(191) NULL,
    `instructions` VARCHAR(191) NULL,
    UNIQUE INDEX `medication_orders_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `investigation_orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `investigation_id` VARCHAR(191) NOT NULL,
    `specimen_type` VARCHAR(191) NULL,
    `clinical_indication` VARCHAR(191) NULL,
    UNIQUE INDEX `investigation_orders_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `diet_orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `diet_type` VARCHAR(191) NOT NULL,
    `restrictions` VARCHAR(191) NULL,
    `special_instructions` TEXT NULL,
    UNIQUE INDEX `diet_orders_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `nursing_orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `instruction` TEXT NOT NULL,
    `frequency` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    UNIQUE INDEX `nursing_orders_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `drug_master` (
    `id` VARCHAR(191) NOT NULL,
    `generic_name` VARCHAR(191) NOT NULL,
    `brand_name` VARCHAR(191) NULL,
    `strength` VARCHAR(191) NULL,
    `form` VARCHAR(191) NULL,
    `route` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `drug_master_generic_name_idx`(`generic_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `drug_interactions` (
    `id` VARCHAR(191) NOT NULL,
    `drug_a_id` VARCHAR(191) NOT NULL,
    `drug_b_id` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    UNIQUE INDEX `drug_interactions_drug_a_id_drug_b_id_key`(`drug_a_id`, `drug_b_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `investigation_master` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NULL,
    `specimen_type` VARCHAR(191) NULL,
    `normal_range` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `investigation_master_name_idx`(`name`),
    INDEX `investigation_master_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mar_schedule` (
    `id` VARCHAR(191) NOT NULL,
    `medication_order_id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `scheduled_time` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    INDEX `mar_schedule_encounter_id_scheduled_time_idx`(`encounter_id`, `scheduled_time`),
    INDEX `mar_schedule_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mar_administration` (
    `id` VARCHAR(191) NOT NULL,
    `schedule_id` VARCHAR(191) NOT NULL,
    `administered_by` VARCHAR(191) NOT NULL,
    `administered_at` DATETIME(3) NOT NULL,
    `dose_given` VARCHAR(191) NOT NULL,
    `site` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    UNIQUE INDEX `mar_administration_schedule_id_key`(`schedule_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `clinical_notes` (
    `id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `note_type` VARCHAR(191) NOT NULL,
    `content` JSON NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `signed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `clinical_notes_encounter_id_idx`(`encounter_id`),
    INDEX `clinical_notes_note_type_idx`(`note_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `diagnoses` (
    `id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `icd_code` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'secondary',
    `diagnosed_by` VARCHAR(191) NOT NULL,
    `diagnosed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `diagnoses_encounter_id_idx`(`encounter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `vitals` (
    `id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `recorded_at` DATETIME(3) NOT NULL,
    `temperature` DOUBLE NULL,
    `pulse` INTEGER NULL,
    `bp_systolic` INTEGER NULL,
    `bp_diastolic` INTEGER NULL,
    `spo2` INTEGER NULL,
    `respiratory_rate` INTEGER NULL,
    `pain_score` INTEGER NULL,
    `gcs` INTEGER NULL,
    `weight` DOUBLE NULL,
    `blood_sugar` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,
    `recorded_by` VARCHAR(191) NOT NULL,
    INDEX `vitals_encounter_id_recorded_at_idx`(`encounter_id`, `recorded_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `intake_output` (
    `id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `recorded_at` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `volume_ml` DOUBLE NOT NULL,
    `route` VARCHAR(191) NULL,
    `recorded_by` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    INDEX `intake_output_encounter_id_recorded_at_idx`(`encounter_id`, `recorded_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `nursing_assessments` (
    `id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `assessment_type` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `assessed_by` VARCHAR(191) NOT NULL,
    `assessed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `nursing_assessments_encounter_id_idx`(`encounter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `investigation_results` (
    `id` VARCHAR(191) NOT NULL,
    `investigation_order_id` VARCHAR(191) NOT NULL,
    `result_data` JSON NOT NULL,
    `result_status` VARCHAR(191) NOT NULL DEFAULT 'preliminary',
    `is_abnormal` BOOLEAN NOT NULL DEFAULT false,
    `is_critical` BOOLEAN NOT NULL DEFAULT false,
    `reported_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reported_by` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `critical_alerts` (
    `id` VARCHAR(191) NOT NULL,
    `result_id` VARCHAR(191) NOT NULL,
    `alert_type` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `acknowledged_by` VARCHAR(191) NULL,
    `acknowledged_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `discharge_summaries` (
    `id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `diagnosis_summary` TEXT NULL,
    `course_in_hospital` TEXT NULL,
    `procedures_done` TEXT NULL,
    `condition_at_discharge` VARCHAR(191) NULL,
    `instructions` TEXT NULL,
    `follow_up_date` DATETIME(3) NULL,
    `follow_up_instructions` TEXT NULL,
    `prepared_by` VARCHAR(191) NOT NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `discharge_summaries_encounter_id_key`(`encounter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `discharge_medications` (
    `id` VARCHAR(191) NOT NULL,
    `summary_id` VARCHAR(191) NOT NULL,
    `drug_id` VARCHAR(191) NOT NULL,
    `dose` VARCHAR(191) NOT NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `instructions` VARCHAR(191) NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `audit_log` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `resource_type` VARCHAR(191) NOT NULL,
    `resource_id` VARCHAR(191) NULL,
    `old_value` JSON NULL,
    `new_value` JSON NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `audit_log_user_id_idx`(`user_id`),
    INDEX `audit_log_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    INDEX `audit_log_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `kranium_sync_queue` (
    `id` VARCHAR(191) NOT NULL,
    `operation` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `retry_count` INTEGER NOT NULL DEFAULT 0,
    `error_message` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `synced_at` DATETIME(3) NULL,
    INDEX `kranium_sync_queue_status_idx`(`status`),
    INDEX `kranium_sync_queue_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign Keys
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `wards` ADD CONSTRAINT `wards_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `beds` ADD CONSTRAINT `beds_ward_id_fkey` FOREIGN KEY (`ward_id`) REFERENCES `wards`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `encounters` ADD CONSTRAINT `encounters_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `encounters` ADD CONSTRAINT `encounters_bed_id_fkey` FOREIGN KEY (`bed_id`) REFERENCES `beds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_encounter_id_fkey` FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_from_bed_id_fkey` FOREIGN KEY (`from_bed_id`) REFERENCES `beds`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_to_bed_id_fkey` FOREIGN KEY (`to_bed_id`) REFERENCES `beds`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `orders` ADD CONSTRAINT `orders_encounter_id_fkey` FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `orders` ADD CONSTRAINT `orders_ordered_by_fkey` FOREIGN KEY (`ordered_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `medication_orders` ADD CONSTRAINT `medication_orders_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `medication_orders` ADD CONSTRAINT `medication_orders_drug_id_fkey` FOREIGN KEY (`drug_id`) REFERENCES `drug_master`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `investigation_orders` ADD CONSTRAINT `investigation_orders_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `investigation_orders` ADD CONSTRAINT `investigation_orders_investigation_id_fkey` FOREIGN KEY (`investigation_id`) REFERENCES `investigation_master`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `diet_orders` ADD CONSTRAINT `diet_orders_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `nursing_orders` ADD CONSTRAINT `nursing_orders_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `drug_interactions` ADD CONSTRAINT `drug_interactions_drug_a_id_fkey` FOREIGN KEY (`drug_a_id`) REFERENCES `drug_master`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `drug_interactions` ADD CONSTRAINT `drug_interactions_drug_b_id_fkey` FOREIGN KEY (`drug_b_id`) REFERENCES `drug_master`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `mar_schedule` ADD CONSTRAINT `mar_schedule_medication_order_id_fkey` FOREIGN KEY (`medication_order_id`) REFERENCES `medication_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `mar_schedule` ADD CONSTRAINT `mar_schedule_encounter_id_fkey` FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `mar_administration` ADD CONSTRAINT `mar_administration_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `mar_schedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `mar_administration` ADD CONSTRAINT `mar_administration_administered_by_fkey` FOREIGN KEY (`administered_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `clinical_notes` ADD CONSTRAINT `clinical_notes_encounter_id_fkey` FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `clinical_notes` ADD CONSTRAINT `clinical_notes_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `diagnoses` ADD CONSTRAINT `diagnoses_encounter_id_fkey` FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `vitals` ADD CONSTRAINT `vitals_encounter_id_fkey` FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `vitals` ADD CONSTRAINT `vitals_recorded_by_fkey` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `intake_output` ADD CONSTRAINT `intake_output_encounter_id_fkey` FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `nursing_assessments` ADD CONSTRAINT `nursing_assessments_encounter_id_fkey` FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `investigation_results` ADD CONSTRAINT `investigation_results_investigation_order_id_fkey` FOREIGN KEY (`investigation_order_id`) REFERENCES `investigation_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `critical_alerts` ADD CONSTRAINT `critical_alerts_result_id_fkey` FOREIGN KEY (`result_id`) REFERENCES `investigation_results`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `discharge_summaries` ADD CONSTRAINT `discharge_summaries_encounter_id_fkey` FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `discharge_medications` ADD CONSTRAINT `discharge_medications_summary_id_fkey` FOREIGN KEY (`summary_id`) REFERENCES `discharge_summaries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `discharge_medications` ADD CONSTRAINT `discharge_medications_drug_id_fkey` FOREIGN KEY (`drug_id`) REFERENCES `drug_master`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prisma migrations tracking table
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
    `id` VARCHAR(36) NOT NULL,
    `checksum` VARCHAR(64) NOT NULL,
    `finished_at` DATETIME(3) NULL,
    `migration_name` VARCHAR(255) NOT NULL,
    `logs` TEXT NULL,
    `rolled_back_at` DATETIME(3) NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `applied_steps_count` INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════

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

-- Users (password: smf@2024 → bcrypt hash)
INSERT INTO `users` (`id`, `employee_id`, `name`, `email`, `password_hash`, `role_id`, `department_id`, `designation`, `updated_at`) VALUES
('usr-admin', 'ADM001', 'System Admin', 'admin@smf.org.in', '$2b$10$cphhWUNRqzFkM.gPvkqxnOuPmKCmg5x3/Fh0XQfhnwrXoH2rsQ1Oq', 'role-admin', NULL, 'IT Administrator', NOW()),
('usr-priya', 'DOC001', 'Dr. Priya Sharma', 'priya.sharma@smf.org.in', '$2b$10$cphhWUNRqzFkM.gPvkqxnOuPmKCmg5x3/Fh0XQfhnwrXoH2rsQ1Oq', 'role-physician', 'dept-med', 'Consultant Physician', NOW()),
('usr-ravi', 'DOC002', 'Dr. Ravi Krishnan', 'ravi.k@smf.org.in', '$2b$10$cphhWUNRqzFkM.gPvkqxnOuPmKCmg5x3/Fh0XQfhnwrXoH2rsQ1Oq', 'role-physician', 'dept-sur', 'Consultant Surgeon', NOW()),
('usr-anitha', 'DOC003', 'Dr. Anitha Venkatesh', 'anitha.v@smf.org.in', '$2b$10$cphhWUNRqzFkM.gPvkqxnOuPmKCmg5x3/Fh0XQfhnwrXoH2rsQ1Oq', 'role-physician', 'dept-ort', 'Consultant Orthopaedician', NOW()),
('usr-kavitha', 'NUR001', 'Kavitha Ramanathan', 'kavitha.r@smf.org.in', '$2b$10$cphhWUNRqzFkM.gPvkqxnOuPmKCmg5x3/Fh0XQfhnwrXoH2rsQ1Oq', 'role-nurse', 'dept-med', 'Senior Staff Nurse', NOW()),
('usr-meera', 'NUR002', 'Meera Sundaram', 'meera.s@smf.org.in', '$2b$10$cphhWUNRqzFkM.gPvkqxnOuPmKCmg5x3/Fh0XQfhnwrXoH2rsQ1Oq', 'role-nurse', 'dept-sur', 'Staff Nurse', NOW()),
('usr-suresh', 'PHR001', 'Suresh Babu', 'suresh.b@smf.org.in', '$2b$10$cphhWUNRqzFkM.gPvkqxnOuPmKCmg5x3/Fh0XQfhnwrXoH2rsQ1Oq', 'role-pharmacist', NULL, 'Clinical Pharmacist', NOW());

-- Wards
INSERT INTO `wards` (`id`, `name`, `department_id`, `ward_type`, `floor`) VALUES
('ward-gm', 'General Medicine Ward', 'dept-med', 'general', '2nd'),
('ward-su', 'Surgical Ward', 'dept-sur', 'general', '3rd'),
('ward-icu', 'ICU', 'dept-med', 'icu', '1st'),
('ward-pd', 'Paediatric Ward', 'dept-ped', 'general', '2nd');

-- Beds (General Medicine - 16 beds)
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

-- Beds (Surgical - 12 beds)
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

-- Beds (ICU - 8 beds)
INSERT INTO `beds` (`id`, `bed_number`, `ward_id`, `status`, `bed_type`) VALUES
('bed-icu01', 'ICU-01', 'ward-icu', 'occupied', 'monitored'),
('bed-icu02', 'ICU-02', 'ward-icu', 'occupied', 'monitored'),
('bed-icu03', 'ICU-03', 'ward-icu', 'occupied', 'monitored'),
('bed-icu04', 'ICU-04', 'ward-icu', 'occupied', 'monitored'),
('bed-icu05', 'ICU-05', 'ward-icu', 'available', 'monitored'),
('bed-icu06', 'ICU-06', 'ward-icu', 'available', 'monitored'),
('bed-icu07', 'ICU-07', 'ward-icu', 'available', 'monitored'),
('bed-icu08', 'ICU-08', 'ward-icu', 'available', 'monitored');

-- Beds (Paediatric - 10 beds)
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

-- Vitals (Patient 1 - improving trend)
INSERT INTO `vitals` (`id`, `encounter_id`, `recorded_at`, `temperature`, `pulse`, `bp_systolic`, `bp_diastolic`, `spo2`, `respiratory_rate`, `pain_score`, `recorded_by`) VALUES
('vit-01', 'enc-01', '2024-01-15 06:00:00', 101.2, 110, 130, 85, 93, 24, 3, 'usr-kavitha'),
('vit-02', 'enc-01', '2024-01-15 10:00:00', 100.8, 105, 128, 82, 94, 22, 2, 'usr-kavitha'),
('vit-03', 'enc-01', '2024-01-15 14:00:00', 100.2, 98, 125, 80, 95, 20, 2, 'usr-kavitha'),
('vit-04', 'enc-01', '2024-01-15 18:00:00', 99.6, 92, 122, 78, 96, 18, 1, 'usr-kavitha'),
('vit-05', 'enc-01', '2024-01-15 22:00:00', 99.0, 88, 120, 76, 97, 18, 1, 'usr-kavitha'),
('vit-06', 'enc-01', '2024-01-16 06:00:00', 98.8, 84, 118, 74, 98, 16, 0, 'usr-kavitha');

-- Orders (Medication orders for Patient 1)
INSERT INTO `orders` (`id`, `encounter_id`, `order_type`, `status`, `priority`, `ordered_by`, `ordered_at`, `signed_at`, `updated_at`) VALUES
('ord-01', 'enc-01', 'medication', 'active', 'routine', 'usr-priya', '2024-01-15 10:00:00', '2024-01-15 10:00:00', NOW()),
('ord-02', 'enc-01', 'medication', 'active', 'routine', 'usr-priya', '2024-01-15 10:00:00', '2024-01-15 10:00:00', NOW()),
('ord-03', 'enc-01', 'medication', 'active', 'routine', 'usr-priya', '2024-01-15 10:00:00', '2024-01-15 10:00:00', NOW()),
('ord-04', 'enc-01', 'medication', 'active', 'routine', 'usr-priya', '2024-01-15 10:00:00', '2024-01-15 10:00:00', NOW());

INSERT INTO `medication_orders` (`id`, `order_id`, `drug_id`, `dose`, `unit`, `route`, `frequency`, `is_prn`, `prn_reason`) VALUES
('mord-01', 'ord-01', 'drug-06', '1', 'g', 'iv', 'bd', false, NULL),
('mord-02', 'ord-02', 'drug-01', '650', 'mg', 'oral', 'tid', false, NULL),
('mord-03', 'ord-03', 'drug-03', '40', 'mg', 'oral', 'od', false, NULL),
('mord-04', 'ord-04', 'drug-09', '4', 'mg', 'oral', 'sos', true, 'Nausea');

-- Clinical Notes
INSERT INTO `clinical_notes` (`id`, `encounter_id`, `note_type`, `content`, `author_id`, `signed_at`, `created_at`, `updated_at`) VALUES
('note-01', 'enc-01', 'admission', '{"chiefComplaint":"Fever, cough, and breathlessness for 3 days","historyOfPresentIllness":"66-year-old male, known diabetic and hypertensive, presents with high-grade fever (102°F) for 3 days associated with productive cough with yellowish sputum and progressive breathlessness. No hemoptysis. No chest pain. Reduced oral intake for 2 days.","pastHistory":"Type 2 DM on OHA for 10 years. Hypertension on medication for 5 years. No history of TB, asthma or cardiac disease.","examination":"Febrile (101.2°F), tachycardic (110/min), tachypneic (24/min), SpO2 93% on RA. RS: Bilateral crepitations, more on right lower zone. CVS: S1S2 normal. P/A: Soft, non-tender.","provisionalDiagnosis":"Community Acquired Pneumonia with Type 2 DM, Systemic Hypertension","plan":"IV antibiotics, supportive care, blood investigations, CXR PA view, strict I/O charting"}', 'usr-priya', '2024-01-15 10:30:00', '2024-01-15 10:30:00', NOW()),
('note-02', 'enc-01', 'progress', '{"subjective":"Patient reports mild improvement. Fever subsiding. Cough persists but sputum reducing. Appetite improving.","objective":"Temp 99.6°F, PR 92/min, BP 122/78, SpO2 96% on RA. RS: Crepitations reducing on right side. Good urine output.","assessment":"CAP — improving on IV antibiotics. DM — sugars controlled.","plan":"Continue current medications. Repeat CBC tomorrow. If afebrile for 24h, consider oral switch."}', 'usr-priya', '2024-01-16 09:00:00', '2024-01-16 09:00:00', NOW());

-- Diagnoses
INSERT INTO `diagnoses` (`id`, `encounter_id`, `icd_code`, `description`, `type`, `diagnosed_by`) VALUES
('dx-01', 'enc-01', 'J18.9', 'Community Acquired Pneumonia, unspecified', 'primary', 'usr-priya'),
('dx-02', 'enc-01', 'E11.9', 'Type 2 Diabetes Mellitus without complications', 'comorbidity', 'usr-priya'),
('dx-03', 'enc-01', 'I10', 'Essential (primary) hypertension', 'comorbidity', 'usr-priya');
