#!/usr/bin/env python3
"""
自動更新台南牛肉湯店家資料
定期從 Google Maps 搜尋新店家並更新現有資料
"""

import os
import json
import requests
import time
from datetime import datetime
from typing import List, Dict, Set

# 從環境變數取得 API Key
API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY')

if not API_KEY:
    print("❌ 錯誤：未設定 GOOGLE_PLACES_API_KEY 環境變數")
    exit(1)

# API 端點
TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
NEARBY_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

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
}

# 搜尋關鍵字
SEARCH_KEYWORDS = [
    '牛肉湯 台南',
    '溫體牛肉湯 台南',
    '牛肉店 台南',
]

class StoreUpdater:
    def __init__(self):
        self.existing_stores = {}  # place_id -> store_data
        self.new_stores = []
        self.updated_stores = []
        self.closed_stores = []
        
    def load_existing_data(self, filepath: str):
        """載入現有店家資料"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                stores = json.load(f)
                for store in stores:
                    self.existing_stores[store['place_id']] = store
            print(f"✅ 載入 {len(self.existing_stores)} 間現有店家")
        except FileNotFoundError:
            print("⚠️  未找到現有資料，將建立新資料庫")
    
    def search_stores(self) -> Set[str]:
        """搜尋所有店家，返回 place_id 集合"""
        all_place_ids = set()
        
        # 1. 關鍵字搜尋
        print("\n📍 階段 1: 關鍵字搜尋")
        for keyword in SEARCH_KEYWORDS:
            print(f"🔍 搜尋: {keyword}")
            place_ids = self._text_search(keyword)
            all_place_ids.update(place_ids)
            time.sleep(1)
        
        print(f"✅ 關鍵字搜尋完成，找到 {len(all_place_ids)} 間店家")
        
        # 2. 區域搜尋
        print("\n📍 階段 2: 區域搜尋")
        for district, location in TAINAN_DISTRICTS.items():
            print(f"🔍 搜尋 {district}...")
            place_ids = self._nearby_search(location)
            all_place_ids.update(place_ids)
            time.sleep(1)
        
        print(f"✅ 區域搜尋完成，總共 {len(all_place_ids)} 間不重複店家")
        
        return all_place_ids
    
    def _text_search(self, query: str) -> Set[str]:
        """文字搜尋"""
        place_ids = set()
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
                time.sleep(2)
            
            try:
                response = requests.get(TEXT_SEARCH_URL, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data['status'] == 'OK':
                    for place in data.get('results', []):
                        place_ids.add(place['place_id'])
                    
                    next_page_token = data.get('next_page_token')
                    if not next_page_token:
                        break
                else:
                    break
            except Exception as e:
                print(f"  ❌ 搜尋錯誤: {str(e)}")
                break
        
        return place_ids
    
    def _nearby_search(self, location: Dict) -> Set[str]:
        """附近搜尋"""
        place_ids = set()
        
        params = {
            'location': f"{location['lat']},{location['lng']}",
            'radius': 5000,
            'keyword': '牛肉湯',
            'key': API_KEY,
            'language': 'zh-TW'
        }
        
        try:
            response = requests.get(NEARBY_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data['status'] == 'OK':
                for place in data.get('results', []):
                    place_ids.add(place['place_id'])
        except Exception as e:
            print(f"  ❌ 搜尋錯誤: {str(e)}")
        
        return place_ids
    
    def get_place_details(self, place_id: str) -> Dict:
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
        except Exception as e:
            print(f"  ❌ 取得詳細資訊錯誤: {str(e)}")
        
        return None
    
    def parse_district(self, address: str) -> str:
        """從地址解析區域"""
        if not address:
            return None
        
        districts = list(TAINAN_DISTRICTS.keys()) + [
            '新化區', '左鎮區', '玉井區', '楠西區', '南化區', '仁德區', '關廟區',
            '龍崎區', '官田區', '麻豆區', '佳里區', '西港區', '七股區', '將軍區',
            '學甲區', '北門區', '新營區', '後壁區', '白河區', '東山區', '六甲區',
            '下營區', '柳營區', '鹽水區', '善化區', '大內區', '山上區', '新市區', '安定區'
        ]
        
        for district in districts:
            if district in address:
                return district
        
        return None
    
    def update_database(self, place_ids: Set[str]):
        """更新資料庫"""
        print("\n📍 階段 3: 更新資料庫")
        
        total = len(place_ids)
        processed = 0
        
        for place_id in place_ids:
            processed += 1
            
            # 取得詳細資訊
            details = self.get_place_details(place_id)
            if not details:
                continue
            
            # 建立店家資料
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
                'reviews': details.get('reviews', [])[:10],
                'photos': details.get('photos', [])[:10],
                'district': self.parse_district(details.get('formatted_address', '')),
                'updated_at': datetime.now().isoformat()
            }
            
            # 判斷是新店家還是更新
            if place_id in self.existing_stores:
                old_data = self.existing_stores[place_id]
                
                # 檢查是否有變化
                if (old_data.get('rating') != store_data['rating'] or
                    old_data.get('user_ratings_total') != store_data['user_ratings_total'] or
                    old_data.get('business_status') != store_data['business_status']):
                    
                    self.updated_stores.append({
                        'name': store_data['name'],
                        'changes': {
                            'rating': {'old': old_data.get('rating'), 'new': store_data['rating']},
                            'reviews': {'old': old_data.get('user_ratings_total'), 'new': store_data['user_ratings_total']},
                            'status': {'old': old_data.get('business_status'), 'new': store_data['business_status']}
                        }
                    })
                
                # 更新資料
                self.existing_stores[place_id] = store_data
            else:
                # 新店家
                self.new_stores.append(store_data)
                self.existing_stores[place_id] = store_data
                print(f"  🆕 新店家: {store_data['name']}")
            
            # 進度顯示
            if processed % 50 == 0:
                print(f"  進度: {processed}/{total}")
            
            time.sleep(0.5)
    
    def save_results(self, output_file: str):
        """儲存結果"""
        all_stores = list(self.existing_stores.values())
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_stores, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ 資料已儲存至: {output_file}")
    
    def generate_report(self) -> Dict:
        """生成更新報告"""
        return {
            'timestamp': datetime.now().isoformat(),
            'total_stores': len(self.existing_stores),
            'new_stores': len(self.new_stores),
            'updated_stores': len(self.updated_stores),
            'new_store_list': [s['name'] for s in self.new_stores],
            'updated_store_list': self.updated_stores
        }

def main():
    print("="*60)
    print("🔄 台南牛肉湯店家自動更新")
    print("="*60)
    
    updater = StoreUpdater()
    
    # 載入現有資料
    data_file = '/home/ubuntu/tainan-beef-soup-selector/scripts/complete_stores_data.json'
    updater.load_existing_data(data_file)
    
    # 搜尋所有店家
    place_ids = updater.search_stores()
    
    # 更新資料庫
    updater.update_database(place_ids)
    
    # 儲存結果
    updater.save_results(data_file)
    
    # 生成報告
    report = updater.generate_report()
    
    # 儲存報告
    report_file = f'/home/ubuntu/tainan-beef-soup-selector/scripts/update_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 顯示摘要
    print("\n" + "="*60)
    print("✅ 更新完成！")
    print("="*60)
    print(f"總店家數: {report['total_stores']}")
    print(f"新增店家: {report['new_stores']}")
    print(f"更新店家: {report['updated_stores']}")
    print(f"\n報告已儲存至: {report_file}")

if __name__ == "__main__":
    main()

