#!/bin/bash

# 台南牛肉湯爬蟲 - 定期執行腳本
# 用途：每2天執行一次爬蟲，更新店家資訊

# 設定工作目錄
cd /home/ubuntu/tainan-beef-soup-selector

# 設定日誌檔案
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/crawler_$(date +%Y%m%d_%H%M%S).log"

# 建立日誌目錄
mkdir -p "$LOG_DIR"

# 記錄開始時間
echo "========================================" | tee -a "$LOG_FILE"
echo "開始執行爬蟲: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# 執行爬蟲
pnpm tsx scripts/crawl_google_maps.ts 2>&1 | tee -a "$LOG_FILE"

# 記錄結束時間
echo "========================================" | tee -a "$LOG_FILE"
echo "執行完成: $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# 保留最近 30 天的日誌
find "$LOG_DIR" -name "crawler_*.log" -mtime +30 -delete

# 發送通知（可選）
# curl -X POST "https://your-webhook-url" -d "爬蟲執行完成"

