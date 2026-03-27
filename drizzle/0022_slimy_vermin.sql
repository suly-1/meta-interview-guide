CREATE TABLE `failure_drill_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`drillId` varchar(64) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`payload` json,
	`feedback` text,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `failure_drill_sessions_id` PRIMARY KEY(`id`)
);
