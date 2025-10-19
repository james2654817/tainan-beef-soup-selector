/**
 * 修復所有店家的 district 欄位
 * 從地址中提取區域資訊
 */

import { getDb } from '../server/db';
import { stores } from '../drizzle/schema';
import { eq, isNull } from 'drizzle-orm';

/**
 * 從地址提取區域
 */
function extractDistrict(address: string): string | null {
  // 嘗試匹配 "台南市XXX區" 格式
  const match = address.match(/台南市(.{2,3}區)/);
  if (match) {
    return match[1];
  }
  
  // 嘗試匹配郵遞區號後的區域
  const match2 = address.match(/\d{3,5}台灣台南市(.{2,3}區)/);
  if (match2) {
    return match2[1];
  }
  
  // 根據郵遞區號判斷區域
  const postalMatch = address.match(/^(\d{3})/);
  if (postalMatch) {
    const postal = postalMatch[1];
    const postalMap: Record<string, string> = {
      '700': '中西區',
      '701': '東區',
      '702': '南區',
      '704': '北區',
      '708': '安平區',
      '709': '安南區',
      '710': '永康區',
      '711': '歸仁區',
      '712': '新化區',
      '713': '左鎮區',
      '714': '玉井區',
      '715': '楠西區',
      '716': '南化區',
      '717': '仁德區',
      '718': '關廟區',
      '719': '龍崎區',
      '720': '官田區',
      '721': '麻豆區',
      '722': '佳里區',
      '723': '西港區',
      '724': '七股區',
      '725': '將軍區',
      '726': '北門區',
      '727': '學甲區',
      '730': '新營區',
      '731': '後壁區',
      '732': '白河區',
      '733': '東山區',
      '734': '六甲區',
      '735': '下營區',
      '736': '柳營區',
      '737': '鹽水區',
      '741': '善化區',
      '742': '大內區',
      '743': '山上區',
      '744': '新市區',
      '745': '安定區'
    };
    
    if (postalMap[postal]) {
      return postalMap[postal];
    }
  }
  
  return null;
}

async function main() {
  console.log('🔧 開始修復店家區域資訊...\n');
  
  const db = await getDb();
  if (!db) {
    console.error('❌ 無法連接資料庫');
    return;
  }
  
  // 取得所有店家
  const allStores = await db.select().from(stores);
  console.log(`找到 ${allStores.length} 間店家\n`);
  
  let fixedCount = 0;
  let nullCount = 0;
  
  for (const store of allStores) {
    // 如果 district 是 null 或 "未知"，嘗試從地址提取
    if (!store.district || store.district === '未知') {
      const district = extractDistrict(store.address);
      
      if (district) {
        await db.update(stores)
          .set({ district: district })
          .where(eq(stores.id, store.id));
        
        console.log(`✓ 修復: ${store.name} → ${district}`);
        fixedCount++;
      } else {
        console.log(`⚠ 無法提取區域: ${store.name} (${store.address})`);
        nullCount++;
      }
    }
  }
  
  console.log('\n✅ 修復完成！');
  console.log(`  已修復: ${fixedCount} 間店家`);
  console.log(`  無法提取: ${nullCount} 間店家`);
  
  // 顯示區域統計
  const updatedStores = await db.select().from(stores);
  const districtCounts = new Map<string, number>();
  
  for (const store of updatedStores) {
    const district = store.district || '未知';
    districtCounts.set(district, (districtCounts.get(district) || 0) + 1);
  }
  
  console.log('\n📊 區域統計：');
  const sortedDistricts = Array.from(districtCounts.entries())
    .sort((a, b) => b[1] - a[1]);
  
  for (const [district, count] of sortedDistricts) {
    console.log(`  ${district}: ${count} 間`);
  }
}

main().catch(error => {
  console.error('❌ 執行錯誤:', error);
  process.exit(1);
});

