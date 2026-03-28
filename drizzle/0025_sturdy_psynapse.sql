CREATE TABLE `visitor_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`inviteCode` varchar(64),
	`userAgent` varchar(512),
	`currentTab` varchar(64),
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastHeartbeatAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visitor_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `visitor_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
