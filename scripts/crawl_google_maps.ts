/**
 * Google Maps 爬蟲 - 台南牛肉湯店家
 * 功能：
 * 1. 搜尋台南市所有牛肉湯店家
 * 2. 取得店家詳細資訊
 * 3. 檢查營業狀態（排除歇業店家）
 * 4. 更新資料庫
 */

import { getDb } from '../server/db';
import { stores, reviews, storePhotos } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Google Places API 設定
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const SEARCH_QUERIES = [
  '台南市 牛肉湯',
  '台南 溫體牛肉湯',
  '台南 牛肉清湯',
  'Tainan beef soup'
];

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  business_status?: string; // 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'
  opening_hours?: {
    periods: any[];
    weekday_text: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

/**
 * 使用 Google Places API Text Search 搜尋店家
 */
async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&language=zh-TW`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`搜尋失敗: ${data.status}`, data.error_message);
      return [];
    }
    
    return data.results || [];
  } catch (error) {
    console.error(`搜尋錯誤 (${query}):`, error);
    return [];
  }
}

/**
 * 取得店家詳細資訊
 */
async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,business_status,opening_hours,photos,reviews,url&key=${GOOGLE_PLACES_API_KEY}&language=zh-TW`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error(`取得詳細資訊失敗: ${data.status}`, data.error_message);
      return null;
    }
    
    return data.result;
  } catch (error) {
    console.error(`取得詳細資訊錯誤 (${placeId}):`, error);
    return null;
  }
}

/**
 * 從地址提取區域
 */
function extractDistrict(address: string): string {
  const match = address.match(/台南市(.{2,3}區)/);
  return match ? match[1] : '未知';
}

/**
 * 轉換營業時間格式
 */
function convertOpeningHours(periods: any[]): any[] {
  if (!periods || !Array.isArray(periods)) return [];
  
  return periods.filter(period => period.open && period.close).map(period => ({
    open: `${period.open.day}:${period.open.time}`,
    close: `${period.close.day}:${period.close.time}`
  }));
}

/**
 * 生成照片 URL
 */
function generatePhotoUrl(photoReference: string, maxWidth: number = 800): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * 檢查店家是否已存在
 */
async function storeExists(placeId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(stores).where(eq(stores.id, placeId)).limit(1);
  return result.length > 0;
}

/**
 * 新增或更新店家
 */
async function upsertStore(place: PlaceResult): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const district = extractDistrict(place.formatted_address);
  const openingHours = place.opening_hours?.periods ? convertOpeningHours(place.opening_hours.periods) : [];
  const firstPhotoUrl = place.photos?.[0] ? generatePhotoUrl(place.photos[0].photo_reference) : null;
  
  const storeData = {
    id: place.place_id,
    name: place.name,
    address: place.formatted_address,
    district: district,
    lat: place.geometry.location.lat.toString(),
    lng: place.geometry.location.lng.toString(),
    rating: Math.round((place.rating || 0) * 10), // 轉換為整數 4.5 -> 45
    reviewCount: place.user_ratings_total || 0,
    openingHours: openingHours,
    googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    photoUrl: firstPhotoUrl,
    businessStatus: place.business_status || 'OPERATIONAL'
  };
  
  const exists = await storeExists(place.place_id);
  
  if (exists) {
    // 更新現有店家
    await db.update(stores)
      .set(storeData)
      .where(eq(stores.id, place.place_id));
    console.log(`  ✓ 更新店家: ${place.name}`);
  } else {
    // 新增店家
    await db.insert(stores).values(storeData);
    console.log(`  ✓ 新增店家: ${place.name}`);
  }
}

/**
 * 新增評論
 */
async function insertReviews(placeId: string, reviewsData: any[]): Promise<void> {
  if (!reviewsData || reviewsData.length === 0) return;
  const db = await getDb();
  if (!db) return;
  
  for (const review of reviewsData) {
    try {
      await db.insert(reviews).values({
        storeId: placeId,
        authorName: review.author_name,
        rating: review.rating,
        text: review.text,
        time: new Date(review.time * 1000)
      });
    } catch (error) {
      // 忽略重複的評論
    }
  }
}

/**
 * 新增照片
 */
async function insertPhotos(placeId: string, photosData: any[]): Promise<void> {
  if (!photosData || photosData.length === 0) return;
  const db = await getDb();
  if (!db) return;
  
  for (const photo of photosData) {
    try {
      const photoUrl = generatePhotoUrl(photo.photo_reference);
      await db.insert(storePhotos).values({
        storeId: placeId,
        photoUrl: photoUrl,
        width: photo.width,
        height: photo.height
      });
    } catch (error) {
      // 忽略重複的照片
    }
  }
}

