CREATE TABLE `invite_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(64) NOT NULL,
	`success` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invite_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `invite_codes` ADD `welcomeMessage` varchar(256);