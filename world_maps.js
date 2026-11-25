// =====================================================================
// World 2 (2-1 ~ 2-5) 專屬手工關卡與密室地圖生成器 (world_maps.js)
// 四幕遞進式長關卡設計（240~300 格，約 45~65 秒飽滿探索節奏，絕無複製貼上）
// =====================================================================

const WORLD2_LEVEL_CONFIGS = {
  1: { id: "2-1", name: "黃沙綠洲",     totalCols: 245, checkpointCol: 122, isBossStage: false, theme: "oasis",         timeLimit: 400 },
  2: { id: "2-2", name: "無盡流沙海",   totalCols: 255, checkpointCol: 128, isBossStage: false, theme: "quicksand",     timeLimit: 420 },
  3: { id: "2-3", name: "太陽神殿",     totalCols: 255, checkpointCol: 128, isBossStage: false, theme: "temple",        timeLimit: 450 },
  4: { id: "2-4", name: "幽暗古礦坑",   totalCols: 265, checkpointCol: 132, isBossStage: false, theme: "dark_mine",     timeLimit: 480 },
  5: { id: "2-5", name: "沙暴巨蟲巢穴", totalCols: 300, checkpointCol: 130, isBossStage: true,  theme: "sandworm_boss", timeLimit: 550 }
};

