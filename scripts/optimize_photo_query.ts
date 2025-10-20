import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || '';

if (!DATABASE_URL) {
  console.error('❌ 請設定 DATABASE_URL 環境變數');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

/**
 * 優化照片查詢 - 將第一張照片 reference 寫入 stores 表
 */
async function main() {
  console.log('🚀 開始優化照片查詢...\n');
  
  // 1. 檢查 stores 表是否有 firstPhotoReference 欄位
  console.log('📊 檢查資料庫結構...');
  const columns = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'firstPhotoReference'
  `;
  
  if (columns.length === 0) {
    console.log('  ➕ 新增 firstPhotoReference 欄位...');
    await sql`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS "firstPhotoReference" TEXT
    `;
    console.log('  ✅ 欄位新增完成\n');
  } else {
    console.log('  ✅ 欄位已存在\n');
  }
  
  // 2. 更新每家店的第一張照片 reference
  console.log('📝 更新照片 reference...');
  
  const result = await sql`
    UPDATE stores s
    SET "firstPhotoReference" = (
      SELECT "photoUrl"
      FROM "storePhotos" sp
      WHERE sp."storeId" = s.id
      ORDER BY sp.id
      LIMIT 1
    )
    WHERE EXISTS (
      SELECT 1
      FROM "storePhotos" sp
      WHERE sp."storeId" = s.id
    )
  `;
  
  console.log(`✅ 更新完成,共更新 ${result.count} 筆資料\n`);
  
  // 3. 檢查結果
  console.log('📊 檢查結果...');
  const stats = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT("firstPhotoReference") as with_photo
    FROM stores
  `;
  
  console.log(`  總店家數: ${stats[0].total}`);
  console.log(`  有照片的店家: ${stats[0].with_photo}`);
  console.log(`  照片覆蓋率: ${(Number(stats[0].with_photo) / Number(stats[0].total) * 100).toFixed(1)}%\n`);
  
  // 4. 顯示範例
  console.log('📷 照片範例:');
  const samples = await sql`
    SELECT id, name, "firstPhotoReference"
    FROM stores
    WHERE "firstPhotoReference" IS NOT NULL
    LIMIT 5
  `;
  
  samples.forEach((store: any) => {
    console.log(`  ${store.name}: ${store.firstPhotoReference.substring(0, 50)}...`);
  });
  
  console.log('\n✅ 優化完成!');
  
  await sql.end();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 錯誤:', err);
  process.exit(1);
});

