// src/components/ui/RotatePrompt.jsx
// 모바일 세로 모드일 때 가로 전환 안내 화면
import React from 'react';

export default function RotatePrompt() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0D0D1A',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 24,
    }}>
      <div style={{ fontSize: 80, animation: 'rotateAnim 1.5s ease-in-out infinite' }}>
        📱
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 22, fontWeight: 900, color: '#FFD700', marginBottom: 8 }}>
          화면을 가로로 돌려주세요!
        </p>
        <p style={{ fontSize: 14, color: '#8892B0' }}>
          게임은 가로 모드에서만 플레이할 수 있어요 🎮
        </p>
      </div>
      <div style={{ fontSize: 36 }}>↔️</div>
      <style>{`
        @keyframes rotateAnim {
          0%   { transform: rotate(0deg); }
          40%  { transform: rotate(-90deg); }
          60%  { transform: rotate(-90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
