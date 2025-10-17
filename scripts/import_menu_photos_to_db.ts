import { getDb } from "../server/db";
import { storePhotos } from "../drizzle/schema";
import menuPhotosData from "./menu_photos.json";

async function importMenuPhotos() {
  const db = getDb();
  
  console.log("開始匯入菜單照片...");
  
  let totalImported = 0;
  
  for (const storeData of menuPhotosData) {
    const { place_id, store_name, menu_photos } = storeData;
    
    console.log(`匯入 ${store_name} 的照片...`);
    
    for (let i = 0; i < menu_photos.length; i++) {
      const photoUrl = menu_photos[i];
      
      try {
        await db.insert(storePhotos).values({
          placeId: place_id,
          photoUrl: photoUrl,
          photoType: i < 3 ? 'menu' : 'general', // 前3張標記為菜單照片
          displayOrder: i
        });
        
        totalImported++;
      } catch (error) {
        console.error(`  ✗ 匯入照片失敗: ${error}`);
      }
    }
    
    console.log(`  ✓ 完成 ${menu_photos.length} 張照片`);
  }
  
  console.log(`\n✅ 完成！共匯入 ${totalImported} 張照片`);
}

importMenuPhotos().catch(console.error);

