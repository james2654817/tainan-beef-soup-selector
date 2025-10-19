# 🍜 台南牛肉湯選擇器

**幫助您在台南找到最適合的牛肉湯店家！**

![台南牛肉湯選擇器](https://img.shields.io/badge/台南-牛肉湯-red)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📖 專案簡介

台南牛肉湯選擇器是一個全端網頁應用程式，整合 Google Maps 資料，提供智慧化的店家搜尋和推薦功能。無論您是台南在地人還是觀光客，都能快速找到心儀的牛肉湯店家。

### ✨ 主要功能

- **🔍 智慧搜尋** - 根據店名、區域、評分快速篩選
- **📍 地圖整合** - 即時顯示店家位置和導航
- **📋 菜單照片** - 瀏覽店家照片（包含菜單、食物、環境等）
- **⭐ 評論摘要** - 查看 Google Maps 評論和評分
- **🕒 營業時間** - 即時顯示營業狀態
- **🎯 位置服務** - 使用您的位置找到最近的店家
- **📱 響應式設計** - 完美支援手機、平板、桌面裝置

---

## 🚀 快速開始

### 前置需求

- Node.js 22+
- pnpm 10+
- MySQL 8+

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone https://github.com/your-username/tainan-beef-soup-selector.git
   cd tainan-beef-soup-selector
   ```

2. **安裝依賴**
   ```bash
   pnpm install
   ```

3. **設定環境變數**
   
   在專案根目錄建立 `.env` 檔案，參考以下範例：
   ```env
   DATABASE_URL=mysql://user:password@localhost:3306/tainan_beef_soup
   NODE_ENV=development
   PORT=3001
   ```

4. **建立資料庫**
   ```bash
   # 登入 MySQL
   mysql -u root -p

   # 建立資料庫
   CREATE DATABASE tainan_beef_soup;
   ```

5. **執行資料庫遷移**
   ```bash
   pnpm db:push
   ```

6. **匯入店家資料**
   ```bash
   cd scripts
   python3 fetch_places.py
   python3 import_to_db.py
   cd ..
   ```

7. **啟動開發伺服器**
   ```bash
   pnpm dev
   ```

8. **開啟瀏覽器**
   
   訪問 [http://localhost:3001](http://localhost:3001)

---

## 📦 專案結構

```
tainan-beef-soup-selector/
├── client/                 # 前端程式碼
│   ├── src/
│   │   ├── components/    # React 組件
│   │   ├── pages/         # 頁面組件
│   │   ├── lib/           # 工具函數
│   │   └── trpc.ts        # tRPC 客戶端
│   └── index.html
├── server/                # 後端程式碼
│   ├── _core/            # Express 伺服器核心
│   ├── routers.ts        # tRPC 路由
│   └── db.ts             # 資料庫查詢函數
├── drizzle/              # 資料庫 schema
│   └── schema.ts
├── scripts/              # 資料抓取腳本
│   ├── fetch_places.py   # 抓取 Google Places 資料
│   └── import_to_db.py   # 匯入資料到資料庫
├── public/               # 靜態資源
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── DEPLOYMENT.md         # 部署指南
└── README.md
```

---

## 🛠️ 技術架構

### 前端
- **框架**: React 19 + TypeScript
- **樣式**: Tailwind CSS
- **UI 組件**: Radix UI
- **狀態管理**: TanStack Query
- **路由**: Wouter
- **建置工具**: Vite

### 後端
- **框架**: Express
- **API**: tRPC
- **資料庫**: MySQL
- **ORM**: Drizzle ORM
- **驗證**: Zod

### 資料來源
- **Google Places API** - 店家資訊、評論、照片
- **Google Maps API** - 地圖顯示、導航

---

## 📝 可用指令

```bash
# 開發模式
pnpm dev

# 建置專案
pnpm build

# 啟動生產環境
pnpm start

# 型別檢查
pnpm check

# 格式化程式碼
pnpm format

# 執行測試
pnpm test

# 資料庫遷移
pnpm db:push
```

---

## 🌐 部署

詳細的部署指南請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 推薦平台
- **Vercel** - 免費全端託管
- **Railway** - 包含資料庫的一站式部署
- **VPS** - 自行託管

---

## 📊 資料更新

店家資料來自 Google Maps，建議定期更新：

```bash
cd scripts
python3 fetch_places.py    # 抓取最新資料
python3 import_to_db.py    # 匯入到資料庫
```

---

## 🤝 貢獻

歡迎提交 Pull Request 或回報問題！

1. Fork 本專案
2. 建立您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

---

## 🙏 致謝

- 感謝所有台南牛肉湯店家
- 資料來源：Google Maps Platform
- UI 組件：Radix UI
- 圖標：Lucide Icons

---

## 📧 聯絡方式

如有任何問題或建議，歡迎聯絡：

- **Email**: your-email@example.com
- **GitHub Issues**: [提交問題](https://github.com/your-username/tainan-beef-soup-selector/issues)

---

**享受您的台南牛肉湯之旅！** 🍜✨

