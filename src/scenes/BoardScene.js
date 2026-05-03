// src/scenes/BoardScene.js
import Phaser from 'phaser';

// 보드 칸 순서 - 이미지 기준:
// 0=START(좌하), 1~7=하단 좌→우, 8~14=우측 하→상, 15~21=상단 우→좌, 22~29=좌측 상→하
const BOARD_CELLS = [
  'START',  // 0  - 좌하 코너
  'SALARY', // 1
  'SPEND',  // 2
  'SAVE',   // 3
  'INVEST', // 4
  'ASSET',  // 5
  'EVENT',  // 6
  'QUIZ',   // 7  - 우하 코너
  'DONATE', // 8
  'SALARY', // 9
  'SPEND',  // 10
  'INVEST', // 11
  'ASSET',  // 12
  'QUIZ',   // 13
  'EVENT',  // 14  - 우상 코너
  'SAVE',   // 15
  'SALARY', // 16
  'DONATE', // 17
  'SPEND',  // 18 (소비)
  'INVEST', // 19
  'ASSET',  // 20
  'QUIZ',   // 21 (퀴즈) - 좌상 코너
  'EVENT',  // 22
  'SAVE',   // 23
  'GROWTH', // 24
  'SALARY', // 25
  'SPEND',  // 26
  'INVEST', // 27
  'ASSET',  // 28
  'QUIZ',   // 29
  'EVENT',  // 30
  'DONATE', // 31
];

const CELL_META = {
  START:   { color: 0xFFD700, label: 'START',  emoji: '🚀' },
  SALARY:  { color: 0x2ECC71, label: '월급',    emoji: '💰' },
  SPEND:   { color: 0xE74C3C, label: '소비',    emoji: '🛍️' },
  SAVE:    { color: 0x3498DB, label: '저축',    emoji: '🏦' },
  INVEST:  { color: 0x9B59B6, label: '투자',    emoji: '📈' },
  ASSET:   { color: 0xF39C12, label: '자산',    emoji: '🏪' },
  EVENT:   { color: 0xE67E22, label: '이벤트',  emoji: '🎲' },
  QUIZ:    { color: 0x1ABC9C, label: '퀴즈',    emoji: '❓' },
  DONATE:  { color: 0xFF69B4, label: '나눔',    emoji: '❤️' },
  GROWTH:  { color: 0x27AE60, label: '성장',    emoji: '⬆️' },
};

// 플레이어별 고유 색상 & 이모지
const PLAYER_COLORS = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0xA29BFE];
const PLAYER_EMOJIS = ['🦊', '🐧', '🐨', '🦁'];
// 같은 칸에 있을 때 겹치지 않도록 오프셋
const PIECE_OFFSETS = [
  { x: -11, y: -11 },
  { x:  11, y: -11 },
  { x: -11, y:  11 },
  { x:  11, y:  11 },
];

