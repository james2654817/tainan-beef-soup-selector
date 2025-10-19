#!/usr/bin/env python3
"""
批次抓取所有店家的詳細資料
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
DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

def search_place(query):
    """搜尋店家"""
    params = {
        'query': query,
        'key': API_KEY,
        'language': 'zh-TW',
        'region': 'tw'
    }
    
    try:
        response = requests.get(TEXT_SEARCH_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data['status'] == 'OK' and len(data['results']) > 0:
            return data['results'][0]
        else:
            return None
            
    except Exception as e:
        print(f"  ❌ 搜尋錯誤: {str(e)}")
        return None

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
    
    districts = [
        '中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區',
        '新化區', '左鎮區', '玉井區', '楠西區', '南化區', '仁德區', '關廟區',
        '龍崎區', '官田區', '麻豆區', '佳里區', '西港區', '七股區', '將軍區',
        '學甲區', '北門區', '新營區', '後壁區', '白河區', '東山區', '六甲區',
        '下營區', '柳營區', '鹽水區', '善化區', '大內區', '山上區', '新市區', '安定區'
    ]
    
    for district in districts:
        if district in address:
            return district
    
    return None

def main():
    """主程式"""
    print("="*60)
    print("🍜 開始批次抓取所有店家資料")
    print("="*60)
    
    # 讀取店家清單
    with open('/home/ubuntu/tainan-beef-soup-selector/scripts/extracted_stores.json', 'r', encoding='utf-8') as f:
        store_list = json.load(f)
    
    print(f"\n📊 準備抓取 {len(store_list)} 間店家")
    
    all_stores = []
    success_count = 0
    error_count = 0
    
    for i, store_info in enumerate(store_list, 1):
        store_name = store_info['name']
        search_query = store_info['search_query']
        
        print(f"\n進度: {i}/{len(store_list)} - {store_name}")
        
        # 1. 搜尋店家
        place = search_place(search_query)
        if not place:
            print(f"  ⚠️  未找到店家")
            error_count += 1
            continue
        
        place_id = place['place_id']
        
        # 2. 取得詳細資訊
        details = get_place_details(place_id)
        if not details:
            print(f"  ⚠️  無法取得詳細資訊")
            error_count += 1
            continue
        
        # 3. 整理資料
        store_data = {
            'place_id': place_id,
            'name': details.get('name', store_name),
            'original_name': store_name,
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
            'reviews': details.get('reviews', [])[:10],
            'photos': details.get('photos', [])[:10],
            'district': parse_district(details.get('formatted_address', '')),
            'scraped_at': datetime.now().isoformat()
        }
        
        all_stores.append(store_data)
        
        print(f"  ✅ {store_data['name']}")
        print(f"     評分: {store_data['rating']} ★ ({store_data['user_ratings_total']} 則)")
        print(f"     地址: {store_data['address']}")
        print(f"     區域: {store_data['district']}")
        
        success_count += 1
        
        # API 限制，稍微延遲
        if i < len(store_list):
            time.sleep(0.5)
        
        # 每 50 間儲存一次（避免資料遺失）
        if i % 50 == 0:
            temp_file = f'/home/ubuntu/tainan-beef-soup-selector/scripts/temp_stores_{i}.json'
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(all_stores, f, ensure_ascii=False, indent=2)
            print(f"\n💾 已儲存臨時檔案: {temp_file}")
    
    # 儲存最終結果
    output_file = '/home/ubuntu/tainan-beef-soup-selector/scripts/complete_stores_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_stores, f, ensure_ascii=False, indent=2)
    
    print("\n" + "="*60)
    print("✅ 抓取完成！")
    print("="*60)
    print(f"成功: {success_count} 間")
    print(f"失敗: {error_count} 間")
    print(f"總計: {len(store_list)} 間")
    print(f"結果已儲存至: {output_file}")
    
    # 統計
    print("\n📊 區域分布:")
    district_count = {}
    for store in all_stores:
        district = store['district'] or '未知'
        district_count[district] = district_count.get(district, 0) + 1
    
    for district, count in sorted(district_count.items(), key=lambda x: x[1], reverse=True):
        print(f"  {district}: {count} 間")

if __name__ == "__main__":
    main()

