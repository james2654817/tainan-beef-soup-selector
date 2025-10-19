import { getDb } from "../server/db";
import { stores } from "../drizzle/schema";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  
  // 查詢評分分布
  const result = await db.select({
    id: stores.id,
    name: stores.name,
    rating: stores.rating
  }).from(stores).limit(20);
  
  console.log("\n評分樣本：");
  console.log("=".repeat(60));
  
  for (const store of result) {
    console.log(`${store.name}: ${store.rating} (${store.rating ? store.rating / 10 : 0}星)`);
  }
  
  // 統計評分範圍
  const stats = await db.select({
    minRating: sql<number>`MIN(${stores.rating})`,
    maxRating: sql<number>`MAX(${stores.rating})`,
    avgRating: sql<number>`AVG(${stores.rating})`,
    count: sql<number>`COUNT(*)`
  }).from(stores);
  
  console.log("\n評分統計：");
  console.log("=".repeat(60));
  console.log(`最小值: ${stats[0].minRating}`);
  console.log(`最大值: ${stats[0].maxRating}`);
  console.log(`平均值: ${stats[0].avgRating}`);
  console.log(`總數: ${stats[0].count}`);
  
  process.exit(0);
}

main().catch(console.error);

