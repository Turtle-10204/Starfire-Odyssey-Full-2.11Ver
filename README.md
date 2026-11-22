# Starfire Odyssey

使用 **p5.js** 製作的 2D 橫向捲軸平台跳躍網頁遊戲（類 Mario 玩法），支援電腦鍵盤與手機/平板觸控。

- 純前端，**沒有 npm、沒有打包工具、沒有 ES Modules**。所有 `.js` 都是用 `<script>` 依序載入，共用同一個全域作用域。
- 直接用瀏覽器開啟 `index.html` 即可（若圖片載入失敗，請用本機伺服器，例如 `python3 -m http.server` 或 VS Code Live Server）。
- 文字與註解以繁體中文為主。

## 遊戲內容

| 世界 | 關卡 | 說明 |
|---|---|---|
| World 1 草原 | 1-1 草原起點、1-2 地下洞穴（含水管入口）、1-3 黃昏浮島、1-4 熔岩魔王城 | 1-4 為魔王關，通關後以白旗＋聚光燈轉場前往世界 2 |
| World 2 沙漠 | 岔路 2-0、補給屋 2-SHOP、2-1 黃沙綠洲、2-2 無盡流沙海、2-3 太陽神殿、2-4 幽暗古礦坑（隱藏路線）、2-5 沙暴巨蟲巢穴（魔王關） | 2-1 有流沙秘室；2-4 解鎖後，原本的 Boss 關在大地圖上會從 "2-4" 改名為 "2-5" |

道具：超級蘑菇、火焰花、羽翼披風、疾風加速菇、仙人掌刺甲菇、時光沙漏菇、無敵星星、1UP。
擊敗沙暴巨蟲可解鎖第二位角色「沙漠遊俠」。

## 操作

| 功能 | 電腦 | 手機 |
|---|---|---|
| 移動 | 方向鍵 / A D | 虛擬方向鍵 |
| 跳躍 | 空白鍵 / W / ↑ | JUMP |
| 蹲下 | ↓ / S | ▼ |
| 射擊 | F | FIRE |
| 加速 / 時間領域開關 | Ctrl / Shift | DASH（點一下鎖定） |
| 空投備用道具 | B | 點上方道具框 |
| 插火把（僅 2-4） | E 或 T | 點火把框 |
| 切換角色（解鎖後） | C | — |
| 返回大地圖 | M | 右上角「地圖」 |
| 設定 | O | 右上角「設定」 |
| 大地圖道具箱 | I | Items 按鈕 |

其他按鍵（如 1、2、U、P、R）請看 `input.js` 的 `keyPressed()`。

## 檔案結構

```
index.html            依序載入所有腳本（載入順序很重要）
style.css
jsconfig.json
libraries/            p5.min.js、p5.sound.min.js
action/ new/          角色精靈圖與特效素材（PNG 橫向影格條）
world_maps.js         世界 2 的關卡地圖生成器 buildWorld2Level 等
config.js             常數：影格數、碰撞盒、TILE_SIZE、道具圖鑑文字
state.js              核心共用狀態（主角物理、遊戲流程、實體陣列、計時器）
assets.js             圖片載入、精靈圖量測、像素材質包
audio.js              8-bit 音效與 BGM（原生 Web Audio）
maps_world1.js        世界 1 的地圖字串、loadLevelMap
level_tiles.js        碰撞、磚塊、水管、旗桿、移動平台、地圖繪製
entities.js           敵人、道具、金幣、浮動文字
player.js             受傷/死亡、時光倒流、火球、仙人掌飛針
boss_castle.js        1-4 魔王城：火棒、魔王、斧頭、橋崩塌
world2_miner.js       2-4 礦坑：頭燈、火把、黑暗遮罩、補給室
world2_sandworm.js    2-5 沙暴巨蟲與解救新角色過場
world2_atmosphere.js  世界 2 背景與地標
ui_hud.js             遊戲內 HUD、道具圖示
ui_modals.js          彈窗：道具圖鑑、設定、離開確認、沙漠補給屋
ui_screens.js         裝置選擇、關卡開場、Game Over
ui_worldmap.js        大地圖節點、繪製、游標、進入關卡
input.js              鍵盤、觸控、虛擬按鍵、點擊分派
level_flow.js         startLevel、退出關卡還原
sketch.js             p5 入口：setup() 與 draw() 主迴圈
```

