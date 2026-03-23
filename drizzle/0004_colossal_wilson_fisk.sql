ALTER TABLE `site_feedback` ADD `status` varchar(20) DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `site_feedback` ADD `status_updated_at` bigint;