function buildWorld2Level(lvlNum) {
  let cfg = WORLD2_LEVEL_CONFIGS[lvlNum] || WORLD2_LEVEL_CONFIGS[1];
  let rows = 15;
  let cols = cfg.totalCols;
  let grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
  let enemySpawns = [];
  let platformSpawns = [];

  const setTile = (r, c, ch) => {
    if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = ch;
  };
  const fillRect = (r1, c1, r2, c2, ch) => {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) setTile(r, c, ch);
    }
  };
  const digPit = (startCol, width, fillChar = ' ') => {
    for (let c = startCol; c < startCol + width; c++) {
      setTile(13, c, fillChar);
      setTile(14, c, fillChar);
    }
  };
  const addCoinArc = (startCol, peakRow, count = 5) => {
    for (let i = 0; i < count; i++) {
      let arch = Math.round(Math.sin((i / (count - 1)) * Math.PI) * 2);
      setTile(peakRow - arch, startCol + i, 'O');
    }
  };

  // 基礎地板（2-3 神殿與 2-4 礦坑有天然岩石天花板）
  fillRect(13, 0, 14, cols - 1, 'G');
  if (lvlNum === 3 || lvlNum === 4) {
    fillRect(0, 0, 0, cols - 1, 'G');
  }

  // 起點安全區補給（挑高至 row 8，衝刺起跳絕不卡頭）
  setTile(8, 8, '?');
  setTile(8, 9, 'M');
  setTile(8, 10, '?');

  // =================================================================
  // 【2-1 黃沙綠洲】（245 格）：四幕綠洲探索＋高低雙線＋顯性秘室入口
  // =================================================================
  if (lvlNum === 1) {
    // 明確清除共用起點預設的 row 8, col 8~10，避免 col 9 殘留多餘 M
    fillRect(8, 8, 8, 10, ' ');
    // 起點綠洲營地石台＋雙磚＋上方隱藏磚 I
    fillRect(12, 8, 12, 10, 'S');
    setTile(8, 8, '?');
    setTile(8, 10, 'M');
    setTile(5, 9, 'I');

    // 第一幕（col 16 ~ 67）：綠洲水池、仙人掌策略林與雙層高空木橋
    fillRect(11, 16, 12, 18, 'S');
    digPit(19, 4, 'Q');
    fillRect(11, 23, 12, 25, 'S');
    addCoinArc(19, 8, 4);

    // 上層挑高磚橋 vs 下層可震碎仙人掌柱（後方藏金幣獎勵）
    fillRect(7, 29, 7, 42, 'B');
    setTile(7, 35, 'M');
    addCoinArc(31, 5, 5);
    setTile(12, 33, 'K');
    setTile(11, 33, 'K');
    setTile(12, 34, 'O');
    setTile(12, 35, 'O');
    setTile(12, 38, 'K');
    setTile(11, 38, 'K');
    setTile(12, 39, 'O');
    setTile(12, 40, 'O');
    enemySpawns.push({ type: "goomba", col: 41, row: 12 });

    // 高空雙階路線（每階垂直落差 2 格，容錯充足）vs 地面路徑
    fillRect(10, 44, 12, 46, 'S');
    fillRect(8,  48, 8,  52, '=');
    fillRect(6,  55, 6,  62, 'T');
    addCoinArc(56, 4, 6);
    setTile(12, 53, 'K');
    enemySpawns.push({ type: "koopa", col: 58, row: 6 });
    enemySpawns.push({ type: "goomba", col: 64, row: 12 });

    // 第二幕（col 68 ~ 118）：古代砂岩大峽谷、雙水平浮板、安全中島與上層石梁
    digPit(69, 22, 'Q'); // col 69 ~ 90 全段流沙退路
    fillRect(10, 69, 12, 72, 'S'); // 左岸起跳台
    platformSpawns.push({
      x: 74 * 40, y: 9 * 40, w: 120, h: 16,
      minX: 73 * 40, maxX: 77 * 40, speed: 2.0, dx: 0
    });
    // 中央安全石島（col 80 ~ 83，恢復實體地基並疊建砂岩島）
    fillRect(13, 80, 14, 83, 'G');
    fillRect(9,  80, 12, 83, 'S');
    // 上層技巧單向石梁（row 6，與中島 row 9 落差 3 格 / 32px 餘裕）
    fillRect(6, 78, 6, 85, '=');
    for (let c = 79; c <= 84; c++) setTile(4, c, 'O');
    enemySpawns.push({ type: "parakoopa", col: 81, row: 4 });

    platformSpawns.push({
      x: 85 * 40, y: 8 * 40, w: 120, h: 16,
      minX: 84 * 40, maxX: 88 * 40, speed: 2.1, dx: 0
    });
    fillRect(9, 91, 12, 95, 'S'); // 右岸安全落腳台

    // 峽谷後段雙層遺跡橋
    fillRect(7, 98, 7, 110, 'B');
    setTile(7, 103, '?');
    setTile(12, 101, 'K');
    enemySpawns.push({ type: "koopa", col: 106, row: 12 });
    addCoinArc(112, 9, 5);

    // --- col 122 為中繼存檔旗（保持不變） ---

    // 第三幕（col 128 ~ 183）：外牆攀登＋中空神龕金字塔與高空木橋
    fillRect(11, 131, 12, 134, 'S');
    fillRect(9,  134, 12, 137, 'S');
    fillRect(7,  137, 8,  141, 'S'); // 金字塔頂蓋
    fillRect(9,  141, 12, 144, 'S');
    fillRect(11, 144, 12, 147, 'S');
    // 挖空金字塔內部神龕室（col 135~143, row 9~12）
    fillRect(9, 135, 12, 143, ' ');
    setTile(11, 135, 'K');
    setTile(12, 135, 'K');
    setTile(11, 143, 'K');
    setTile(12, 143, 'K');
    setTile(9,  139, 'M');
    setTile(12, 137, 'O');
    setTile(12, 138, 'O');
    setTile(12, 140, 'O');
    setTile(12, 141, 'O');
    setTile(4,  139, '*'); // 外牆頂端無敵星

    digPit(149, 5, 'Q');
    enemySpawns.push({ type: "parakoopa", col: 151, row: 6 });

    // 高空木橋捷徑（加中繼單向平台方便登橋）vs 地面巡邏隊
    fillRect(9, 154, 9, 156, '=');
    fillRect(6, 158, 6, 175, 'T');
    addCoinArc(160, 4, 6);
    setTile(6, 166, 'M');
    setTile(12, 162, 'K');
    setTile(11, 162, 'K');
    enemySpawns.push({ type: "goomba", col: 168, row: 12 });
    enemySpawns.push({ type: "koopa", col: 173, row: 12 });

    // 第四幕（col 184 ~ 225）：綠洲沙丘衝刺＋顯性古代石門秘室入口
    fillRect(10, 184, 12, 188, 'S');
    digPit(189, 5, 'Q');
    fillRect(10, 194, 12, 198, 'S');
    enemySpawns.push({ type: "parakoopa", col: 200, row: 6 });

    fillRect(7, 202, 7, 212, 'B');
    setTile(7, 207, '?');
    enemySpawns.push({ type: "koopa", col: 210, row: 12 });

    // 終點前特殊流沙入口（col 217 ~ 219）：保留 V，兩側設遺跡石墩與垂直金幣引導線
    fillRect(11, 216, 12, 216, 'S');
    digPit(217, 3, 'V');
    fillRect(11, 220, 12, 220, 'S');
    setTile(6,  218, 'O');
    setTile(8,  218, 'O');
    setTile(10, 218, 'O');
  }

  // =================================================================
  // 【2-2 無盡流沙海】（255 格）：四幕浮空拱橋＋連環沙海橫渡
  // =================================================================
  else if (lvlNum === 2) {
    // 第一幕（col 16 ~ 70）：古代砂岩拱橋群
    digPit(16, 20, 'Q');
    fillRect(10, 17, 12, 20, 'S');
    fillRect(8,  23, 8,  29, 'T');
    addCoinArc(24, 6, 5);
    fillRect(10, 32, 12, 35, 'S');
    enemySpawns.push({ type: "parakoopa", col: 30, row: 6 });

    setTile(8, 41, 'M');
    setTile(12, 45, 'K');
    setTile(11, 45, 'K');
    enemySpawns.push({ type: "koopa", col: 50, row: 12 });
    fillRect(7, 54, 7, 63, 'B');
    setTile(7, 58, '?');

    // 第二幕（col 68 ~ 120）：雙移動石板橫渡流沙大峽谷
    digPit(68, 34, 'Q');
    fillRect(10, 69, 12, 72, 'S');
    platformSpawns.push({
      x: 74 * 40, y: 10 * 40, w: 120, h: 16,
      minX: 73 * 40, maxX: 83 * 40, speed: 2.3, dx: 0
    });
    fillRect(9, 86, 12, 89, 'S');
    platformSpawns.push({
      x: 91 * 40, y: 8 * 40, w: 120, h: 16,
      minX: 90 * 40, maxX: 99 * 40, speed: 2.5, dx: 0
    });
    fillRect(10, 102, 12, 106, 'S');
    addCoinArc(85, 6, 5);
    enemySpawns.push({ type: "parakoopa", col: 95, row: 5 });

    // --- col 128 為中繼存檔旗 ---

    // 第三幕（col 136 ~ 192）：風蝕高石柱連跳與飛行龜陣
    digPit(137, 26, 'Q');
    fillRect(11, 138, 12, 140, 'S');
    fillRect(9,  143, 12, 145, 'S');
    fillRect(7,  148, 12, 150, 'S');
    setTile(4, 149, 'M');
    fillRect(9,  153, 12, 155, 'S');
    fillRect(11, 158, 12, 161, 'S');
    enemySpawns.push({ type: "parakoopa", col: 151, row: 5 });

    // 沙漠綠洲休息站＋雙層磚塊陣
    fillRect(7, 168, 7, 182, 'B');
    setTile(7, 173, '?');
    setTile(7, 177, '*');
    enemySpawns.push({ type: "goomba", col: 171, row: 12 });
    enemySpawns.push({ type: "koopa", col: 179, row: 12 });

    // 第四幕（col 190 ~ 236）：高速拱橋與高低石台衝刺
    digPit(190, 22, 'Q');
    fillRect(10, 191, 12, 194, 'S');
    fillRect(7,  197, 7,  204, 'T');
    addCoinArc(198, 5, 5);
    fillRect(10, 207, 12, 211, 'S');
    enemySpawns.push({ type: "parakoopa", col: 205, row: 5 });

    fillRect(8, 216, 8, 225, 'B');
    setTile(8, 220, '?');
    fillRect(10, 228, 12, 233, 'S');
  }

  // =================================================================
  // 【2-3 太陽神殿】（255 格）：四幕上下雙層神殿走廊＋聖火攀升塔
  // =================================================================
  else if (lvlNum === 3) {
    // 第一幕（col 16 ~ 72）：神殿前廳雙層走廊
    fillRect(7, 16, 7, 36, 'S');
    fillRect(7, 42, 7, 64, 'S');

    addCoinArc(21, 5, 5);
    setTile(4, 28, 'M');
    enemySpawns.push({ type: "parakoopa", col: 39, row: 5 });
    fillRect(5, 47, 5, 57, 'T');
    addCoinArc(49, 3, 5);

    setTile(12, 23, 'K');
    enemySpawns.push({ type: "koopa", col: 30, row: 12 });
    digPit(37, 4, 'L');
    setTile(10, 48, '?');
    setTile(10, 50, '?');
    enemySpawns.push({ type: "goomba", col: 56, row: 12 });

    // 第二幕（col 74 ~ 120）：神殿聖火大廳與高低石柱
    digPit(75, 22, 'L');
    fillRect(10, 76, 12, 80, 'S');
    fillRect(7,  83, 7,  89, 'S');
    setTile(4, 86, '*');
    fillRect(10, 92, 12, 96, 'S');
    enemySpawns.push({ type: "parakoopa", col: 86, row: 4 });

    fillRect(8, 102, 8, 114, 'B');
    setTile(8, 108, '?');
    enemySpawns.push({ type: "koopa", col: 106, row: 12 });
    enemySpawns.push({ type: "goomba", col: 112, row: 12 });

    // --- col 128 為中繼存檔旗 ---

    // 第三幕（col 136 ~ 192）：太陽神殿垂直上升塔（一路往上攀登至頂層走廊）
    digPit(137, 32, 'L');
    fillRect(11, 138, 12, 142, 'S');
    fillRect(9,  145, 9,  150, 'S');
    setTile(6, 147, 'M');
    platformSpawns.push({
      x: 152 * 40, y: 7 * 40, w: 120, h: 16,
      minX: 151 * 40, maxX: 161 * 40, speed: 2.2, dx: 0
    });
    fillRect(5, 164, 12, 171, 'S'); // 頂層神殿聖壇
    addCoinArc(165, 3, 5);
    enemySpawns.push({ type: "koopa", col: 168, row: 5 });

    // 第四幕（col 176 ~ 236）：神殿上層長廊與階梯俯衝出口
    fillRect(7, 176, 7, 198, 'S');
    setTile(4, 186, '?');
    digPit(180, 5, 'L');
    digPit(190, 5, 'L');
    enemySpawns.push({ type: "parakoopa", col: 196, row: 5 });

    fillRect(9,  204, 12, 209, 'S');
    fillRect(7,  212, 7,  220, 'B');
    setTile(7, 216, 'M');
    enemySpawns.push({ type: "koopa", col: 215, row: 12 });
    fillRect(10, 224, 12, 230, 'S');
  }

  // =================================================================
  // 【2-4 幽暗古礦坑】（265 格）：四幕上層木棧道 vs 下層寶藏暗道＋火把節奏
  // =================================================================
  else if (lvlNum === 4) {
    // 入口處放置前往全亮補給密室的綠色水管 'p'
    fillRect(11, 14, 12, 15, 'p');

    // 第一幕（col 20 ~ 76）：雙層礦道岔路
    fillRect(7, 22, 7, 45, 'T');
    setTile(4, 27, 't'); // 火把補給
    addCoinArc(32, 5, 5);
    enemySpawns.push({ type: "goomba", col: 39, row: 7 });

    setTile(10, 30, 'M');
    fillRect(10, 36, 10, 43, 'B');
    setTile(10, 39, '*'); // 下層暗道無敵星
    enemySpawns.push({ type: "koopa", col: 34, row: 12 });

    digPit(49, 5, ' ');
    fillRect(10, 47, 12, 48, 'S');
    fillRect(10, 54, 12, 57, 'S');
    setTile(7, 55, 't');
    enemySpawns.push({ type: "parakoopa", col: 63, row: 7 });
    fillRect(8, 66, 8, 74, 'B');
    setTile(8, 70, '?');

    // 第二幕（col 78 ~ 124）：深淵礦車軌道與懸空升降梯
    digPit(79, 26, ' ');
    fillRect(10, 80, 12, 84, 'S');
    platformSpawns.push({
      x: 86 * 40, y: 9 * 40, w: 120, h: 16,
      minX: 85 * 40, maxX: 96 * 40, speed: 2.3, dx: 0
    });
    fillRect(8, 99, 12, 104, 'S');
    setTile(5, 101, 't');
    enemySpawns.push({ type: "koopa", col: 109, row: 12 });
    fillRect(7, 112, 7, 120, 'T');
    addCoinArc(113, 5, 5);

    // --- col 132 為中繼存檔旗 ---

    // 第三幕（col 140 ~ 198）：地下熔岩礦脈區（上下雙層路線）
    fillRect(6, 142, 6, 166, 'T'); // 上層高空木橋
    setTile(3, 154, 'M');
    digPit(145, 5, 'L');
    digPit(156, 5, 'L');
    setTile(10, 151, '?');
    enemySpawns.push({ type: "goomba", col: 163, row: 12 });

    fillRect(9, 171, 12, 176, 'S');
    setTile(6, 173, '?'); // 改為金幣磚（或 'M' 道具磚）
    digPit(177, 14, ' ');
    platformSpawns.push({
      x: 179 * 40, y: 8 * 40, w: 120, h: 16,
      minX: 178 * 40, maxX: 188 * 40, speed: 2.5, dx: 0
    });
    fillRect(9, 191, 12, 196, 'S');

    // 第四幕（col 202 ~ 246）：古礦坑出口高台衝刺
    enemySpawns.push({ type: "parakoopa", col: 203, row: 6 });
    fillRect(7, 207, 7, 218, 'B');
    setTile(7, 212, '?');
    enemySpawns.push({ type: "koopa", col: 215, row: 12 });
    fillRect(9,  223, 12, 228, 'S');
    fillRect(7,  231, 7,  238, 'T');
    addCoinArc(232, 5, 5);
    fillRect(10, 240, 12, 244, 'S');
  }

  // =================================================================
  // 【2-5 沙暴巨蟲巢穴】（300 格）：三段式向上攀登神殿＋48 格完整主畫面競技場
  // =================================================================
  else if (lvlNum === 5) {
    // 第一段（col 20 ~ 78）：神殿外牆階梯攀升
    fillRect(11, 22, 12, 25, 'S');
    fillRect(9,  28, 12, 32, 'S');
    setTile(6, 30, 'M');
    enemySpawns.push({ type: "koopa", col: 30, row: 9 });

    fillRect(7, 36, 7, 42, 'B');
    setTile(7, 39, '?');
    digPit(34, 14, 'Q');

    fillRect(5, 46, 5, 53, 'T');
    addCoinArc(47, 3, 5);
    enemySpawns.push({ type: "parakoopa", col: 56, row: 5 });

    fillRect(7,  60, 12, 64, 'S');
    setTile(4, 62, '*');
    fillRect(10, 68, 12, 73, 'S');
    enemySpawns.push({ type: "goomba", col: 70, row: 10 });

    // 第二段（col 82 ~ 126）：雙層垂直遺跡塔
    digPit(82, 24, 'L');
    fillRect(10, 84, 10, 90, 'S');
    fillRect(7,  93, 7, 100, 'S');
    setTile(4, 96, 'M');
    platformSpawns.push({
      x: 102 * 40, y: 6 * 40, w: 120, h: 16,
      minX: 102 * 40, maxX: 112 * 40, speed: 2.5, dx: 0
    });
    fillRect(5, 116, 5, 124, 'B');
    setTile(5, 120, '?');
    enemySpawns.push({ type: "parakoopa", col: 118, row: 4 });

    // 第三段（col 136 ~ 225）：天際懸空石柱群
    digPit(136, 36, 'Q');
    fillRect(9, 139, 12, 142, 'S');
    fillRect(6, 147, 12, 150, 'S');
    fillRect(4, 155, 12, 159, 'S');
    addCoinArc(155, 2, 5);
    setTile(1, 157, 'M');

    platformSpawns.push({
      x: 162 * 40, y: 5 * 40, w: 120, h: 16,
      minX: 162 * 40, maxX: 172 * 40, speed: 2.8, dx: 0
    });
    fillRect(7, 177, 12, 182, 'S');
    enemySpawns.push({ type: "parakoopa", col: 186, row: 6 });
    fillRect(10, 190, 12, 196, 'S');
  }

  // =================================================================
  // 中繼存檔旗 ('R') 與 終點區域
  // =================================================================
  if (!cfg.isBossStage) {
    let cp = cfg.checkpointCol;
    fillRect(13, cp - 3, 14, cp + 3, 'G');
    setTile(12, cp, 'R');
    setTile(11, cp, 'R');

    let flagCol = cols - 15;
    fillRect(13, flagCol - 6, 14, cols - 1, 'G');
    for (let step = 0; step < 5; step++) {
      fillRect(12 - step, flagCol - 6 + step, 12, flagCol - 2, 'S');
    }
    setTile(3, flagCol, '|');
    for (let r = 4; r <= 12; r++) setTile(r, flagCol, 'F');
    fillRect(8, flagCol + 5, 12, flagCol + 9, 'C');
  } else {
    let cp = cfg.checkpointCol;
    fillRect(13, cp - 3, 14, cp + 3, 'G');
    setTile(12, cp, 'R');
    setTile(11, cp, 'R');

    let arenaStart = cols - 58;
    fillRect(1, arenaStart - 12, 12, arenaStart - 1, ' ');
    fillRect(0, arenaStart - 12, 0, cols - 1, 'G');
    fillRect(13, arenaStart - 12, 14, cols - 1, 'G');

    setTile(12, arenaStart - 7, 'R');
    setTile(11, arenaStart - 7, 'R');
    setTile(9, arenaStart - 5, '?');
    setTile(9, arenaStart - 4, 'M');

    fillRect(1, arenaStart, 12, cols - 1, ' ');
    fillRect(9, arenaStart + 4, 9, arenaStart + 9, '=');
    fillRect(6, arenaStart + 11, 6, arenaStart + 15, '=');
    fillRect(9, cols - 19, 9, cols - 14, '=');
    fillRect(6, cols - 25, 6, cols - 21, '=');

    fillRect(1, cols - 3, 12, cols - 1, 'G');
    fillRect(9, cols - 4, 12, cols - 2, 'C');
  }

  return {
    config: cfg,
    mapStrings: grid.map(row => row.join('')),
    enemySpawns,
    platformSpawns
  };
}

