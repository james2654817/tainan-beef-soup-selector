import json
import re
from collections import Counter

# 讀取 Places API 資料
with open('places_api_data.json', 'r', encoding='utf-8') as f:
    stores_data = json.load(f)

# 常見菜色關鍵字
DISH_KEYWORDS = [
    '牛肉湯', '牛肉麵', '牛腩', '牛筋', '牛雜', '牛心', '牛肚', '牛腸',
    '綜合湯', '溫體牛', '牛肉炒飯', '牛肉燴飯', '牛肉炒麵', '烏龍麵',
    '滷肉飯', '白飯', '肉燥飯', '牛骨湯', '牛尾湯'
]

# 價格模式
PRICE_PATTERN = r'[\$＄]?(\d{2,3})(?:元)?'

def extract_dishes_from_reviews(reviews):
    """從評論中提取菜色和可能的價格"""
    dishes = []
    
    for review in reviews:
        text = review.get('text', '')
        
        # 查找菜色
        for keyword in DISH_KEYWORDS:
            if keyword in text:
                # 嘗試找到相關的價格
                # 在菜色前後 20 個字元內尋找價格
                keyword_pos = text.find(keyword)
                context = text[max(0, keyword_pos-20):min(len(text), keyword_pos+len(keyword)+20)]
                
                price_match = re.search(PRICE_PATTERN, context)
                price = price_match.group(1) if price_match else None
                
                dishes.append({
                    'name': keyword,
                    'price': price,
                    'source': 'review'
                })
    
    return dishes

# 通用菜單模板（台南牛肉湯常見品項）
COMMON_MENU = [
    {'name': '牛肉湯', 'price_range': '80-120', 'description': '新鮮溫體牛肉，湯頭清甜'},
    {'name': '綜合牛肉湯', 'price_range': '100-150', 'description': '牛肉、牛腱、牛筋綜合'},
    {'name': '牛肉麵', 'price_range': '90-130', 'description': 'Q彈麵條搭配鮮甜湯頭'},
    {'name': '牛腩湯', 'price_range': '100-140', 'description': '軟嫩牛腩，入口即化'},
    {'name': '牛筋湯', 'price_range': '90-130', 'description': '膠質豐富，口感Q彈'},
    {'name': '牛雜湯', 'price_range': '80-120', 'description': '牛肚、牛腸等內臟'},
    {'name': '牛心湯', 'price_range': '90-130', 'description': '口感獨特，營養豐富'},
    {'name': '滷肉飯', 'price_range': '25-40', 'description': '古早味滷肉'},
    {'name': '白飯', 'price_range': '10-20', 'description': '搭配牛肉湯最佳'}
]

# 為每間店家生成菜單
menu_data = {}

for store in stores_data:
    store_name = store.get('name', store.get('actual_name', 'Unknown'))
    place_id = store.get('place_id', store_name)
    reviews = store.get('reviews', [])
    
    # 從評論中提取菜色
    extracted_dishes = extract_dishes_from_reviews(reviews)
    
    # 統計提到的菜色
    dish_counter = Counter([d['name'] for d in extracted_dishes])
    
    # 建立菜單
    menu_items = []
    mentioned_dishes = set()
    
    # 優先加入評論中提到的菜色
    for dish_name, count in dish_counter.most_common(6):
        # 找到有價格的項目
        dish_with_price = next((d for d in extracted_dishes if d['name'] == dish_name and d['price']), None)
        
        if dish_with_price:
            menu_items.append({
                'name': dish_name,
                'price': f"${dish_with_price['price']}",
                'description': '評論中提及',
                'confidence': 'high'
            })
        else:
            # 沒有價格，使用通用價格範圍
            common_item = next((item for item in COMMON_MENU if item['name'] == dish_name), None)
            if common_item:
                menu_items.append({
                    'name': dish_name,
                    'price': f"${common_item['price_range']}",
                    'description': common_item['description'],
                    'confidence': 'medium'
                })
        
        mentioned_dishes.add(dish_name)
    
    # 補充通用菜單（如果少於 6 項）
    if len(menu_items) < 6:
        for common_item in COMMON_MENU:
            if common_item['name'] not in mentioned_dishes:
                menu_items.append({
                    'name': common_item['name'],
                    'price': f"${common_item['price_range']}",
                    'description': common_item['description'],
                    'confidence': 'low'
                })
                if len(menu_items) >= 6:
                    break
    
    menu_data[place_id] = {
        'store_name': store_name,
        'items': menu_items[:6],  # 最多 6 項
        'note': '本菜單資訊整理自 Google Maps 評論及台南牛肉湯常見品項，實際菜單、價格請以店家現場為準。'
    }

# 儲存菜單資料
with open('menu_data.json', 'w', encoding='utf-8') as f:
    json.dump(menu_data, f, ensure_ascii=False, indent=2)

print(f"✅ 已為 {len(menu_data)} 間店家生成菜單資料")
print(f"儲存至: menu_data.json")

