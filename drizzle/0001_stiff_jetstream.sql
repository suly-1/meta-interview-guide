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
CREATE TABLE `ctci_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`solved` json NOT NULL,
	`difficulty` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ctci_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `ctci_progress_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `leaderboard_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`anonHandle` varchar(32) NOT NULL,
	`streakDays` int NOT NULL DEFAULT 0,
	`patternsMastered` int NOT NULL DEFAULT 0,
	`mockSessions` int NOT NULL DEFAULT 0,
	`overallPct` int NOT NULL DEFAULT 0,
	`badges` json NOT NULL DEFAULT ('[]'),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboard_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mock_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionType` varchar(32) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`sessionData` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mock_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`progress` json NOT NULL,
	`dismissed` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `onboarding_progress_userId_unique` UNIQUE(`userId`)
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
--> statement-breakpoint
CREATE TABLE `user_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ratingType` varchar(32) NOT NULL,
	`ratings` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `disclaimerAcknowledgedAt` timestamp;