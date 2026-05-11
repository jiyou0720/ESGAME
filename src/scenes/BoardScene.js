// src/scenes/BoardScene.js
import Phaser from 'phaser';

const BOARD_CELLS = [
  'START',  'SALARY', 'SPEND',  'SAVE',   'INVEST', 'ASSET',  'EVENT',  'QUIZ',
  'DONATE', 'SALARY', 'SPEND',  'INVEST', 'ASSET',  'QUIZ',   'EVENT',  'SAVE',
  'SALARY', 'DONATE', 'SPEND',  'INVEST', 'ASSET',  'QUIZ',   'EVENT',  'SAVE',
  'GROWTH', 'SALARY', 'SPEND',  'INVEST', 'ASSET',  'QUIZ',   'EVENT',  'DONATE',
];

const CELL_META = {
  START:   { color: 0xFFD700, label: 'START',  emoji: '🚀' },
  SALARY:  { color: 0x2ECC71, label: '월급',   emoji: '💰' },
  SPEND:   { color: 0xE74C3C, label: '소비',   emoji: '🛍️' },
  SAVE:    { color: 0x3498DB, label: '저축',   emoji: '🏦' },
  INVEST:  { color: 0x9B59B6, label: '투자',   emoji: '📈' },
  ASSET:   { color: 0xF39C12, label: '자산',   emoji: '🏪' },
  EVENT:   { color: 0xE67E22, label: '이벤트', emoji: '🎲' },
  QUIZ:    { color: 0x1ABC9C, label: '퀴즈',   emoji: '❓' },
  DONATE:  { color: 0xFF69B4, label: '나눔',   emoji: '❤️' },
  GROWTH:  { color: 0x27AE60, label: '성장',   emoji: '⬆️' },
};

const PLAYER_COLORS = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0xA29BFE];
const PLAYER_EMOJIS = ['🦊', '🐧', '🐨', '🦁'];
const PIECE_OFFSETS = [
  { x: -11, y: -11 },
  { x:  11, y: -11 },
  { x: -11, y:  11 },
  { x:  11, y:  11 },
];

