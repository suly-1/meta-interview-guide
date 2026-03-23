CREATE TABLE `high_impact_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`feature` varchar(64) NOT NULL,
	`scoreType` varchar(64) NOT NULL,
	`scoreValue` int NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `high_impact_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sprint_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetLevel` varchar(8) NOT NULL DEFAULT 'L6',
	`daysUntilInterview` int,
	`plan` json NOT NULL,
	`readinessScore` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sprint_plans_id` PRIMARY KEY(`id`)
);
