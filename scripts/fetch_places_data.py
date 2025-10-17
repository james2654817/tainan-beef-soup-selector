#!/usr/bin/env python3
"""
Google Places API 資料抓取腳本
使用官方 API 取得台南牛肉湯店家資訊
"""

import os
import json
import requests
import time
from datetime import datetime

# 從環境變數取得 API Key
API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY')

if not API_KEY:
    print("❌ 錯誤：未設定 GOOGLE_PLACES_API_KEY 環境變數")
    exit(1)

# API 端點
PLACES_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

def search_place(query):
    """使用 Text Search API 搜尋店家"""
    print(f"\n🔍 搜尋: {query}")
    
    params = {
        'query': query,
        'key': API_KEY,
        'language': 'zh-TW',
        'region': 'tw'
    }
    
    try:
        response = requests.get(PLACES_TEXT_SEARCH_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data['status'] == 'OK' and len(data['results']) > 0:
            # 返回第一個結果
            place = data['results'][0]
            print(f"✅ 找到: {place['name']}")
            return place
        else:
            print(f"⚠️  未找到結果 (status: {data['status']})")
            return None
            
    except Exception as e:
        print(f"❌ 搜尋錯誤: {str(e)}")
        return None

def get_place_details(place_id):
    """使用 Place Details API 取得詳細資訊"""
    print(f"📋 取得詳細資訊...")
    
    params = {
        'place_id': place_id,
        'key': API_KEY,
        'language': 'zh-TW',
        'fields': 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,opening_hours,reviews,photos,geometry,price_level,types,website,url'
    }
    
    try:
        response = requests.get(PLACES_DETAILS_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data['status'] == 'OK':
            return data['result']
        else:
            print(f"⚠️  無法取得詳細資訊 (status: {data['status']})")
            return None
            
    except Exception as e:
        print(f"❌ 取得詳細資訊錯誤: {str(e)}")
        return None

def parse_opening_hours(opening_hours):
    """解析營業時間"""
    if not opening_hours:
        return {}
    
    hours_dict = {}
    weekday_text = opening_hours.get('weekday_text', [])
    
    # weekday_text 格式: ["星期一: 05:00 - 12:00", "星期二: 公休", ...]
    day_mapping = {
        '星期一': 'monday',
        '星期二': 'tuesday',
        '星期三': 'wednesday',
        '星期四': 'thursday',
        '星期五': 'friday',
        '星期六': 'saturday',
        '星期日': 'sunday'
    }
    
    for text in weekday_text:
        for zh_day, en_day in day_mapping.items():
            if text.startswith(zh_day):
                time_part = text.split(': ', 1)[1] if ': ' in text else ''
                hours_dict[en_day] = time_part
                break
    
    return hours_dict

def parse_reviews(reviews):
    """解析評論"""
    if not reviews:
        return []
    
    parsed_reviews = []
    for review in reviews[:10]:  # 只取前 10 則
        parsed_reviews.append({
            'author': review.get('author_name', '匿名'),
            'rating': review.get('rating', 0),
            'text': review.get('text', ''),
            'time': review.get('relative_time_description', ''),
            'timestamp': review.get('time', 0)
        })
    
    return parsed_reviews

def get_photo_url(photo_reference, max_width=800):
    """取得照片 URL"""
    if not photo_reference:
        return None
    
    return f"https://maps.googleapis.com/maps/api/place/photo?maxwidth={max_width}&photo_reference={photo_reference}&key={API_KEY}"

def fetch_store_data(store_name, search_query):
    """抓取單一店家完整資料"""
    print(f"\n{'='*60}")
    print(f"處理店家: {store_name}")
    print(f"{'='*60}")
    
    # 1. 搜尋店家
    place = search_place(search_query)
    if not place:
        return {
            'name': store_name,
            'search_query': search_query,
            'error': '未找到店家',
            'scraped_at': datetime.now().isoformat()
        }
    
    place_id = place['place_id']
    
    # 2. 取得詳細資訊
    details = get_place_details(place_id)
    if not details:
        return {
            'name': store_name,
            'search_query': search_query,
            'place_id': place_id,
            'error': '無法取得詳細資訊',
            'scraped_at': datetime.now().isoformat()
        }
    
    # 3. 整理資料
    store_data = {
        'name': store_name,
        'actual_name': details.get('name', store_name),
        'place_id': place_id,
        'rating': details.get('rating'),
        'review_count': details.get('user_ratings_total', 0),
        'address': details.get('formatted_address', ''),
        'phone': details.get('formatted_phone_number', ''),
        'website': details.get('website', ''),
        'google_maps_url': details.get('url', ''),
        'price_level': details.get('price_level'),
        'types': details.get('types', []),
        'hours': parse_opening_hours(details.get('opening_hours')),
        'is_open_now': details.get('opening_hours', {}).get('open_now'),
        'reviews': parse_reviews(details.get('reviews', [])),
        'photos': [],
        'latitude': details.get('geometry', {}).get('location', {}).get('lat'),
        'longitude': details.get('geometry', {}).get('location', {}).get('lng'),
        'scraped_at': datetime.now().isoformat()
    }
    
    # 4. 取得照片 URL
    photos = details.get('photos', [])
    for photo in photos[:5]:  # 只取前 5 張
        photo_ref = photo.get('photo_reference')
        if photo_ref:
            store_data['photos'].append(get_photo_url(photo_ref))
    
    # 5. 顯示摘要
    print(f"✅ 店名: {store_data['actual_name']}")
    print(f"✅ 評分: {store_data['rating']} ★ ({store_data['review_count']} 則評論)")
    print(f"✅ 地址: {store_data['address']}")
    print(f"✅ 電話: {store_data['phone']}")
    print(f"✅ 營業時間: {len(store_data['hours'])} 天")
    print(f"✅ 評論: {len(store_data['reviews'])} 則")
    print(f"✅ 照片: {len(store_data['photos'])} 張")
    print(f"✅ 座標: ({store_data['latitude']}, {store_data['longitude']})")
    
    return store_data

def main():
    """主程式"""
    # 讀取店家清單
    with open('/home/ubuntu/tainan-beef-soup-selector/scripts/seed_stores.json', 'r', encoding='utf-8') as f:
        stores = json.load(f)
    
    print(f"準備抓取 {len(stores)} 間店家的資料...")
    print(f"使用 Google Places API")
    
    results = []
    
    # 抓取全部店家
    for i, store in enumerate(stores, 1):
        print(f"\n進度: {i}/{len(stores)}")
        
        result = fetch_store_data(store['name'], store['search_query'])
        results.append(result)
        
        # API 有使用限制，稍微延遲避免超過配額
        if i < len(stores):
            print("\n⏳ 等待 2 秒...")
            time.sleep(2)
    
    # 儲存結果
    output_file = '/home/ubuntu/tainan-beef-soup-selector/scripts/places_api_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"✅ 資料抓取完成！")
    print(f"✅ 結果已儲存至: {output_file}")
    print(f"✅ 總共抓取: {len(results)} 間店家")
    print(f"{'='*60}\n")
    
    # 顯示統計
    success_count = sum(1 for r in results if 'error' not in r)
    print(f"📊 統計:")
    print(f"  - 成功: {success_count} 間")
    print(f"  - 失敗: {len(results) - success_count} 間")

if __name__ == "__main__":
    main()

