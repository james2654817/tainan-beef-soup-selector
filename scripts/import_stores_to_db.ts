import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { stores, reviews, storePhotos } from '../drizzle/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 讀取環境變數
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 環境變數未設定');
  process.exit(1);
}

// 連接資料庫
const client = postgres(DATABASE_URL);
const db = drizzle(client);

// 讀取店家資料
const dataPath = path.join(__dirname, 'merged_stores_data.json');
const storesData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`📊 準備匯入 ${storesData.length} 間店家資料...`);

async function importStores() {
  let successCount = 0;
  let errorCount = 0;

  for (const store of storesData) {
    try {
      // 準備店家資料
      const storeData = {
        id: store.place_id,
        name: store.name,
        address: store.formatted_address || '',
        district: store.district || null,
        phone: store.formatted_phone_number || null,
        rating: store.rating ? Math.round(store.rating * 10) : null, // 轉換為整數 (4.5 -> 45)
        reviewCount: store.user_ratings_total || 0,
        lat: (store.geometry?.location?.lat || store.latitude)?.toString() || null,
        lng: (store.geometry?.location?.lng || store.longitude)?.toString() || null,
        photoUrl: null, // 暫時設為 null,前端會使用預設圖片
        googleMapsUrl: store.url || null,
        openingHours: store.opening_hours?.periods ? JSON.stringify(
          store.opening_hours.periods.map((period: any) => ({
            open: period.open ? `${period.open.day}:${period.open.time}` : null,
            close: period.close ? `${period.close.day}:${period.close.time}` : null,
          }))
        ) : null,
        priceLevel: store.price_level || null,
        website: store.website || null,
        businessStatus: store.business_status || 'OPERATIONAL',
        isActive: true,
        lastUpdated: new Date(),
        createdAt: new Date(),
      };

      // 插入店家資料
      await db.insert(stores).values(storeData).onConflictDoUpdate({
        target: stores.id,
        set: {
          name: storeData.name,
          address: storeData.address,
          district: storeData.district,
          phone: storeData.phone,
          rating: storeData.rating,
          reviewCount: storeData.reviewCount,
          lat: storeData.lat,
          lng: storeData.lng,
          photoUrl: storeData.photoUrl,
          googleMapsUrl: storeData.googleMapsUrl,
          openingHours: storeData.openingHours,
          priceLevel: storeData.priceLevel,
          website: storeData.website,
          businessStatus: storeData.businessStatus,
          lastUpdated: new Date(),
        },
      });

      // 插入評論資料
      if (store.reviews && Array.isArray(store.reviews)) {
        for (const review of store.reviews) {
          try {
            await db.insert(reviews).values({
              storeId: store.place_id,
              authorName: review.author_name || null,
              rating: review.rating || null,
              text: review.text || null,
              time: review.time ? new Date(review.time * 1000) : null,
              relativeTime: review.relative_time_description || null,
              createdAt: new Date(),
            });
          } catch (err) {
            // 忽略重複的評論
          }
        }
      }

      // 插入照片資料
      if (store.photos && Array.isArray(store.photos)) {
        for (const photo of store.photos) {
          try {
            await db.insert(storePhotos).values({
              storeId: store.place_id,
              photoUrl: photo.photo_reference,
              width: photo.width || null,
              height: photo.height || null,
              createdAt: new Date(),
            });
          } catch (err) {
            // 忽略重複的照片
          }
        }
      }

      successCount++;
      console.log(`✅ [${successCount}/${storesData.length}] ${store.name}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ 匯入失敗: ${store.name}`, error);
    }
  }

  console.log(`\n📊 匯入完成!`);
  console.log(`✅ 成功: ${successCount} 間`);
  console.log(`❌ 失敗: ${errorCount} 間`);
}

// 執行匯入
importStores()
  .then(() => {
    console.log('🎉 資料匯入完成!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 匯入過程發生錯誤:', error);
    process.exit(1);
  })
  .finally(() => {
    client.end();
  });

