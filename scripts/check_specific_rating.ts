import { getDb } from '../server/db.js';
import { stores } from '../drizzle/schema.js';
import { eq, like } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  
  // 查詢「新營94滿益牛肉湯」
  const store = await db.select().from(stores).where(like(stores.name, '%新營94%')).limit(1);
  
  if (store.length > 0) {
    console.log('店家名稱:', store[0].name);
    console.log('資料庫中的 rating 值:', store[0].rating);
    console.log('應該顯示的星數:', (store[0].rating || 0) / 10);
    console.log('評論數:', store[0].reviewCount);
  } else {
    console.log('找不到店家');
  }
  
  process.exit(0);
}

main().catch(console.error);

