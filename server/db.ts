import { eq, and, gte, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, stores, reviews, storePhotos, menuItems } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL uses ON CONFLICT instead of ON DUPLICATE KEY UPDATE
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.id,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// 店家相關查詢

export async function getAllStores() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(stores).where(eq(stores.isActive, true));
  return result;
}

export async function getStoreById(id: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getStoresByDistrict(district: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(stores)
    .where(and(eq(stores.isActive, true), eq(stores.district, district)));
  
  return result;
}

export async function searchStores(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(stores)
    .where(and(eq(stores.isActive, true), like(stores.name, `%${searchTerm}%`)));
  
  return result;
}

export async function getStoresByRating(minRating: number) {
  const db = await getDb();
  if (!db) return [];

  const minRatingInt = Math.round(minRating * 10); // 4.5 -> 45

  const result = await db
    .select()
    .from(stores)
    .where(and(eq(stores.isActive, true), gte(stores.rating, minRatingInt)));
  
  return result;
}

// 評論相關查詢

export async function getReviewsByStoreId(storeId: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(reviews)
    .where(eq(reviews.storeId, storeId))
    .limit(limit);
  
  return result;
}

// 照片相關查詢

export async function getAllStoresFirstPhoto() {
  const db = await getDb();
  if (!db) return [];

  // 使用 SQL 查詢取得每家店的第一張照片
  const result = await db.execute(sql`
    SELECT DISTINCT ON ("storeId") 
      "storeId", 
      "photoUrl",
      width,
      height
    FROM "storePhotos"
    ORDER BY "storeId", id
  `);
  
  return result.rows;
}

export async function getPhotosByStoreId(storeId: string, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(storePhotos)
    .where(eq(storePhotos.storeId, storeId))
    .limit(limit);
  
  return result;
}

// 菜單相關查詢

export async function getMenuItems(storeId: string) {
  const db = await getDb();
  if (!db) return [];
  
  const items = await db.select().from(menuItems).where(eq(menuItems.storeId, storeId));
  return items;
}

