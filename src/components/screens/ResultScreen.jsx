// src/components/screens/ResultScreen.jsx
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

const PLAYER_EMOJIS = ['🦊','🐧','🐨','🦁'];
const MEDALS        = ['🥇','🥈','🥉','4️⃣'];
const JOB_EMOJIS    = { chef:'👨‍🍳', dev:'👨‍💻', police:'👮', youtuber:'🎬', designer:'🎨' };

export default function ResultScreen() {
  const { finalScores, resetGame, playerId } = useGameStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (!finalScores) return null;

  const sorted   = [...finalScores].sort((a, b) => b.totalScore - a.totalScore);
  const winner   = sorted[0];
  const isWinner = winner?.id === playerId;

  return (
    <div className="screen result-screen">
      <div className="result-bg">
        {isWinner && (
          <div className="confetti-wrap">
            {[...Array(28)].map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                '--delay': `${(Math.random() * 2).toFixed(2)}s`,
                '--x':     `${Math.floor(Math.random() * 100)}%`,
                '--color': ['#FFD700','#FF6B6B','#4ECDC4','#A29BFE','#55EFC4'][i % 5],
              }} />
            ))}
          </div>
        )}
      </div>

      <div className="result-content">
        <div className={`winner-announcement ${show ? 'visible' : ''}`}>
          <div className="winner-trophy">🏆</div>
          <h2 className="winner-name">
            {isWinner ? '🎉 내가 이겼다!' : `${winner?.name}의 승리!`}
          </h2>
          <p className="winner-score">{winner?.totalScore?.toLocaleString()}점</p>
        </div>

        <div className={`rankings ${show ? 'visible' : ''}`}>
          {sorted.map((player, rank) => (
            <div
              key={player.id}
              className={`rank-card ${rank === 0 ? 'winner' : ''} ${player.id === playerId ? 'is-me' : ''}`}
              style={{ '--delay': `${rank * 0.15}s` }}
            >
              <div className="rank-medal">{MEDALS[rank]}</div>
              <div className="rank-avatar">{PLAYER_EMOJIS[player.index ?? rank]}</div>
              <div className="rank-info">
                <div className="rank-player-name">
                  {player.name}
                  {player.id === playerId && <span className="me-badge"> 나</span>}
                </div>
                <div className="rank-job">
                  {JOB_EMOJIS[player.jobId] || '👤'} {player.jobName}
                </div>
              </div>
              <div className="rank-scores">
                <div className="score-breakdown">
                  <span>💰 {(player.money       || 0).toLocaleString()}</span>
                  <span>🏦 {(player.savings     || 0).toLocaleString()}</span>
                  <span>🏪 {(player.assetValue  || 0).toLocaleString()}</span>
                  <span>❤️ {player.happiness    || 0}</span>
                  <span>❓ {player.quizScore    || 0}</span>
                </div>
                <div className="total-score">
                  합계: <strong>{player.totalScore?.toLocaleString()}</strong>점
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`score-explain ${show ? 'visible' : ''}`}>
          <h3>🏆 점수 계산 방식</h3>
          <div className="explain-grid">
            <div>💰 현금 ×1</div>
            <div>🏦 저축 ×1.2</div>
            <div>🏪 자산 ×1.5</div>
            <div>❤️ 행복 ×100</div>
            <div>❓ 퀴즈 ×200</div>
          </div>
        </div>

        <div className="result-actions">
          <button className="btn-primary btn-xl" onClick={resetGame}>
            🏠 메인 메뉴로
          </button>
        </div>
      </div>
    </div>
  );
}
