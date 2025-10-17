#!/usr/bin/env python3
"""
從 Google Spreadsheet 提取台南牛肉湯店家清單
"""

import requests
import json
import re

# Google Sheets 公開 CSV 匯出 URL
SHEET_ID = "18AYlrW4MlIlEouQ4IYRh3kOfdOJJNhIYxHMmP9rWZHs"
GID = "0"  # 第一個工作表
CSV_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}"

def fetch_store_list():
    """從 Google Sheets 提取店家清單"""
    print(f"正在從 Google Sheets 讀取資料...")
    print(f"URL: {CSV_URL}\n")
    
    try:
        response = requests.get(CSV_URL)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            print(f"錯誤：無法讀取試算表 (HTTP {response.status_code})")
            return []
        
        # 解析 CSV
        lines = response.text.strip().split('\n')
        stores = []
        
        # 跳過標題行
        for i, line in enumerate(lines[1:], start=2):
            # 簡單的 CSV 解析（處理逗號分隔）
            fields = line.split(',')
            
            if len(fields) < 2:
                continue
                
            store_name = fields[0].strip().strip('"')
            
            # 過濾掉空白或無效的店名
            if not store_name or store_name == '' or len(store_name) < 2:
                continue
            
            # 提取評分（如果有）
            rating = fields[1].strip().strip('"') if len(fields) > 1 else ''
            
            # 提取營業時間（如果有）
            hours = fields[2].strip().strip('"') if len(fields) > 2 else ''
            
            store_data = {
                'name': store_name,
                'rating': rating,
                'hours': hours,
                'row': i
            }
            
            stores.append(store_data)
            print(f"✓ 第 {i} 行: {store_name}")
        
        print(f"\n總共找到 {len(stores)} 間店家")
        return stores
        
    except Exception as e:
        print(f"錯誤：{str(e)}")
        return []

def save_to_json(stores, filename='stores_list.json'):
    """儲存店家清單為 JSON"""
    output_path = f"/home/ubuntu/tainan-beef-soup-selector/scripts/{filename}"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(stores, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 已儲存至: {output_path}")
    return output_path

if __name__ == "__main__":
    stores = fetch_store_list()
    
    if stores:
        save_to_json(stores)
        
        # 顯示前 10 間店家
        print("\n前 10 間店家預覽：")
        for store in stores[:10]:
            print(f"  - {store['name']}")
    else:
        print("未找到任何店家資料")

