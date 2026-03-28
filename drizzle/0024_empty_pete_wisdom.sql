CREATE TABLE `invite_attempt_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ip` varchar(64) NOT NULL,
	`codeTried` varchar(64) NOT NULL,
	`success` boolean NOT NULL DEFAULT false,
	`userAgent` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invite_attempt_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invite_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`cohortName` varchar(128),
	`welcomeMessage` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invite_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `invite_codes_code_unique` UNIQUE(`code`)
);
