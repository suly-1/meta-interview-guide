ALTER TABLE `sprint_plans` ADD `focusPriority` varchar(32);--> statement-breakpoint
ALTER TABLE `sprint_plans` ADD `weakAreas` json;--> statement-breakpoint
ALTER TABLE `sprint_plans` ADD `viewCount` int DEFAULT 0 NOT NULL;