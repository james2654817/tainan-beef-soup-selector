import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 讀取兩個資料檔案
const allStoresData = JSON.parse(readFileSync(join(__dirname, 'all_stores_data.json'), 'utf-8'));
const completeStoresData = JSON.parse(readFileSync(join(__dirname, 'complete_stores_data.json'), 'utf-8'));

console.log(`📊 all_stores_data.json: ${allStoresData.length} 間店家`);
console.log(`📊 complete_stores_data.json: ${completeStoresData.length} 間店家`);

// 合併資料,使用 place_id 作為唯一鍵
const mergedStores = new Map();

// 先加入 all_stores_data
for (const store of allStoresData) {
  if (store.place_id) {
    mergedStores.set(store.place_id, store);
  }
}

// 再加入 complete_stores_data (如果 place_id 已存在則覆蓋,因為 complete 可能更新)
for (const store of completeStoresData) {
  if (store.place_id) {
    mergedStores.set(store.place_id, store);
  }
}

const mergedArray = Array.from(mergedStores.values());

console.log(`\n✅ 合併後: ${mergedArray.length} 間不重複店家`);
console.log(`📝 重複店家: ${(allStoresData.length + completeStoresData.length) - mergedArray.length} 間`);

// 儲存合併後的資料
writeFileSync(
  join(__dirname, 'merged_stores_data.json'),
  JSON.stringify(mergedArray, null, 2),
  'utf-8'
);

console.log(`\n💾 已儲存到: merged_stores_data.json`);

