import { getDb } from "../server/db";
import { menuItems } from "../drizzle/schema";
import menuData from "./menu_data.json";

async function importMenuData() {
  console.log("開始匯入菜單資料...");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ 無法連接資料庫");
    process.exit(1);
  }
  
  let totalImported = 0;
  
  for (const [placeId, menu] of Object.entries(menuData)) {
    const items = (menu as any).items;
    
    for (const item of items) {
      await db.insert(menuItems).values({
        storeId: placeId,
        name: item.name,
        price: item.price,
        description: item.description,
        confidence: item.confidence,
      });
      
      totalImported++;
    }
    
    console.log(`✅ ${(menu as any).store_name}: 已匯入 ${items.length} 項菜色`);
  }
  
  console.log(`\n🎉 總共匯入 ${totalImported} 項菜單資料！`);
  process.exit(0);
}

importMenuData().catch((error) => {
  console.error("❌ 匯入失敗:", error);
  process.exit(1);
});

