CREATE TABLE `menuItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` varchar(64),
	`description` text,
	`confidence` varchar(32),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `menuItems_id` PRIMARY KEY(`id`)
);
