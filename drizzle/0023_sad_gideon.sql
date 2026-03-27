CREATE TABLE `adaptive_difficulty_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`drillId` varchar(64) NOT NULL,
	`difficulty` varchar(8) NOT NULL DEFAULT 'normal',
	`recentScores` json NOT NULL DEFAULT ('[]'),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adaptive_difficulty_state_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boss_fight_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`verdict` varchar(16) NOT NULL,
	`overallScore` int NOT NULL DEFAULT 0,
	`transcript` json NOT NULL,
	`scoreBreakdown` json,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boss_fight_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comeback_arc_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`drillId` varchar(64) NOT NULL,
	`triggerScore` int NOT NULL,
	`steps` json NOT NULL,
	`predictedScore` int,
	`retryScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comeback_arc_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_challenge_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`category` varchar(32) NOT NULL,
	`questionId` varchar(64) NOT NULL,
	`answer` text NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`feedback` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_challenge_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interview_seasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seasonNumber` int NOT NULL,
	`theme` varchar(128) NOT NULL,
	`description` text,
	`drillIds` json NOT NULL,
	`startDate` varchar(10) NOT NULL,
	`endDate` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interview_seasons_id` PRIMARY KEY(`id`),
	CONSTRAINT `interview_seasons_seasonNumber_unique` UNIQUE(`seasonNumber`)
);
--> statement-breakpoint
CREATE TABLE `season_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`seasonId` int NOT NULL,
	`totalScore` int NOT NULL DEFAULT 0,
	`drillsCompleted` int NOT NULL DEFAULT 0,
	`isChampion` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `season_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_streaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActivityDate` varchar(10),
	`hardModeUnlocked` boolean NOT NULL DEFAULT false,
	`bossFightUnlocked` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_streaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_streaks_userId_unique` UNIQUE(`userId`)
);
