ALTER TABLE `invite_codes` ADD `isBlocked` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `invite_codes` ADD `firstUsedAt` timestamp;--> statement-breakpoint
ALTER TABLE `invite_codes` ADD `accessWindowDays` int DEFAULT 60;