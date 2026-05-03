// src/components/ui/EventBanner.jsx
import React, { useEffect, useState } from 'react';

const EVENT_STYLES = {
  SALARY:   { bg: '#2ECC71', icon: '💰', label: '월급 지급!' },
  SPEND:    { bg: '#E74C3C', icon: '🛍️', label: '소비 발생!' },
  SAVE:     { bg: '#3498DB', icon: '🏦', label: '저축 가능!' },
  INVEST:   { bg: '#9B59B6', icon: '📈', label: '투자 기회!' },
  BUY_ASSET:{ bg: '#F39C12', icon: '🏪', label: '자산 구매!' },
  EVENT:    { bg: '#E67E22', icon: '🎲', label: '이벤트 발생!' },
  QUIZ:     { bg: '#1ABC9C', icon: '❓', label: '퀴즈 타임!' },
  DONATE:   { bg: '#FF69B4', icon: '❤️', label: '나눔 기회!' },
  GROWTH:   { bg: '#27AE60', icon: '⬆️', label: '자기 계발!' },
  POSITIVE: { bg: '#2ECC71', icon: '🌟', label: '행운!' },
  NEGATIVE: { bg: '#E74C3C', icon: '😱', label: '이런!' },
};

export default function EventBanner({ event }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!event) return;
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [event]);

  if (!event) return null;

  const style = EVENT_STYLES[event.type] || EVENT_STYLES['EVENT'];

  return (
    <div
      className={`event-banner ${visible ? 'slide-in' : ''}`}
      style={{ '--banner-bg': style.bg }}
    >
      <span className="banner-icon">{style.icon}</span>
      <div className="banner-content">
        <div className="banner-label">{style.label}</div>
        <div className="banner-desc">{event.description || event.message || ''}</div>
        {event.amount != null && (
          <div className={`banner-amount ${event.amount >= 0 ? 'positive' : 'negative'}`}>
            {event.amount >= 0 ? '+' : ''}{event.amount.toLocaleString()}원
          </div>
        )}
      </div>
    </div>
  );
}
