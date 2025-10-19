import { drizzle } from "drizzle-orm/mysql2";
import { stores, reviews, storePhotos, menuItems } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function restore() {
  console.log('清空資料庫...');
  await db.delete(menuItems).execute();
  await db.delete(storePhotos).execute();
  await db.delete(reviews).execute();
  await db.delete(stores).execute();
  console.log('✓ 資料庫已清空');
  console.log('');
  console.log('請執行原始的匯入腳本來恢復 18 間測試店家資料');
}

restore().catch(console.error);

