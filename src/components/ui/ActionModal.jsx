// src/components/ui/ActionModal.jsx
import React, { useState } from 'react';
import { buyAsset, saveMoney, investMoney, donateMoney, answerQuiz } from '../../socket/socketManager';

const ASSETS = [
  { id: 'stationery', name: '문구점',      price: 3000,  emoji: '✏️', rent: 500  },
  { id: 'tteok',      name: '떡볶이 가게', price: 5000,  emoji: '🌶️', rent: 800  },
  { id: 'cafe',       name: '카페',        price: 8000,  emoji: '☕', rent: 1200 },
  { id: 'app',        name: '앱 개발사',   price: 12000, emoji: '📱', rent: 2000 },
];

const QUIZZES = [
  { q: '저축이 필요한 이유는 무엇일까요?',      options: ['미래를 위해','지금 당장 쓰려고','친구에게 주려고','모르겠어요'],  answer: 0 },
  { q: '투자와 저축의 차이점은?',               options: ['투자는 위험이 있어요','둘 다 같아요','저축이 더 위험해요','모두 안전해요'], answer: 0 },
  { q: '기부를 하면 어떤 점이 좋을까요?',        options: ['돈이 늘어나요','사회가 따뜻해져요','아무 의미 없어요','손해만 생겨요'], answer: 1 },
  { q: '용돈을 받았을 때 가장 좋은 방법은?',    options: ['모두 써버리기','일부는 저축하기','빌려주기','잃어버리기'], answer: 1 },
  { q: '자산이란 무엇인가요?',                   options: ['미래에 수익을 만드는 것','그냥 물건','친구','숙제'], answer: 0 },
];

