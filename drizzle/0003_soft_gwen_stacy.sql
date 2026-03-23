CREATE TABLE `shared_sprint_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`planData` json NOT NULL,
	`targetLevel` varchar(8),
	`focusPriority` varchar(32),
	`weakAreas` json,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `shared_sprint_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_sprint_plans_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `site_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`category` varchar(64) NOT NULL DEFAULT 'other',
	`rating` int,
	`message` text NOT NULL,
	`page` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sprint_plan_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`dayNumber` int,
	`rating` int NOT NULL,
	`suggestion` text,
	`helpful` tinyint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sprint_plan_feedback_id` PRIMARY KEY(`id`)
);
