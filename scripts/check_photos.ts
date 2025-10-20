import { db } from '../server/db';
import { stores, storePhotos } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function checkPhotos() {
  console.log('檢查照片資料狀態...\n');
  
  // 檢查店家的 photoUrl
  const storesWithPhotos = await db.select({
    id: stores.id,
    name: stores.name,
    photoUrl: stores.photoUrl,
  }).from(stores).limit(5);
  
  console.log('前 5 家店家的 photoUrl:');
  storesWithPhotos.forEach(store => {
    console.log(`- ${store.name}: ${store.photoUrl || 'null'}`);
  });
  
  // 檢查 storePhotos 表
  const photoCount = await db.select().from(storePhotos);
  console.log(`\nstorePhotos 表總共有 ${photoCount.length} 筆照片資料`);
  
  // 檢查第一家店的照片
  const firstStore = storesWithPhotos[0];
  const firstStorePhotos = await db.select()
    .from(storePhotos)
    .where(eq(storePhotos.storeId, firstStore.id))
    .limit(3);
  
  console.log(`\n${firstStore.name} 的照片資料:`);
  firstStorePhotos.forEach((photo, idx) => {
    console.log(`  照片 ${idx + 1}:`);
    console.log(`    - photoReference: ${photo.photoReference?.substring(0, 50)}...`);
    console.log(`    - photoUrl: ${photo.photoUrl || 'null'}`);
  });
  
  process.exit(0);
}

checkPhotos();