export default function ActionModal({ type, myMoney, roomCode, onClose }) {
  const [amount,        setAmount]        = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [quizAnswer,    setQuizAnswer]    = useState(null);
  const [submitted,     setSubmitted]     = useState(false);
  const [quiz]          = useState(() => QUIZZES[Math.floor(Math.random() * QUIZZES.length)]);

  const presets = [500, 1000, 2000, 5000].filter(v => v <= myMoney);

  const handleBuy = () => {
    if (!selectedAsset) return;
    buyAsset(roomCode, selectedAsset.id);
    onClose();
  };

  const handleSave = () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0 || amt > myMoney) return;
    saveMoney(roomCode, amt);
    onClose();
  };

  const handleInvest = () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0 || amt > myMoney) return;
    investMoney(roomCode, amt);
    onClose();
  };

  const handleDonate = () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0 || amt > myMoney) return;
    donateMoney(roomCode, amt);
    onClose();
  };

  const handleQuiz = () => {
    if (quizAnswer === null) return;
    setSubmitted(true);
    answerQuiz(roomCode, quizAnswer);
    setTimeout(onClose, 1600);
  };

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="action-modal">

        {/* ── 자산 구매 ── */}
        {type === 'BUY' && (
          <>
            <div className="modal-header">🏪 자산 구매</div>
            <p className="modal-sub">내 돈: <strong>💰 {myMoney.toLocaleString()}원</strong></p>
            <div className="assets-grid">
              {ASSETS.map(asset => (
                <div
                  key={asset.id}
                  className={`asset-card ${selectedAsset?.id === asset.id ? 'selected' : ''} ${asset.price > myMoney ? 'cant-afford' : ''}`}
                  onClick={() => asset.price <= myMoney && setSelectedAsset(asset)}
                >
                  <span className="asset-emoji">{asset.emoji}</span>
                  <p className="asset-name">{asset.name}</p>
                  <p className="asset-price">💵 {asset.price.toLocaleString()}원</p>
                  <p className="asset-rent">통행료 {asset.rent.toLocaleString()}원</p>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={onClose}>나중에</button>
              <button className={`btn-primary ${!selectedAsset ? 'disabled' : ''}`} onClick={handleBuy} disabled={!selectedAsset}>
                구매하기!
              </button>
            </div>
          </>
        )}

        {/* ── 저축 ── */}
        {type === 'SAVE' && (
          <>
            <div className="modal-header">🏦 저축하기</div>
            <p className="modal-sub">내 돈: <strong>💰 {myMoney.toLocaleString()}원</strong></p>
            <p className="modal-desc">저축하면 다음 월급 때 <strong>25% 이자</strong>를 받아요!</p>
            <div className="preset-btns">
              {presets.map(v => (
                <button key={v} className={`preset-btn ${amount == v ? 'active' : ''}`} onClick={() => setAmount(String(v))}>
                  {v.toLocaleString()}원
                </button>
              ))}
            </div>
            <input type="number" className="amount-input" placeholder="금액 직접 입력"
              value={amount} onChange={e => setAmount(e.target.value)} max={myMoney} min={1} />
            <div className="modal-actions">
              <button className="btn-ghost" onClick={onClose}>다음에</button>
              <button className={`btn-primary ${!amount || parseInt(amount) <= 0 ? 'disabled' : ''}`} onClick={handleSave}>저축!</button>
            </div>
          </>
        )}

        {/* ── 투자 ── */}
        {type === 'INVEST' && (
          <>
            <div className="modal-header">📈 투자하기</div>
            <p className="modal-sub">내 돈: <strong>💰 {myMoney.toLocaleString()}원</strong></p>
            <div className="invest-info">
              <div className="invest-case success">✅ 성공시 +200%</div>
              <div className="invest-case fail">❌ 실패시 전액 손실</div>
            </div>
            <p className="modal-desc risk">⚠️ 투자는 위험이 따릅니다!</p>
            <div className="preset-btns">
              {presets.map(v => (
                <button key={v} className={`preset-btn ${amount == v ? 'active' : ''}`} onClick={() => setAmount(String(v))}>
                  {v.toLocaleString()}원
                </button>
              ))}
            </div>
            <input type="number" className="amount-input" placeholder="투자 금액"
              value={amount} onChange={e => setAmount(e.target.value)} max={myMoney} min={1} />
            <div className="modal-actions">
              <button className="btn-ghost" onClick={onClose}>포기</button>
              <button className={`btn-primary invest-btn ${!amount || parseInt(amount) <= 0 ? 'disabled' : ''}`} onClick={handleInvest}>투자!</button>
            </div>
          </>
        )}

        {/* ── 기부 ── */}
        {type === 'DONATE' && (
          <>
            <div className="modal-header">❤️ 나눔하기</div>
            <p className="modal-sub">내 돈: <strong>💰 {myMoney.toLocaleString()}원</strong></p>
            <p className="modal-desc">기부하면 <strong>행복 지수</strong>가 올라가요!<br/>행복 지수도 최종 점수에 반영돼요 🌟</p>
            <div className="preset-btns">
              {presets.map(v => (
                <button key={v} className={`preset-btn donate-preset ${amount == v ? 'active' : ''}`} onClick={() => setAmount(String(v))}>
                  {v.toLocaleString()}원
                </button>
              ))}
            </div>
            <input type="number" className="amount-input" placeholder="기부 금액"
              value={amount} onChange={e => setAmount(e.target.value)} max={myMoney} min={1} />
            <div className="modal-actions">
              <button className="btn-ghost" onClick={onClose}>다음에</button>
              <button className={`btn-primary donate-btn ${!amount || parseInt(amount) <= 0 ? 'disabled' : ''}`} onClick={handleDonate}>나눔!</button>
            </div>
          </>
        )}

        {/* ── 퀴즈 ── */}
        {type === 'QUIZ' && (
          <>
            <div className="modal-header">❓ 경제 퀴즈!</div>
            <p className="quiz-question">{quiz.q}</p>
            <div className="quiz-options">
              {quiz.options.map((opt, i) => (
                <button
                  key={i}
                  className={`quiz-option
                    ${quizAnswer === i ? 'selected' : ''}
                    ${submitted && i === quiz.answer ? 'correct' : ''}
                    ${submitted && quizAnswer === i && i !== quiz.answer ? 'wrong' : ''}
                  `}
                  onClick={() => !submitted && setQuizAnswer(i)}
                >
                  <span className="option-num">{['①','②','③','④'][i]}</span>
                  {opt}
                </button>
              ))}
            </div>
            {submitted && (
              <div className={`quiz-result ${quizAnswer === quiz.answer ? 'correct' : 'wrong'}`}>
                {quizAnswer === quiz.answer ? '🎉 정답! +1,000원 보너스!' : '😅 틀렸어요! 다음엔 맞춰봐요!'}
              </div>
            )}
            {!submitted && (
              <div className="modal-actions">
                <button className="btn-ghost" onClick={onClose}>건너뛰기</button>
                <button className={`btn-primary ${quizAnswer === null ? 'disabled' : ''}`} onClick={handleQuiz}>
                  정답 제출!
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
