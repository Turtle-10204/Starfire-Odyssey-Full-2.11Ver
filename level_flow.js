// =====================================================================
// level_flow.js — 關卡流程：startLevel（開始關卡）與退出關卡還原。
// =====================================================================

window.subSecretCheckpointState = window.subSecretCheckpointState || {
  active: false,
  world: 2,
  level: 1,
  col: 0,
  x: 0,
  y: 0
};

function resetAllCheckpoints() {
  if (typeof checkpointState !== "undefined") {
    checkpointState.active = false;
  }
  window.subSecretCheckpointState = {
    active: false,
    world: 2,
    level: 1,
    col: 0,
    x: 0,
    y: 0
  };
}

// 共用函式：載入 2-1 地下秘室（首次墜入流沙與秘室內死亡重生皆呼叫此函式）
function enterSubSecret(spawnX = null, spawnY = null, showEnterText = true) {
  is2_1SubSecret = true;
  let subData = buildWorld2SubSecretMap();
  loadLevelMap(subData.mapStrings);

  // 任務 0：清空主關卡殘留的移動平台（秘室刻意不設移動平台）
  movingPlatforms = [];
  items = [];
  coins = [];
  bumpingTiles = [];
  playerFireballs = [];
  if (typeof cactusNeedles !== "undefined") cactusNeedles = [];

  enemies = [];
  for (let sp of (subData.enemySpawns || [])) {
    let h = sp.type === "goomba" ? 30 : 38;
    enemies.push({
      type: sp.type,
      x: sp.col * TILE_SIZE + 20,
      y: sp.row * TILE_SIZE - h / 2 - 12,
      baseY: sp.row * TILE_SIZE - h / 2 - 24,
      w: 30, h: h, vx: -1.4, vy: 0,
      shellMoving: false, dead: false, flyPhase: random(TWO_PI),
      stunTimer: 0, knockbackX: 0
    });
  }

  // 從地圖資料讀取秘室起點（支援頂層 spawnCol/spawnRow 或 config.spawnCol/spawnRow）
  let defaultSpawnCol = (subData.spawnCol !== undefined)
    ? subData.spawnCol
    : (subData.config && subData.config.spawnCol !== undefined ? subData.config.spawnCol : 3);
  let defaultSpawnRow = (subData.spawnRow !== undefined)
    ? subData.spawnRow
    : (subData.config && subData.config.spawnRow !== undefined ? subData.config.spawnRow : 4);

  characterX = (spawnX !== null && spawnX !== undefined) ? spawnX : (defaultSpawnCol * TILE_SIZE + TILE_SIZE / 2);
  characterY = (spawnY !== null && spawnY !== undefined) ? spawnY : (defaultSpawnRow * TILE_SIZE);
  velocityY = 0;
  cameraX = max(0, characterX - (width / (typeof getEffectiveViewZoom === "function" ? getEffectiveViewZoom() : 1)) / 3);

  // 若是從秘室檢查點重生，將該欄的 'R' 還原為已啟動的 'r'
  if (window.subSecretCheckpointState && window.subSecretCheckpointState.active) {
    let cpCol = (window.subSecretCheckpointState.col > 0)
      ? window.subSecretCheckpointState.col
      : floor(characterX / TILE_SIZE);
    for (let fr = 0; fr < levelMap.length; fr++) {
      if (levelMap[fr][cpCol] === 'R') levelMap[fr][cpCol] = 'r';
    }
  }

  if (showEnterText) {
    quicksandFadeInTimer = millis();
    gameState = "PLAYING";
    floatingTexts.push({
      text: "被流沙吸入地下秘室！尋找紅色終點旗！",
      x: characterX,
      y: characterY - 30,
      vy: -1,
      life: 110,
      isOneUp: true
    });
  }
}

// 退出關卡回大地圖時還原進關前道具快照（避免重複刷道具）
function exitToWorldMapRestoreEntry() {
  if (typeof resetWallJumpState === "function") resetWallJumpState();
  if (typeof resetPipeTransitionState === "function") resetPipeTransitionState();
  resetAllCheckpoints();
  lives = levelEntrySnapshot.lives;
  powerLevel = levelEntrySnapshot.powerLevel;
  powerType = levelEntrySnapshot.powerType;
  reservedItem = levelEntrySnapshot.reservedItem;
  coinCount = levelEntrySnapshot.coinCount;
  score = levelEntrySnapshot.score;
  deathAnimTimer = 0;
  deathAnimStage = 0;
  deathAnimFinished = false;
  dashToggleActive = false;
  mobileDashLocked = false;
  showSettingsModal = false;
  showExitMapConfirmModal = false;
  saved2_4MainState = null;
  initialW2L4Spawns = null;
  window.isInMinerSupplyRoom = false;
  is2_1SubSecret = false;
  gameState = "WORLD_MAP";
  playSFX("mapMove");
}

