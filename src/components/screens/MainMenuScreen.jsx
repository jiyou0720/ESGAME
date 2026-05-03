// src/components/screens/MainMenuScreen.jsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { connectSocket, createRoom, joinRoom } from '../../socket/socketManager';

export default function MainMenuScreen() {
  const { setPlayerName, setConnected } = useGameStore();
  const [mode, setMode]           = useState(null);
  const [roomCode, setRoomCode]   = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // 앱 시작 시 소켓 미리 연결
  useEffect(() => {
    const socket = connectSocket();
    if (socket.connected) setConnected(socket.id);
    socket.on('connect', () => setConnected(socket.id));
    return () => socket.off('connect');
  }, []);

  const handleCreate = () => {
    if (!nameInput.trim()) return setError('이름을 입력해주세요!');
    setLoading(true);
    setError('');
    setPlayerName(nameInput);
    createRoom(nameInput, (res) => {
      setLoading(false);
      if (res?.error) setError(res.error);
    });
  };

  const handleJoin = () => {
    if (!nameInput.trim()) return setError('이름을 입력해주세요!');
    if (!roomCode.trim())  return setError('방 코드를 입력해주세요!');
    setLoading(true);
    setError('');
    setPlayerName(nameInput);
    joinRoom(roomCode.toUpperCase(), nameInput, (res) => {
      setLoading(false);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div className="screen main-menu">
      <div className="main-bg-deco">
        {['💰','🏦','📈','🎲','🏪','💎','🌟','🎯'].map((e, i) => (
          <span key={i} className="deco-float" style={{ '--i': i }}>{e}</span>
        ))}
      </div>

      <div className="main-content">
        <div className="logo-wrap">
          <div className="logo-coin">🪙</div>
          <h1 className="game-title">
            꿈꾸는<br />
            <span className="title-accent">경제 어드벤처</span>
          </h1>
          <p className="game-subtitle">Dream Economy Adventure</p>
        </div>

        {!mode ? (
          <div className="menu-buttons">
            <button className="btn-primary btn-xl" onClick={() => setMode('create')}>
              <span className="btn-icon">🏠</span> 방 만들기
            </button>
            <button className="btn-secondary btn-xl" onClick={() => setMode('join')}>
              <span className="btn-icon">🚪</span> 방 참여하기
            </button>
          </div>
        ) : (
          <div className="input-panel">
            <button className="btn-back" onClick={() => { setMode(null); setError(''); }}>
              ← 뒤로
            </button>
            <h2 className="input-title">
              {mode === 'create' ? '🏠 방 만들기' : '🚪 방 참여하기'}
            </h2>

            <div className="input-group">
              <label>닉네임</label>
              <input
                type="text"
                placeholder="나의 이름은..."
                value={nameInput}
                maxLength={10}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'create' ? handleCreate() : handleJoin())}
              />
            </div>

            {mode === 'join' && (
              <div className="input-group">
                <label>방 코드</label>
                <input
                  type="text"
                  placeholder="ABCD"
                  value={roomCode}
                  maxLength={6}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  className="code-input"
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
              </div>
            )}

            {error && <p className="error-msg">⚠️ {error}</p>}

            <button
              className={`btn-primary btn-xl ${loading ? 'loading' : ''}`}
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading}
            >
              {loading ? '연결 중...' : mode === 'create' ? '방 생성!' : '입장!'}
            </button>
          </div>
        )}
      </div>

      <div className="main-footer">
        <p>👦 권장 연령 8~13세 &nbsp;|&nbsp; 👥 2~4명 &nbsp;|&nbsp; ⏱ 30~60분</p>
      </div>
    </div>
  );
}
