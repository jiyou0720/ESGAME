// src/App.jsx
import React from 'react';
import { useGameStore, GAME_SCREENS } from './store/gameStore';
import { useSocketEvents } from './socket/useSocketEvents';

import MainMenuScreen  from './components/screens/MainMenuScreen';
import LobbyScreen     from './components/screens/LobbyScreen';
import JobSelectScreen from './components/screens/JobSelectScreen';
import GameBoardScreen from './components/screens/GameBoardScreen';
import ResultScreen    from './components/screens/ResultScreen';

import './styles/global.css';
import './styles/mainmenu.css';
import './styles/lobby.css';
import './styles/jobselect.css';
import './styles/gameboard.css';
import './styles/modals.css';
import './styles/result.css';
import './styles/responsive.css'; // ← 반응형 (항상 마지막에)

function ScreenRouter() {
  const { currentScreen } = useGameStore();
  switch (currentScreen) {
    case GAME_SCREENS.MAIN_MENU:  return <MainMenuScreen  />;
    case GAME_SCREENS.LOBBY:      return <LobbyScreen     />;
    case GAME_SCREENS.JOB_SELECT: return <JobSelectScreen />;
    case GAME_SCREENS.GAME_BOARD: return <GameBoardScreen />;
    case GAME_SCREENS.RESULT:     return <ResultScreen    />;
    default:                      return <MainMenuScreen  />;
  }
}

export default function App() {
  useSocketEvents();
  return (
    <div className="app-root">
      <ScreenRouter />
    </div>
  );
}
