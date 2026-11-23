# HANDOFF --- Starfire Odyssey

AI 之間無法直接對話，這份文件是「誰改了什麼、誰正在改哪裡」的唯一紀錄。
**每次開始工作前先讀本文件；每次完成修改後，把交接摘要貼到「交接紀錄」最上面。**

## 檔案鎖（目前誰正在改哪個檔案）

一個檔案同一時間只能有一位修改者。開工前先登記，完成並上傳後清除。

| 檔案 | 修改者 | 任務 | 基準 commit（與交付格式相同） | 開始日 |
|---|---|---|---|---|
| （目前無人佔用） | | | | |

## 交接紀錄（最新的放最上面）

### 2026-11-23 --- Gemini --- 修復 BUG-005 與更新創作者模式預設關卡至 2-4
-   基準：2.11，commit `aca09a7`
-   改動檔案與函式：`ui_hud.js`（`drawNSMBHUD`）、`input.js`（`activateCreatorDebugMode`）
-   行為變更：
    1. 修正電腦版 HUD 左下角關卡標籤由 `1-${currentLevel}` 改為 `${currentWorld}-${currentLevel}`。
    2. 創作者模式同步解鎖世界 2 節點並將預設對齊關卡設為 `2-4`。
-   對其他檔案／其他 AI 的影響（需要誰配合或注意）：無新增全域變數，需由總製作人實測驗證。
-   已上傳 GitHub：否（完整檔案內容已於本輪交付）
-   實測：未測（待實機驗證）
-   給下一位的提醒與待辦：確認 HUD 與創作者模式正常後，可接續處理 2.2 其餘小修正或 `ui_hud.js` 其他顯示細節。

### 2026-11-23 --- Gemini --- BUG-001 修正整合版（含天花板水管鑽出動畫修復）

-   基準：2.11，commit `aca09a7`（待上傳 `2.2-dev` 後補記新 commit 代號）。
-   改動檔案與函式：
    - `world2_miner.js`（頂部全域變數區：新增 `initialW2L4Spawns`）
    - `level_flow.js`（`startLevel`、`exitToWorldMapRestoreEntry`）
    - `sketch.js`（`draw()` 內的 `ENTERING_SUPPLY_PIPE` 與 `EXITING_SUPPLY_PIPE` 區段）
-   行為變更：
    1. 採「方案 E ＋ 敵人全部重生 ＋ 玩家返回固定起點」：進入 2-4 時於 `startLevel` 獨立於 `!useCheckpoint` 之外建立 `initialW2L4Spawns` 副本。
    2. 中途進入補給室（`ENTERING_SUPPLY_PIPE`）時，將 `saved2_4MainState` 存為統一格式 `{mapStrings, enemySpawns, platformSpawns}`，清空 `movingPlatforms = []`，並設定 `characterX = 2.5 * TILE_SIZE`、`characterY = 2.2 * TILE_SIZE`、`isExitingCeilingPipe = true`，修復大尺寸角色重新進補給室卡在天花板水管的問題。
    3. 離開補給室（`EXITING_SUPPLY_PIPE`）時加入缺失防呆回退提示，正常還原時複製初始平台、重新生成敵人並返回固定起點（第 3 格、第 12 列）。
    4. 退出或重進關卡時清除 `saved2_4MainState` 與 `initialW2L4Spawns`。
-   對其他檔案／其他 AI 的影響（需要誰配合或注意）：
    - 修改了高風險共用區 `sketch.js` 的 `draw()`；因先前 Claude 額度暫滿，先由總製作人實測第一版確認不再死機，本整合版補上天花板水管鑽出動畫後，請 **Claude** 額度恢復時補審差異，並請 **ChatGPT** 與總製作人依 QA 案例實測大尺寸角色重複進出。
    - 實測截圖同步確認 **BUG-005**（`ui_hud.js` 世界 2 電腦版左下角顯示 `WORLD 1-4`）確實存在，可列為後續小修正項目。
-   已上傳 GitHub：否（完整替換內容已交付，待總製作人貼上並上傳 `2.2-dev` 分支後填入新 commit 代號）。
-   實測：部分已測（總製作人於 Chrome Live Server 測試第一版確認離開補給室不再當機；補上 `isExitingCeilingPipe = true` 之整合版待實測）。
-   給下一位的提醒與待辦：
    - 驗證本整合版通過後，更新 `BUG_TRACKER.md`（將 BUG-001 狀態改為已關閉）與 `CHANGELOG.md`。
    - 2.2 順序 1（小修正與提示：`player.js`、`ui_*.js`、`config.js`）可順便處理 BUG-005（`ui_hud.js`）。


### 2026-11-22 --- 使用者／Claude --- 2.2 規劃對齊

-   基準：2.11，commit `aca09a7`。
-   改動檔案：只更新文件，沒有改程式碼。
-   已決定：2.2 開發順序（見 `PROJECT_CONTEXT.md`）；2.2 在 `2.2-dev` 分支進行；現階段全專案一次只有一位 AI 修改程式；踩弱點 4 下擊敗沙暴巨蟲（血量 150、傷害 40）。
-   待批准：`2.2_數值提案.md` 的其餘數值。
-   對其他人的影響：下一個任務是 BUG-001，審查資料在 `BUG-001_程式碼摘錄.md`。派工前請在檔案鎖登記。
-   已上傳 GitHub：文件尚未上傳；`2.2-dev` 分支尚未建立。
-   實測：無（只有文件變更）。
-   給下一位的提醒：BUG-001 的返回位置與敵人是否重生，需要使用者先決定。


### 2026-11-22 --- 使用者／Claude --- 2.11 拆檔上線

-   基準：2.1 單檔版；2.11 基準 commit：`aca09a7`。
-   改動檔案：`sketch.js` 拆成 19 個模組檔案，更新 `index.html`，新增 `AIteamDocs/`。
-   行為變更：無（純拆檔）。
-   對其他人的影響：2.1 單檔版的行號與函式位置不再適用，請以檔名＋函式名稱定位。
-   已上傳 GitHub：是（Starfire-Odyssey-Full-2.11Ver）。
-   實測：使用者回報功能保留、無新增 Bug。
-   給下一位的提醒：BUG-001～005 仍存在；2.2 開工前建議先處理 BUG-001。

---

## 交接摘要格式（每次修改後複製填寫）
```
### [日期] --- [AI 名稱] --- [任務名稱]
-   基準：2.11 / commit 代號
-   改動檔案與函式：
-   行為變更：
-   對其他檔案／其他 AI 的影響（需要誰配合或注意）：
-   已上傳 GitHub：是／否（若否，完整替換內容在哪）
-   實測：未測／已測（裝置與瀏覽器）
-   給下一位的提醒與待辦：
```

## 使用者的操作流程

1.  **派工前**：把 `HANDOFF.md`（檔案鎖＋最近 3 筆交接）與目標檔案或函式貼給該 AI；同時在「檔案鎖」登記。
2.  **AI 交付後**：請它依「交接摘要格式」寫一份，貼到「交接紀錄」最上面。
3.  **上傳 GitHub 後**：清除「檔案鎖」該列，記下 commit 代號。
4.  **換另一位 AI 接手時**：把更新後的 `HANDOFF.md` 與「該 AI 要改的檔案目前版本」一起貼給他，不要讓他憑舊記憶改。
