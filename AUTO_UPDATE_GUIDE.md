# 🔄 台南牛肉湯選擇器 - 自動更新系統

本系統能夠定期從 Google Maps 自動搜尋並更新台南牛肉湯店家資料，確保網站資訊始終保持最新。

---

## 📋 系統功能

### 1. 自動搜尋新店家
- 使用 Google Places API 搜尋台南地區所有牛肉湯店家
- 涵蓋台南市 8 個主要行政區（中西區、東區、南區、北區、安平區、安南區、永康區、歸仁區）
- 使用多個關鍵字搜尋（牛肉湯、溫體牛肉湯、牛肉店等）
- 自動去除重複店家（使用 Google Place ID）

### 2. 智慧資料更新
- **新店家**：自動加入資料庫
- **現有店家**：更新評分、評論數、營業狀態等資訊
- **已歇業店家**：標記為「已歇業」狀態

### 3. 定期自動執行
- 使用 GitHub Actions 每天自動執行
- 預設執行時間：每天凌晨 2:00（台灣時間）
- 可自訂執行頻率（每天/每週/每月）

### 4. 手動觸發更新
- 管理員可透過 API 隨時手動觸發更新
- 適用於緊急更新或測試場景

---

## 🚀 部署設定

### 步驟 1：設定 GitHub Secrets

在 GitHub 專案設定中新增以下 Secrets：

1. 前往 GitHub 專案頁面
2. 點擊 **Settings** → **Secrets and variables** → **Actions**
3. 新增以下 Secret：
   - **Name**: `GOOGLE_PLACES_API_KEY`
   - **Value**: 您的 Google Places API Key

### 步驟 2：啟用 GitHub Actions

1. 確認 `.github/workflows/auto-update-stores.yml` 檔案已存在
2. GitHub Actions 會自動啟用
3. 檢查 **Actions** 頁籤確認工作流程已啟用

### 步驟 3：設定執行頻率（可選）

編輯 `.github/workflows/auto-update-stores.yml`：

```yaml
on:
  schedule:
    # 每天執行
    - cron: '0 18 * * *'  # UTC 18:00 = 台灣時間 02:00
    
    # 或每週執行
    # - cron: '0 18 * * 0'  # 每週日凌晨 2:00
    
    # 或每月執行
    # - cron: '0 18 1 * *'  # 每月 1 號凌晨 2:00
```

---

## 🎯 使用方式

### 方式 1：自動執行（推薦）

系統會按照設定的時間自動執行，無需手動操作。

**查看執行結果：**
1. 前往 GitHub 專案的 **Actions** 頁籤
2. 點擊最新的 "Auto Update Beef Soup Stores" 工作流程
3. 查看執行日誌和更新摘要

### 方式 2：手動觸發（GitHub）

1. 前往 GitHub 專案的 **Actions** 頁籤
2. 點擊 "Auto Update Beef Soup Stores" 工作流程
3. 點擊右上角的 **Run workflow** 按鈕
4. 選擇分支並點擊 **Run workflow**

### 方式 3：手動觸發（API）

**設定管理員 Token：**

在環境變數中設定：
```bash
export ADMIN_UPDATE_TOKEN="your-secret-token"
```

**觸發更新：**

```bash
curl -X POST https://your-domain.com/api/admin/update-stores \
  -H "Authorization: Bearer your-secret-token"
```

**查詢更新狀態：**

```bash
curl https://your-domain.com/api/admin/update-status \
  -H "Authorization: Bearer your-secret-token"
```

---

## 📊 更新報告

每次更新後，系統會生成詳細的更新報告，包含：

- **更新時間**
- **總店家數**
- **新增店家數量和清單**
- **更新店家數量和變更詳情**
- **區域分布統計**

報告儲存位置：`scripts/update_report_YYYYMMDD_HHMMSS.json`

**報告範例：**

