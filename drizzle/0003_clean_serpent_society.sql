CREATE TABLE `onboarding_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`progress` json NOT NULL DEFAULT ('{}'),
	`dismissed` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `onboarding_progress_userId_unique` UNIQUE(`userId`)
);
