// src/socket/useSocketEvents.js
import { useEffect } from 'react';
import { connectSocket } from './socketManager';
import { useGameStore, GAME_SCREENS } from '../store/gameStore';

export const useSocketEvents = () => {
  const {
    setConnected, setDisconnected, setScreen, setRoom,
    updatePlayers, setGameState, setCurrentTurn,
    setDiceResult, setCurrentEvent,
    setActionModal, setFinalScores,
  } = useGameStore();

  useEffect(() => {
    const socket = connectSocket();

    const onConnect    = () => setConnected(socket.id);
    const onDisconnect = () => setDisconnected();

    const onRoomCreated = ({ roomCode, players, playerId }) => {
      setRoom({ roomCode, players, isHost: true, playerId });
      setScreen(GAME_SCREENS.LOBBY);
    };

    const onRoomJoined = ({ roomCode, players, playerId }) => {
      setRoom({ roomCode, players, isHost: false, playerId });
      setScreen(GAME_SCREENS.LOBBY);
    };

    const onPlayersUpdated = ({ players }) => updatePlayers(players);

    const onRoomError = ({ message }) => alert(`방 오류: ${message}`);

    const onJobSelectPhase = () => setScreen(GAME_SCREENS.JOB_SELECT);

    const onStateUpdate = ({ gameState, currentTurn }) => {
      setGameState(gameState);
      setCurrentTurn(currentTurn);
      setScreen(GAME_SCREENS.GAME_BOARD);
    };

    const onDiceRolled = ({ result, playerId }) => {
      setDiceResult({ result, playerId });
      setTimeout(() => setDiceResult(null), 2500);
    };

    const onCellEvent = ({ event }) => {
      setCurrentEvent(event);
      const modalMap = {
        BUY_ASSET: 'BUY',
        SAVE:      'SAVE',
        INVEST:    'INVEST',
        DONATE:    'DONATE',
        QUIZ:      'QUIZ',
      };
      if (modalMap[event.type]) setActionModal(modalMap[event.type]);
    };

    const onTurnChanged = ({ currentTurn, gameState }) => {
      setCurrentTurn(currentTurn);
      setGameState(gameState);
      setCurrentEvent(null);
      setActionModal(null);
    };

    const onGameEnded = ({ scores }) => {
      setFinalScores(scores);
      setScreen(GAME_SCREENS.RESULT);
    };

    socket.on('connect',               onConnect);
    socket.on('disconnect',            onDisconnect);
    socket.on('room:created',          onRoomCreated);
    socket.on('room:joined',           onRoomJoined);
    socket.on('room:playersUpdated',   onPlayersUpdated);
    socket.on('room:error',            onRoomError);
    socket.on('game:jobSelectPhase',   onJobSelectPhase);
    socket.on('game:stateUpdate',      onStateUpdate);
    socket.on('game:diceRolled',       onDiceRolled);
    socket.on('game:cellEvent',        onCellEvent);
    socket.on('game:turnChanged',      onTurnChanged);
    socket.on('game:ended',            onGameEnded);

    return () => {
      socket.off('connect',             onConnect);
      socket.off('disconnect',          onDisconnect);
      socket.off('room:created',        onRoomCreated);
      socket.off('room:joined',         onRoomJoined);
      socket.off('room:playersUpdated', onPlayersUpdated);
      socket.off('room:error',          onRoomError);
      socket.off('game:jobSelectPhase', onJobSelectPhase);
      socket.off('game:stateUpdate',    onStateUpdate);
      socket.off('game:diceRolled',     onDiceRolled);
      socket.off('game:cellEvent',      onCellEvent);
      socket.off('game:turnChanged',    onTurnChanged);
      socket.off('game:ended',          onGameEnded);
    };
  }, []);
};
