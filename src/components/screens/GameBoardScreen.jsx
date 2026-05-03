// src/components/screens/GameBoardScreen.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import BoardScene from '../../scenes/BoardScene';
import { useGameStore } from '../../store/gameStore';
import { rollDice, endTurn } from '../../socket/socketManager';
import ActionModal from '../ui/ActionModal';
import PlayerHUD from '../ui/PlayerHUD';
import EventBanner from '../ui/EventBanner';

let phaserGame = null;

const CELL_LABELS = {
  START:  '🚀 출발 칸',   SALARY: '💰 월급 칸',
  SPEND:  '🛍️ 소비 칸',  SAVE:   '🏦 저축 칸',
  INVEST: '📈 투자 칸',   ASSET:  '🏪 자산 칸',
  EVENT:  '🎲 이벤트 칸', QUIZ:   '❓ 퀴즈 칸',
  DONATE: '❤️ 나눔 칸',   GROWTH: '⬆️ 성장 칸',
};

export default function GameBoardScreen() {
  const containerRef = useRef(null);
  const boardRef     = useRef(null);

  const {
    gameState, myPlayerData, currentTurn, playerId,
    roomCode, diceResult, currentEvent, actionModal,
    setActionModal, players,
  } = useGameStore();

  const isMyTurn = currentTurn === playerId;
  const [diceRolled, setDiceRolled] = useState(false);
  const [landedCell, setLandedCell] = useState(null);
  const [showLanded, setShowLanded] = useState(false);
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 500);

  // 반응형 감지
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 500);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Phaser 초기화
  useEffect(() => {
    if (!containerRef.current || phaserGame) return;

    phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: '#1A1A2E',
      scene: [BoardScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width:  '100%',
        height: '100%',
      },
    });

    const tryGetScene = setInterval(() => {
      const scene = phaserGame?.scene?.getScene('BoardScene');
      if (scene) { boardRef.current = scene; clearInterval(tryGetScene); }
    }, 100);

    return () => {
      clearInterval(tryGetScene);
      if (phaserGame) { phaserGame.destroy(true); phaserGame = null; }
    };
  }, []);

  // 게임 상태 → Phaser
  useEffect(() => {
    if (boardRef.current && gameState) {
      boardRef.current.events.emit('updateGameState', gameState);
    }
  }, [gameState]);

  // 주사위 결과 처리
  useEffect(() => {
    if (!diceResult) return;
    setDiceRolled(true);

    if (boardRef.current) {
      boardRef.current.showDiceAnimation(diceResult.result);
    }

    // ~2초 후 도착 칸 배너
    const t1 = setTimeout(() => {
      if (diceResult.cellType) {
        setLandedCell(diceResult.cellType);
        setShowLanded(true);
      }
    }, 2000);

    // ~3초 후 배너 숨김 (서버에서 3.2초 후 모달 이벤트 옴)
    const t2 = setTimeout(() => {
      setShowLanded(false);
      setTimeout(() => setLandedCell(null), 400);
    }, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [diceResult]);

  // 턴 변경 시 리셋
  useEffect(() => {
    setDiceRolled(false);
    setLandedCell(null);
    setShowLanded(false);
  }, [currentTurn]);

  const handleRollDice = useCallback(() => {
    if (!isMyTurn || diceRolled) return;
    rollDice(roomCode);
  }, [isMyTurn, diceRolled, roomCode]);

  const handleEndTurn = useCallback(() => {
    endTurn(roomCode);
    setDiceRolled(false);
    setActionModal(null);
    setLandedCell(null);
  }, [roomCode]);

  const currentPlayerName = players.find(p => p.id === currentTurn)?.name;

  return (
    <div className="screen game-board-screen">
      {/* Phaser 캔버스 */}
      <div ref={containerRef} className="phaser-container" />

      {/* HUD 오버레이 */}
      <div className={`hud-overlay ${isMobile ? 'hud-mobile' : 'hud-desktop'}`}>

        {/* 상단 바 */}
        <div className="hud-top">
          <div>
            {isMyTurn
              ? <div className="my-turn-badge pulse">🎯 내 차례!</div>
              : <div className="other-turn-badge">⏳ {currentPlayerName}의 차례</div>
            }
          </div>
          <div className="hud-room-code">방 {roomCode}</div>
        </div>

        {/* 도착 칸 배너 */}
        {landedCell && (
          <div className={`landed-cell-banner ${showLanded ? 'show' : ''}`}>
            <span className="landed-arrow">▼</span>
            <span className="landed-label">{CELL_LABELS[landedCell] || landedCell} 도착!</span>
            <span className="landed-arrow">▼</span>
          </div>
        )}

        {/* 이벤트 배너 */}
        {currentEvent && !actionModal && <EventBanner event={currentEvent} />}

        {/* 주사위 버튼 */}
        {isMyTurn && !diceRolled && (
          <div className="dice-btn-wrap">
            <button className="btn-dice" onClick={handleRollDice}>
              <span className="dice-emoji">🎲</span>
              주사위 굴리기!
            </button>
          </div>
        )}

        {/* 턴 종료 버튼 */}
        {isMyTurn && diceRolled && !actionModal && !showLanded && (
          <div className="dice-btn-wrap">
            <button className="btn-end-turn" onClick={handleEndTurn}>
              턴 종료 →
            </button>
          </div>
        )}

        {/* 플레이어 스탯 - 모바일은 하단, 데스크탑은 우측 */}
        <PlayerHUD
          players={gameState?.players || []}
          myId={playerId}
          isMobile={isMobile}
        />
      </div>

      {/* 액션 모달 */}
      {actionModal && (
        <ActionModal
          type={actionModal}
          myMoney={myPlayerData?.money || 0}
          roomCode={roomCode}
          onClose={() => setActionModal(null)}
        />
      )}
    </div>
  );
}
