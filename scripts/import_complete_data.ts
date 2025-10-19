#!/usr/bin/env tsx
/**
 * 匯入完整的 249 間店家資料到資料庫
 */

import { readFileSync } from 'fs';
import { getDb } from '../server/db';
import { stores, reviews, photos } from '../drizzle/schema';

async function main() {
  console.log('='.repeat(60));
  console.log('🍜 開始匯入完整店家資料到資料庫');
  console.log('='.repeat(60));

  // 讀取資料
  const data = JSON.parse(
    readFileSync('/home/ubuntu/tainan-beef-soup-selector/scripts/complete_stores_data.json', 'utf-8')
  );

  console.log(`\n📊 準備匯入 ${data.length} 間店家`);

  // 取得資料庫連接
  const db = await getDb();
  if (!db) {
    console.error('❌ 無法連接資料庫');
    process.exit(1);
  }

  // 清空現有資料
  console.log('\n🗑️  清空現有資料...');
  await db.delete(photos);
  await db.delete(reviews);
  await db.delete(stores);
  console.log('✅ 清空完成');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < data.length; i++) {
    const store = data[i];
    
    if (i % 50 === 0) {
      console.log(`\n進度: ${i + 1}/${data.length}`);
    }

    try {
      // 1. 插入店家基本資料
      const [insertedStore] = await db.insert(stores).values({
        placeId: store.place_id,
        name: store.name,
        address: store.address || '',
        latitude: store.latitude,
        longitude: store.longitude,
        rating: store.rating,
        userRatingsTotal: store.user_ratings_total || 0,
        businessStatus: store.business_status || 'OPERATIONAL',
        priceLevel: store.price_level,
        phone: store.phone || null,
        website: store.website || null,
        googleMapsUrl: store.url || null,
        openingHours: store.opening_hours ? JSON.stringify(store.opening_hours) : null,
        district: store.district || null,
        types: store.types ? JSON.stringify(store.types) : null,
      });

      const storeId = insertedStore.insertId;

      // 2. 插入評論
      if (store.reviews && store.reviews.length > 0) {
        for (const review of store.reviews) {
          // 處理時間戳記
          let timestamp = review.timestamp || 0;
          if (typeof timestamp === 'number' && timestamp > 0) {
            // 確保時間戳記是有效的
            try {
              new Date(timestamp * 1000).toISOString();
            } catch {
              timestamp = Math.floor(Date.now() / 1000);
            }
          } else {
            timestamp = Math.floor(Date.now() / 1000);
          }

          await db.insert(reviews).values({
            storeId: storeId,
            authorName: review.author || '匿名',
            rating: review.rating || 0,
            text: review.text || '',
            relativeTime: review.time || '',
            timestamp: timestamp,
          });
        }
      }

      // 3. 插入照片
      if (store.photos && store.photos.length > 0) {
        for (const photo of store.photos) {
          const photoRef = photo.photo_reference || '';
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
          
          await db.insert(photos).values({
            storeId: storeId,
            photoReference: photoRef,
            photoUrl: photoUrl,
            width: photo.width || 800,
            height: photo.height || 600,
          });
        }
      }

      successCount++;

    } catch (error) {
      console.error(`  ❌ ${store.name} 匯入失敗:`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 匯入完成！');
  console.log('='.repeat(60));
  console.log(`成功: ${successCount} 間`);
  console.log(`失敗: ${errorCount} 間`);
  console.log(`總計: ${data.length} 間`);

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ 匯入過程發生錯誤:', error);
  process.exit(1);
});

