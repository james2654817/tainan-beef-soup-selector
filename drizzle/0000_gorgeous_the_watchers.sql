CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "menuItems" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "menuItems_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"storeId" varchar(128) NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" varchar(64),
	"description" text,
	"confidence" varchar(32),
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"storeId" varchar(128) NOT NULL,
	"authorName" varchar(255),
	"rating" integer,
	"text" text,
	"time" timestamp,
	"relativeTime" varchar(64),
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "storePhotos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "storePhotos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"storeId" varchar(128) NOT NULL,
	"photoUrl" text NOT NULL,
	"width" integer,
	"height" integer,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"district" varchar(64),
	"phone" varchar(64),
	"rating" integer,
	"reviewCount" integer DEFAULT 0,
	"lat" varchar(32),
	"lng" varchar(32),
	"photoUrl" text,
	"googleMapsUrl" text,
	"openingHours" json,
	"priceLevel" integer,
	"website" text,
	"businessStatus" varchar(64) DEFAULT 'OPERATIONAL',
	"isActive" boolean DEFAULT true,
	"lastUpdated" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"lastSignedIn" timestamp DEFAULT now()
);
