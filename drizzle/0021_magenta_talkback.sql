CREATE TABLE `active_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionToken` varchar(64) NOT NULL,
	`codeId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`ipAddress` varchar(64) NOT NULL,
	`userAgent` varchar(256),
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`isRevoked` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `active_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `active_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
