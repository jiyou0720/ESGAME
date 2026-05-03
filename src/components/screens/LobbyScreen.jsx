// src/components/screens/LobbyScreen.jsx
import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { setReady, startGame, leaveRoom } from '../../socket/socketManager';

export default function LobbyScreen() {
  const { roomCode, players, isHost, playerId, resetGame } = useGameStore();
  const [isReady, setIsReadyState] = useState(false);

  const allReady  = players.length >= 2 && players.every(p => p.ready || p.isHost);
  const canStart  = isHost && allReady;

  const handleReady = () => {
    const next = !isReady;
    setIsReadyState(next);
    setReady(roomCode, next);
  };

  const handleStart = () => {
    if (canStart) startGame(roomCode);
  };

  const handleLeave = () => {
    leaveRoom(roomCode);
    resetGame();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
  };

  return (
    <div className="screen lobby-screen">
      <div className="lobby-bg-pattern" />

      <div className="lobby-header">
        <button className="btn-back" onClick={handleLeave}>← 나가기</button>
        <h2 className="lobby-title">🎲 게임 대기실</h2>
        <div />
      </div>

      <div className="room-code-wrap">
        <p className="room-code-label">방 코드</p>
        <div className="room-code" onClick={copyCode}>
          <span>{roomCode}</span>
          <button className="copy-btn">📋 복사</button>
        </div>
        <p className="room-code-hint">친구에게 코드를 알려주세요!</p>
      </div>

      <div className="players-grid">
        {[...Array(4)].map((_, i) => {
          const player = players[i];
          return (
            <div key={i} className={`player-slot ${player ? 'occupied' : 'empty'}`}>
              {player ? (
                <>
                  <div className="player-avatar">
                    {['🦊','🐧','🐨','🦁'][i]}
                  </div>
                  <div className="player-info">
                    <p className="player-name">
                      {player.name}
                      {player.id === playerId && <span className="me-badge"> 나</span>}
                      {player.isHost && <span className="host-badge"> 👑</span>}
                    </p>
                    <p className={`player-status ${player.ready || player.isHost ? 'ready' : 'waiting'}`}>
                      {player.isHost ? '방장' : player.ready ? '✅ 준비완료' : '⏳ 대기중'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="player-avatar empty-avatar">?</div>
                  <p className="empty-label">대기 중...</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="lobby-rules">
        <h3>📌 게임 규칙</h3>
        <div className="rules-list">
          <div className="rule-item">🎲 주사위를 굴려 보드판을 이동해요</div>
          <div className="rule-item">💰 직업을 선택해 월급을 받아요</div>
          <div className="rule-item">🏪 자산을 구매해 수익을 올려요</div>
          <div className="rule-item">❤️ 기부하면 행복지수가 올라가요</div>
          <div className="rule-item">🏆 자산 + 행복지수 합산 1등이 승리!</div>
        </div>
      </div>

      <div className="lobby-actions">
        {players.length < 2 && (
          <p className="min-players-warn">⚠️ 최소 2명이 필요해요</p>
        )}
        {!isHost && (
          <button
            className={`btn-primary btn-xl ${isReady ? 'ready-active' : ''}`}
            onClick={handleReady}
          >
            {isReady ? '✅ 준비 완료!' : '준비하기'}
          </button>
        )}
        {isHost && (
          <button
            className={`btn-primary btn-xl ${!canStart ? 'disabled' : ''}`}
            onClick={handleStart}
            disabled={!canStart}
          >
            {canStart ? '🎮 게임 시작!' : '모두 준비 대기 중...'}
          </button>
        )}
      </div>
    </div>
  );
}
