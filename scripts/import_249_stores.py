#!/usr/bin/env python3
import sqlite3
import json
import os
import re

# 路徑設定
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, '../data/db.sqlite')
data_path = os.path.join(script_dir, 'complete_stores_data.json')

# 讀取 JSON 資料
with open(data_path, 'r', encoding='utf-8') as f:
    stores_data = json.load(f)

print(f'準備匯入 {len(stores_data)} 間店家...')

# 連接資料庫
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 清空現有資料
cursor.execute('DELETE FROM stores')
cursor.execute('DELETE FROM reviews')
cursor.execute('DELETE FROM photos')
cursor.execute('DELETE FROM menu_items')
conn.commit()

print('✓ 已清空現有資料')

store_count = 0
review_count = 0
photo_count = 0

for store in stores_data:
    try:
        # 提取區域
        district = None
        address = store.get('formatted_address') or store.get('vicinity') or ''
        district_match = re.search(r'(中西區|東區|南區|北區|安平區|安南區|永康區|歸仁區)', address)
        if district_match:
            district = district_match.group(1)
        
        # 轉換營業時間
        opening_hours_json = None
        if store.get('opening_hours') and store['opening_hours'].get('periods'):
            opening_hours_json = json.dumps(store['opening_hours']['periods'])
        
        # 取得經緯度
        lat = None
        lng = None
        if store.get('geometry') and store['geometry'].get('location'):
            lat = str(store['geometry']['location'].get('lat', ''))
            lng = str(store['geometry']['location'].get('lng', ''))
        
        # 插入店家
        cursor.execute('''
            INSERT INTO stores (
                name, address, district, phone, rating, reviewCount,
                lat, lng, photoUrl, googleMapsUrl, placeId, openingHours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            store.get('name'),
            address,
            district,
            store.get('formatted_phone_number'),
            store.get('rating'),
            store.get('user_ratings_total', 0),
            lat,
            lng,
            None,  # photoUrl 稍後處理
            store.get('url') or f"https://www.google.com/maps/place/?q=place_id:{store.get('place_id')}",
            store.get('place_id'),
            opening_hours_json
        ))
        
        store_id = cursor.lastrowid
        store_count += 1
        
        # 匯入評論
        reviews = store.get('reviews', [])
        for review in reviews[:5]:
            try:
                cursor.execute('''
                    INSERT INTO reviews (storeId, authorName, rating, text, relativeTime, time)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    store_id,
                    review.get('author_name', '匿名'),
                    review.get('rating', 0),
                    review.get('text', ''),
                    review.get('relative_time_description', ''),
                    review.get('time', 0)
                ))
                review_count += 1
            except Exception as e:
                print(f'  ✗ 匯入評論失敗: {e}')
        
        # 匯入照片
        photos = store.get('photos', [])
        for photo in photos[:10]:
            try:
                photo_ref = photo.get('photo_reference')
                if photo_ref:
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={photo_ref}&key=YOUR_API_KEY"
                    attribution = photo.get('html_attributions', [''])[0] if photo.get('html_attributions') else ''
                    
                    cursor.execute('''
                        INSERT INTO photos (storeId, url, attribution)
                        VALUES (?, ?, ?)
                    ''', (store_id, photo_url, attribution))
                    photo_count += 1
            except Exception as e:
                print(f'  ✗ 匯入照片失敗: {e}')
        
        if store_count % 10 == 0:
            print(f'已匯入 {store_count} 間店家...')
            conn.commit()
    
    except Exception as e:
        print(f"✗ 匯入店家失敗: {store.get('name')}: {e}")

conn.commit()
conn.close()

print('\n✅ 匯入完成！')
print(f'  店家: {store_count} 間')
print(f'  評論: {review_count} 則')
print(f'  照片: {photo_count} 張')

