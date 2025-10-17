#!/usr/bin/env python3
"""
Google Maps 爬蟲 - 抓取台南牛肉湯店家資訊
使用 Playwright 模擬瀏覽器操作
"""

import asyncio
import json
import re
from playwright.async_api import async_playwright
from datetime import datetime

async def scrape_store_from_google_maps(page, store_name, search_query):
    """從 Google Maps 爬取單一店家資訊"""
    print(f"\n{'='*60}")
    print(f"正在搜尋: {store_name}")
    print(f"{'='*60}")
    
    try:
        # 前往 Google Maps
        search_url = f"https://www.google.com/maps/search/{search_query}"
        print(f"URL: {search_url}")
        
        await page.goto(search_url, wait_until="domcontentloaded", timeout=60000)
        await asyncio.sleep(3)  # 等待頁面載入
        
        # 提取店家資訊
        store_data = {
            "name": store_name,
            "search_query": search_query,
            "scraped_at": datetime.now().isoformat(),
            "rating": None,
            "review_count": None,
            "address": None,
            "phone": None,
            "website": None,
            "hours": {},
            "reviews": [],
            "photos": [],
            "latitude": None,
            "longitude": None,
            "price_range": None,
            "categories": []
        }
        
        # 等待搜尋結果載入
        try:
            await page.wait_for_selector('div[role="article"]', timeout=10000)
        except:
            print("⚠️  未找到搜尋結果")
            return store_data
        
        # 點擊第一個搜尋結果
        try:
            first_result = page.locator('div[role="article"]').first
            await first_result.click()
            await asyncio.sleep(2)
        except:
            print("⚠️  無法點擊搜尋結果")
            return store_data
        
        # 提取店名
        try:
            name_element = page.locator('h1').first
            actual_name = await name_element.text_content()
            store_data["actual_name"] = actual_name.strip() if actual_name else store_name
            print(f"✓ 店名: {store_data['actual_name']}")
        except:
            store_data["actual_name"] = store_name
        
        # 提取評分和評論數
        try:
            rating_element = page.locator('div[role="main"] span[aria-label*="顆星"]').first
            rating_text = await rating_element.get_attribute("aria-label")
            
            # 解析評分 (例如: "4.3 顆星")
            rating_match = re.search(r'([\d.]+)', rating_text)
            if rating_match:
                store_data["rating"] = float(rating_match.group(1))
                print(f"✓ 評分: {store_data['rating']} ★")
            
            # 提取評論數 (通常在評分旁邊)
            review_count_element = page.locator('div[role="main"] button[aria-label*="則評論"]').first
            review_count_text = await review_count_element.get_attribute("aria-label")
            review_match = re.search(r'([\d,]+)', review_count_text)
            if review_match:
                store_data["review_count"] = int(review_match.group(1).replace(',', ''))
                print(f"✓ 評論數: {store_data['review_count']} 則")
        except Exception as e:
            print(f"⚠️  無法提取評分: {str(e)}")
        
        # 提取地址
        try:
            address_button = page.locator('button[data-item-id="address"]').first
            address_text = await address_button.get_attribute("aria-label")
            if address_text:
                # 移除 "地址: " 前綴
                store_data["address"] = address_text.replace("地址: ", "").strip()
                print(f"✓ 地址: {store_data['address']}")
        except:
            print("⚠️  無法提取地址")
        
        # 提取電話
        try:
            phone_button = page.locator('button[data-item-id*="phone"]').first
            phone_text = await phone_button.get_attribute("aria-label")
            if phone_text:
                # 移除 "電話: " 前綴
                store_data["phone"] = phone_text.replace("電話: ", "").strip()
                print(f"✓ 電話: {store_data['phone']}")
        except:
            print("⚠️  無法提取電話")
        
        # 提取營業時間
        try:
            # 點擊營業時間展開
            hours_button = page.locator('button[aria-label*="營業時間"]').first
            await hours_button.click()
            await asyncio.sleep(1)
            
            # 提取每日營業時間
            hours_table = page.locator('table[aria-label="營業時間"]').first
            rows = await hours_table.locator('tr').all()
            
            for row in rows:
                day_cell = row.locator('td').first
                time_cell = row.locator('td').nth(1)
                
                day = await day_cell.text_content()
                time = await time_cell.text_content()
                
                if day and time:
                    store_data["hours"][day.strip()] = time.strip()
            
            print(f"✓ 營業時間: 已提取 {len(store_data['hours'])} 天")
            
            # 關閉營業時間面板
            await hours_button.click()
            await asyncio.sleep(0.5)
        except:
            print("⚠️  無法提取營業時間")
        
        # 提取前 5 則評論
        try:
            # 捲動到評論區
            reviews_section = page.locator('div[role="main"]').first
            await reviews_section.scroll_into_view_if_needed()
            await asyncio.sleep(1)
            
            # 找到評論元素
            review_elements = await page.locator('div[data-review-id]').all()
            
            for i, review_elem in enumerate(review_elements[:5]):
                try:
                    # 提取評論者名稱
                    author_elem = review_elem.locator('button[aria-label]').first
                    author = await author_elem.get_attribute("aria-label")
                    
                    # 提取評分
                    rating_elem = review_elem.locator('span[role="img"][aria-label*="顆星"]').first
                    rating_label = await rating_elem.get_attribute("aria-label")
                    rating_match = re.search(r'([\d.]+)', rating_label)
                    review_rating = float(rating_match.group(1)) if rating_match else None
                    
                    # 提取評論文字
                    text_elem = review_elem.locator('span[lang]').first
                    text = await text_elem.text_content()
                    
                    # 提取時間
                    time_elem = review_elem.locator('span[aria-label*="前"]').first
                    time = await time_elem.get_attribute("aria-label")
                    
                    review_data = {
                        "author": author.strip() if author else "匿名",
                        "rating": review_rating,
                        "text": text.strip() if text else "",
                        "time": time.strip() if time else ""
                    }
                    
                    store_data["reviews"].append(review_data)
                except:
                    continue
            
            print(f"✓ 評論: 已提取 {len(store_data['reviews'])} 則")
        except:
            print("⚠️  無法提取評論")
        
        # 提取經緯度 (從 URL)
        try:
            current_url = page.url
            # Google Maps URL 格式: .../@緯度,經度,縮放z...
            coords_match = re.search(r'@([-\d.]+),([-\d.]+),', current_url)
            if coords_match:
                store_data["latitude"] = float(coords_match.group(1))
                store_data["longitude"] = float(coords_match.group(2))
                print(f"✓ 座標: ({store_data['latitude']}, {store_data['longitude']})")
        except:
            print("⚠️  無法提取座標")
        
        print(f"\n✅ 完成爬取: {store_name}")
        return store_data
        
    except Exception as e:
        print(f"\n❌ 錯誤: {str(e)}")
        return {
            "name": store_name,
            "search_query": search_query,
            "error": str(e),
            "scraped_at": datetime.now().isoformat()
        }

async def main():
    """主程式"""
    # 讀取店家清單
    with open('/home/ubuntu/tainan-beef-soup-selector/scripts/seed_stores.json', 'r', encoding='utf-8') as f:
        stores = json.load(f)
    
    print(f"準備爬取 {len(stores)} 間店家的資料...\n")
    
    # 啟動 Playwright
    async with async_playwright() as p:
        # 使用 Chromium 瀏覽器
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            locale='zh-TW'
        )
        page = await context.new_page()
        
        results = []
        
        # 只爬取前 3 間作為測試
        for store in stores[:3]:
            result = await scrape_store_from_google_maps(
                page, 
                store['name'], 
                store['search_query']
            )
            results.append(result)
            
            # 避免被偵測為機器人，稍微延遲
            await asyncio.sleep(2)
        
        await browser.close()
    
    # 儲存結果
    output_file = '/home/ubuntu/tainan-beef-soup-selector/scripts/scraped_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"✅ 爬蟲完成！")
    print(f"✅ 結果已儲存至: {output_file}")
    print(f"✅ 總共爬取: {len(results)} 間店家")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    asyncio.run(main())

