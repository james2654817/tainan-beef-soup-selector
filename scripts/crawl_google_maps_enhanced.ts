/**
 * Google Maps 爬蟲 - 台南牛肉湯店家（增強版）
 * 
 * 三種搜尋策略：
 * 1. 區域性搜尋 - 針對每個台南市行政區搜尋
 * 2. Nearby Search - 在台南市中心點周圍搜尋
 * 3. 結合原始資料 - 保留原有店家並更新資訊
 */

import { getDb } from '../server/db';
import { stores, reviews, storePhotos } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Google Places API 設定
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

// 台南市所有行政區
const TAINAN_DISTRICTS = [
  "中西區", "東區", "南區", "北區", "安平區", "安南區",
  "永康區", "仁德區", "歸仁區", "關廟區",
  "新營區", "鹽水區", "白河區", "柳營區", "後壁區", "東山區",
  "麻豆區", "下營區", "六甲區", "官田區", "大內區",
  "佳里區", "學甲區", "西港區", "七股區", "將軍區", "北門區",
  "新化區", "善化區", "新市區", "安定區", "山上區", "玉井區",
  "楠西區", "南化區", "左鎮區", "龍崎區"
];

// 台南市中心座標（台南火車站附近）
const TAINAN_CENTER = {
  lat: 22.9971,
  lng: 120.2133
};

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
  business_status?: string;
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
  url?: string;
}

/**
 * 策略 1: 區域性文字搜尋
 */
async function searchByDistrict(district: string): Promise<PlaceResult[]> {
  const queries = [
    `台南${district} 牛肉湯`,
    `台南${district} 溫體牛肉湯`,
  ];
  
  const allResults: PlaceResult[] = [];
  
  for (const query of queries) {
    console.log(`🔍 搜尋: ${query}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&language=zh-TW`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log(`   找到 ${data.results.length} 間店家`);
        allResults.push(...data.results);
      } else if (data.status === 'ZERO_RESULTS') {
        console.log(`   無結果`);
      } else {
        console.error(`   搜尋失敗: ${data.status}`);
      }
      
      // 避免超過 API 限制
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`   搜尋錯誤:`, error);
    }
  }
  
  return allResults;
}

/**
 * 策略 2: Nearby Search API
 * 在指定座標周圍搜尋店家
 */
async function searchNearby(lat: number, lng: number, radius: number = 10000): Promise<PlaceResult[]> {
  console.log(`📍 搜尋附近店家: (${lat}, ${lng}), 半徑 ${radius}m`);
  
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=牛肉湯&key=${GOOGLE_PLACES_API_KEY}&language=zh-TW`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log(`   找到 ${data.results.length} 間店家`);
      return data.results;
    } else if (data.status === 'ZERO_RESULTS') {
      console.log(`   無結果`);
      return [];
    } else {
      console.error(`   搜尋失敗: ${data.status}`);
      return [];
    }
  } catch (error) {
    console.error(`   搜尋錯誤:`, error);
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
    
    if (data.status === 'OK') {
      return data.result;
    } else {
      console.error(`取得詳細資訊失敗: ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error(`取得詳細資訊錯誤:`, error);
    return null;
  }
}

/**
 * 從地址提取區域
 */
function extractDistrict(address: string): string {
  // 使用郵遞區號對照
  const postalCodeMap: Record<string, string> = {
    '700': '中西區', '701': '東區', '702': '南區', '704': '北區',
    '708': '安平區', '709': '安南區', '710': '永康區', '717': '仁德區',
    '711': '歸仁區', '718': '關廟區', '730': '新營區', '737': '鹽水區',
    '732': '白河區', '736': '柳營區', '731': '後壁區', '733': '東山區',
    '721': '麻豆區', '735': '下營區', '734': '六甲區', '720': '官田區',
    '742': '大內區', '722': '佳里區', '726': '學甲區', '723': '西港區',
    '724': '七股區', '725': '將軍區', '727': '北門區', '712': '新化區',
    '741': '善化區', '744': '新市區', '745': '安定區', '743': '山上區',
    '714': '玉井區', '715': '楠西區', '716': '南化區', '713': '左鎮區',
    '719': '龍崎區'
  };

  // 先嘗試郵遞區號
  for (const [code, district] of Object.entries(postalCodeMap)) {
    if (address.includes(code)) {
      return district;
    }
  }

  // 再嘗試區域名稱
  const match = address.match(/台南市(.{2,3}區)/);
  if (match) {
    return match[1];
  }

  return '未知';
}

/**
 * 轉換營業時間格式
 */
function convertOpeningHours(periods: any[]): any[] {
  if (!periods || periods.length === 0) return [];
  
  return periods.map(period => ({
    open: period.open ? `${period.open.day}:${period.open.time}` : null,
    close: period.close ? `${period.close.day}:${period.close.time}` : null
  })).filter(p => p.open && p.close);
}

/**
 * 主函數
 */
