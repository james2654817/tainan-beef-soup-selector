import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 資料庫連線
const DATABASE_URL = process.env.DATABASE_URL || '';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

if (!DATABASE_URL) {
  console.error('❌ 請設定 DATABASE_URL 環境變數');
  process.exit(1);
}

if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ 請設定 GOOGLE_MAPS_API_KEY 環境變數');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

// 建立照片儲存目錄
const PHOTOS_DIR = path.join(__dirname, '../photos');
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

interface StorePhoto {
  id: number;
  storeId: string;
  photoUrl: string; // 這是 photo_reference
}

/**
 * 下載單張照片
 */
async function downloadPhoto(photoReference: string, outputPath: string): Promise<boolean> {
  try {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
    
    // 使用 curl 下載照片
    execSync(`curl -s -o "${outputPath}" "${photoUrl}"`, { stdio: 'inherit' });
    
    // 檢查檔案是否成功下載
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`  ❌ 下載失敗: ${error}`);
    return false;
  }
}

/**
 * 上傳照片到 Manus S3
 */
function uploadPhoto(localPath: string): string | null {
  try {
    const result = execSync(`manus-upload-file "${localPath}"`, { encoding: 'utf-8' });
    const url = result.trim();
    
    if (url.startsWith('http')) {
      return url;
    }
    
    return null;
  } catch (error) {
    console.error(`  ❌ 上傳失敗: ${error}`);
    return null;
  }
}

/**
 * 主程式
 */
async function main() {
  console.log('🚀 開始下載並上傳照片...\n');
  
  // 1. 取得所有店家的第一張照片
  console.log('📊 查詢資料庫...');
  const photos = await sql<StorePhoto[]>`
    SELECT DISTINCT ON ("storeId") 
      id,
      "storeId", 
      "photoUrl"
    FROM "storePhotos"
    ORDER BY "storeId", id
    LIMIT 50
  `;
  
  console.log(`✅ 找到 ${photos.length} 家店家的照片\n`);
  
  // 2. 下載並上傳每張照片
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const progress = `[${i + 1}/${photos.length}]`;
    
    console.log(`${progress} 處理店家 ${photo.storeId}...`);
    
    // 下載照片
    const localPath = path.join(PHOTOS_DIR, `${photo.storeId}.jpg`);
    const downloaded = await downloadPhoto(photo.photoUrl, localPath);
    
    if (!downloaded) {
      console.log(`  ❌ 下載失敗\n`);
      failCount++;
      continue;
    }
    
    console.log(`  ✅ 下載成功`);
    
    // 上傳照片
    const publicUrl = uploadPhoto(localPath);
    
    if (!publicUrl) {
      console.log(`  ❌ 上傳失敗\n`);
      failCount++;
      continue;
    }
    
    console.log(`  ✅ 上傳成功: ${publicUrl}`);
    
    // 更新資料庫
    await sql`
      UPDATE stores
      SET "photoUrl" = ${publicUrl}
      WHERE id = ${photo.storeId}
    `;
    
    console.log(`  ✅ 資料庫已更新\n`);
    successCount++;
    
    // 刪除本地檔案
    fs.unlinkSync(localPath);
    
    // 避免請求太快,休息 100ms
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 3. 顯示結果
  console.log('\n📊 處理完成!');
  console.log(`✅ 成功: ${successCount} 張`);
  console.log(`❌ 失敗: ${failCount} 張`);
  
  await sql.end();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ 錯誤:', err);
  process.exit(1);
});