```json
{
  "timestamp": "2025-10-17T02:00:00.000Z",
  "total_stores": 320,
  "new_stores": 5,
  "updated_stores": 12,
  "new_store_list": [
    "阿新牛肉湯",
    "品鮮牛肉湯",
    "......"
  ],
  "updated_store_list": [
    {
      "name": "阿明牛肉湯",
      "changes": {
        "rating": {"old": 4.4, "new": 4.5},
        "reviews": {"old": 2167, "new": 2189}
      }
    }
  ]
}
```

---

## 🔧 進階設定

### 調整搜尋範圍

編輯 `scripts/auto_update_stores.py`：

```python
# 新增更多行政區
TAINAN_DISTRICTS = {
    '中西區': {'lat': 22.9908, 'lng': 120.2026},
    '東區': {'lat': 22.9856, 'lng': 120.2244},
    # ... 新增其他區域
}

# 新增更多搜尋關鍵字
SEARCH_KEYWORDS = [
    '牛肉湯 台南',
    '溫體牛肉湯 台南',
    # ... 新增其他關鍵字
]
```

### 調整搜尋半徑

```python
# 在 _nearby_search 函數中
params = {
    'radius': 5000,  # 調整為其他值（單位：公尺）
    # ...
}
```

### 調整 API 延遲時間

```python
# 避免超過 API 配額限制
time.sleep(0.5)  # 調整延遲時間（單位：秒）
```

---

## ⚠️ 注意事項

### 1. Google Places API 配額

- **免費配額**：每月 $200 美元額度
- **Places API 費用**：
  - Text Search: $32 / 1000 次請求
  - Place Details: $17 / 1000 次請求
- **預估成本**（每天更新 300 間店家）：
  - Text Search: ~10 次 × $0.032 = $0.32
  - Place Details: 300 次 × $0.017 = $5.1
  - **每天約 $5.4，每月約 $162**

**建議：**
- 調整為每週更新一次（每月約 $40）
- 或使用增量更新（只更新變化的店家）

### 2. GitHub Actions 限制

- 免費帳號：每月 2000 分鐘執行時間
- 每次更新約需 10-15 分鐘
- 每天執行：約 450 分鐘/月（在免費額度內）

### 3. 資料品質

- 系統會自動過濾非台南地區的店家
- 建議定期檢查更新報告，確認資料品質
- 如發現錯誤資料，可手動從資料庫中移除

---

## 🛠️ 故障排除

### 問題 1：GitHub Actions 執行失敗

**可能原因：**
- Google Places API Key 未設定或無效
- API 配額已用完
- 網路連線問題

**解決方法：**
1. 檢查 GitHub Secrets 中的 API Key
2. 前往 Google Cloud Console 檢查 API 配額
3. 查看 Actions 執行日誌找出具體錯誤

### 問題 2：更新後店家數量異常

**可能原因：**
- Google Places API 回傳結果不穩定
- 搜尋關鍵字或範圍設定不當

**解決方法：**
1. 檢查更新報告中的詳細資訊
2. 手動執行腳本並查看日誌
3. 調整搜尋參數後重新執行

### 問題 3：手動 API 無法觸發

**可能原因：**
- 管理員 Token 未設定或錯誤
- API 路由未正確註冊

**解決方法：**
1. 確認環境變數 `ADMIN_UPDATE_TOKEN` 已設定
2. 檢查 `server/index.ts` 是否已引入 API 路由
3. 查看伺服器日誌確認錯誤訊息

---

## 📚 相關檔案

- **自動更新腳本**：`scripts/auto_update_stores.py`
- **GitHub Actions 配置**：`.github/workflows/auto-update-stores.yml`
- **手動觸發 API**：`server/update-stores-api.ts`
- **更新報告**：`scripts/update_report_*.json`
- **店家資料**：`scripts/complete_stores_data.json`

---

## 🎉 總結

透過這套自動更新系統，台南牛肉湯選擇器能夠：

✅ **自動發現新店家** - 無需手動新增  
✅ **即時更新資訊** - 評分、評論數始終最新  
✅ **標記歇業店家** - 避免使用者白跑一趟  
✅ **定期執行** - 完全自動化，無需人工介入  
✅ **彈性調整** - 可自訂執行頻率和搜尋範圍  

讓您的牛肉湯選擇器始終保持最新、最準確的店家資訊！🍜

