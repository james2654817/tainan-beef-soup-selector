# 台南牛肉湯選擇器 - 部署指南

## 專案概述

這是一個全端網頁應用程式，幫助用戶在台南找到最適合的牛肉湯店家。

### 主要功能
- 🔍 **智慧搜尋** - 根據店名、區域、評分篩選店家
- 📍 **地圖整合** - 顯示店家位置（Google Maps）
- 📋 **菜單照片** - 查看店家照片（包含菜單、食物、環境等）
- ⭐ **評論摘要** - 顯示 Google Maps 評論
- 🕒 **營業時間** - 即時顯示營業狀態

### 技術架構
- **前端**: React 19 + TypeScript + Tailwind CSS
- **後端**: Express + tRPC
- **資料庫**: MySQL (使用 Drizzle ORM)
- **建置工具**: Vite + esbuild

---

## 部署選項

### 選項 1: Vercel (推薦)

Vercel 提供免費的全端應用程式託管，適合這個專案。

#### 步驟：

1. **準備 Git 儲存庫**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **在 Vercel 建立專案**
   - 訪問 [vercel.com](https://vercel.com)
   - 點擊 "Import Project"
   - 選擇您的 Git 儲存庫

3. **配置環境變數**
   在 Vercel 專案設定中，新增以下環境變數：
   ```
   DATABASE_URL=mysql://user:password@host:port/database
   NODE_ENV=production
   ```

4. **配置建置設定**
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

5. **部署**
   - 點擊 "Deploy"
   - Vercel 會自動建置並部署您的應用程式

---

### 選項 2: Railway

Railway 提供簡單的全端應用程式部署，包含資料庫。

#### 步驟：

1. **在 Railway 建立專案**
   - 訪問 [railway.app](https://railway.app)
   - 點擊 "New Project"
   - 選擇 "Deploy from GitHub repo"

2. **新增 MySQL 資料庫**
   - 在專案中點擊 "New"
   - 選擇 "Database" → "MySQL"
   - Railway 會自動提供 `DATABASE_URL`

3. **配置環境變數**
   ```
   DATABASE_URL=${{MySQL.DATABASE_URL}}
   NODE_ENV=production
   ```

4. **配置啟動指令**
   - Start Command: `pnpm start`
   - Build Command: `pnpm build`

5. **部署**
   - Railway 會自動建置並部署

---

### 選項 3: 自行託管 (VPS)

適合有自己伺服器的用戶。

#### 步驟：

1. **安裝依賴**
   ```bash
   # 安裝 Node.js 22+
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # 安裝 pnpm
   npm install -g pnpm

   # 安裝 MySQL
   sudo apt-get install mysql-server
   ```

2. **設定資料庫**
   ```bash
   sudo mysql
   CREATE DATABASE tainan_beef_soup;
   CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON tainan_beef_soup.* TO 'app_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **部署應用程式**
   ```bash
   # 克隆專案
   git clone <your-repo-url>
   cd tainan-beef-soup-selector

   # 安裝依賴
   pnpm install

   # 設定環境變數
   cp .env.example .env
   # 編輯 .env 檔案，填入資料庫連線資訊

   # 建置專案
   pnpm build

   # 啟動應用程式
   pnpm start
   ```

4. **使用 PM2 管理程序**
   ```bash
   # 安裝 PM2
   npm install -g pm2

   # 啟動應用程式
   pm2 start dist/index.js --name tainan-beef-soup

   # 設定開機自動啟動
   pm2 startup
   pm2 save
   ```

5. **設定 Nginx 反向代理**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 環境變數說明

### 必要環境變數

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| `DATABASE_URL` | MySQL 資料庫連線字串 | `mysql://user:pass@host:3306/db` |
| `NODE_ENV` | 執行環境 | `production` |

### 選用環境變數

| 變數名稱 | 說明 | 預設值 |
|---------|------|--------|
| `PORT` | 應用程式監聽埠號 | `3001` |

---

## 資料庫遷移

在首次部署或更新資料庫結構時，需要執行資料庫遷移：

```bash
pnpm db:push
```

---

## 常見問題

### Q: 如何更新資料庫中的店家資料？

A: 執行以下腳本：
```bash
cd scripts
python3 fetch_places.py
python3 import_to_db.py
```

### Q: Google Maps API 顯示錯誤？

A: 請確認：
1. API Key 是否有效
2. 是否啟用了 Maps JavaScript API 和 Maps Embed API
3. 是否設定了正確的 API 使用限制

### Q: 如何備份資料庫？

A: 使用 mysqldump：
```bash
mysqldump -u user -p database_name > backup.sql
```

---

## 技術支援

如有問題，請查看：
- [專案 README](./README.md)
- [問題追蹤](https://github.com/your-repo/issues)

---

## 授權

MIT License

