import json
import requests
import os

# 讀取現有的店家資料
with open('places_api_data.json', 'r', encoding='utf-8') as f:
    stores_data = json.load(f)

API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY', 'AIzaSyD80kuCrJFFj2zsxRTrmxPTbRbVrqEAn3U')

menu_photos_data = []

for store in stores_data:
    place_id = store.get('place_id')
    store_name = store.get('name', 'Unknown')
    
    if not place_id:
        continue
    
    print(f"抓取 {store_name} 的菜單照片...")
    
    # 使用 Place Details API 取得照片
    details_url = f"https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        'place_id': place_id,
        'fields': 'photos',
        'key': API_KEY
    }
    
    try:
        response = requests.get(details_url, params=params)
        data = response.json()
        
        if data.get('status') == 'OK' and 'result' in data:
            photos = data['result'].get('photos', [])
            
            # 篩選可能是菜單的照片（通常前幾張照片）
            menu_photo_urls = []
            for photo in photos[:10]:  # 取前10張照片
                photo_reference = photo.get('photo_reference')
                if photo_reference:
                    # 建立照片 URL
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={photo_reference}&key={API_KEY}"
                    menu_photo_urls.append(photo_url)
            
            if menu_photo_urls:
                menu_photos_data.append({
                    'place_id': place_id,
                    'store_name': store_name,
                    'menu_photos': menu_photo_urls
                })
                print(f"  ✓ 找到 {len(menu_photo_urls)} 張照片")
            else:
                print(f"  ✗ 沒有找到照片")
        else:
            print(f"  ✗ API 錯誤: {data.get('status')}")
    
    except Exception as e:
        print(f"  ✗ 錯誤: {e}")

# 儲存結果
with open('menu_photos.json', 'w', encoding='utf-8') as f:
    json.dump(menu_photos_data, f, ensure_ascii=False, indent=2)

print(f"\n完成！共抓取 {len(menu_photos_data)} 間店家的照片資料")

