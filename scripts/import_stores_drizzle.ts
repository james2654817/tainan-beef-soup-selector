import { drizzle } from "drizzle-orm/mysql2";
import { stores, reviews, storePhotos, menuItems } from "../drizzle/schema";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 檢查環境變數
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL 環境變數未設定');
  console.error('請在 .env 檔案中設定 DATABASE_URL');
  process.exit(1);
}

// 連接資料庫
const db = drizzle(process.env.DATABASE_URL);

// 讀取資料
const dataPath = path.join(__dirname, 'complete_stores_data.json');
const storesData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`準備匯入 ${storesData.length} 間店家...`);

async function importData() {
  try {
    // 清空現有資料
    console.log('清空現有資料...');
    await db.delete(menuItems).execute();
    await db.delete(storePhotos).execute();
    await db.delete(reviews).execute();
    await db.delete(stores).execute();
    console.log('✓ 已清空現有資料');

    let storeCount = 0;
    let reviewCount = 0;
    let photoCount = 0;

    for (const store of storesData) {
      try {
        // 提取區域
        let district = null;
        const address = store.address || store.formatted_address || store.vicinity || '';
        const districtMatch = address.match(/台南市(.{2,3}區)/);
        if (districtMatch) {
          district = districtMatch[1];
        }

        // 轉換營業時間
        let openingHoursJson = null;
        if (store.opening_hours?.periods) {
          openingHoursJson = store.opening_hours.periods.map((period: any) => {
            const open = period.open ? `${period.open.day}:${period.open.time}` : null;
            const close = period.close ? `${period.close.day}:${period.close.time}` : null;
            return { open, close };
          });
        }

        // 取得經緯度
        const lat = store.latitude?.toString() || store.geometry?.location?.lat?.toString() || null;
        const lng = store.longitude?.toString() || store.geometry?.location?.lng?.toString() || null;

        // 轉換評分為整數（4.5 -> 45）
        const ratingInt = store.rating ? Math.round(store.rating * 10) : null;

        // 插入或更新店家（使用 upsert）
        await db.insert(stores).values({
          id: store.place_id,
          name: store.name,
          address: address,
          district: district,
          phone: store.formatted_phone_number || null,
          rating: ratingInt,
          reviewCount: store.user_ratings_total || 0,
          lat: lat,
          lng: lng,
          photoUrl: null,
          googleMapsUrl: store.url || `https://www.google.com/maps/place/?q=place_id:${store.place_id}`,
          openingHours: openingHoursJson as any,
          priceLevel: store.price_level || null,
          website: store.website || null,
          isActive: true,
        }).onDuplicateKeyUpdate({
          set: {
            name: store.name,
            address: address,
            district: district,
            phone: store.formatted_phone_number || null,
            rating: ratingInt,
            reviewCount: store.user_ratings_total || 0,
            lat: lat,
            lng: lng,
            googleMapsUrl: store.url || `https://www.google.com/maps/place/?q=place_id:${store.place_id}`,
            openingHours: openingHoursJson as any,
            priceLevel: store.price_level || null,
            website: store.website || null,
            isActive: true,
          }
        });

        storeCount++;

        // 匯入評論
        if (store.reviews && Array.isArray(store.reviews)) {
          for (const review of store.reviews.slice(0, 5)) {
            try {
              await db.insert(reviews).values({
                storeId: store.place_id,
                authorName: review.author_name || '匿名',
                rating: review.rating || 0,
                text: review.text || '',
                time: review.time ? new Date(review.time * 1000) : null,
                relativeTime: review.relative_time_description || '',
              });
              reviewCount++;
            } catch (err) {
              console.error(`  ✗ 匯入評論失敗:`, err);
            }
          }
        }

        // 匯入照片
        let firstPhotoUrl = null;
        if (store.photos && Array.isArray(store.photos)) {
          for (let i = 0; i < store.photos.slice(0, 10).length; i++) {
            const photo = store.photos[i];
            try {
              const photoRef = photo.photo_reference;
              if (photoRef) {
                // 使用環境變數中的 API Key
                const apiKey = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyD80kuCrJFFj2zsxRTrmxPTbRbVrqEAn3U';
                const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${apiKey}`;
                
                // 儲存第一張照片作為店家封面
                if (i === 0) {
                  firstPhotoUrl = photoUrl;
                }
                
                await db.insert(storePhotos).values({
                  storeId: store.place_id,
                  photoUrl: photoUrl,
                  width: photo.width || null,
                  height: photo.height || null,
                });
                photoCount++;
              }
            } catch (err) {
              console.error(`  ✗ 匯入照片失敗:`, err);
            }
          }
        }
        
        // 更新店家封面照片
        if (firstPhotoUrl) {
          await db.update(stores)
            .set({ photoUrl: firstPhotoUrl })
            .where(eq(stores.id, store.place_id));
        }

        if (storeCount % 10 === 0) {
          console.log(`已匯入 ${storeCount} 間店家...`);
        }
      } catch (err) {
        console.error(`✗ 匯入店家失敗: ${store.name}`, err);
      }
    }

    console.log('\n✅ 匯入完成！');
    console.log(`  店家: ${storeCount} 間`);
    console.log(`  評論: ${reviewCount} 則`);
    console.log(`  照片: ${photoCount} 張`);
  } catch (error) {
    console.error('❌ 匯入過程發生錯誤:', error);
    process.exit(1);
  }
}

importData();

