import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || '';
const sql = postgres(DATABASE_URL);

async function checkPhotos() {
  console.log('檢查照片資料狀態...\n');
  
  // 檢查店家的 photoUrl
  const storesData = await sql`
    SELECT id, name, "photoUrl"
    FROM stores
    LIMIT 5
  `;
  
  console.log('前 5 家店家的 photoUrl:');
  storesData.forEach(store => {
    console.log(`- ${store.name}: ${store.photoUrl || 'null'}`);
  });
  
  // 檢查 storePhotos 表總數
  const photoCountResult = await sql`
    SELECT COUNT(*) as count FROM "storePhotos"
  `;
  console.log(`\nstorePhotos 表總共有 ${photoCountResult[0].count} 筆照片資料`);
  
  // 檢查第一家店的照片
  if (storesData.length > 0) {
    const firstStore = storesData[0];
    const firstStorePhotos = await sql`
      SELECT "photoReference", "photoUrl"
      FROM "storePhotos"
      WHERE "storeId" = ${firstStore.id}
      LIMIT 3
    `;
    
    console.log(`\n${firstStore.name} 的照片資料:`);
    firstStorePhotos.forEach((photo, idx) => {
      console.log(`  照片 ${idx + 1}:`);
      console.log(`    - photoReference: ${photo.photoReference?.substring(0, 50)}...`);
      console.log(`    - photoUrl: ${photo.photoUrl || 'null'}`);
    });
  }
  
  await sql.end();
  process.exit(0);
}

checkPhotos().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
