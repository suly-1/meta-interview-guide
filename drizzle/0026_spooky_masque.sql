CREATE TABLE `active_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionToken` varchar(64) NOT NULL,
	`codeId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`ipAddress` varchar(64) NOT NULL,
	`userAgent` varchar(256),
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`isRevoked` boolean NOT NULL DEFAULT false,
	CONSTRAINT `active_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `active_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `invite_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(64) NOT NULL,
	`submittedCode` varchar(64),
	`success` boolean NOT NULL DEFAULT false,
	`reason` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invite_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invite_gate_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invite_gate_settings_id` PRIMARY KEY(`id`)
);
