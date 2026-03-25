CREATE TABLE `pin_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ip` varchar(64) NOT NULL,
	`succeeded` int NOT NULL DEFAULT 0,
	`attemptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pin_attempts_id` PRIMARY KEY(`id`)
);
