#!/usr/bin/env python3
"""
全面搜尋台南牛肉湯店家
使用 Google Places API 搜尋台南所有牛肉湯相關店家
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
TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
NEARBY_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

# 台南市中心座標
TAINAN_CENTER = {'lat': 22.9997281, 'lng': 120.2270277}

# 台南各區中心座標
TAINAN_DISTRICTS = {
    '中西區': {'lat': 22.9908, 'lng': 120.2026},
    '東區': {'lat': 22.9856, 'lng': 120.2244},
    '南區': {'lat': 22.9583, 'lng': 120.1875},
    '北區': {'lat': 23.0108, 'lng': 120.2053},
    '安平區': {'lat': 23.0011, 'lng': 120.1650},
    '安南區': {'lat': 23.0489, 'lng': 120.1864},
    '永康區': {'lat': 23.0264, 'lng': 120.2571},
    '歸仁區': {'lat': 22.9661, 'lng': 120.2933},
    '新化區': {'lat': 23.0386, 'lng': 120.3108},
    '左鎮區': {'lat': 23.0567, 'lng': 120.4067},
    '玉井區': {'lat': 23.1242, 'lng': 120.4608},
    '楠西區': {'lat': 23.1742, 'lng': 120.4856},
    '南化區': {'lat': 23.0417, 'lng': 120.4778},
    '仁德區': {'lat': 22.9711, 'lng': 120.2500},
    '關廟區': {'lat': 22.9608, 'lng': 120.3253},
    '龍崎區': {'lat': 22.9667, 'lng': 120.3667},
    '官田區': {'lat': 23.1933, 'lng': 120.3169},
    '麻豆區': {'lat': 23.1814, 'lng': 120.2475},
    '佳里區': {'lat': 23.1653, 'lng': 120.1775},
    '西港區': {'lat': 23.1253, 'lng': 120.2042},
    '七股區': {'lat': 23.1411, 'lng': 120.1419},
    '將軍區': {'lat': 23.2050, 'lng': 120.1489},
    '學甲區': {'lat': 23.2344, 'lng': 120.1806},
    '北門區': {'lat': 23.2686, 'lng': 120.1253},
    '新營區': {'lat': 23.3106, 'lng': 120.3167},
    '後壁區': {'lat': 23.3667, 'lng': 120.3667},
    '白河區': {'lat': 23.3525, 'lng': 120.4308},
    '東山區': {'lat': 23.3264, 'lng': 120.4028},
    '六甲區': {'lat': 23.2333, 'lng': 120.3500},
    '下營區': {'lat': 23.2356, 'lng': 120.2639},
    '柳營區': {'lat': 23.2778, 'lng': 120.3139},
    '鹽水區': {'lat': 23.3200, 'lng': 120.2667},
    '善化區': {'lat': 23.1325, 'lng': 120.2969},
    '大內區': {'lat': 23.1167, 'lng': 120.3667},
    '山上區': {'lat': 23.1044, 'lng': 120.3672},
    '新市區': {'lat': 23.0786, 'lng': 120.2950},
    '安定區': {'lat': 23.1217, 'lng': 120.2364}
}

# 搜尋關鍵字
SEARCH_KEYWORDS = [
    '牛肉湯 台南',
    '溫體牛肉湯 台南',
    '牛肉麵 台南',
    '牛肉店 台南',
    'beef soup tainan',
]

def text_search(query):
    """使用 Text Search API 搜尋"""
    print(f"🔍 搜尋: {query}")
    
    all_results = []
    next_page_token = None
    
    while True:
        params = {
            'query': query,
            'key': API_KEY,
            'language': 'zh-TW',
            'region': 'tw'
        }
        
        if next_page_token:
            params['pagetoken'] = next_page_token
            time.sleep(2)  # 等待 pagetoken 生效
        
        try:
            response = requests.get(TEXT_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data['status'] == 'OK':
                results = data.get('results', [])
                all_results.extend(results)
                print(f"  找到 {len(results)} 間店家")
                
                next_page_token = data.get('next_page_token')
                if not next_page_token:
                    break
            else:
                print(f"  ⚠️  搜尋狀態: {data['status']}")
                break
                
        except Exception as e:
            print(f"  ❌ 搜尋錯誤: {str(e)}")
            break
    
    return all_results

def nearby_search(location, radius=5000, keyword='牛肉湯'):
    """使用 Nearby Search API 搜尋"""
    print(f"🔍 附近搜尋: {keyword} (半徑 {radius}m)")
    
    all_results = []
    next_page_token = None
    
    while True:
        params = {
            'location': f"{location['lat']},{location['lng']}",
            'radius': radius,
            'keyword': keyword,
            'key': API_KEY,
            'language': 'zh-TW'
        }
        
        if next_page_token:
            params['pagetoken'] = next_page_token
            time.sleep(2)
        
        try:
            response = requests.get(NEARBY_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data['status'] == 'OK':
                results = data.get('results', [])
                all_results.extend(results)
                print(f"  找到 {len(results)} 間店家")
                
                next_page_token = data.get('next_page_token')
                if not next_page_token:
                    break
            else:
                print(f"  ⚠️  搜尋狀態: {data['status']}")
                break
                
        except Exception as e:
            print(f"  ❌ 搜尋錯誤: {str(e)}")
            break
    
    return all_results

def get_place_details(place_id):
    """取得店家詳細資訊"""
    params = {
        'place_id': place_id,
        'key': API_KEY,
        'language': 'zh-TW',
        'fields': 'name,rating,user_ratings_total,formatted_address,formatted_phone_number,opening_hours,reviews,photos,geometry,price_level,types,website,url,business_status'
    }
    
    try:
        response = requests.get(DETAILS_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data['status'] == 'OK':
            return data['result']
        else:
            return None
            
    except Exception as e:
        print(f"  ❌ 取得詳細資訊錯誤: {str(e)}")
        return None

def parse_district(address):
    """從地址解析區域"""
    if not address:
        return None
    
    for district in TAINAN_DISTRICTS.keys():
        if district in address:
            return district
    
    return None

def main():
    """主程式"""
    print("="*60)
    print("🍜 開始搜尋台南所有牛肉湯店家")
    print("="*60)
    
    all_places = {}  # 使用 dict 去重，key 為 place_id
    
    # 1. 使用關鍵字搜尋
    print("\n📍 階段 1: 關鍵字搜尋")
    print("-"*60)
    for keyword in SEARCH_KEYWORDS:
        results = text_search(keyword)
        for place in results:
            place_id = place['place_id']
            if place_id not in all_places:
                all_places[place_id] = place
        time.sleep(1)
    
    print(f"\n✅ 關鍵字搜尋完成，共找到 {len(all_places)} 間不重複店家")
    
    # 2. 使用各區中心點搜尋
    print("\n📍 階段 2: 各區域搜尋")
    print("-"*60)
    
    # 優先搜尋主要區域
    priority_districts = ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區']
    
    for district in priority_districts:
        location = TAINAN_DISTRICTS[district]
        print(f"\n搜尋 {district}...")
        
        results = nearby_search(location, radius=5000, keyword='牛肉湯')
        for place in results:
            place_id = place['place_id']
            if place_id not in all_places:
                all_places[place_id] = place
        
        time.sleep(1)
    
    print(f"\n✅ 區域搜尋完成，共找到 {len(all_places)} 間不重複店家")
    
    # 3. 取得每間店家的詳細資訊
    print("\n📍 階段 3: 取得詳細資訊")
    print("-"*60)
    
    detailed_stores = []
    total = len(all_places)
    
    for i, (place_id, place) in enumerate(all_places.items(), 1):
        print(f"\n進度: {i}/{total} - {place.get('name', '未知')}")
        
        details = get_place_details(place_id)
        if not details:
            print("  ⚠️  無法取得詳細資訊，使用基本資訊")
            details = place
        
        # 整理資料
        store_data = {
            'place_id': place_id,
            'name': details.get('name', ''),
            'rating': details.get('rating'),
            'user_ratings_total': details.get('user_ratings_total', 0),
            'address': details.get('formatted_address', ''),
            'phone': details.get('formatted_phone_number', ''),
            'website': details.get('website', ''),
            'url': details.get('url', ''),
            'business_status': details.get('business_status', 'OPERATIONAL'),
            'price_level': details.get('price_level'),
            'types': details.get('types', []),
            'latitude': details.get('geometry', {}).get('location', {}).get('lat'),
            'longitude': details.get('geometry', {}).get('location', {}).get('lng'),
            'opening_hours': details.get('opening_hours', {}),
            'reviews': details.get('reviews', [])[:10],  # 前 10 則評論
            'photos': details.get('photos', [])[:10],  # 前 10 張照片
            'district': parse_district(details.get('formatted_address', '')),
            'scraped_at': datetime.now().isoformat()
        }
        
        detailed_stores.append(store_data)
        
        print(f"  ✅ {store_data['name']}")
        print(f"     評分: {store_data['rating']} ★ ({store_data['user_ratings_total']} 則)")
        print(f"     地址: {store_data['address']}")
        print(f"     區域: {store_data['district']}")
        
        # API 限制，稍微延遲
        if i < total:
            time.sleep(0.5)
    
    # 4. 儲存結果
    output_file = '/home/ubuntu/tainan-beef-soup-selector/scripts/all_stores_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(detailed_stores, f, ensure_ascii=False, indent=2)
    
    print("\n" + "="*60)
    print("✅ 搜尋完成！")
    print("="*60)
    print(f"總共找到: {len(detailed_stores)} 間店家")
    print(f"結果已儲存至: {output_file}")
    
    # 統計
    print("\n📊 區域分布:")
    district_count = {}
    for store in detailed_stores:
        district = store['district'] or '未知'
        district_count[district] = district_count.get(district, 0) + 1
    
    for district, count in sorted(district_count.items(), key=lambda x: x[1], reverse=True):
        print(f"  {district}: {count} 間")
    
    print("\n📊 評分分布:")
    rating_ranges = {'5.0': 0, '4.0-4.9': 0, '3.0-3.9': 0, '<3.0': 0, '無評分': 0}
    for store in detailed_stores:
        rating = store['rating']
        if rating is None:
            rating_ranges['無評分'] += 1
        elif rating >= 5.0:
            rating_ranges['5.0'] += 1
        elif rating >= 4.0:
            rating_ranges['4.0-4.9'] += 1
        elif rating >= 3.0:
            rating_ranges['3.0-3.9'] += 1
        else:
            rating_ranges['<3.0'] += 1
    
    for range_name, count in rating_ranges.items():
        print(f"  {range_name}: {count} 間")

if __name__ == "__main__":
    main()

