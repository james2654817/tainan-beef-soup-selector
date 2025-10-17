CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` varchar(128) NOT NULL,
	`authorName` varchar(255),
	`rating` int,
	`text` text,
	`time` timestamp,
	`relativeTime` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storePhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` varchar(128) NOT NULL,
	`photoUrl` text NOT NULL,
	`width` int,
	`height` int,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `storePhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`district` varchar(64),
	`phone` varchar(64),
	`rating` int,
	`reviewCount` int DEFAULT 0,
	`lat` varchar(32),
	`lng` varchar(32),
	`photoUrl` text,
	`googleMapsUrl` text,
	`openingHours` json,
	`priceLevel` int,
	`website` text,
	`isActive` boolean DEFAULT true,
	`lastUpdated` timestamp DEFAULT (now()),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `stores_id` PRIMARY KEY(`id`)
);