// =====================================================================
// 2-1 神秘流沙吸入口進入的「地下古代秘室」（15 列 × 135 格，終點為紅色秘密終點旗 'H'）
// 四大分區：A.古代入口 → B.失落走廊 → C.祭壇暗道 → D.秘密出口
// =====================================================================
function buildWorld2SubSecretMap() {
  let rows = 15;
  let cols = 135;
  let grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
  let enemySpawns = [];

  const setTile = (r, c, ch) => { if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = ch; };
  const fillRect = (r1, c1, r2, c2, ch) => {
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) setTile(r, c, ch);
  };
  const digPit = (startCol, width, fillChar = ' ') => {
    for (let c = startCol; c < startCol + width; c++) {
      setTile(13, c, fillChar);
      setTile(14, c, fillChar);
    }
  };
  const addCoinArc = (startCol, peakRow, count = 5) => {
    for (let i = 0; i < count; i++) {
      let arch = Math.round(Math.sin((i / (count - 1)) * Math.PI) * 2);
      setTile(peakRow - arch, startCol + i, 'O');
    }
  };

  // 全長天然岩層天花板（row 0~1）＋基礎砂岩地板（row 13~14）＋左右封閉岩壁
  fillRect(0, 0, 1, cols - 1, 'G');
  fillRect(13, 0, 14, cols - 1, 'G');
  fillRect(2, 0, 12, 0, 'G');
  fillRect(2, cols - 1, 12, cols - 1, 'G');

  // =================================================================
  // 分區 A：古代入口（col 1 ~ 24）
  // 玩家進入於 col 3, row 4，落於安全砂岩起點，前方有半埋古代石門框與金幣前進引導
  // =================================================================
  fillRect(12, 2, 12, 6, 'S');     // 入口安全砂岩平台（接住從 col 3 落下的主角）
  fillRect(2, 7, 5, 8, 'S');       // 半埋石門門楣上方石塊
  fillRect(10, 7, 12, 8, 'S');     // 半埋石門門檻石墩（中間 row 6~9 保持淨空 4 格高，大小隻皆可順暢通過）
  addCoinArc(11, 8, 5);            // 前進方向金幣弧線引導
  setTile(8, 17, '?');             // 入口補給金幣磚
  setTile(8, 19, 'M');             // 入口能力補給磚（確保無道具玩家也有資源）
  fillRect(11, 22, 12, 24, 'S');   // 過渡砂岩階梯

  // =================================================================
  // 分區 B：失落走廊（col 25 ~ 63）
  // 雙層走廊＋飛行龜互動（可跳過、踩踏或走上層木橋繞過，絕非必傷陷阱）
  // =================================================================
  fillRect(9, 27, 12, 30, 'S');    // 走廊前段石柱台
  fillRect(7, 33, 7, 52, 'T');     // 上層遺跡木棧道（高空安全替代路線）
  addCoinArc(35, 5, 6);            // 上層木棧道金幣弧線
  setTile(7, 43, '?');             // 上層木棧道金幣磚

  // 下層主走廊地面敵人與可震碎仙人掌（後方藏額外金幣）
  enemySpawns.push({ type: "goomba", col: 36, row: 12 });
  setTile(12, 41, 'K');            // 單格可跳過之矮仙人掌（無敵星或仙人掌能力可直接撞碎）
  setTile(12, 42, 'O');
  setTile(12, 43, 'O');

  // 明確要求之飛行龜生成點（baseY = 4*40 - 19 - 24 = 117px，垂直巡邏 ±48px 範圍 y=69~165px，
  // 玩家可走地面 row 12 底部輕鬆通過、跳起踩踏或從上層木橋跨越）
  enemySpawns.push({ type: "parakoopa", col: 42, row: 4 });

  fillRect(10, 55, 12, 58, 'S');   // 走廊後段落腳石台
  enemySpawns.push({ type: "koopa", col: 61, row: 12 });

  // =================================================================
  // 分區 C：祭壇暗道（col 64 ~ 112）
  // 主路線：分段流沙池（每段 4 格寬，連跳即可脫困）＋寬敞安全砂岩石島＋中央古代祭壇
  // 技巧獎勵路線：上方單向石梁 '=' 連跳，通往高空無敵星與金幣寶庫
  // =================================================================
  // 第一段流沙暗道（col 66~69 為 4 格流沙，col 70~75 為 6 格寬敞安全砂岩石島）
  digPit(66, 4, 'Q');
  fillRect(11, 70, 12, 75, 'S');
  setTile(8, 72, 'M');             // 主路線必經處提供能力補給磚

  // 技巧高空路線入口（從 col 72 跳上 row 8 單向石梁 → row 6 技巧高台）
  fillRect(8, 75, 8, 78, '=');
  fillRect(6, 81, 6, 94, '=');
  for (let c = 83; c <= 92; c++) setTile(4, c, 'O');
  setTile(3, 88, '*');             // 高空技巧路線額外獎勵：無敵星（非必要通關資源）

  // 第二段流沙暗道（col 76~79 為 4 格流沙，col 80~95 為中央古代祭壇大石台）
  digPit(76, 4, 'Q');
  fillRect(11, 80, 12, 95, 'S');   // 中央古代祭壇基座（16 格寬安全落腳與恢復區）
  fillRect(9,  85, 10, 90, 'S');   // 祭壇中層台階
  setTile(6, 87, '?');             // 祭壇上方聖火金幣磚
  setTile(6, 88, 'M');             // 祭壇上方聖火能力磚
  setTile(12, 82, 'O');
  setTile(12, 93, 'O');
  enemySpawns.push({ type: "goomba", col: 92, row: 11 });

  // 第三段流沙暗道（col 96~99 為 4 格流沙，col 100~112 為出口前恢復區）
  digPit(96, 4, 'Q');
  fillRect(10, 100, 12, 104, 'S'); // 脫離流沙後的安全高台
  setTile(12, 107, 'K');           // 暗道末段單格仙人掌（可輕鬆跳過，或以星／仙人掌能力清除）
  addCoinArc(106, 8, 5);

  // =================================================================
  // 分區 D：秘密出口（col 113 ~ 134）
  // col 122 設置紅色秘密終點旗 'H'，col 127~131 設置終點城堡 'C'
  // 旗桿下方為 row 13 完整地面，且 H 到 C 之間完全平坦無任何阻擋
  // =================================================================
  for (let step = 0; step < 4; step++) {
    fillRect(12 - step, 114 + step, 12, 117, 'S'); // 出口前 4 階砂岩助跑台
  }

  let flagCol = 122;
  for (let r = 3; r <= 12; r++) setTile(r, flagCol, 'H');
  fillRect(8, flagCol + 5, 12, flagCol + 9, 'C'); // col 127 ~ 131 城堡（共 5 格寬，中心門在 col 129）

  return {
    mapStrings: grid.map(row => row.join('')),
    enemySpawns
  };
}

// =====================================================================
// 2-4 開場「全亮礦工裝備補給密室」（頭燈＋4 個火把磚＋出口水管 'u'）
// =====================================================================
function buildWorld2MinerSupplyRoom() {
  let rows = 15;
  let cols = 28;
  let grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
  const setTile = (r, c, ch) => { if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = ch; };
  const fillRect = (r1, c1, r2, c2, ch) => {
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) setTile(r, c, ch);
  };

  fillRect(0, 0, 1, cols - 1, 'B');
  fillRect(13, 0, 14, cols - 1, 'G');
  fillRect(2, 0, 12, 0, 'B');
  fillRect(2, cols - 1, 12, cols - 1, 'B');

  fillRect(2, 2, 3, 3, 'P');
  setTile(8, 6, 't');
  setTile(8, 7, 't');
  setTile(8, 8, 't');
  setTile(8, 9, 't');
  fillRect(12, 12, 12, 13, 'S');
  fillRect(11, 22, 12, 23, 'u');

  return {
    mapStrings: grid.map(row => row.join(''))
  };
}