/**
 * 刪除歇業店家
 */
async function removeClosedStores(): Promise<number> {
  console.log('\n檢查並移除歇業店家...');
  const db = await getDb();
  if (!db) return 0;
  
  const allStores = await db.select().from(stores);
  let removedCount = 0;
  
  for (const store of allStores) {
    // 取得最新的營業狀態
    const details = await getPlaceDetails(store.id);
    
    if (!details) {
      console.log(`  ⚠ 無法取得店家資訊: ${store.name}`);
      continue;
    }
    
    // 檢查是否永久歇業
    if (details.business_status === 'CLOSED_PERMANENTLY') {
      console.log(`  ✗ 移除歇業店家: ${store.name}`);
      
      // 刪除相關評論
      await db.delete(reviews).where(eq(reviews.storeId, store.id));
      
      // 刪除相關照片
      await db.delete(storePhotos).where(eq(storePhotos.storeId, store.id));
      
      // 刪除店家
      await db.delete(stores).where(eq(stores.id, store.id));
      
      removedCount++;
    } else if (details.business_status === 'CLOSED_TEMPORARILY') {
      console.log(`  ⏸ 暫時歇業: ${store.name}`);
      // 更新狀態但不刪除
      await db.update(stores)
        .set({ businessStatus: 'CLOSED_TEMPORARILY' })
        .where(eq(stores.id, store.id));
    }
    
    // 避免 API 限制，每次請求後等待
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return removedCount;
}

/**
 * 主要執行函數
 */
async function main() {
  console.log('🚀 開始爬取 Google Maps 台南牛肉湯店家...\n');
  
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('❌ 錯誤: 請設定 GOOGLE_PLACES_API_KEY 環境變數');
    process.exit(1);
  }
  
  const allPlaces = new Map<string, PlaceResult>();
  
  // 1. 搜尋所有店家
  console.log('📍 步驟 1: 搜尋店家...');
  for (const query of SEARCH_QUERIES) {
    console.log(`  搜尋: ${query}`);
    const results = await searchPlaces(query);
    console.log(`  找到 ${results.length} 間店家`);
    
    for (const place of results) {
      if (!allPlaces.has(place.place_id)) {
        allPlaces.set(place.place_id, place);
      }
    }
    
    // 避免 API 限制
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n總共找到 ${allPlaces.size} 間不重複的店家\n`);
  
  // 2. 取得詳細資訊並更新資料庫
  console.log('📝 步驟 2: 取得詳細資訊並更新資料庫...');
  let processedCount = 0;
  
  for (const [placeId, place] of allPlaces) {
    console.log(`\n處理 ${++processedCount}/${allPlaces.size}: ${place.name}`);
    
    // 取得詳細資訊
    const details = await getPlaceDetails(placeId);
    
    if (!details) {
      console.log(`  ⚠ 跳過（無法取得詳細資訊）`);
      continue;
    }
    
    // 跳過永久歇業的店家
    if (details.business_status === 'CLOSED_PERMANENTLY') {
      console.log(`  ✗ 跳過（已永久歇業）`);
      continue;
    }
    
    // 更新店家資訊
    await upsertStore(details);
    
    // 新增評論
    if (details.reviews && details.reviews.length > 0) {
      await insertReviews(placeId, details.reviews);
      console.log(`  ✓ 新增 ${details.reviews.length} 則評論`);
    }
    
    // 新增照片
    if (details.photos && details.photos.length > 0) {
      await insertPhotos(placeId, details.photos);
      console.log(`  ✓ 新增 ${details.photos.length} 張照片`);
    }
    
    // 避免 API 限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 3. 移除歇業店家
  console.log('\n🗑️  步驟 3: 檢查並移除歇業店家...');
  const removedCount = await removeClosedStores();
  
  // 4. 完成
  console.log('\n✅ 爬取完成！');
  console.log(`  新增/更新: ${processedCount} 間店家`);
  console.log(`  移除歇業: ${removedCount} 間店家`);
  
  // 顯示最終統計
  const db = await getDb();
  if (db) {
    const finalStores = await db.select().from(stores);
    console.log(`  資料庫總計: ${finalStores.length} 間店家`);
  }
}

// 執行
main().catch(error => {
  console.error('❌ 執行錯誤:', error);
  process.exit(1);
});

