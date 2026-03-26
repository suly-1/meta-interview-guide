CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`eventName` varchar(128) NOT NULL,
	`page` varchar(128),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`page` varchar(128) NOT NULL,
	`referrer` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_page_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int,
	`deviceType` enum('desktop','tablet','mobile') DEFAULT 'desktop',
	`browser` varchar(64),
	`os` varchar(64),
	`country` varchar(64),
	`durationSeconds` int DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `analytics_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `analytics_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `favorite_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(128) NOT NULL,
	`questionType` enum('coding','behavioral','design','ctci') NOT NULL DEFAULT 'coding',
	`questionText` text NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorite_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`feedbackType` enum('general','sprint_plan') NOT NULL DEFAULT 'general',
	`category` enum('bug','feature_request','content','ux','other') NOT NULL DEFAULT 'other',
	`message` text NOT NULL,
	`page` varchar(64),
	`status` enum('new','in_progress','done','dismissed') NOT NULL DEFAULT 'new',
	`metadata` json,
	`admin_note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progress_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`snapshotDate` varchar(16) NOT NULL,
	`codingPct` int NOT NULL DEFAULT 0,
	`behavioralPct` int NOT NULL DEFAULT 0,
	`overallPct` int NOT NULL DEFAULT 0,
	`streakDays` int NOT NULL DEFAULT 0,
	`mockSessionCount` int NOT NULL DEFAULT 0,
	`patternsMastered` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `progress_snapshots_id` PRIMARY KEY(`id`)
);
