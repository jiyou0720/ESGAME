// src/components/ui/PlayerHUD.jsx
import React from 'react';

const PLAYER_EMOJIS = ['🦊', '🐧', '🐨', '🦁'];
const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A29BFE'];
const JOB_EMOJIS    = { chef:'👨‍🍳', dev:'👨‍💻', police:'👮', youtuber:'🎬', designer:'🎨' };

export default function PlayerHUD({ players, myId, isMobile }) {
  if (!players.length) return null;

  return (
    <div className={`player-hud ${isMobile ? 'player-hud-mobile' : 'player-hud-desktop'}`}>
      {players.map((p, i) => (
        <div
          key={p.id}
          className={`hud-player-card ${p.id === myId ? 'is-me' : ''}`}
          style={{ '--player-color': PLAYER_COLORS[i] }}
        >
          {/* 플레이어 색상 띠 */}
          <div className="hud-color-bar" />

          <div className="hud-avatar-wrap">
            <span className="hud-avatar">{PLAYER_EMOJIS[i]}</span>
          </div>

          <div className="hud-info">
            <div className="hud-name">
              {p.name}
              {p.id === myId && <span className="hud-me-tag">나</span>}
            </div>
            <div className="hud-job">
              {JOB_EMOJIS[p.jobId] || '👤'} {p.jobName || '?'}
            </div>
          </div>

          <div className="hud-stats">
            <div className="hud-stat"><span>💰</span><span>{(p.money   || 0).toLocaleString()}</span></div>
            <div className="hud-stat"><span>🏦</span><span>{(p.savings || 0).toLocaleString()}</span></div>
            <div className="hud-stat"><span>❤️</span><span>{p.happiness || 0}</span></div>
            <div className="hud-stat"><span>📍</span><span>{p.position  || 0}칸</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}
