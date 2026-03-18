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
