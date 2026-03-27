CREATE TABLE `ai_native_drill_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`drillId` varchar(64) NOT NULL,
	`drillLabel` varchar(128) NOT NULL,
	`coreSkill` varchar(64) NOT NULL,
	`overallScore` int NOT NULL,
	`scores` json NOT NULL,
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_native_drill_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_native_maturity_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`level` varchar(32) NOT NULL,
	`levelIndex` int NOT NULL DEFAULT 0,
	`scores` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_native_maturity_levels_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_native_maturity_levels_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `ai_native_mock_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`overallScore` int NOT NULL DEFAULT 0,
	`maturityLevel` varchar(32),
	`sessionData` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_native_mock_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_native_mock_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
