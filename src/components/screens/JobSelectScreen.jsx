// src/components/screens/JobSelectScreen.jsx
import React, { useState } from 'react';
import { useGameStore, JOBS } from '../../store/gameStore';
import { selectJob } from '../../socket/socketManager';

export default function JobSelectScreen() {
  const { roomCode, setPlayerJob } = useGameStore();
  const [selected,  setSelected]   = useState(null);
  const [confirmed, setConfirmed]  = useState(false);

  const handleSelect = (job) => {
    if (confirmed) return;
    setSelected(job);
  };

  const handleConfirm = () => {
    if (!selected) return;
    setPlayerJob(selected);
    setConfirmed(true);
    selectJob(roomCode, selected.id);
  };

  return (
    <div className="screen job-select-screen">
      <div className="job-bg-deco">
        {JOBS.map((j, i) => (
          <span key={i} className="job-deco" style={{ '--i': i }}>{j.emoji}</span>
        ))}
      </div>

      <div className="job-header">
        <h2 className="job-title">🌟 직업을 선택하세요!</h2>
        <p className="job-subtitle">각 직업마다 특별한 능력이 있어요</p>
      </div>

      <div className="jobs-grid">
        {JOBS.map((job) => (
          <div
            key={job.id}
            className={`job-card ${selected?.id === job.id ? 'selected' : ''} ${confirmed ? 'locked' : ''}`}
            style={{ '--job-color': job.color }}
            onClick={() => handleSelect(job)}
          >
            <div className="job-emoji">{job.emoji}</div>
            <h3 className="job-name">{job.name}</h3>
            <div className="job-salary">
              <span className="salary-label">월급</span>
              <span className="salary-value">💵 {job.salary.toLocaleString()}원</span>
            </div>
            <div className="job-special">
              <span className="special-icon">⚡</span>
              <span className="special-text">{job.special}</span>
            </div>
            {selected?.id === job.id && (
              <div className="job-selected-indicator">✓</div>
            )}
          </div>
        ))}
      </div>

      <div className="job-confirm-area">
        {confirmed ? (
          <div className="confirm-waiting">
            <div className="confirm-check">✅</div>
            <p>{selected?.name} 선택 완료! 다른 플레이어를 기다리는 중...</p>
            <div className="dots-loader"><span /><span /><span /></div>
          </div>
        ) : (
          <button
            className={`btn-primary btn-xl ${!selected ? 'disabled' : ''}`}
            onClick={handleConfirm}
            disabled={!selected}
          >
            {selected ? `${selected.emoji} ${selected.name} 선택하기!` : '직업을 골라주세요'}
          </button>
        )}
      </div>
    </div>
  );
}
