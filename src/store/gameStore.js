// src/store/gameStore.js
import { create } from 'zustand';

export const GAME_SCREENS = {
  MAIN_MENU:  'MAIN_MENU',
  LOBBY:      'LOBBY',
  JOB_SELECT: 'JOB_SELECT',
  GAME_BOARD: 'GAME_BOARD',
  RESULT:     'RESULT',
};

export const JOBS = [
  { id: 'chef',     name: '요리사',   emoji: '👨‍🍳', salary: 2000, special: '소비 칸 -20%',     color: '#FF6B6B' },
  { id: 'dev',      name: '개발자',   emoji: '👨‍💻', salary: 3000, special: '투자 성공률 +10%',  color: '#4ECDC4' },
  { id: 'police',   name: '경찰관',   emoji: '👮',  salary: 2500, special: '이벤트 손실 -30%',  color: '#45B7D1' },
  { id: 'youtuber', name: '유튜버',   emoji: '🎬',  salary: 1500, special: '퀴즈 보너스 2배',   color: '#FFA07A' },
  { id: 'designer', name: '디자이너', emoji: '🎨',  salary: 2200, special: '자산 가치 +15%',   color: '#98D8C8' },
];

export const useGameStore = create((set, get) => ({
  // 소켓
  socketId:      null,
  isConnected:   false,

  // 화면
  currentScreen: GAME_SCREENS.MAIN_MENU,

  // 플레이어
  playerName:    '',
  playerJob:     null,
  playerId:      null,

  // 방
  roomCode:      null,
  players:       [],
  isHost:        false,

  // 게임
  gameState:     null,
  currentTurn:   null,
  myPlayerData:  null,
  diceResult:    null,
  currentEvent:  null,
  actionModal:   null,

  // 결과
  finalScores:   null,

  // ─── Actions ──────────────────────────────────────────────────────────────
  setConnected:    (id)      => set({ isConnected: true,  socketId: id }),
  setDisconnected: ()        => set({ isConnected: false, socketId: null }),
  setScreen:       (screen)  => set({ currentScreen: screen }),
  setPlayerName:   (name)    => set({ playerName: name }),
  setPlayerJob:    (job)     => set({ playerJob: job }),

  setRoom: ({ roomCode, players, isHost, playerId }) =>
    set({ roomCode, players, isHost, playerId }),

  updatePlayers: (players) => set({ players }),

  setGameState: (gameState) => {
    const { playerId } = get();
    const myPlayerData = gameState?.players?.find(p => p.id === playerId) || null;
    set({ gameState, myPlayerData });
  },

  setCurrentTurn:  (id)     => set({ currentTurn: id }),
  setDiceResult:   (result) => set({ diceResult: result }),
  setCurrentEvent: (event)  => set({ currentEvent: event }),
  setActionModal:  (modal)  => set({ actionModal: modal }),
  setFinalScores:  (scores) => set({ finalScores: scores }),

  resetGame: () => set({
    roomCode: null, players: [], isHost: false,
    gameState: null, currentTurn: null, myPlayerData: null,
    diceResult: null, currentEvent: null, actionModal: null,
    finalScores: null, playerJob: null,
    currentScreen: GAME_SCREENS.MAIN_MENU,
  }),
}));
