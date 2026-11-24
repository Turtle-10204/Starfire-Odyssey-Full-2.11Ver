// =====================================================================
// config.js — 常數與設定（影格數、碰撞盒、格子大小、道具圖鑑文字）。調整數值平衡請改這裡。
// =====================================================================

const POWERUP_GUIDE_DB = {
  mushroom: {
    title: "超級蘑菇 (Super Mushroom)",
    color: "#E63946",
    desc: [
      "• 吃下後體型變大，多獲得 1 次耐傷機會！",
      "• 向上跳躍頂撞磚塊可直接撞碎。",
      "• 獲得一次受傷機會。"
    ]
  },
  fire: {
    title: "火焰花 (Fire Flower)",
    color: "#FF5400",
    desc: [
      "• 按 [F] 發射「追蹤穿牆火焰彈」！",
      "• 火焰彈會自動追蹤最近的敵人，並可穿透牆壁與障礙物。",
      "• 擊中魔王可造成 3 倍高額傷害！"
    ]
  },
  feather: {
    title: "羽翼披風 (Feather Cape)",
    color: "#FFB703",
    desc: [
      "• 每次起跳最多可連續振翅 2 次，輕鬆飛過大深淵。",
      "• 按住跳躍鍵可緩慢滑翔飄落，方便對準落腳點。",
      "• 在即將墜落到深淵時，切換道具或許可以救你一命？"
    ]
  },
  speed: {
    title: "疾風加速菇 (Speed Mushroom)",
    color: "#0096C7",
    desc: [
      "• 奔跑速度大幅提升，助跑後能跳得更遠！",
      "• 電腦版按一下 [Ctrl] 切換衝刺開關；手機版點一下 [DASH] 開啟。",
      "• 加速跑到最高速時，可暈眩敵人 3 秒並將其撞退。"
    ]
  },
  cactus: {
    title: "仙人掌刺甲菇 (Cactus Mushroom)",
    color: "#2D6A4F",
    desc: [
      "• 按 ↓ 展開護罩，可反殺怪物與震碎仙人掌柱。",
      "• 按 [F] 射擊可發射「穿透飛針」，一路貫穿整排敵人！",
      "• 面對Boss時，蹲下會有格檔效果。",
      "• 注意：站立或走路直接撞到怪物還是會受傷喔！"
    ]
  },
  chrono: {
    title: "時光沙漏菇 (Chrono Mushroom)",
    color: "#D97706",
    desc: [
      "• 按一下 [Ctrl]（手機點 [DASH]）展開「時光領域」。",
      "• 時光領域介紹：進入的敵人會緩速，剛開啟時，再領域內的敵人會受到時光震波的傷害並暈眩3秒。",
      "• 踩在沙漠流沙坑上完全不會下沉，能像平地一樣行走。",
      "• 不小心墜落或受致命傷時，會自動消耗能力回溯到2秒前的位置。（免死一次）！"
    ]
  },
  star: {
    title: "無敵星星 (Super Star)",
    color: "#FFD166",
    desc: [
      "• 8 秒內進入七彩閃爍無敵狀態！",
      "• 不怕任何怪物、旋轉火棒與魔王火球。",
      "• 直接撞過去就能把敵人通通撞飛並賺取額外分數！"
    ]
  }
};

// 動畫影格設定
const WALK_FRAME_COUNT = 8; 

const STAND_FRAME_COUNT = 7; 

const JUMP_FRAME_COUNT = 10; 

const JUMP_MOVE_FRAME_COUNT = 23; 

const FALLING_FRAME_COUNT = 3;    

const ATTACK_FRAME_COUNT = 12;   

const SQUAT_FRAME_COUNT = 5;        

const SQUAT_MOVE_FRAME_COUNT = 12;  

const DEAD_FRAME_COUNT = 12;

const BASE_FRAME_INTERVAL = 100;  

const MOVE_SPEED = 4; 

// 地圖系統設定
const TILE_SIZE = 40; 

const BASE_HITBOX_W = 22;

const BASE_HITBOX_H = 46; 

const BIG_HITBOX_W = 28;

const BIG_HITBOX_H = 74;
