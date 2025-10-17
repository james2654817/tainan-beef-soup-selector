import { drizzle } from "drizzle-orm/mysql2";
import { stores, reviews, storePhotos, type InsertStore, type InsertReview, type InsertStorePhoto } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 讀取 Places API 資料
const dataPath = path.join(__dirname, "places_api_data.json");
const rawData = fs.readFileSync(dataPath, "utf-8");
const placesData = JSON.parse(rawData);

// 連接資料庫
const db = drizzle(process.env.DATABASE_URL!);

async function importData() {
  console.log("開始匯入資料...");
  
  let storeCount = 0;
  let reviewCount = 0;
  let photoCount = 0;

  for (const place of placesData) {
    try {
      // 提取行政區 (從地址中)
      const districtMatch = place.formatted_address?.match(/台南市(\S+區)/);
      const district = districtMatch ? districtMatch[1] : null;

      // 準備店家資料
      const storeData: InsertStore = {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address || "",
        district: district,
        phone: place.formatted_phone_number || null,
        rating: place.rating ? Math.round(place.rating * 10) : null, // 4.5 -> 45
        reviewCount: place.user_ratings_total || 0,
        lat: place.geometry?.location?.lat?.toString() || null,
        lng: place.geometry?.location?.lng?.toString() || null,
        photoUrl: place.photos?.[0] || null,
        googleMapsUrl: place.url || null,
        openingHours: place.opening_hours?.weekday_text || null,
        priceLevel: place.price_level || null,
        website: place.website || null,
        isActive: true,
        lastUpdated: new Date(),
        createdAt: new Date(),
      };

      // 插入店家資料 (使用 upsert 避免重複)
      await db.insert(stores).values(storeData).onDuplicateKeyUpdate({
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
          lastUpdated: new Date(),
        },
      });
      
      storeCount++;
      console.log(`✓ 匯入店家: ${place.name}`);

      // 插入評論
      if (place.reviews && Array.isArray(place.reviews)) {
        for (const review of place.reviews) {
          const reviewData: InsertReview = {
            storeId: place.place_id,
            authorName: review.author_name || null,
            rating: review.rating || null,
            text: review.text || null,
            time: review.time && !isNaN(review.time) ? new Date(review.time * 1000) : null,
            relativeTime: review.relative_time_description || null,
            createdAt: new Date(),
          };

          await db.insert(reviews).values(reviewData);
          reviewCount++;
        }
      }

      // 插入照片
      if (place.photos && Array.isArray(place.photos)) {
        for (const photoUrl of place.photos) {
          const photoData: InsertStorePhoto = {
            storeId: place.place_id,
            photoUrl: photoUrl,
            width: null,
            height: null,
            createdAt: new Date(),
          };

          await db.insert(storePhotos).values(photoData);
          photoCount++;
        }
      }

    } catch (error) {
      console.error(`✗ 匯入失敗: ${place.name}`, error);
    }
  }

  console.log("\n=== 匯入完成 ===");
  console.log(`店家數量: ${storeCount}`);
  console.log(`評論數量: ${reviewCount}`);
  console.log(`照片數量: ${photoCount}`);
}

importData()
  .then(() => {
    console.log("資料匯入成功！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("資料匯入失敗:", error);
    process.exit(1);
  });

