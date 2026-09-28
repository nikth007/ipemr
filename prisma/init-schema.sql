-- IP EMR Schema for TiDB Cloud
-- Part 1: Tables (run this first)
-- NOTE: Select your "ipemr" database in the SQL Editor dropdown before running

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `accounts` (
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

CREATE TABLE IF NOT EXISTS `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    UNIQUE INDEX `sessions_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `verification_tokens` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    UNIQUE INDEX `verification_tokens_token_key`(`token`),
    UNIQUE INDEX `verification_tokens_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `departments` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `departments_name_key`(`name`),
    UNIQUE INDEX `departments_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
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

CREATE TABLE IF NOT EXISTS `role_permissions` (
    `id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    UNIQUE INDEX `role_permissions_role_id_resource_action_key`(`role_id`, `resource`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wards` (
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

CREATE TABLE IF NOT EXISTS `beds` (
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

CREATE TABLE IF NOT EXISTS `patients` (
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

CREATE TABLE IF NOT EXISTS `encounters` (
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

CREATE TABLE IF NOT EXISTS `transfers` (
    `id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `from_bed_id` VARCHAR(191) NOT NULL,
    `to_bed_id` VARCHAR(191) NOT NULL,
    `transfer_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reason` VARCHAR(191) NULL,
    `transferred_by` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
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

CREATE TABLE IF NOT EXISTS `medication_orders` (
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

CREATE TABLE IF NOT EXISTS `investigation_orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `investigation_id` VARCHAR(191) NOT NULL,
    `specimen_type` VARCHAR(191) NULL,
    `clinical_indication` VARCHAR(191) NULL,
    UNIQUE INDEX `investigation_orders_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `diet_orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `diet_type` VARCHAR(191) NOT NULL,
    `restrictions` VARCHAR(191) NULL,
    `special_instructions` TEXT NULL,
    UNIQUE INDEX `diet_orders_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `nursing_orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `instruction` TEXT NOT NULL,
    `frequency` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    UNIQUE INDEX `nursing_orders_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `drug_master` (
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

CREATE TABLE IF NOT EXISTS `drug_interactions` (
    `id` VARCHAR(191) NOT NULL,
    `drug_a_id` VARCHAR(191) NOT NULL,
    `drug_b_id` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    UNIQUE INDEX `drug_interactions_drug_a_id_drug_b_id_key`(`drug_a_id`, `drug_b_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `investigation_master` (
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

CREATE TABLE IF NOT EXISTS `mar_schedule` (
    `id` VARCHAR(191) NOT NULL,
    `medication_order_id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `scheduled_time` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    INDEX `mar_schedule_encounter_id_scheduled_time_idx`(`encounter_id`, `scheduled_time`),
    INDEX `mar_schedule_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mar_administration` (
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

CREATE TABLE IF NOT EXISTS `clinical_notes` (
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

CREATE TABLE IF NOT EXISTS `diagnoses` (
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

CREATE TABLE IF NOT EXISTS `vitals` (
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

CREATE TABLE IF NOT EXISTS `intake_output` (
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

CREATE TABLE IF NOT EXISTS `nursing_assessments` (
    `id` VARCHAR(191) NOT NULL,
    `encounter_id` VARCHAR(191) NOT NULL,
    `assessment_type` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `assessed_by` VARCHAR(191) NOT NULL,
    `assessed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `nursing_assessments_encounter_id_idx`(`encounter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `investigation_results` (
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

CREATE TABLE IF NOT EXISTS `critical_alerts` (
    `id` VARCHAR(191) NOT NULL,
    `result_id` VARCHAR(191) NOT NULL,
    `alert_type` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `acknowledged_by` VARCHAR(191) NULL,
    `acknowledged_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `discharge_summaries` (
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

CREATE TABLE IF NOT EXISTS `discharge_medications` (
    `id` VARCHAR(191) NOT NULL,
    `summary_id` VARCHAR(191) NOT NULL,
    `drug_id` VARCHAR(191) NOT NULL,
    `dose` VARCHAR(191) NOT NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `instructions` VARCHAR(191) NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_log` (
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

CREATE TABLE IF NOT EXISTS `kranium_sync_queue` (
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

SET FOREIGN_KEY_CHECKS = 1;
