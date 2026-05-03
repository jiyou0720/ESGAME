// src/socket/socketManager.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

let socket = null;

export const connectSocket = () => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });
  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });
  socket.on('connect_error', (err) => {
    console.warn('[Socket] Error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

// 연결 보장 emit 헬퍼
const safeEmit = (event, data, callback) => {
  const s = connectSocket();
  const doEmit = () => {
    if (callback) s.emit(event, data, callback);
    else s.emit(event, data);
  };
  if (s.connected) doEmit();
  else s.once('connect', doEmit);
};

// ─── Room ────────────────────────────────────────────────────────────────────
export const createRoom  = (playerName, cb)            => safeEmit('room:create', { playerName }, cb);
export const joinRoom    = (roomCode, playerName, cb)  => safeEmit('room:join',   { roomCode, playerName }, cb);
export const leaveRoom   = (roomCode)                  => safeEmit('room:leave',  { roomCode });
export const setReady    = (roomCode, ready)           => safeEmit('room:ready',  { roomCode, ready });
export const startGame   = (roomCode)                  => safeEmit('game:start',  { roomCode });

// ─── Game ────────────────────────────────────────────────────────────────────
export const rollDice    = (roomCode)         => safeEmit('game:rollDice',   { roomCode });
export const buyAsset    = (roomCode, id)     => safeEmit('game:buyAsset',   { roomCode, assetId: id });
export const donateMoney = (roomCode, amount) => safeEmit('game:donate',     { roomCode, amount });
export const saveMoney   = (roomCode, amount) => safeEmit('game:save',       { roomCode, amount });
export const investMoney = (roomCode, amount) => safeEmit('game:invest',     { roomCode, amount });
export const answerQuiz  = (roomCode, answer) => safeEmit('game:answerQuiz', { roomCode, answer });
export const endTurn     = (roomCode)         => safeEmit('game:endTurn',    { roomCode });
export const selectJob   = (roomCode, jobId)  => safeEmit('game:selectJob',  { roomCode, jobId });
