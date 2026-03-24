CREATE TABLE `user_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` enum('block','unblock','role_change') NOT NULL,
	`actorId` int NOT NULL,
	`actorName` varchar(128),
	`targetUserId` int NOT NULL,
	`targetUserName` varchar(128),
	`targetUserEmail` varchar(320),
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_events_id` PRIMARY KEY(`id`)
);
