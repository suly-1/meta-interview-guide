CREATE TABLE `user_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patternRatings` json NOT NULL DEFAULT ('{}'),
	`behavioralRatings` json NOT NULL DEFAULT ('{}'),
	`starNotes` json NOT NULL DEFAULT ('{}'),
	`patternTime` json NOT NULL DEFAULT ('{}'),
	`interviewDate` varchar(16),
	`targetLevel` varchar(8),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_scores_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `sprint_plans` MODIFY COLUMN `targetLevel` varchar(8) NOT NULL DEFAULT 'IC6';--> statement-breakpoint
ALTER TABLE `sprint_plans` ADD `planId` varchar(64);--> statement-breakpoint
ALTER TABLE `sprint_plans` ADD `timeline` varchar(32);--> statement-breakpoint
ALTER TABLE `sprint_plans` ADD `planData` json;--> statement-breakpoint
ALTER TABLE `sprint_plans` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `sprint_plans` ADD CONSTRAINT `sprint_plans_planId_unique` UNIQUE(`planId`);--> statement-breakpoint
ALTER TABLE `sprint_plans` ADD CONSTRAINT `sprint_plans_shareToken_unique` UNIQUE(`shareToken`);