ALTER TABLE `feedback` ADD `admin_note` text;--> statement-breakpoint
ALTER TABLE `feedback` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;