/**
 * 手動觸發店家資料更新的 API
 * 管理員可以透過此 API 隨時更新店家資料
 */

import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);
const router = Router();

// 簡單的認證（實際部署時應使用更安全的方式）
const ADMIN_TOKEN = process.env.ADMIN_UPDATE_TOKEN || 'your-secret-token';

/**
 * POST /api/admin/update-stores
 * 觸發店家資料更新
 */
router.post('/api/admin/update-stores', async (req, res) => {
  try {
    // 驗證管理員權限
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: '未授權' });
    }

    // 執行更新腳本
    console.log('🔄 開始更新店家資料...');
    
    const scriptPath = path.join(__dirname, '../scripts/auto_update_stores.py');
    const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);
    
    if (stderr) {
      console.error('更新過程中的警告:', stderr);
    }
    
    console.log('✅ 更新完成');
    console.log(stdout);

    // 讀取最新的更新報告
    const scriptsDir = path.join(__dirname, '../scripts');
    const files = await fs.readdir(scriptsDir);
    const reportFiles = files
      .filter(f => f.startsWith('update_report_'))
      .sort()
      .reverse();
    
    let report = null;
    if (reportFiles.length > 0) {
      const reportPath = path.join(scriptsDir, reportFiles[0]);
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      report = JSON.parse(reportContent);
    }

    res.json({
      success: true,
      message: '店家資料更新成功',
      report: report,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 更新失敗:', error);
    res.status(500).json({
      success: false,
      error: '更新失敗',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/admin/update-status
 * 查詢最近的更新狀態
 */
router.get('/api/admin/update-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: '未授權' });
    }

    const scriptsDir = path.join(__dirname, '../scripts');
    const files = await fs.readdir(scriptsDir);
    const reportFiles = files
      .filter(f => f.startsWith('update_report_'))
      .sort()
      .reverse()
      .slice(0, 5);  // 最近 5 次更新
    
    const reports = [];
    for (const file of reportFiles) {
      const reportPath = path.join(scriptsDir, file);
      const content = await fs.readFile(reportPath, 'utf-8');
      reports.push(JSON.parse(content));
    }

    res.json({
      success: true,
      recent_updates: reports
    });

  } catch (error) {
    console.error('❌ 查詢失敗:', error);
    res.status(500).json({
      success: false,
      error: '查詢失敗',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

