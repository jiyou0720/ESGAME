// src/components/screens/GameBoardScreen.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import BoardScene from '../../scenes/BoardScene';
import { useGameStore } from '../../store/gameStore';
import { rollDice, endTurn } from '../../socket/socketManager';
import ActionModal from '../ui/ActionModal';
import PlayerHUD from '../ui/PlayerHUD';
import EventBanner from '../ui/EventBanner';
import RotatePrompt from '../ui/RotatePrompt';

// 전역 Phaser 인스턴스 - 싱글턴 유지
let phaserGame = null;

const CELL_LABELS = {
  START:  '🚀 출발 칸',   SALARY: '💰 월급 칸',
  SPEND:  '🛍️ 소비 칸',  SAVE:   '🏦 저축 칸',
  INVEST: '📈 투자 칸',   ASSET:  '🏪 자산 칸',
  EVENT:  '🎲 이벤트 칸', QUIZ:   '❓ 퀴즈 칸',
  DONATE: '❤️ 나눔 칸',   GROWTH: '⬆️ 성장 칸',
};

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  Math.min(window.screen.width, window.screen.height) < 600;

const isPortrait = () => window.innerHeight > window.innerWidth;

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
  const [mobile,     setMobile]     = useState(isMobileDevice());
  const [portrait,   setPortrait]   = useState(isPortrait());

  // 방향 감지 (딜레이로 실제 크기 반영 대기)
  useEffect(() => {
    let timer = null;
    const onOrientationChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setMobile(isMobileDevice());
        setPortrait(isPortrait());
      }, 200);
    };
    window.addEventListener('resize', onOrientationChange);
    window.addEventListener('orientationchange', onOrientationChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onOrientationChange);
      window.removeEventListener('orientationchange', onOrientationChange);
    };
  }, []);

  // Phaser 초기화 - 딱 한 번만 생성, 절대 재생성하지 않음
  // 방향 전환은 Phaser 내부 Scale.RESIZE 가 자동 처리
  useEffect(() => {
    if (!containerRef.current || phaserGame) return;

    phaserGame = new Phaser.Game({
      type:            Phaser.CANVAS, // WebGL 대신 Canvas → Framebuffer 오류 원천 차단
      parent:          containerRef.current,
      backgroundColor: '#1A1A2E',
      scene:           [BoardScene],
      scale: {
        mode:       Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width:      '100%',
        height:     '100%',
      },
    });

    const tryGetScene = setInterval(() => {
      const scene = phaserGame?.scene?.getScene('BoardScene');
      if (scene) {
        boardRef.current = scene;
        clearInterval(tryGetScene);
        if (gameState) scene.events.emit('updateGameState', gameState);
      }
    }, 80);

    return () => clearInterval(tryGetScene);
  }, []); // 마운트 시 딱 한 번

  // 컴포넌트 언마운트 시만 Phaser 정리
  useEffect(() => {
    return () => {
      if (phaserGame) {
        phaserGame.destroy(true);
        phaserGame = null;
        boardRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (boardRef.current && gameState) {
      boardRef.current.events.emit('updateGameState', gameState);
    }
  }, [gameState]);

  useEffect(() => {
    if (!diceResult) return;
    setDiceRolled(true);
    if (boardRef.current) boardRef.current.showDiceAnimation(diceResult.result);
    const t1 = setTimeout(() => {
      if (diceResult.cellType) { setLandedCell(diceResult.cellType); setShowLanded(true); }
    }, 2000);
    const t2 = setTimeout(() => {
      setShowLanded(false);
      setTimeout(() => setLandedCell(null), 400);
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [diceResult]);

  useEffect(() => {
    setDiceRolled(false); setLandedCell(null); setShowLanded(false);
  }, [currentTurn]);

  const handleRollDice = useCallback(() => {
    if (!isMyTurn || diceRolled) return;
    rollDice(roomCode);
  }, [isMyTurn, diceRolled, roomCode]);

  const handleEndTurn = useCallback(() => {
    endTurn(roomCode);
    setDiceRolled(false); setActionModal(null); setLandedCell(null);
  }, [roomCode]);

  const currentPlayerName = players.find(p => p.id === currentTurn)?.name;

  // 모바일 세로 → 회전 안내 (Phaser는 숨기지 않고 display:none으로 유지)
  return (
    <div className="screen game-board-screen">
      {/* 세로 모드 안내 - Phaser는 계속 살아있음 */}
      {mobile && portrait && <RotatePrompt />}

      {/* Phaser 캔버스: 세로 모드에도 DOM에 존재(숨김), 가로에서 보임 */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute', inset: 0,
          visibility: (mobile && portrait) ? 'hidden' : 'visible',
        }}
      />

      {/* HUD - 가로 모드일 때만 표시 */}
      {!(mobile && portrait) && (
        <div className="hud-overlay">
          <div className="hud-top">
            <div>
              {isMyTurn
                ? <div className="my-turn-badge pulse">🎯 내 차례!</div>
                : <div className="other-turn-badge">⏳ {currentPlayerName}의 차례</div>
              }
            </div>
            <div className="hud-room-code">방 {roomCode}</div>
          </div>

          {landedCell && (
            <div className={`landed-cell-banner ${showLanded ? 'show' : ''}`}>
              <span className="landed-arrow">▼</span>
              <span>{CELL_LABELS[landedCell] || landedCell} 도착!</span>
              <span className="landed-arrow">▼</span>
            </div>
          )}

          {currentEvent && !actionModal && <EventBanner event={currentEvent} />}

          {isMyTurn && !diceRolled && (
            <div className="dice-btn-wrap">
              <button className="btn-dice" onClick={handleRollDice}>
                <span className="dice-emoji">🎲</span>주사위 굴리기!
              </button>
            </div>
          )}
          {isMyTurn && diceRolled && !actionModal && !showLanded && (
            <div className="dice-btn-wrap">
              <button className="btn-end-turn" onClick={handleEndTurn}>턴 종료 →</button>
            </div>
          )}

          <PlayerHUD players={gameState?.players || []} myId={playerId} isMobile={mobile} />
        </div>
      )}

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
