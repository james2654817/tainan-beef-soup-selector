import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || '';
const sql = postgres(DATABASE_URL);

async function testPhotosApi() {
  console.log('測試照片 API...\n');
  
  // 模擬 getAllStoresFirstPhoto 函數
  const result = await sql`
    SELECT DISTINCT ON ("storeId") 
      "storeId", 
      "photoUrl",
      width,
      height
    FROM "storePhotos"
    ORDER BY "storeId", id
    LIMIT 5
  `;
  
  console.log(`取得 ${result.length} 筆照片資料:\n`);
  result.forEach((row, idx) => {
    console.log(`${idx + 1}. storeId: ${row.storeId}`);
    console.log(`   photoUrl (reference): ${row.photoUrl.substring(0, 50)}...`);
    console.log(`   尺寸: ${row.width}x${row.height}\n`);
  });
  
  await sql.end();
  process.exit(0);
}

testPhotosApi().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
