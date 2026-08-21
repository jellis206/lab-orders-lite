CREATE TABLE `lab_tests` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`price_cents` integer NOT NULL,
	`turnaround_hours` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "lab_tests_code_not_blank" CHECK(length(trim("lab_tests"."code")) > 0),
	CONSTRAINT "lab_tests_name_not_blank" CHECK(length(trim("lab_tests"."name")) > 0),
	CONSTRAINT "lab_tests_price_nonnegative" CHECK("lab_tests"."price_cents" >= 0),
	CONSTRAINT "lab_tests_turnaround_positive" CHECK("lab_tests"."turnaround_hours" > 0),
	CONSTRAINT "lab_tests_active_boolean" CHECK("lab_tests"."active" in (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lab_tests_code_unique` ON `lab_tests` (`code`);--> statement-breakpoint
CREATE INDEX `lab_tests_active_code_cursor_idx` ON `lab_tests` (`active`,`code`,`id`);--> statement-breakpoint
CREATE INDEX `lab_tests_active_name_cursor_idx` ON `lab_tests` (`active`,lower("name"),`id`);--> statement-breakpoint
CREATE TABLE `order_tests` (
	`order_id` text NOT NULL,
	`lab_test_id` text NOT NULL,
	`test_code` text NOT NULL,
	`test_name` text NOT NULL,
	`price_cents` integer NOT NULL,
	`turnaround_hours` integer NOT NULL,
	PRIMARY KEY(`order_id`, `lab_test_id`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`lab_test_id`) REFERENCES `lab_tests`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "order_tests_code_not_blank" CHECK(length(trim("order_tests"."test_code")) > 0),
	CONSTRAINT "order_tests_name_not_blank" CHECK(length(trim("order_tests"."test_name")) > 0),
	CONSTRAINT "order_tests_price_nonnegative" CHECK("order_tests"."price_cents" >= 0),
	CONSTRAINT "order_tests_turnaround_positive" CHECK("order_tests"."turnaround_hours" > 0)
);
--> statement-breakpoint
CREATE INDEX `order_tests_lab_test_idx` ON `order_tests` (`lab_test_id`,`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`status` text NOT NULL,
	`ordered_at` text NOT NULL,
	`total_cents` integer NOT NULL,
	`estimated_ready_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "orders_status_valid" CHECK("orders"."status" in ('pending', 'in_progress', 'completed', 'cancelled')),
	CONSTRAINT "orders_total_nonnegative" CHECK("orders"."total_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `orders_patient_cursor_idx` ON `orders` (`patient_id`,`ordered_at`,`id`);--> statement-breakpoint
CREATE INDEX `orders_status_cursor_idx` ON `orders` (`status`,`ordered_at`,`id`);--> statement-breakpoint
CREATE INDEX `orders_cursor_idx` ON `orders` (`ordered_at`,`id`);--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`email` text,
	`phone` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "patients_first_name_not_blank" CHECK(length(trim("patients"."first_name")) > 0),
	CONSTRAINT "patients_last_name_not_blank" CHECK(length(trim("patients"."last_name")) > 0),
	CONSTRAINT "patients_date_of_birth_iso" CHECK("patients"."date_of_birth" glob '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE INDEX `patients_name_cursor_idx` ON `patients` (lower("last_name"),lower("first_name"),`id`);