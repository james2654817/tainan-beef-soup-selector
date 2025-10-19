import { getDb } from "../server/db";
import { stores } from "../drizzle/schema";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  
  console.log("\n🔧 修復評分格式...");
  console.log("=".repeat(60));
  
  // 將所有小於 10 的評分乘以 10
  // 例如：4 -> 40 (4.0星), 5 -> 50 (5.0星)
  const result = await db.execute(
    sql`UPDATE stores SET rating = rating * 10 WHERE rating < 10 AND rating IS NOT NULL`
  );
  
  console.log(`✅ 已修復 ${result.rowsAffected || 0} 間店家的評分格式`);
  
  // 驗證修復結果
  const stats = await db.select({
    minRating: sql<number>`MIN(${stores.rating})`,
    maxRating: sql<number>`MAX(${stores.rating})`,
    avgRating: sql<number>`AVG(${stores.rating})`,
    count: sql<number>`COUNT(*)`
  }).from(stores);
  
  console.log("\n📊 修復後的評分統計：");
  console.log("=".repeat(60));
  console.log(`最小值: ${stats[0].minRating} (${stats[0].minRating / 10}星)`);
  console.log(`最大值: ${stats[0].maxRating} (${stats[0].maxRating / 10}星)`);
  console.log(`平均值: ${stats[0].avgRating?.toFixed(1)} (${(stats[0].avgRating / 10).toFixed(2)}星)`);
  console.log(`總數: ${stats[0].count}`);
  
  process.exit(0);
}

main().catch(console.error);

