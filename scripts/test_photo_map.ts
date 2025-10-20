import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || '';
const sql = postgres(DATABASE_URL);

async function testPhotoMap() {
  console.log('測試 getAllStoresFirstPhotoMap 查詢...\n');
  
  const startTime = Date.now();
  
  const result = await sql`
    SELECT DISTINCT ON ("storeId") 
      "storeId", 
      "photoUrl"
    FROM "storePhotos"
    ORDER BY "storeId", id
  `;
  
  const endTime = Date.now();
  
  console.log(`查詢完成,耗時: ${endTime - startTime}ms`);
  console.log(`取得 ${result.length} 筆照片資料\n`);
  
  // 轉換成 Map
  const photoMap: Record<string, string> = {};
  result.forEach((row: any) => {
    photoMap[row.storeId] = row.photoUrl;
  });
  
  console.log('前 5 筆資料:');
  Object.entries(photoMap).slice(0, 5).forEach(([storeId, photoUrl]) => {
    console.log(`  ${storeId}: ${photoUrl.substring(0, 50)}...`);
  });
  
  await sql.end();
  process.exit(0);
}

testPhotoMap().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
