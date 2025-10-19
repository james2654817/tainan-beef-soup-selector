import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../data/db.sqlite');
const dataPath = path.join(__dirname, 'complete_stores_data.json');

const db = new Database(dbPath);

// 讀取 JSON 資料
const storesData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`準備匯入 ${storesData.length} 間店家...`);

// 清空現有資料
db.prepare('DELETE FROM stores').run();
db.prepare('DELETE FROM reviews').run();
db.prepare('DELETE FROM photos').run();
db.prepare('DELETE FROM menu_items').run();

console.log('✓ 已清空現有資料');

// 匯入店家
const insertStore = db.prepare(`
  INSERT INTO stores (
    name, address, district, phone, rating, reviewCount,
    lat, lng, photoUrl, googleMapsUrl, placeId, openingHours
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertReview = db.prepare(`
  INSERT INTO reviews (storeId, authorName, rating, text, relativeTime, time)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertPhoto = db.prepare(`
  INSERT INTO photos (storeId, url, attribution)
  VALUES (?, ?, ?)
`);

let storeCount = 0;
let reviewCount = 0;
let photoCount = 0;

for (const store of storesData) {
  try {
    // 提取區域（從地址中）
    let district = null;
    const districtMatch = store.formatted_address?.match(/(中西區|東區|南區|北區|安平區|安南區|永康區|歸仁區)/);
    if (districtMatch) {
      district = districtMatch[1];
    }

    // 轉換營業時間為 JSON 字串
    let openingHoursJson = null;
    if (store.opening_hours?.periods) {
      openingHoursJson = JSON.stringify(store.opening_hours.periods);
    }

    // 插入店家
    const result = insertStore.run(
      store.name,
      store.formatted_address || store.vicinity || '',
      district,
      store.formatted_phone_number || null,
      store.rating || null,
      store.user_ratings_total || 0,
      store.geometry?.location?.lat?.toString() || null,
      store.geometry?.location?.lng?.toString() || null,
      store.photos?.[0]?.photo_reference ? 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${store.photos[0].photo_reference}&key=YOUR_API_KEY` : 
        null,
      store.url || `https://www.google.com/maps/place/?q=place_id:${store.place_id}`,
      store.place_id,
      openingHoursJson
    );

    const storeId = result.lastInsertRowid;
    storeCount++;

    // 匯入評論
    if (store.reviews && Array.isArray(store.reviews)) {
      for (const review of store.reviews.slice(0, 5)) {
        try {
          insertReview.run(
            storeId,
            review.author_name || '匿名',
            review.rating || 0,
            review.text || '',
            review.relative_time_description || '',
            review.time || Date.now() / 1000
          );
          reviewCount++;
        } catch (err) {
          console.error(`  ✗ 匯入評論失敗:`, err);
        }
      }
    }

    // 匯入照片
    if (store.photos && Array.isArray(store.photos)) {
      for (const photo of store.photos.slice(0, 10)) {
        try {
          const photoUrl = photo.photo_reference ?
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=YOUR_API_KEY` :
            null;
          
          if (photoUrl) {
            insertPhoto.run(
              storeId,
              photoUrl,
              photo.html_attributions?.[0] || ''
            );
            photoCount++;
          }
        } catch (err) {
          console.error(`  ✗ 匯入照片失敗:`, err);
        }
      }
    }

    if (storeCount % 10 === 0) {
      console.log(`已匯入 ${storeCount} 間店家...`);
    }
  } catch (err) {
    console.error(`✗ 匯入店家失敗: ${store.name}`, err);
  }
}

db.close();

console.log('\n✅ 匯入完成！');
console.log(`  店家: ${storeCount} 間`);
console.log(`  評論: ${reviewCount} 則`);
console.log(`  照片: ${photoCount} 張`);

