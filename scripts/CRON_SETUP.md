# 定期爬蟲設定說明

## 🎯 目的
每 2 天自動執行一次 Google Maps 爬蟲，更新台南牛肉湯店家資訊。

## 📋 設定步驟

### 1. 設定 Google Places API Key

在專案根目錄的 `.env` 檔案中添加：

```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
```

### 2. 設定 Cron Job

編輯 crontab：

```bash
crontab -e
```

添加以下內容（每2天凌晨3點執行）：

```bash
0 3 */2 * * /home/ubuntu/tainan-beef-soup-selector/scripts/schedule_crawler.sh
```

### 3. Cron 時間設定說明

```
分 時 日 月 週
│ │ │ │ │
│ │ │ │ └─ 星期幾 (0-7, 0和7都代表星期日)
│ │ │ └─── 月份 (1-12)
│ │ └───── 日期 (1-31)
│ └─────── 小時 (0-23)
└───────── 分鐘 (0-59)
```

**常用範例：**
- `0 3 */2 * *` - 每2天凌晨3點執行
- `0 0 * * *` - 每天午夜執行
- `0 */6 * * *` - 每6小時執行一次
- `0 3 * * 0` - 每週日凌晨3點執行

### 4. 查看 Cron 任務

```bash
crontab -l
```

### 5. 移除 Cron 任務

```bash
crontab -e
# 刪除對應的行，然後儲存
```

## 📝 日誌管理

日誌檔案位置：`./logs/crawler_YYYYMMDD_HHMMSS.log`

查看最新日誌：

```bash
ls -lt logs/ | head -5
tail -f logs/crawler_*.log
```

日誌會自動保留最近 30 天，舊的日誌會自動刪除。

## 🧪 手動測試

在設定 cron 之前，先手動測試：

```bash
cd /home/ubuntu/tainan-beef-soup-selector
./scripts/schedule_crawler.sh
```

## ⚙️ 環境變數

確保以下環境變數已設定：

- `GOOGLE_PLACES_API_KEY` - Google Places API 金鑰
- `DATABASE_URL` - PostgreSQL 資料庫連線字串

## 🔍 爬蟲功能

1. **搜尋新店家** - 從 Google Maps 搜尋台南市所有牛肉湯店家
2. **更新現有店家** - 更新評分、評論數、照片等資訊
3. **移除歇業店家** - 自動檢查並移除永久歇業的店家
4. **標記暫時歇業** - 標記暫時歇業的店家但不刪除

## 📊 執行統計

每次執行後會顯示：
- 新增/更新的店家數量
- 移除的歇業店家數量
- 資料庫總店家數量

## 🚨 注意事項

1. **API 配額** - Google Places API 有每日請求限制，請注意配額使用
2. **執行時間** - 建議在網站流量較低的時段執行（如凌晨）
3. **備份** - 建議在執行前備份資料庫
4. **監控** - 定期檢查日誌，確保爬蟲正常運作

## 🔗 相關連結

- [Google Places API 文件](https://developers.google.com/maps/documentation/places/web-service)
- [Crontab 語法說明](https://crontab.guru/)