async function main() {
  console.log('🚀 開始爬取台南牛肉湯店家（增強版）\n');
  
  const db = await getDb();
  const allPlaces = new Map<string, PlaceResult>();
  
  // ========== 策略 1: 區域性搜尋 ==========
  console.log('\n📍 策略 1: 區域性搜尋');
  console.log('=' .repeat(50));
  
  for (const district of TAINAN_DISTRICTS) {
    const results = await searchByDistrict(district);
    results.forEach(place => {
      allPlaces.set(place.place_id, place);
    });
    
    // 避免超過 API 限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n✅ 策略 1 完成，找到 ${allPlaces.size} 間不重複店家\n`);
  
  // ========== 策略 2: Nearby Search ==========
  console.log('\n📍 策略 2: Nearby Search（台南市中心）');
  console.log('=' .repeat(50));
  
  // 在台南市中心搜尋
  const nearbyResults = await searchNearby(TAINAN_CENTER.lat, TAINAN_CENTER.lng, 15000);
  nearbyResults.forEach(place => {
    allPlaces.set(place.place_id, place);
  });
  
  console.log(`\n✅ 策略 2 完成，總共 ${allPlaces.size} 間不重複店家\n`);
  
  // ========== 策略 3: 取得詳細資訊並更新資料庫 ==========
  console.log('\n📍 策略 3: 取得詳細資訊並更新資料庫');
  console.log('=' .repeat(50));
  
  let newStores = 0;
  let updatedStores = 0;
  let closedStores = 0;
  
  for (const [placeId, place] of allPlaces) {
    console.log(`\n處理: ${place.name}`);
    
    // 取得詳細資訊
    const details = await getPlaceDetails(placeId);
    if (!details) continue;
    
    // 檢查營業狀態
    if (details.business_status === 'CLOSED_PERMANENTLY') {
      console.log(`   ❌ 永久歇業，跳過`);
      closedStores++;
      
      // 從資料庫中移除
      await db.delete(stores).where(eq(stores.googleMapsUrl, details.url || ''));
      continue;
    }
    
    // 提取區域
    const district = extractDistrict(details.formatted_address);
    console.log(`   📍 區域: ${district}`);
    console.log(`   ⭐ 評分: ${details.rating || 'N/A'} (${details.user_ratings_total || 0}則評論)`);
    
    // 檢查店家是否已存在（使用 Google Place ID）
    const existingStores = await db.select().from(stores).where(eq(stores.id, placeId)).limit(1);
    const existingStore = existingStores.length > 0 ? existingStores[0] : null;
    
    const storeData = {
      id: placeId, // Google Place ID
      name: details.name,
      address: details.formatted_address,
      district: district,
      lat: details.geometry.location.lat.toString(),
      lng: details.geometry.location.lng.toString(),
      rating: details.rating ? Math.round(details.rating * 10) : null, // 4.5 -> 45
      reviewCount: details.user_ratings_total || 0,
      googleMapsUrl: details.url || '',
      businessStatus: details.business_status || 'OPERATIONAL',
      openingHours: details.opening_hours ? convertOpeningHours(details.opening_hours.periods) : null,
      photoUrl: details.photos && details.photos.length > 0
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${details.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        : null
    };
    
    if (existingStore) {
      // 更新現有店家
      await db.update(stores)
        .set(storeData)
        .where(eq(stores.id, existingStore.id));
      console.log(`   ✅ 更新店家資訊`);
      updatedStores++;
    } else {
      // 新增店家
      await db.insert(stores).values(storeData);
      console.log(`   ✅ 新增店家 (ID: ${placeId})`);
      newStores++;
      
      // 新增評論
      if (details.reviews && details.reviews.length > 0) {
        for (const review of details.reviews.slice(0, 5)) {
          await db.insert(reviews).values({
            storeId: placeId,
            author: review.author_name,
            rating: review.rating,
            text: review.text,
            date: new Date(review.time * 1000).toISOString().split('T')[0]
          });
        }
        console.log(`   💬 新增 ${Math.min(details.reviews.length, 5)} 則評論`);
      }
      
      // 新增照片
      if (details.photos && details.photos.length > 0) {
        for (const photo of details.photos.slice(0, 10)) {
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
          await db.insert(storePhotos).values({
            storeId: placeId,
            photoUrl: photoUrl,
            width: photo.width || null,
            height: photo.height || null
          });
        }
        console.log(`   📸 新增 ${Math.min(details.photos.length, 10)} 張照片`);
      }
    }
    
    // 避免超過 API 限制
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // ========== 總結 ==========
  console.log('\n' + '='.repeat(50));
  console.log('🎉 爬取完成！');
  console.log('='.repeat(50));
  console.log(`📊 總共找到: ${allPlaces.size} 間店家`);
  console.log(`✅ 新增店家: ${newStores} 間`);
  console.log(`🔄 更新店家: ${updatedStores} 間`);
  console.log(`❌ 歇業店家: ${closedStores} 間`);
  
  // 查詢最終資料庫統計
  const finalStores = await db.select().from(stores);
  console.log(`\n📈 資料庫總計: ${finalStores.length} 間店家`);
  
  process.exit(0);
}

main().catch(console.error);

