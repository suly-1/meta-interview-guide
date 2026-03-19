CREATE TABLE `user_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ratingType` varchar(32) NOT NULL,
	`ratings` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_ratings_id` PRIMARY KEY(`id`)
);
