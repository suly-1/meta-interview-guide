CREATE TABLE `collab_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomCode` varchar(16) NOT NULL,
	`questionId` varchar(64),
	`questionTitle` text,
	`mode` enum('human','ai') NOT NULL DEFAULT 'human',
	`status` enum('waiting','active','ended') NOT NULL DEFAULT 'waiting',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `collab_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `collab_rooms_roomCode_unique` UNIQUE(`roomCode`)
);
--> statement-breakpoint
CREATE TABLE `scorecards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomCode` varchar(16) NOT NULL,
	`scorerName` varchar(128),
	`candidateName` varchar(128),
	`requirementsScore` int NOT NULL DEFAULT 3,
	`architectureScore` int NOT NULL DEFAULT 3,
	`scalabilityScore` int NOT NULL DEFAULT 3,
	`communicationScore` int NOT NULL DEFAULT 3,
	`overallFeedback` text,
	`aiCoachingNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scorecards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomCode` varchar(16) NOT NULL,
	`eventType` varchar(32) NOT NULL,
	`payload` json NOT NULL,
	`actorName` varchar(128),
	`ts` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_events_id` PRIMARY KEY(`id`)
);
