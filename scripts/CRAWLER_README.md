# 🕷️ Google Maps 爬蟲工具

自動從 Google Maps 爬取台南市牛肉湯店家資訊，並更新到資料庫。

## 🎯 功能特色

### ✅ 自動爬取
- 搜尋台南市所有牛肉湯店家
- 支援多種搜尋關鍵字（牛肉湯、溫體牛肉湯、牛肉清湯等）
- 自動去重，避免重複店家

### 📊 完整資訊
- 店家名稱、地址、區域
- GPS 座標（經緯度）
- 評分、評論數量
- 營業時間
- Google Maps 連結
- 封面照片
- 營業狀態（營業中/暫時歇業/永久歇業）

### 🔄 智慧更新
- **新店家**：自動加入資料庫
- **現有店家**：更新評分、評論、照片等資訊
- **歇業店家**：自動檢測並移除永久歇業的店家
- **暫時歇業**：標記但不刪除

### 📝 評論與照片
- 自動抓取最新評論
- 下載店家照片
- 避免重複資料

## 🚀 快速開始

### 1. 取得 Google Places API Key

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Places API**
4. 建立 API 金鑰
5. 設定 API 金鑰限制（建議限制為 Places API）

### 2. 設定環境變數

在專案根目錄的 `.env` 檔案中添加：

```bash
GOOGLE_PLACES_API_KEY=AIzaSy...your_api_key_here
```

### 3. 執行爬蟲

```bash
# 進入專案目錄
cd /home/ubuntu/tainan-beef-soup-selector

# 執行爬蟲
pnpm tsx scripts/crawl_google_maps.ts
```

## 📋 執行流程

```
步驟 1: 搜尋店家
  ├─ 搜尋: 台南市 牛肉湯
  ├─ 搜尋: 台南 溫體牛肉湯
  ├─ 搜尋: 台南 牛肉清湯
  └─ 搜尋: Tainan beef soup

步驟 2: 取得詳細資訊並更新資料庫
  ├─ 取得店家詳細資訊
  ├─ 新增/更新店家資料
  ├─ 新增評論
  └─ 新增照片

步驟 3: 檢查並移除歇業店家
  ├─ 檢查所有現有店家
  ├─ 移除永久歇業店家
  └─ 標記暫時歇業店家

完成！
  ├─ 新增/更新: X 間店家
  ├─ 移除歇業: Y 間店家
  └─ 資料庫總計: Z 間店家
```

## 🔧 進階設定

### 自訂搜尋關鍵字

編輯 `crawl_google_maps.ts` 中的 `SEARCH_QUERIES`：

```typescript
const SEARCH_QUERIES = [
  '台南市 牛肉湯',
  '台南 溫體牛肉湯',
  '台南 牛肉清湯',
  '台南 牛肉火鍋',  // 新增
  'Tainan beef soup'
];
```

### 調整 API 請求間隔

避免超過 API 限制，可調整等待時間：

```typescript
// 搜尋後等待 1 秒
await new Promise(resolve => setTimeout(resolve, 1000));

// 取得詳細資訊後等待 0.5 秒
await new Promise(resolve => setTimeout(resolve, 500));
```

## 📊 資料結構

### Stores 表
```typescript
{
  id: string;              // Google Place ID
  name: string;            // 店家名稱
  address: string;         // 完整地址
  district: string;        // 區域（如：中西區）
  lat: string;             // 緯度
  lng: string;             // 經度
  rating: number;          // 評分 (0-5)
  reviewCount: number;     // 評論數量
  openingHours: object[];  // 營業時間
  googleMapsUrl: string;   // Google Maps 連結
  photoUrl: string;        // 封面照片
  businessStatus: string;  // 營業狀態
}
```

### Reviews 表
```typescript
{
  storeId: string;         // 店家 ID
  authorName: string;      // 評論者名稱
  rating: number;          // 評分
  text: string;            // 評論內容
  time: string;            // 評論時間
}
```

### Photos 表
```typescript
{
  storeId: string;         // 店家 ID
  url: string;             // 照片 URL
  photoUrl: string;        // 照片 URL (備份)
}
```

## ⏰ 定期執行

### 使用 Cron Job

```bash
# 編輯 crontab
crontab -e

# 每2天凌晨3點執行
0 3 */2 * * /home/ubuntu/tainan-beef-soup-selector/scripts/schedule_crawler.sh
```

詳細設定請參考 [CRON_SETUP.md](./CRON_SETUP.md)

## 💰 API 費用

Google Places API 收費標準（2024）：

- **Text Search**: $32 / 1000 次請求
- **Place Details**: $17 / 1000 次請求
- **Place Photos**: $7 / 1000 次請求

**預估費用**（每次執行）：
- 搜尋 4 次 = $0.128
- 詳細資訊 250 次 = $4.25
- 照片 2500 張 = $17.50
- **總計約 $22 / 次**

💡 **省錢技巧**：
1. 減少搜尋關鍵字數量
2. 限制照片數量
3. 使用 Google Cloud 免費額度（每月 $200）

## 🚨 注意事項

### API 限制
- 每日請求配額有限
- 建議在低峰時段執行
- 注意 API 費用

### 資料品質
- 定期檢查爬取結果
- 驗證店家資訊準確性
- 處理異常資料

### 資料庫備份
- 執行前建議備份資料庫
- 保留舊資料以便回溯

## 🐛 除錯

### 檢查 API Key

```bash
echo $GOOGLE_PLACES_API_KEY
```

### 查看詳細日誌

```bash
# 執行並顯示詳細輸出
pnpm tsx scripts/crawl_google_maps.ts 2>&1 | tee crawler.log
```

### 測試單一店家

修改腳本，只處理一間店家進行測試。

## 📚 相關資源

- [Google Places API 文件](https://developers.google.com/maps/documentation/places/web-service)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API 定價](https://developers.google.com/maps/billing-and-pricing/pricing)

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request 改進爬蟲功能！

## 📄 授權

MIT License

