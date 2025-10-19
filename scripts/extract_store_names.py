#!/usr/bin/env python3
"""
從 stores_list.json 提取真正的店家名稱
"""

import json
import re

# 讀取原始資料
with open('/home/ubuntu/tainan-beef-soup-selector/scripts/stores_list.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"原始資料共 {len(data)} 筆")

# 提取店家名稱
store_names = []
seen_names = set()

# 關鍵字過濾（排除非店家名稱的項目）
exclude_keywords = [
    '評論', '備註', '時間', '創店', '緯度', '經度', '地址',
    '服務態度', '醬油膏', '本站食記', '開店時間', '公休時間',
    '賣完為止', '週一', '週二', '週三', '週四', '週五', '週六', '週日',
    '湯頭', '肉質', '價格', '環境', '停車', '推薦', '不推薦',
    '(1-5)', '[', ']', '全地圖'
]

for item in data:
    name = item.get('name', '').strip()
    
    # 跳過空白或太短的名稱
    if not name or len(name) < 2:
        continue
    
    # 跳過包含排除關鍵字的項目
    if any(keyword in name for keyword in exclude_keywords):
        continue
    
    # 跳過純數字或特殊符號
    if re.match(r'^[\d\s\-\(\)]+$', name):
        continue
    
    # 跳過重複的名稱
    if name in seen_names:
        continue
    
    # 檢查是否看起來像店家名稱（包含「牛肉」或「牛」）
    if '牛肉' in name or '牛' in name or '溫體' in name:
        store_names.append({
            'name': name,
            'search_query': f'{name} 台南'
        })
        seen_names.add(name)

print(f"\n提取出 {len(store_names)} 間店家")

# 顯示前 20 間
print("\n前 20 間店家:")
for i, store in enumerate(store_names[:20], 1):
    print(f"{i}. {store['name']}")

# 儲存結果
output_file = '/home/ubuntu/tainan-beef-soup-selector/scripts/extracted_stores.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(store_names, f, ensure_ascii=False, indent=2)

print(f"\n✅ 結果已儲存至: {output_file}")

