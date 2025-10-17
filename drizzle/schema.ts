import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 台南牛肉湯店家資料表
 */
export const stores = mysqlTable("stores", {
  id: varchar("id", { length: 128 }).primaryKey(), // Google Place ID
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  district: varchar("district", { length: 64 }), // 行政區
  phone: varchar("phone", { length: 64 }),
  rating: int("rating"), // 儲存為整數 (例如 4.5 -> 45)
  reviewCount: int("reviewCount").default(0),
  lat: varchar("lat", { length: 32 }), // 緯度
  lng: varchar("lng", { length: 32 }), // 經度
  photoUrl: text("photoUrl"), // 店家照片 URL
  googleMapsUrl: text("googleMapsUrl"), // Google Maps 連結
  openingHours: json("openingHours").$type<string[]>(), // 營業時間陣列
  priceLevel: int("priceLevel"), // 價格等級 1-4
  website: text("website"),
  isActive: boolean("isActive").default(true), // 是否啟用
  lastUpdated: timestamp("lastUpdated").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

/**
 * 店家評論資料表
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").primaryKey().autoincrement(),
  storeId: varchar("storeId", { length: 128 }).notNull(),
  authorName: varchar("authorName", { length: 255 }),
  rating: int("rating"), // 1-5 星
  text: text("text"),
  time: timestamp("time"),
  relativeTime: varchar("relativeTime", { length: 64 }), // 例如 "2天前"
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * 店家照片資料表
 */
export const storePhotos = mysqlTable("storePhotos", {
  id: int("id").primaryKey().autoincrement(),
  storeId: varchar("storeId", { length: 128 }).notNull(),
  photoUrl: text("photoUrl").notNull(),
  width: int("width"),
  height: int("height"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type StorePhoto = typeof storePhotos.$inferSelect;
export type InsertStorePhoto = typeof storePhotos.$inferInsert;