export default class BoardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BoardScene' });
    this.cellPositions = []; // 각 칸의 픽셀 좌표
    this.playerPieces  = {}; // playerId → { container, colorIndex, offset }
    this.playerOrder   = []; // 플레이어 순서 (인덱스 보장용)
  }

  init(data) {
    this.gameState  = data?.gameState  || null;
    this.myPlayerId = data?.myPlayerId || null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E);

    // 격자 배경
    const g = this.add.graphics();
    g.lineStyle(1, 0xffffff, 0.04);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    this._buildBoard();
    this._buildPlayerPieces();

    // 게임 상태 업데이트 수신
    this.events.on('updateGameState', (gs) => {
      this.gameState = gs;
      this._syncPlayerOrder(gs.players);
      this._movePieces();
    });

    // 리사이즈 대응
    this.scale.on('resize', this._onResize, this);
  }

  _onResize() {
    // 보드 재빌드는 비용이 크므로 단순 재배치만
    if (this.gameState) this._movePieces();
  }

  // ─── 보드 구성 ──────────────────────────────────────────────────────────────
  _buildBoard() {
    const W        = this.scale.width;
    const H        = this.scale.height;
    // 모바일에서 HUD 공간 확보를 위해 세로를 조금 줄임
    const isMobile = W < 500;
    const boardSize = isMobile
      ? Math.min(W, H) * 0.95
      : Math.min(W, H) * 0.88;

    const bx       = W / 2 - boardSize / 2;
    const by       = isMobile ? 4 : H / 2 - boardSize / 2 + 10;
    const cps      = 8; // 한 변에 8칸 (코너 포함)
    const cellSize = boardSize / cps;

    // 보드 배경
    const bg = this.add.graphics();
    bg.fillStyle(0x16213E, 1);
    bg.fillRoundedRect(bx - 2, by - 2, boardSize + 4, boardSize + 4, 12);
    bg.lineStyle(2, 0x4A90E2, 0.5);
    bg.strokeRoundedRect(bx - 2, by - 2, boardSize + 4, boardSize + 4, 12);

    // 중앙 패널
    const cx  = bx + boardSize / 2;
    const cy  = by + boardSize / 2;
    const inS = boardSize - cellSize * 2 - 6;
    const inner = this.add.graphics();
    inner.fillStyle(0x0F3460, 1);
    inner.fillRoundedRect(cx - inS / 2, cy - inS / 2, inS, inS, 10);

    const fs = Math.floor(cellSize * (isMobile ? 0.45 : 0.5));
    this.add.text(cx, cy - fs * 0.6, '꿈꾸는', {
      fontSize: `${fs}px`, fontFamily: 'Noto Sans KR,sans-serif',
      color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, cy + fs * 0.5, '경제 어드벤처', {
      fontSize: `${Math.floor(fs * 0.68)}px`, fontFamily: 'Noto Sans KR,sans-serif',
      color: '#A0A0FF',
    }).setOrigin(0.5);
    this.add.text(cx, cy + fs * 1.4, '🎲', {
      fontSize: `${Math.floor(fs * 0.75)}px`,
    }).setOrigin(0.5);

    // ─── 칸 위치 계산 ─────────────────────────────────────────────────────────
    // 총 32칸: 하단(0~7 좌→우), 우측(8~14 하→상), 상단(15~21 우→좌), 좌측(22~29 상→하)
    // cps=8이므로 각 변에 8칸, 코너는 공유 → 4*(8-1)+4 = 32칸
    const positions = [];

    // 하단: 좌→우 (0 ~ 7)
    for (let i = 0; i < cps; i++) {
      positions.push({
        x: bx + i * cellSize + cellSize / 2,
        y: by + boardSize - cellSize / 2,
      });
    }
    // 우측: 하→상 (8 ~ 14), 코너(7) 제외하고 위로
    for (let i = 1; i < cps; i++) {
      positions.push({
        x: bx + boardSize - cellSize / 2,
        y: by + boardSize - (i + 1) * cellSize + cellSize / 2,
      });
    }
    // 상단: 우→좌 (15 ~ 21), 코너(14) 제외하고 왼쪽으로
    for (let i = 1; i < cps; i++) {
      positions.push({
        x: bx + boardSize - (i + 1) * cellSize + cellSize / 2,
        y: by + cellSize / 2,
      });
    }
    // 좌측: 상→하 (22 ~ 29), 코너(21,0) 제외
    for (let i = 1; i < cps - 1; i++) {
      positions.push({
        x: bx + cellSize / 2,
        y: by + i * cellSize + cellSize / 2,
      });
    }

    this.cellPositions = positions;

    // 각 칸 그리기
    positions.forEach((pos, idx) => {
      const key  = BOARD_CELLS[idx % BOARD_CELLS.length];
      const meta = CELL_META[key] || CELL_META['EVENT'];
      this._drawCell(pos.x, pos.y, cellSize, meta, idx, isMobile);
    });
  }

  _drawCell(x, y, size, meta, idx, isMobile) {
    const pad = 2;
    const s   = size - pad * 2;

    const g = this.add.graphics();
    g.fillStyle(meta.color, 0.85);
    g.fillRoundedRect(x - s / 2, y - s / 2, s, s, 5);
    g.lineStyle(1, 0xffffff, 0.2);
    g.strokeRoundedRect(x - s / 2, y - s / 2, s, s, 5);

    const emojiSz = Math.max(isMobile ? 10 : 12, Math.floor(size * (isMobile ? 0.32 : 0.36)));
    const labelSz = Math.max(isMobile ? 7  : 8,  Math.floor(size * (isMobile ? 0.13 : 0.15)));
    const numSz   = Math.max(isMobile ? 6  : 7,  Math.floor(size * (isMobile ? 0.11 : 0.13)));

    this.add.text(x, y - size * 0.08, meta.emoji, { fontSize: `${emojiSz}px` }).setOrigin(0.5);
    this.add.text(x, y + size * 0.26, meta.label, {
      fontSize: `${labelSz}px`, fontFamily: 'Noto Sans KR,sans-serif',
      color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(x - size * 0.36, y - size * 0.38, `${idx + 1}`, {
      fontSize: `${numSz}px`, fontFamily: 'monospace',
      color: 'rgba(255,255,255,0.5)',
    }).setOrigin(0.5);
  }

  // ─── 플레이어 기물 ──────────────────────────────────────────────────────────
  _syncPlayerOrder(players) {
    // 첫 수신 시 순서 고정 (이후 동일하게 유지)
    if (this.playerOrder.length === 0 && players?.length > 0) {
      this.playerOrder = players.map(p => p.id);
    }
  }

  _getColorIndex(playerId) {
    const idx = this.playerOrder.indexOf(playerId);
    return idx >= 0 ? idx : 0;
  }

  _buildPlayerPieces() {
    if (!this.gameState?.players) return;
    this._syncPlayerOrder(this.gameState.players);
    this.gameState.players.forEach((player) => {
      const colorIdx = this._getColorIndex(player.id);
      this._createPiece(player.id, colorIdx, player.position || 0);
    });
  }

  _createPiece(playerId, colorIdx, position) {
    if (this.playerPieces[playerId]) return; // 이미 존재하면 스킵

    const pos    = this.cellPositions[position % this.cellPositions.length];
    if (!pos) return;

    const offset = PIECE_OFFSETS[colorIdx] || { x: 0, y: 0 };

    const container = this.add.container(pos.x + offset.x, pos.y + offset.y);

    // 배경 원 (플레이어 고유 색상)
    const circle = this.add.circle(0, 0, 14, PLAYER_COLORS[colorIdx], 1);
    circle.setStrokeStyle(2.5, 0xffffff, 1);

    // 플레이어 고유 이모지
    const emoji = this.add.text(0, 1, PLAYER_EMOJIS[colorIdx], {
      fontSize: '15px',
    }).setOrigin(0.5);

    container.add([circle, emoji]);
    container.setDepth(10 + colorIdx);

    // 살짝 위아래 떠다니는 애니메이션 (플레이어마다 타이밍 다르게)
    this.tweens.add({
      targets:  container,
      y:        container.y - 6,
      duration: 700 + colorIdx * 150,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });

    this.playerPieces[playerId] = { container, colorIdx, offset };
  }

  _movePieces() {
    if (!this.gameState?.players || this.cellPositions.length === 0) return;

    this.gameState.players.forEach((player) => {
      let piece = this.playerPieces[player.id];

      // 아직 기물이 없으면 생성
      if (!piece) {
        const colorIdx = this._getColorIndex(player.id);
        this._createPiece(player.id, colorIdx, player.position || 0);
        return;
      }

      const targetPos = this.cellPositions[player.position % this.cellPositions.length];
      if (!targetPos) return;

      const targetX = targetPos.x + piece.offset.x;
      const targetY = targetPos.y + piece.offset.y;

      // 기존 tween 제거 후 이동
      this.tweens.killTweensOf(piece.container);

      this.tweens.add({
        targets:  piece.container,
        x:        targetX,
        y:        targetY,
        duration: 700,
        ease:     'Back.easeOut',
        onComplete: () => {
          // 이동 완료 후 다시 둥실둥실 애니메이션
          this.tweens.add({
            targets:  piece.container,
            y:        targetY - 6,
            duration: 700 + piece.colorIdx * 150,
            yoyo:     true,
            repeat:   -1,
            ease:     'Sine.easeInOut',
          });
        },
      });
    });
  }

  // ─── 주사위 애니메이션 ───────────────────────────────────────────────────────
  showDiceAnimation(result) {
    const W     = this.scale.width;
    const H     = this.scale.height;
    const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    const isMobile = W < 500;

    const boxW = isMobile ? 160 : 200;
    const boxH = isMobile ? 130 : 160;

    const overlay  = this.add.rectangle(W / 2, H / 2, boxW, boxH, 0x000000, 0.85)
      .setDepth(50).setStrokeStyle(2, 0x4A90E2);
    const diceText = this.add.text(W / 2, H / 2 - (isMobile ? 16 : 22), '🎲', {
      fontSize: isMobile ? '48px' : '60px',
    }).setOrigin(0.5).setDepth(51);
    const numText  = this.add.text(W / 2, H / 2 + (isMobile ? 32 : 42), '', {
      fontSize: isMobile ? '20px' : '26px',
      fontFamily: 'Noto Sans KR,sans-serif',
      color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51);

    let count = 0;
    this.time.addEvent({
      delay: 80, repeat: 15,
      callback: () => {
        diceText.setText(faces[Phaser.Math.Between(0, 5)]);
        count++;
        if (count >= 15) {
          diceText.setText(faces[result - 1]);
          numText.setText(`${result}칸 이동!`);
          this.time.delayedCall(1000, () => {
            overlay.destroy();
            diceText.destroy();
            numText.destroy();
          });
        }
      },
    });
  }
}