export default class BoardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BoardScene' });
    this.cellPositions = [];
    this.playerPieces  = {};
    this.playerOrder   = [];
    this.gameState     = null;
  }

  create() {
    this._drawScene();

    this.events.on('updateGameState', (gs) => {
      this.gameState = gs;
      this._syncPlayerOrder(gs.players);
      this._movePieces();
    });

    // 리사이즈(방향 전환 포함) 시 전체 재구성
    this.scale.on('resize', () => {
      this.time.delayedCall(100, () => {
        this.children.removeAll(true);
        this.playerPieces = {};
        this._drawScene();
        if (this.gameState?.players) {
          this._syncPlayerOrder(this.gameState.players);
          this.gameState.players.forEach(p => {
            this._createPiece(p.id, this._getColorIndex(p.id), p.position || 0);
          });
        }
      });
    });
  }

  _drawScene() {
    const W = this.scale.width;
    const H = this.scale.height;

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x1A1A2E);

    // 격자 패턴
    const g = this.add.graphics();
    g.lineStyle(1, 0xffffff, 0.04);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    this._buildBoard(W, H);
  }

  _buildBoard(W, H) {
    // 가로/세로 모드 모두 대응: 짧은 쪽 기준으로 정사각형 보드
    const padding   = 4;
    const boardSize = Math.min(W, H) - padding * 2;
    const bx = (W - boardSize) / 2;
    const by = (H - boardSize) / 2;
    const cps      = 8;
    const cellSize = boardSize / cps;

    // 보드 배경
    const bg = this.add.graphics();
    bg.fillStyle(0x16213E, 1);
    bg.fillRoundedRect(bx, by, boardSize, boardSize, 10);
    bg.lineStyle(2, 0x4A90E2, 0.6);
    bg.strokeRoundedRect(bx, by, boardSize, boardSize, 10);

    // 중앙 패널
    const cx  = bx + boardSize / 2;
    const cy  = by + boardSize / 2;
    const inS = boardSize - cellSize * 2 - 4;

    const inner = this.add.graphics();
    inner.fillStyle(0x0F3460, 1);
    inner.fillRoundedRect(cx - inS / 2, cy - inS / 2, inS, inS, 8);

    const fs = Math.floor(cellSize * 0.46);
    this.add.text(cx, cy - fs * 0.65, '꿈꾸는', {
      fontSize: `${fs}px`,
      fontFamily: 'Noto Sans KR, sans-serif',
      color: '#FFD700', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, cy + fs * 0.45, '경제 어드벤처', {
      fontSize: `${Math.floor(fs * 0.65)}px`,
      fontFamily: 'Noto Sans KR, sans-serif',
      color: '#A0A0FF',
    }).setOrigin(0.5);
    this.add.text(cx, cy + fs * 1.32, '🎲', {
      fontSize: `${Math.floor(fs * 0.7)}px`,
    }).setOrigin(0.5);

    // 셀 위치 계산
    const positions = [];

    // 하단 좌→우 (0~7)
    for (let i = 0; i < cps; i++) {
      positions.push({
        x: bx + i * cellSize + cellSize / 2,
        y: by + boardSize - cellSize / 2,
      });
    }
    // 우측 하→상 (8~14)
    for (let i = 1; i < cps; i++) {
      positions.push({
        x: bx + boardSize - cellSize / 2,
        y: by + boardSize - (i + 1) * cellSize + cellSize / 2,
      });
    }
    // 상단 우→좌 (15~21)
    for (let i = 1; i < cps; i++) {
      positions.push({
        x: bx + boardSize - (i + 1) * cellSize + cellSize / 2,
        y: by + cellSize / 2,
      });
    }
    // 좌측 상→하 (22~29)
    for (let i = 1; i < cps - 1; i++) {
      positions.push({
        x: bx + cellSize / 2,
        y: by + i * cellSize + cellSize / 2,
      });
    }

    this.cellPositions = positions;

    positions.forEach((pos, idx) => {
      const key  = BOARD_CELLS[idx % BOARD_CELLS.length];
      const meta = CELL_META[key] || CELL_META['EVENT'];
      this._drawCell(pos.x, pos.y, cellSize, meta, idx);
    });
  }

  _drawCell(x, y, size, meta, idx) {
    const s = size - 3;
    const g = this.add.graphics();
    g.fillStyle(meta.color, 0.9);
    g.fillRoundedRect(x - s / 2, y - s / 2, s, s, 4);
    g.lineStyle(1, 0xffffff, 0.15);
    g.strokeRoundedRect(x - s / 2, y - s / 2, s, s, 4);

    const emojiSz = Math.max(8, Math.floor(size * 0.33));
    const labelSz = Math.max(6, Math.floor(size * 0.135));
    const numSz   = Math.max(5, Math.floor(size * 0.105));

    this.add.text(x, y - size * 0.08, meta.emoji, {
      fontSize: `${emojiSz}px`,
    }).setOrigin(0.5);

    this.add.text(x, y + size * 0.26, meta.label, {
      fontSize: `${labelSz}px`,
      fontFamily: 'Noto Sans KR, sans-serif',
      color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(x - size * 0.36, y - size * 0.38, `${idx + 1}`, {
      fontSize: `${numSz}px`,
      fontFamily: 'monospace',
      color: 'rgba(255,255,255,0.55)',
    }).setOrigin(0.5);
  }

  _syncPlayerOrder(players) {
    if (this.playerOrder.length === 0 && players?.length > 0) {
      this.playerOrder = players.map(p => p.id);
    }
  }

  _getColorIndex(playerId) {
    const idx = this.playerOrder.indexOf(playerId);
    return idx >= 0 ? idx : 0;
  }

  _createPiece(playerId, colorIdx, position) {
    if (this.playerPieces[playerId]) return;
    const pos = this.cellPositions[position % this.cellPositions.length];
    if (!pos) return;

    const offset    = PIECE_OFFSETS[colorIdx] || { x: 0, y: 0 };
    const container = this.add.container(pos.x + offset.x, pos.y + offset.y);
    const circle    = this.add.circle(0, 0, 14, PLAYER_COLORS[colorIdx], 1);
    circle.setStrokeStyle(2.5, 0xffffff, 1);
    const emoji = this.add.text(0, 1, PLAYER_EMOJIS[colorIdx], {
      fontSize: '15px',
    }).setOrigin(0.5);
    container.add([circle, emoji]);
    container.setDepth(10 + colorIdx);

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
    if (!this.gameState?.players || !this.cellPositions.length) return;

    this.gameState.players.forEach((player) => {
      const piece = this.playerPieces[player.id];
      if (!piece) {
        this._createPiece(player.id, this._getColorIndex(player.id), player.position || 0);
        return;
      }
      const targetPos = this.cellPositions[player.position % this.cellPositions.length];
      if (!targetPos) return;

      const tx = targetPos.x + piece.offset.x;
      const ty = targetPos.y + piece.offset.y;
      this.tweens.killTweensOf(piece.container);
      this.tweens.add({
        targets:  piece.container,
        x: tx, y: ty,
        duration: 700,
        ease:     'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets:  piece.container,
            y:        ty - 6,
            duration: 700 + piece.colorIdx * 150,
            yoyo:     true,
            repeat:   -1,
            ease:     'Sine.easeInOut',
          });
        },
      });
    });
  }

  showDiceAnimation(result) {
    const W     = this.scale.width;
    const H     = this.scale.height;
    const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    const small = Math.min(W, H) < 400;

    const overlay = this.add.rectangle(W / 2, H / 2,
      small ? 140 : 200, small ? 110 : 160,
      0x000000, 0.88).setDepth(50).setStrokeStyle(2, 0x4A90E2);
    const diceText = this.add.text(W / 2, H / 2 - (small ? 12 : 20), '🎲', {
      fontSize: small ? '40px' : '56px',
    }).setOrigin(0.5).setDepth(51);
    const numText = this.add.text(W / 2, H / 2 + (small ? 26 : 38), '', {
      fontSize: small ? '16px' : '22px',
      fontFamily: 'Noto Sans KR, sans-serif',
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
