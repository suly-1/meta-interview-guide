CREATE TABLE `page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tabName` varchar(64) NOT NULL,
	`userId` int,
	`sessionId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_views_id` PRIMARY KEY(`id`)
);