### 載入順序規則（改 index.html 時務必遵守）
1. 先 `world_maps.js`，再 `config.js` → `state.js`，接著 `assets.js`、`audio.js`、`maps_world1.js`。
2. 然後是玩法模組、UI 與輸入模組。
3. **`sketch.js` 永遠最後**。
4. 函式可以跨檔案任意互相呼叫（執行期才解析）；順序只影響檔案最上層 `let/const` 的初始化。
5. 新增檔案時：如果最上層有用到其他檔案的常數，要放在那個檔案之後。

## 架構重點

- **全域狀態**：沒有類別或模組封裝，變數都是全域 `let`。每個模組自己的變數放在自己檔案開頭（例如 `boss_castle.js` 的 `boss`、`fireBars`），共用的放 `state.js`。
- **狀態機**：由全域字串 `gameState` 控制，目前有：
  `DEVICE_SELECT`、`WORLD_MAP`、`LEVEL_INTRO`、`PLAYING`、`ITEM_GUIDE`、`TRANSFORM_FREEZE`、`FLAG_SLIDE`、`WALK_TO_CASTLE`、`ENTERING_PIPE`、`ENTERING_SUPPLY_PIPE`、`EXITING_SUPPLY_PIPE`、`ENTERING_QUICKSAND`、`BOSS_DEFEAT_CUTSCENE`、`ALL_CLEAR`、`GAME_OVER`。
  新增狀態時，要同時檢查 `draw()` 內相關的 `if (gameState === ...)` 判斷。
- **主迴圈**：`sketch.js` 的 `draw()` 約 1260 行，包含輸入、狀態機、物理、動畫、繪圖，是目前最複雜的地方。修改前請先完整閱讀相關段落。
- **關卡識別**：用 `currentWorld`（1 或 2）加 `currentLevel`（1~5）。⚠️ 部分判斷只看 `currentLevel === 4`，世界 1 的魔王城與世界 2 的礦坑都是 4，要小心區分，需要時一併檢查 `currentWorld`。
- **地圖格式**：地圖是字串陣列，每個字元代表一種磚塊或物件（例如 `G` 地面、`B` 磚、`?` 問號磚、`M` 蘑菇磚、`P` 水管、`F`/`|` 旗桿、`L` 熔岩、`Q` 流沙、`K` 仙人掌刺柱）。完整字元意義請看 `drawMap()`（`level_tiles.js`）與 `checkCollision()`。
- **精靈圖**：每個動作一張橫向影格條，影格數定義在 `config.js`（例如 `WALK_FRAME_COUNT`）。換圖時影格數必須同步修改。
- **進入新世界**：地圖資料在 `mapNodesData`（`ui_worldmap.js`），節點含 `unlocked`、`cleared`、`nextNormal`、`nextSecret`、`neighbors`。

## 已知問題（待修）

1. **會當機**：從 2-4 礦坑中途的水管進入補給室後再出來時，`saved2_4MainState` 的欄位格式與開始關卡時不一致（缺少 `mapStrings` 等欄位），`loadLevelMap(undefined)` 會報錯。位置：`world2_miner.js`/`sketch.js` 中 `ENTERING_SUPPLY_PIPE` 與 `EXITING_SUPPLY_PIPE` 處理段落。
2. BGM 與部分地磚顏色只用 `currentLevel === 4` 判斷，世界 2 的 2-4 會套用到世界 1 魔王城的設定。
3. `draw()` 內 `isExitingPipe` 的處理寫了兩次；另有一段判斷使用不存在的狀態名稱 `"PIPE_ENTER"` / `"PIPE_EXIT"`，實際不會執行。
4. `FLAG_SLIDE` 區塊中 `let flagCol` 遮蔽了全域 `flagCol`。
5. HUD 底部文字寫死 `1-${currentLevel}`，在世界 2 會顯示錯誤。

## 給協作者與 AI 的修改守則

- **保持單純的 script 載入**：不要改成 `import/export`、不要加打包工具，除非整個專案一起遷移。
- **不要隨意重新命名全域函式或變數**，它們是跨檔案共用的；改名前請先全專案搜尋。
- 不要在 `sketch.js` 之外再定義 `preload()`、`setup()`、`draw()`（`preload` 目前在 `assets.js`，是 p5 全域鉤子之一）。
- 修改後至少手動測試：開始畫面 → 大地圖 → 進入 1-1 → 吃蘑菇/火焰花 → 通關 → 1-2 水管 → 手機模式虛擬按鍵 → 世界 2 的補給屋與 2-4 水管。
- 改動音效時注意 iOS Safari 需要使用者互動後才能啟動音訊（見 `initAudioEngine`）。
- 優先順序建議：先修「已知問題」第 1 項，再把 `draw()` 拆成 `updateGame()` / `renderGame()` 等小函式。
