// server/index.js
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3001;

const rooms = {};

const BOARD_CELLS = [
  'START',  // 0
  'SALARY', // 1
  'SPEND',  // 2
  'SAVE',   // 3
  'INVEST', // 4
  'ASSET',  // 5
  'EVENT',  // 6
  'QUIZ',   // 7
  'DONATE', // 8
  'SALARY', // 9
  'SPEND',  // 10
  'INVEST', // 11
  'ASSET',  // 12
  'QUIZ',   // 13
  'EVENT',  // 14
  'SAVE',   // 15
  'SALARY', // 16
  'DONATE', // 17
  'SPEND',  // 18
  'INVEST', // 19
  'ASSET',  // 20
  'QUIZ',   // 21
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

const JOBS = {
  chef:     { name: '요리사',   salary: 2000, spendDiscount: 0.2 },
  dev:      { name: '개발자',   salary: 3000, investBonus: 0.1   },
  police:   { name: '경찰관',   salary: 2500, eventProtect: 0.3  },
  youtuber: { name: '유튜버',   salary: 1500, quizDouble: true    },
  designer: { name: '디자이너', salary: 2200, assetBonus: 0.15   },
};

const ASSET_DATA = {
  stationery: { name: '문구점',      price: 3000,  rent: 500,  emoji: '✏️' },
  tteok:      { name: '떡볶이 가게', price: 5000,  rent: 800,  emoji: '🌶️' },
  cafe:       { name: '카페',        price: 8000,  rent: 1200, emoji: '☕' },
  app:        { name: '앱 개발사',   price: 12000, rent: 2000, emoji: '📱' },
};

const EVENTS_POS = [
  { description: '용돈을 받았어요!',     amount: 1500 },
  { description: '중고 거래 성공!',       amount: 2000 },
  { description: '퀴즈 보너스 획득!',     amount: 1000 },
  { description: '친구 생일 선물 받음!',  amount: 800  },
];
const EVENTS_NEG = [
  { description: '학용품을 잃어버렸어요.', amount: -800  },
  { description: '물건이 고장났어요.',      amount: -1200 },
  { description: '예상치 못한 지출!',       amount: -1000 },
  { description: '병원에 다녀왔어요.',      amount: -1500 },
];

// ─── 타이밍 상수 ──────────────────────────────────────────────────────────────
// 주사위 애니메이션(~2초) + 말 이동 애니메이션(~0.7초) + 여유(0.5초) = 3.2초
const CELL_EVENT_DELAY = 3200;

function genCode() {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code;
  do { code = Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join(''); }
  while (rooms[code]);
  return code;
}

function makePlayer(id, name, isHost) {
  return {
    id, name, isHost,
    ready: false, jobId: null, jobName: null,
    money: 5000, savings: 0, assets: [], assetValue: 0,
    happiness: 0, quizScore: 0, position: 0, salary: 2000,
  };
}

function calcScore(p) {
  return Math.floor(
    (p.money * 1) + (p.savings * 1.2) + (p.assetValue * 1.5) +
    (p.happiness * 100) + (p.quizScore * 200)
  );
}

function broadcastState(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  room.gameState.players = room.players;
  io.to(roomCode).emit('game:stateUpdate', {
    gameState: room.gameState,
    currentTurn: room.currentTurn,
  });
}

io.on('connection', (socket) => {
  console.log('[+]', socket.id);

  socket.on('room:create', ({ playerName }, cb) => {
    const roomCode = genCode();
    const player   = makePlayer(socket.id, playerName, true);
    rooms[roomCode] = {
      code: roomCode, players: [player], phase: 'lobby',
      currentTurn: null, turnIndex: 0, gameState: null,
      totalTurns: 20, turnsPlayed: 0,
    };
    socket.join(roomCode);
    socket.roomCode = roomCode;
    cb?.({ ok: true });
    socket.emit('room:created', { roomCode, players: rooms[roomCode].players, playerId: socket.id });
    console.log(`방 생성: ${roomCode} by ${playerName}`);
  });

  socket.on('room:join', ({ roomCode, playerName }, cb) => {
    const room = rooms[roomCode];
    if (!room)                    return cb?.({ error: '방을 찾을 수 없어요!' });
    if (room.players.length >= 4) return cb?.({ error: '방이 가득 찼어요!' });
    if (room.phase !== 'lobby')   return cb?.({ error: '이미 게임이 시작됐어요!' });

    const player = makePlayer(socket.id, playerName, false);
    room.players.push(player);
    socket.join(roomCode);
    socket.roomCode = roomCode;
    cb?.({ ok: true });
    socket.emit('room:joined', { roomCode, players: room.players, playerId: socket.id });
    socket.to(roomCode).emit('room:playersUpdated', { players: room.players });
    console.log(`방 참여: ${roomCode} by ${playerName}`);
  });

  function handleLeave(socket, roomCode) {
    const room = rooms[roomCode];
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(roomCode);
    if (room.players.length === 0) {
      delete rooms[roomCode];
    } else {
      if (!room.players.find(p => p.isHost)) room.players[0].isHost = true;
      io.to(roomCode).emit('room:playersUpdated', { players: room.players });
    }
  }

  socket.on('room:leave', ({ roomCode }) => handleLeave(socket, roomCode));
  socket.on('disconnect', () => {
    if (socket.roomCode) handleLeave(socket, socket.roomCode);
  });

  socket.on('room:ready', ({ roomCode, ready }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) player.ready = ready;
    io.to(roomCode).emit('room:playersUpdated', { players: room.players });
  });

  socket.on('game:start', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    if (!room.players.find(p => p.id === socket.id)?.isHost) return;
    if (room.players.length < 2) return;
    room.phase = 'jobSelect';
    io.to(roomCode).emit('game:jobSelectPhase');
  });

  socket.on('game:selectJob', ({ roomCode, jobId }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    const job = JOBS[jobId];
    if (job) { player.jobId = jobId; player.jobName = job.name; player.salary = job.salary; }

    if (room.players.every(p => p.jobId)) {
      room.phase       = 'playing';
      room.gameState   = { players: room.players, boardCells: BOARD_CELLS };
      room.currentTurn = room.players[0].id;
      broadcastState(roomCode);
    }
  });

  // ── 주사위 굴리기 ──
  // 순서: diceRolled 이벤트 → 클라이언트에서 주사위 애니메이션 + 말 이동
  //       → CELL_EVENT_DELAY(3.2초) 후 셀 이벤트 전송
  socket.on('game:rollDice', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.currentTurn !== socket.id) return;

    const result = Math.floor(Math.random() * 6) + 1;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const prevPosition = player.position;
    player.position    = (player.position + result) % BOARD_CELLS.length;
    const cellType     = BOARD_CELLS[player.position];
    const cellName     = cellType;

    // 1) 모든 클라이언트에게 주사위 결과 + 새 위치 + 칸 이름 전송
    io.to(roomCode).emit('game:diceRolled', {
      result,
      playerId:    socket.id,
      newPosition: player.position,
      cellType:    cellName,
    });

    // 2) 게임 상태 업데이트 (말 위치 반영)
    broadcastState(roomCode);

    // 3) 말 이동 + 주사위 애니메이션이 끝난 후 셀 이벤트 전송
    setTimeout(() => triggerCell(roomCode, socket.id, cellType), CELL_EVENT_DELAY);
  });

  function triggerCell(roomCode, playerId, cellType) {
    const room         = rooms[roomCode];
    if (!room) return;
    const player       = room.players.find(p => p.id === playerId);
    const playerSocket = io.sockets.sockets.get(playerId);
    if (!player || !playerSocket) return;

    let event = null;

    switch (cellType) {
      case 'SALARY': {
        let desc = `월급 ${player.salary.toLocaleString()}원 지급!`;
        player.money += player.salary;
        if (player.savings > 0) {
          const interest = Math.floor(player.savings * 0.25);
          player.money  += interest;
          desc          += ` (+이자 ${interest.toLocaleString()}원)`;
        }
        event = { type: 'SALARY', description: desc, amount: player.salary };
        break;
      }
      case 'SPEND': {
        const base   = Math.floor(Math.random() * 800) + 400;
        const disc   = JOBS[player.jobId]?.spendDiscount || 0;
        const amount = Math.floor(base * (1 - disc));
        player.money = Math.max(0, player.money - amount);
        event = { type: 'SPEND', description: '소비 지출 발생!', amount: -amount };
        break;
      }
      case 'SAVE':
        // 선택지가 필요한 칸 → 해당 플레이어에게만 전송
        playerSocket.emit('game:cellEvent', {
          event: { type: 'SAVE', description: '저축을 할 수 있어요!', canAction: true }
        });
        return;
      case 'INVEST':
        playerSocket.emit('game:cellEvent', {
          event: { type: 'INVEST', description: '투자 기회! 얼마를 투자할까요?', canAction: true }
        });
        return;
      case 'ASSET':
        playerSocket.emit('game:cellEvent', {
          event: { type: 'BUY_ASSET', description: '자산을 구매할 수 있어요!', canAction: true }
        });
        return;
      case 'EVENT': {
        const isPos = Math.random() > 0.5;
        const pool  = isPos ? EVENTS_POS : EVENTS_NEG;
        const pick  = pool[Math.floor(Math.random() * pool.length)];
        player.money = Math.max(0, player.money + pick.amount);
        event = { type: isPos ? 'POSITIVE' : 'NEGATIVE', ...pick };
        break;
      }
      case 'QUIZ':
        playerSocket.emit('game:cellEvent', {
          event: { type: 'QUIZ', description: '경제 퀴즈를 풀어보세요!', canAction: true }
        });
        return;
      case 'DONATE':
        playerSocket.emit('game:cellEvent', {
          event: { type: 'DONATE', description: '나눔을 할 수 있어요!', canAction: true }
        });
        return;
      case 'GROWTH':
        player.salary += 200;
        event = { type: 'GROWTH', description: '자기계발! 월급이 200원 올랐어요!', amount: 200 };
        break;
      default:
        break;
    }

    if (event) {
      io.to(roomCode).emit('game:cellEvent', { event });
      broadcastState(roomCode);
    }
  }

  socket.on('game:save', ({ roomCode, amount }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.money < amount) return;
    player.money   -= amount;
    player.savings += amount;
    broadcastState(roomCode);
  });

  socket.on('game:invest', ({ roomCode, amount }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.money < amount) return;
    const bonus   = JOBS[player.jobId]?.investBonus || 0;
    const success = Math.random() < (0.5 + bonus);
    player.money -= amount;
    const gain    = success ? amount * 2 : 0;
    player.money += gain;
    const event = {
      type: success ? 'POSITIVE' : 'NEGATIVE',
      description: success ? `투자 성공! +${gain.toLocaleString()}원` : '투자 실패...',
      amount: success ? gain : -amount,
    };
    io.to(roomCode).emit('game:cellEvent', { event });
    broadcastState(roomCode);
  });

  socket.on('game:buyAsset', ({ roomCode, assetId }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    const asset  = ASSET_DATA[assetId];
    if (!player || !asset || player.money < asset.price) return;
    player.money      -= asset.price;
    player.assetValue += asset.price;
    player.assets.push({ ...asset, id: assetId });
    broadcastState(roomCode);
  });

  socket.on('game:donate', ({ roomCode, amount }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.money < amount) return;
    player.money     -= amount;
    player.happiness += Math.floor(amount / 1000) + 1;
    broadcastState(roomCode);
  });

  socket.on('game:answerQuiz', ({ roomCode, answer }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    const correct = (answer === 0 || answer === 1);
    if (correct) {
      const bonus = JOBS[player.jobId]?.quizDouble ? 2000 : 1000;
      player.money     += bonus;
      player.quizScore += 1;
    }
    broadcastState(roomCode);
  });

  socket.on('game:endTurn', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.currentTurn !== socket.id) return;

    room.players.forEach(owner => {
      owner.assets?.forEach(asset => {
        room.players.forEach(visitor => {
          if (visitor.id !== owner.id && visitor.position === owner.position) {
            const rent     = Math.min(asset.rent, visitor.money);
            visitor.money -= rent;
            owner.money   += rent;
          }
        });
      });
    });

    room.turnsPlayed++;

    if (room.turnsPlayed >= room.totalTurns * room.players.length) {
      const scores = room.players.map((p, i) => ({ ...p, index: i, totalScore: calcScore(p) }));
      room.phase = 'ended';
      io.to(roomCode).emit('game:ended', { scores });
      return;
    }

    room.turnIndex   = (room.turnIndex + 1) % room.players.length;
    room.currentTurn = room.players[room.turnIndex].id;
    room.gameState.players = room.players;

    io.to(roomCode).emit('game:turnChanged', {
      currentTurn: room.currentTurn,
      gameState:   room.gameState,
    });
  });
});

app.get('/health', (_, res) => res.json({ ok: true, rooms: Object.keys(rooms).length }));
server.listen(PORT, () => console.log(`🚀 서버 실행: http://localhost:${PORT}`));
