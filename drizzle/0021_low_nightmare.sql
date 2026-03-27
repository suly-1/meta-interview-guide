CREATE TABLE `drill_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`sessionScore` int NOT NULL DEFAULT 0,
	`drillScores` json NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drill_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persona_stress_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`personaId` varchar(64) NOT NULL,
	`personaLabel` varchar(128) NOT NULL,
	`resilienceScore` int NOT NULL DEFAULT 0,
	`turns` json NOT NULL,
	`aiCoachNote` text,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persona_stress_sessions_id` PRIMARY KEY(`id`)
);
