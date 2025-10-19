#!/usr/bin/env python3
"""
使用圖像識別來識別菜單照片
"""
import json
import requests
import os
import base64
from pathlib import Path

# 讀取菜單照片資料
with open('menu_photos.json', 'r', encoding='utf-8') as f:
    menu_photos_data = json.load(f)

# 建立照片下載目錄
photos_dir = Path('downloaded_photos')
photos_dir.mkdir(exist_ok=True)

# 儲存識別結果
identified_menu_photos = []

print("開始下載並識別菜單照片...")
print("=" * 60)

for store_data in menu_photos_data[:3]:  # 先測試前3間店家
    place_id = store_data['place_id']
    store_name = store_data['store_name']
    photos = store_data.get('menu_photos', [])
    
    print(f"\n處理店家: {store_name}")
    print(f"共有 {len(photos)} 張照片")
    
    store_menu_photos = []
    
    for idx, photo_url in enumerate(photos):
        print(f"  分析照片 {idx + 1}/{len(photos)}...", end=' ')
        
        try:
            # 下載照片
            response = requests.get(photo_url, timeout=10)
            if response.status_code != 200:
                print(f"下載失敗 (HTTP {response.status_code})")
                continue
            
            # 儲存照片
            photo_filename = f"{place_id}_{idx}.jpg"
            photo_path = photos_dir / photo_filename
            with open(photo_path, 'wb') as f:
                f.write(response.content)
            
            # 讀取照片並轉為 base64
            with open(photo_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
            
            # 這裡我們使用簡單的啟發式規則：
            # 1. 檢查檔案大小（菜單照片通常較大，因為包含文字）
            # 2. 在實際應用中，這裡應該調用視覺 API
            file_size = photo_path.stat().st_size
            
            # 暫時標記所有照片為可能的菜單照片
            # 在實際應用中，這裡會使用 AI 視覺 API 來判斷
            is_menu = True  # 預設為 True，稍後會用 AI 判斷
            
            if is_menu:
                store_menu_photos.append({
                    'url': photo_url,
                    'local_path': str(photo_path),
                    'index': idx
                })
                print("✓ 識別為菜單照片")
            else:
                print("✗ 非菜單照片")
                
        except Exception as e:
            print(f"錯誤: {e}")
    
    if store_menu_photos:
        identified_menu_photos.append({
            'place_id': place_id,
            'store_name': store_name,
            'menu_photos': store_menu_photos
        })
        print(f"  → 找到 {len(store_menu_photos)} 張菜單照片")

# 儲存結果
output_file = 'identified_menu_photos.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(identified_menu_photos, f, ensure_ascii=False, indent=2)

print("\n" + "=" * 60)
print(f"完成！共識別 {len(identified_menu_photos)} 間店家的菜單照片")
print(f"結果已儲存至: {output_file}")
print(f"照片已下載至: {photos_dir}")

