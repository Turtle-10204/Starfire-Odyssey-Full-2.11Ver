// =====================================================================
// world2_atmosphere.js — 世界 2 的背景氣氛與地標繪製。
// =====================================================================

// =====================================================================
// World 2 (2-1 ~ 2-5) 零文字視覺連貫場景：光影色溫漸變 ＋ 起點來路地標
// =====================================================================
function drawWorld2AtmosphereAndLandmarks() {
  if (currentWorld !== 2) return;

  push();
  noStroke();

  // --- 1. 遠景層（依關卡逐漸變深，呈現從地表走進地底的過程） ---
  if (currentLevel === 1) {
    // 2-1 戶外主關卡三層背景（僅在非地下秘室時繪製）
    if (!(typeof is2_1SubSecret !== "undefined" && is2_1SubSecret)) {
      // 1-A 遠景層：烈日與連綿沙漠沙丘剪影（視差 0.25）
      fill("#FFF3B0");
      circle(cameraX + width * 0.78, 95, 78);
      fill(255, 243, 176, 45);
      circle(cameraX + width * 0.78, 95, 118);

      fill(232, 148, 76, 135);
      for (let d = -1; d < 12; d++) {
        let dx = d * 420 + cameraX * 0.75;
        arc(dx + 210, 520, 520, 260, PI, TWO_PI);
      }

      // 1-B 遠景地標層：大小雙金字塔群（視差 0.35）
      fill("#E76F51");
      triangle(cameraX * 0.65 + 320, 520, cameraX * 0.65 + 470, 210, cameraX * 0.65 + 620, 520);
      fill("#D65A3C");
      triangle(cameraX * 0.65 + 470, 210, cameraX * 0.65 + 620, 520, cameraX * 0.65 + 545, 520);

      fill("#EE8959");
      triangle(cameraX * 0.65 + 1450, 520, cameraX * 0.65 + 1570, 265, cameraX * 0.65 + 1690, 520);
      triangle(cameraX * 0.65 + 2750, 520, cameraX * 0.65 + 2910, 200, cameraX * 0.65 + 3070, 520);

      // 1-C 中景綠洲棕櫚樹剪影（固定高低錯落偏移＋綠洲沙丘底座與草叢，純視覺裝飾無碰撞）
      const oasisPalmCols = [15, 25, 118, 126];
      const treeHeightOffsets = [0, 25, 10, -15];
      for (let i = 0; i < oasisPalmCols.length; i++) {
        let pc = oasisPalmCols[i];
        let px = pc * 40 + 20;
        let baseY = 520;
        let hOffset = treeHeightOffsets[i % treeHeightOffsets.length];
        let trunkTopY = baseY - (125 + hOffset);

        // 樹幹（從底座土壤延伸至樹冠頂端）
        fill("#8D5524");
        quad(px - 6, baseY, px + 6, baseY, px + 3, trunkTopY, px - 3, trunkTopY);

        // 樹冠棕櫚葉（隨 trunkTopY 同步高低錯落）
        fill("#2A9D8F");
        ellipse(px - 26, trunkTopY, 54, 16);
        ellipse(px + 26, trunkTopY, 54, 16);
        ellipse(px - 18, trunkTopY - 13, 44, 15);
        ellipse(px + 18, trunkTopY - 13, 44, 15);

        // 樹木底座與地面融合（雙層沙丘土堆＋綠洲草叢點綴）
        fill("#B08968");
        arc(px, baseY, 46, 20, PI, TWO_PI);
        fill("#E6CCB2");
        arc(px - 4, baseY, 32, 13, PI, TWO_PI);
        fill("#2A9D8F");
        triangle(px - 14, baseY, px - 10, baseY - 9, px - 6, baseY);
        triangle(px + 7, baseY, px + 11, baseY - 10, px + 15, baseY);
        fill("#52B788");
        triangle(px - 8, baseY, px - 5, baseY - 7, px - 2, baseY);
        triangle(px + 2, baseY, px + 5, baseY - 8, px + 8, baseY);
      }

      // 1-D 中景顯性秘室入口提示（col 217~219 特殊流沙後方半埋古代雙柱石門＋發光符文 — 維持現狀）
      let gateLeftX = 216 * 40 + 6;
      let gateRightX = 220 * 40 + 6;
      let gateTopY = 350;
      let gateBotY = 520;
      // 古代石門雙柱與門楣（位於地形後方，絕不遮擋 V 入口或金幣）
      fill("#6C584C");
      rect(gateLeftX, gateTopY, 28, gateBotY - gateTopY, 3);
      rect(gateRightX, gateTopY, 28, gateBotY - gateTopY, 3);
      fill("#8A7365");
      rect(gateLeftX - 8, gateTopY - 18, (gateRightX + 36) - (gateLeftX - 8), 22, 4);
      // 門柱上的發光綠洲青藍符文（提醒玩家此處流沙為古代秘室入口）
      let runePulse = 140 + sin(frameCount * 0.08) * 65;
      fill(64, 224, 208, runePulse);
      rect(gateLeftX + 10, gateTopY + 26, 8, 22, 2);
      rect(gateLeftX + 10, gateTopY + 62, 8, 22, 2);
      rect(gateRightX + 10, gateTopY + 26, 8, 22, 2);
      rect(gateRightX + 10, gateTopY + 62, 8, 22, 2);
    } else {
      // =================================================================
      // 2-1 地下秘室（135 格）專屬背景：古代砂岩地宮、壁畫、破損石柱、聖火祭壇與流沙豎井
      // （不顯示戶外太陽、沙丘、棕櫚樹與遠景金字塔；位於地形與角色後方）
      // =================================================================
      let secretWidth = 135 * 40; // 5400px

      // S-1 深層古代砂岩磚牆底幕（覆蓋整座 135 格地下秘室）
      fill("#2B1C12");
      rect(0, 0, secretWidth, 600);

      // S-2 遠景砂岩砌石橫紋與浮雕壁畫板（視差 0.45）
      fill("#3B2719");
      for (let i = 0; i < 18; i++) {
        let wx = i * 320 + cameraX * 0.55;
        rect(wx, 80, 260, 440, 6);
        fill("#4E3422");
        rect(wx + 28, 125, 204, 150, 4);
        fill("#7F5539");
        circle(wx + 130, 185, 44);
        triangle(wx + 80, 255, wx + 130, 205, wx + 180, 255);
        fill("#3B2719");
      }

      // S-3 分區 A 入口流沙豎井光束（col 2~5 頂部滲入的地表流沙微光，交代來路）
      fill(246, 189, 96, 36);
      quad(85, 0, 175, 0, 235, 480, 55, 480);
      fill(230, 180, 110, 55);
      rect(118, 0, 24, 160);

      // S-4 中景破損古代砂岩石柱群（避開 row 7 棧道高度，營造地宮縱深感）
      const brokenPillars = [
        { col: 12, topY: 165, brokenTop: true },
        { col: 26, topY: 80,  brokenTop: false },
        { col: 54, topY: 195, brokenTop: true },
        { col: 64, topY: 80,  brokenTop: false },
        { col: 97, topY: 175, brokenTop: true },
        { col: 113, topY: 80, brokenTop: false }
      ];
      for (let p of brokenPillars) {
        let px = p.col * 40 + 4;
        fill("#583E2B");
        rect(px, p.topY, 32, 520 - p.topY);
        fill("#6F4E37");
        rect(px + 6, p.topY + 8, 6, 520 - p.topY - 16);
        rect(px + 20, p.topY + 8, 6, 520 - p.topY - 16);
        if (p.brokenTop) {
          fill("#583E2B");
          triangle(px, p.topY, px + 12, p.topY - 14, px + 20, p.topY);
          triangle(px + 16, p.topY, px + 26, p.topY - 9, px + 32, p.topY);
        } else {
          fill("#7F5539");
          rect(px - 6, p.topY, 44, 16, 2);
        }
      }

      // S-5 分區 C 中央古代祭壇神龕背牆與聖火壁燈光暈（col 83~92）
      let altarX = 83 * 40;
      let altarW = 10 * 40;
      fill("#4A3222");
      rect(altarX, 110, altarW, 410, 8, 8, 0, 0);
      fill("#6C4A33");
      rect(altarX + 20, 130, altarW - 40, 390, 4, 4, 0, 0);
      let altarGlow = 120 + sin(frameCount * 0.06) * 45;
      fill(255, 209, 102, altarGlow);
      circle(altarX + altarW / 2, 225, 76);
      fill("#2B1C12");
      circle(altarX + altarW / 2, 225, 42);
      fill(64, 224, 208, altarGlow + 20);
      circle(altarX + altarW / 2, 225, 22);

      // S-6 沿途壁掛火炬與徑向漸層暖橘光暈（位置皆避開 row 7 棧道，且邊緣柔和淡出）
      const torchSpots = [
        { col: 15, y: 245 },
        { col: 31, y: 220 },
        { col: 54, y: 220 },
        { col: 72, y: 245 },
        { col: 83, y: 215 },
        { col: 92, y: 215 },
        { col: 103, y: 245 },
        { col: 119, y: 260 }
      ];
      let flicker = sin(frameCount * 0.22) * 5;
      let ctx = drawingContext;
      for (let ts of torchSpots) {
        let tx = ts.col * 40 + 20;
        let ty = ts.y;
        let glowR = 86 + flicker;

        // 徑向漸層暖橘光暈（柔和淡出至完全透明，無硬邊圓盤）
        ctx.save();
        let grad = ctx.createRadialGradient(tx, ty - 8, 4, tx, ty - 8, glowR);
        grad.addColorStop(0, "rgba(255, 215, 120, 0.34)");
        grad.addColorStop(0.45, "rgba(255, 155, 50, 0.16)");
        grad.addColorStop(1, "rgba(255, 130, 30, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(tx, ty - 8, glowR, 0, TWO_PI);
        ctx.fill();
        ctx.restore();

        // 壁掛火炬座與火焰
        fill("#3D2516");
        rect(tx - 3, ty, 6, 22, 2);
        fill("#FF7B00");
        ellipse(tx, ty - 6, 12, 18 + flicker * 0.3);
        fill("#FFD166");
        ellipse(tx, ty - 4, 6, 10);
      }
    }
  } else if (currentLevel === 2) {
    // 2-2：沙暴黃昏轉入地下邊緣（遠景半掩埋的遺跡石柱）
    fill(180, 120, 60, 85);
    for (let i = 0; i < 10; i++) {
      let rx = i * 340 + cameraX * 0.45;
      rect(rx, 80, 55, 520);
      rect(rx - 12, 80, 79, 26);
    }
  } else if (currentLevel === 3) {
    // 2-3：太陽神殿深處（暗紅神殿壁柱＋微弱火把壁燈光暈）
    fill("#1E1008");
    for (let i = 0; i < 12; i++) {
      let px = i * 300 + cameraX * 0.35;
      rect(px, 0, 70, 640);
      fill(255, 110, 30, 45);
      circle(px + 35, 190, 110);
      fill("#1E1008");
    }
  } else if (currentLevel === 4 && !window.isInMinerSupplyRoom) {
    // 2-4：幽暗古礦坑（深處礦道木梁支架）
    fill("#121222");
    for (let i = 0; i < 14; i++) {
      let mx = i * 280 + cameraX * 0.3;
      rect(mx, 0, 22, 640);
      rect(mx + 140, 0, 22, 640);
      rect(mx - 10, 40, 182, 20);
    }
  }

  // --- 2. 起點「來路地標」（讓玩家一進關卡往左看就知道自己怎麼來到這裡的） ---
  if (currentLevel === 2) {
    // 【2-2 起點】上方沙穴洞口＋斜射陽光光束＋向下的砂岩石階
    fill("#5C4033");
    for (let s = 0; s < 5; s++) {
      rect(10 + s * 26, 220 + s * 36, 95 - s * 10, 36);
    }
    fill(255, 245, 185, 55);
    quad(0, 0, 130, 0, 270, 520, 40, 520);
  } else if (currentLevel === 3) {
    // 【2-3 起點】上方神殿豎井入口＋垂落的繩梯（表示從上一區垂降進入神殿）
    fill("#3D2314");
    rect(45, 0, 16, 170);
    rect(135, 0, 16, 170);
    stroke("#C9963B");
    strokeWeight(3);
    line(76, 0, 76, 240);
    line(116, 0, 116, 225);
    for (let ry = 24; ry < 220; ry += 26) {
      line(76, ry, 116, ry);
    }
    noStroke();
  } else if (currentLevel === 4 && !window.isInMinerSupplyRoom) {
    // 【2-4 主礦坑起點】左側已升起開啟的厚重黑鐵礦坑閘門
    fill("#2B2D42");
    rect(18, 320, 112, 160, 8, 8, 0, 0);
    fill("#090912");
    rect(34, 340, 80, 140, 4, 4, 0, 0);
    fill("#6C757D");
    rect(34, 340, 80, 22);
    for (let gx = 40; gx < 110; gx += 14) {
      triangle(gx, 362, gx + 8, 362, gx + 4, 374);
    }
  }

  pop();
}
