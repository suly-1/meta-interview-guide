CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lockStartDate` varchar(16),
	`lockDays` int NOT NULL DEFAULT 60,
	`manualLockEnabled` int NOT NULL DEFAULT 0,
	`lockMessage` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`)
);