function startLevel(levelNum, resetRunStats, keepPowerup = false) {
  if (typeof resetWallJumpState === "function") resetWallJumpState();
  if (typeof resetPipeTransitionState === "function") resetPipeTransitionState();
  if (resetRunStats) {
    resetAllCheckpoints();
    is2_1SubSecret = false;
  }

  deathAnimTimer = 0;
  deathAnimStage = 0;
  deathAnimFinished = false;
  if (typeof touchControls !== "undefined") {
    touchControls.left = false;
    touchControls.right = false;
    touchControls.down = false;
    touchControls.jump = false;
    touchControls.fire = false;
  }
  prevTouchJump = false;
  prevTouchFire = false;

  castleFlagRaised = false;
  castleFlagProgress = 0;
  flagDropY = 0;
  dashToggleActive = false;
  mobileDashLocked = false;
  safePositionHistory = [];
  currentLevel = levelNum;
  movingPlatforms = [];
  fireBars = [];
  boss = null;
  bossFireballs = [];
  bridgeCollapsing = false;
  transformTimer = 0;
  invincibleTimer = 0;
  starTimer = 0;
  currentSprintBonus = 0;
  knockbackVX = 0;
  bumpingTiles = [];
  playerFireballs = [];
  enemies = [];
  levelTimer = 400;
  saved2_4MainState = null;
  initialW2L4Spawns = null;
  window.isInMinerSupplyRoom = false;

  // 判斷本次死亡重生是否應留在 2-1 地下秘室（已進過秘室且未重置整輪遊戲）
  let wasIn2_1SubSecret = (!resetRunStats && currentWorld === 2 && levelNum === 1 && typeof is2_1SubSecret !== "undefined" && is2_1SubSecret);
  let useSubCheckpoint = (
    !resetRunStats &&
    currentWorld === 2 &&
    levelNum === 1 &&
    window.subSecretCheckpointState &&
    window.subSecretCheckpointState.active &&
    window.subSecretCheckpointState.world === 2 &&
    window.subSecretCheckpointState.level === 1
  );
  let respawnInSubSecret = (wasIn2_1SubSecret || useSubCheckpoint);

  if (currentWorld === 2) {
    is1_2Intro = false;
    isSecretClear = false;
    is2_1SubSecret = respawnInSubSecret;
    torchCount = 0;
    placedTorches = [];
    hasMinerHeadlamp = false;
    endClearBonusSmoke = [];
    wormRocks = [];
    playerStunTimer = 0;
    rescueCutscene = null;
    sandwormBoss = null;

    let useCheckpoint = (!respawnInSubSecret && typeof checkpointState !== "undefined" && checkpointState.active && checkpointState.world === 2 && checkpointState.level === levelNum);
    let w2Data = buildWorld2Level(levelNum);
    levelTimer = w2Data.config.timeLimit;

    if (respawnInSubSecret) {
      // 留在 2-1 秘室重生（有秘室檢查點用檢查點座標，否則回秘室起點，不覆蓋主關卡檢查點）
      let rx = useSubCheckpoint ? window.subSecretCheckpointState.x : null;
      let ry = useSubCheckpoint ? window.subSecretCheckpointState.y : null;
      enterSubSecret(rx, ry, false);
    } else {
      // 方案 E：進入 2-4 時先保存初始 spawn 副本（必須獨立於 !useCheckpoint 條件）
      if (levelNum === 4) {
        initialW2L4Spawns = {
          enemySpawns: (w2Data.enemySpawns || []).map(sp => ({ ...sp })),
          platformSpawns: (w2Data.platformSpawns || []).map(pl => ({ ...pl }))
        };
      }

      if (levelNum === 4 && !useCheckpoint) {
        window.isInMinerSupplyRoom = true;
        saved2_4MainState = {
          mapStrings: w2Data.mapStrings,
          enemySpawns: initialW2L4Spawns.enemySpawns.map(sp => ({ ...sp })),
          platformSpawns: initialW2L4Spawns.platformSpawns.map(pl => ({ ...pl }))
        };
        let roomData = buildWorld2MinerSupplyRoom();
        loadLevelMap(roomData.mapStrings);
        movingPlatforms = [];
        minerLampPickup = { x: 12.5 * TILE_SIZE + 20, y: 12 * TILE_SIZE + 12, taken: false };
      } else {
        window.isInMinerSupplyRoom = false;
        minerLampPickup = null;
        loadLevelMap(w2Data.mapStrings);
        movingPlatforms = (w2Data.platformSpawns || []).map(pl => ({ ...pl }));
      }

      if (levelNum === 5) {
        let arenaLeftX = (levelMap[0].length - 58) * TILE_SIZE;
        let arenaRightX = (levelMap[0].length - 10) * TILE_SIZE;
        sandwormBoss = {
          active: false,
          doorLocked: false,
          doorOpened: false,
          arenaLeft: arenaLeftX,
          arenaRight: arenaRightX,
          hp: 150,
          maxHp: 150,
          state: "IDLE",
          timer: 60,
          nextAttack: "",
          lastAttack: "",
          segments: [],
          headX: arenaRightX - 180,
          headY: 9 * TILE_SIZE,
          vx: 0,
          vy: 0,
          dir: -1,
          arcProgress: 0,
          beamAngle: 0,
          hurtFlash: 0
        };
        for (let i = 0; i < 16; i++) {
          sandwormBoss.segments.push({ x: sandwormBoss.headX, y: sandwormBoss.headY });
        }
      }

      enemies = [];
      if (!window.isInMinerSupplyRoom) {
        for (let sp of w2Data.enemySpawns) {
          let h = sp.type === "goomba" ? 30 : 38;
          enemies.push({
            type: sp.type,
            x: sp.col * TILE_SIZE + 20,
            y: sp.row * TILE_SIZE - h / 2 - 12,
            baseY: sp.row * TILE_SIZE - h / 2 - 24,
            w: 30, h: h, vx: -1.4, vy: 0,
            shellMoving: false, dead: false, flyPhase: random(TWO_PI),
            stunTimer: 0, knockbackX: 0
          });
        }
      }
    }
  } 
  else {
    is2_1SubSecret = false;
    if (levelNum === 1) {
      is1_2Intro = false;
      loadLevelMap(MAP_1_1);
      spawnLevelEnemies(1);
    } else if (levelNum === 2) {
      is1_2Intro = true;
      loadLevelMap(MAP_1_2_INTRO);
    } else if (levelNum === 3) {
      is1_2Intro = false;
      loadLevelMap(MAP_1_3);
      spawnLevelEnemies(3);
      movingPlatforms = [
        { x: 102 * TILE_SIZE, y: 10 * TILE_SIZE, w: 3 * TILE_SIZE, h: 16, minX: 100 * TILE_SIZE, maxX: 112 * TILE_SIZE, speed: 2.2, dx: 0 },
        { x: 122 * TILE_SIZE, y: 8 * TILE_SIZE,  w: 3 * TILE_SIZE, h: 16, minX: 118 * TILE_SIZE, maxX: 132 * TILE_SIZE, speed: -2.5, dx: 0 }
      ];
    } else {
      is1_2Intro = false;
      loadLevelMap(MAP_1_4);
      spawnLevelEnemies(4);

      movingPlatforms = [
        { x: 122 * TILE_SIZE, y: 11 * TILE_SIZE, w: 3 * TILE_SIZE, h: 16, minX: 121 * TILE_SIZE, maxX: 135 * TILE_SIZE, speed: 2.4, dx: 0 }
      ];

      fireBars = [
        { cx: 43 * TILE_SIZE + 20, cy: 12 * TILE_SIZE + 20, angle: 0, speed: 0.032, count: 6, spacing: 20 },
        { cx: 72 * TILE_SIZE + 20, cy: 12 * TILE_SIZE + 20, angle: PI, speed: -0.035, count: 6, spacing: 20 },
        { cx: 105 * TILE_SIZE + 20, cy: 9 * TILE_SIZE + 20, angle: HALF_PI, speed: 0.038, count: 6, spacing: 20 }
      ];

      boss = {
        x: 185 * TILE_SIZE,
        y: 11 * TILE_SIZE - 42,
        w: 64,
        h: 84,
        vx: -1.6,
        vy: 0,
        minX: 173 * TILE_SIZE,
        maxX: 190 * TILE_SIZE,
        hp: 12,
        maxHp: 12,
        alive: true,
        falling: false,
        flashTimer: 0,
        lastFireTime: millis(),
        lastJumpTime: millis()
      };
    }
  }

  gameState = "LEVEL_INTRO";
  stateTimer = millis();

  isExitingPipe = false;
  isExitingCeilingPipe = false;

  if (!respawnInSubSecret) {
    characterX = 100;
    characterY = 100;
    if (currentWorld === 2 && levelNum === 4 && window.isInMinerSupplyRoom) {
      characterX = 2.5 * TILE_SIZE;
      characterY = 2.2 * TILE_SIZE;
      isExitingCeilingPipe = true;
      playSFX("shrink");
    }
    if (typeof checkpointState !== "undefined" && checkpointState.active && checkpointState.world === currentWorld && checkpointState.level === levelNum) {
      characterX = checkpointState.x;
      characterY = checkpointState.y;
      let cpCol = floor(characterX / TILE_SIZE);
      for (let fr = 0; fr < levelMap.length; fr++) {
        if (levelMap[fr][cpCol] === 'R') levelMap[fr][cpCol] = 'r';
      }
    }
  }
  velocityY = 0;

  if (resetRunStats) {
    score = 0;
    lives = 3;
    coinCount = 0;
    reservedItem = null;
  }
  if (!keepPowerup) {
    powerLevel = 1;
    powerType = "none";
  }

  if (keepPowerup) {
    levelEntrySnapshot = { lives, powerLevel, powerType, reservedItem, coinCount, score };
  }

  isCrouching = false;
  prevHitboxH = (powerLevel >= 2) ? BIG_HITBOX_H : BASE_HITBOX_H;
  hideCharacter = false;
  isGliding = false;
  isActionLocked = false;
  isShortJump = false;
  featherFlapsLeft = 2;
  isAttacking = false;
  items = [];
  coins = [];
  brickParticles = [];
  activeEffects = [];
  floatingTexts = [];
}
