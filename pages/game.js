import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { data } from '../data/turing_data';
import { useGame } from '../contexts/GameContext';
import GameSettings from '../components/GameSettings';

export default function Game() {
  const { darkMode, gameMode, timeLimit, fontSize } = useGame();

  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState('');
  const [shuffledData, setShuffledData] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [humanCorrect, setHumanCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [responseToShow, setResponseToShow] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [startTime, setStartTime] = useState(null);
  const [isHumanFirst, setIsHumanFirst] = useState(true);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [roundReflection, setRoundReflection] = useState('');
  const [messageInBottle, setMessageInBottle] = useState('');
  const [reflectionLog, setReflectionLog] = useState([]);
  const [bottleMessages, setBottleMessages] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!router.isReady) return;
    const incomingTheme = Array.isArray(router.query.theme)
      ? router.query.theme[0]
      : router.query.theme || '';
    if (incomingTheme !== selectedTheme) {
      setSelectedTheme(incomingTheme);
    }
  }, [router.isReady, router.query.theme, selectedTheme]);

  const startGame = () => {
    const filtered = selectedTheme
      ? data.filter(item => item.condition?.trim() === selectedTheme)
      : data;

    const selected = [...filtered]
      .filter(item => item.prompt && item.human && item.ai)
      .sort(() => Math.random() - 0.5)
      .slice(0, 15);

    setShuffledData(selected);
    setIndex(0);
    setScore(0);
    setHumanCorrect(0);
    setFinished(false);
    setCurrentItem(null);
    setResponseToShow(null);
    setGameStarted(true);
    setTimeLeft(timeLimit);
    setStartTime(Date.now());
    setQuestionHistory([]);
    setRoundReflection('');
    setMessageInBottle('');
  };

  // Handle timeout for each question
  useEffect(() => {
    if (gameStarted && !finished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Force move to next question when time runs out
            if (currentItem && responseToShow) {
              setIndex(prev => prev + 1);
            }
            return timeLimit; // Reset to full time limit
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStarted, finished, currentItem, responseToShow, timeLimit]);

  // Reset timer for new question
  useEffect(() => {
    if (shuffledData.length > 0 && index < shuffledData.length) {
      const item = shuffledData[index];
      const showHuman = Math.random() > 0.5;
      setCurrentItem(item);
      setResponseToShow(showHuman ? item.human : item.ai);
      setIsHumanFirst(Math.random() > 0.5);
      setTimeLeft(timeLimit);
      setStartTime(Date.now());
      
      // Clear and restart timer for new question
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Force move to next question when time runs out
            if (currentItem && responseToShow) {
              setIndex(prev => prev + 1);
            }
            return timeLimit;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (shuffledData.length > 0 && index >= shuffledData.length) {
      setFinished(true);
    }
  }, [shuffledData, index, timeLimit, currentItem, responseToShow]);

  const handleSwipe = (direction) => {
    if (!currentItem || !responseToShow) return;

    const isHuman = responseToShow === currentItem.human;
    const correctGuess = (direction === 'right' && isHuman) || (direction === 'left' && !isHuman);
    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Add to question history
    setQuestionHistory(prev => [...prev, {
      questionNumber: index + 1,
      prompt: currentItem.prompt,
      userChoice: direction === 'right' ? 'Human' : 'AI',
      correct: correctGuess,
      correctAnswer: isHuman ? 'Human' : 'AI',
      humanResponse: currentItem.human,
      aiResponse: currentItem.ai,
      timeTaken
    }]);

    if (correctGuess) {
      setScore(prev => prev + 1);
      if (isHuman) {
        setHumanCorrect(prev => prev + 1);
      }
    }

    setIndex(prev => prev + 1);
  };

  const handleClick = (isFirstResponse) => {
    if (!currentItem) return;

    const isHuman = isFirstResponse ? isHumanFirst : !isHumanFirst;
    const correctGuess = isHuman;
    const userChoice = isFirstResponse
      ? (isHumanFirst ? 'Human' : 'AI')
      : (!isHumanFirst ? 'Human' : 'AI');
    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Add to question history
    setQuestionHistory(prev => [...prev, {
      questionNumber: index + 1,
      prompt: currentItem.prompt,
      userChoice,
      correct: correctGuess,
      correctAnswer: isHuman ? 'Human' : 'AI',
      humanResponse: currentItem.human,
      aiResponse: currentItem.ai,
      timeTaken
    }]);

    if (correctGuess) {
      setScore(prev => prev + 1);
      setHumanCorrect(prev => prev + 1);
    }

    setIndex(prev => prev + 1);
  };

  const persistRoundNotes = () => {
    const trimmedReflection = roundReflection.trim();
    const trimmedMessage = messageInBottle.trim();
    const timestamp = new Date().toISOString();

    if (trimmedReflection) {
      setReflectionLog(prev => [
        ...prev,
        { text: trimmedReflection, theme: selectedTheme || 'All Topics', createdAt: timestamp }
      ]);
    }

    if (trimmedMessage) {
      setBottleMessages(prev => [
        ...prev,
        { text: trimmedMessage, createdAt: timestamp }
      ]);
    }

    setRoundReflection('');
    setMessageInBottle('');
  };

  const resetSessionState = () => {
    setGameStarted(false);
    setFinished(false);
    setShuffledData([]);
    setIndex(0);
    setScore(0);
    setHumanCorrect(0);
    setCurrentItem(null);
    setResponseToShow(null);
    setTimeLeft(timeLimit);
    setStartTime(null);
    setQuestionHistory([]);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handlePlayAgain = () => {
    persistRoundNotes();
    startGame();
  };

  const handleReturnHome = () => {
    persistRoundNotes();
    resetSessionState();
    router.push('/');
  };

  const handleSaveReflection = () => {
    persistRoundNotes();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted || finished) return;
      
      if (gameMode === 'swipe') {
        if (e.key === 'ArrowRight') handleSwipe('right');
        else if (e.key === 'ArrowLeft') handleSwipe('left');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, finished, currentItem, responseToShow, gameMode]);

  if (!gameStarted) {
    return (
      <div style={{ 
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        background: darkMode ? '#0b1120' : '#f8f9fb'
      }}>
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000
        }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: '8px 16px',
              fontSize: `${fontSize * 0.8}px`,
              borderRadius: '8px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
            }}
          >
            ⚙️ Settings
          </button>
        </div>
        {showSettings && <GameSettings onClose={() => setShowSettings(false)} />}
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: '12vh',
          color: darkMode ? '#fff' : '#101828',
          fontSize: `${fontSize * 0.95}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          padding: 20
        }}>
          <div style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 16 }}>Ready for a fresh round?</h1>
            <p style={{ lineHeight: 1.6 }}>
              {selectedTheme
                ? `You're about to test your instincts on the "${selectedTheme}" theme.`
                : "We'll mix in prompts from every theme this time."}
            </p>
            <p style={{ marginTop: 12, color: darkMode ? '#d0d7ff' : '#475467' }}>
              Want a different topic? Head back to the home page and pick a new one before starting.
            </p>
          </div>

          <div style={{
            width: '100%',
            maxWidth: 540,
            background: darkMode ? 'rgba(15,23,42,0.7)' : '#fff',
            borderRadius: 24,
            padding: '32px 28px',
            boxShadow: darkMode ? '0 25px 40px rgba(15,23,42,0.45)' : '0 25px 40px rgba(15, 23, 42, 0.15)',
            border: darkMode ? '1px solid rgba(99,102,241,0.4)' : '1px solid #e2e8f0',
            textAlign: 'left'
          }}>
            <h2 style={{ marginBottom: 16 }}>How this round works</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.7, display: 'grid', gap: 12 }}>
              <li>
                <strong>1.</strong> You'll see one prompt at a time. Decide if the response is{' '}
                <span style={{ color: '#0ea5e9' }}>Human</span> or <span style={{ color: '#f97316' }}>AI</span>.
              </li>
              <li>
                <strong>2.</strong> Use the swipe gesture or the arrow keys <code>←</code> / <code>→</code>.
              </li>
              <li>
                <strong>3.</strong> After the round, leave a quick reflection or message in a bottle.
              </li>
            </ul>
            <div style={{
              marginTop: 24,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12
            }}>
          <button
            onClick={startGame}
            style={{
                  flex: '1 1 180px',
                  padding: '14px 24px',
                  fontSize: `${fontSize * 0.9}px`,
                  borderRadius: 999,
              backgroundColor: '#0070f3',
              color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 16px 30px rgba(0,112,243,0.35)'
                }}
              >
                ▶ Start Round
              </button>
              <button
                onClick={() => router.push('/')}
                style={{
                  flex: '1 1 180px',
                  padding: '14px 24px',
                  fontSize: `${fontSize * 0.9}px`,
                  borderRadius: 999,
                  backgroundColor: darkMode ? 'rgba(148,163,184,0.2)' : '#e2e8f0',
                  color: darkMode ? '#e2e8f0' : '#475467',
              border: 'none',
              cursor: 'pointer'
            }}
          >
                ← Pick a new topic
          </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const totalQuestions = questionHistory.length || shuffledData.length;
    const accuracy = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;

    return (
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          width: '100%',
          padding: '40px 20px 80px',
          background: darkMode ? '#020617' : '#f5f7fb',
          color: darkMode ? '#e2e8f0' : '#0f172a'
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 32 }}>
          <section
            style={{
              borderRadius: 24,
              padding: '36px 32px',
              background: darkMode ? 'rgba(15,23,42,0.75)' : '#fff',
              boxShadow: darkMode ? '0 30px 60px rgba(15,23,42,0.45)' : '0 30px 60px rgba(15,23,42,0.12)',
              border: darkMode ? '1px solid rgba(148,163,184,0.3)' : '1px solid #e2e8f0',
              display: 'grid',
              gap: 28
            }}
          >
            <div>
              <h1 style={{ fontSize: '2.25rem', marginBottom: 12 }}>Round complete 🎯</h1>
              <p style={{ margin: 0, color: darkMode ? '#c7d2fe' : '#475467' }}>
                {selectedTheme ? `Theme: ${selectedTheme}` : 'Theme: Mixed prompts'} · Accuracy {accuracy}% ·{' '}
                {humanCorrect} human answers spotted
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16
              }}
            >
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 18,
                  background: darkMode ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)'
                }}
              >
                <p style={{ margin: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2 }}>Score</p>
                <p style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 700 }}>{score}</p>
                <p style={{ margin: '4px 0 0', fontSize: 14, opacity: 0.75 }}>out of {totalQuestions}</p>
              </div>
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 18,
                  background: darkMode ? 'rgba(22,163,74,0.2)' : 'rgba(34,197,94,0.12)'
                }}
              >
                <p style={{ margin: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Human reads
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 700 }}>{humanCorrect}</p>
              </div>
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 18,
                  background: darkMode ? 'rgba(244,114,182,0.18)' : 'rgba(236,72,153,0.12)'
                }}
              >
                <p style={{ margin: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Avg time
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 700 }}>
                  {questionHistory.length
                    ? `${Math.round(questionHistory.reduce((acc, q) => acc + (q.timeTaken || 0), 0) / questionHistory.length)}s`
                    : '—'}
                </p>
              </div>
        </div>
        
            <div
              style={{
                display: 'grid',
                gap: 20,
                background: darkMode ? 'rgba(15,23,42,0.55)' : '#f8fafc',
                borderRadius: 20,
                padding: '24px 24px 28px'
              }}
            >
              <div>
                <h2 style={{ marginBottom: 8 }}>Reflect on this round</h2>
                <p style={{ margin: 0, color: darkMode ? '#94a3b8' : '#667085' }}>
                  What surprised you? Capture it here to track your intuition over time.
                </p>
              </div>
              <textarea
                value={roundReflection}
                onChange={(e) => setRoundReflection(e.target.value)}
                placeholder="I noticed that..."
                rows={3}
                style={{
                  width: '100%',
                  borderRadius: 16,
                  padding: '16px 18px',
                  border: '1px solid rgba(148,163,184,0.4)',
                  background: darkMode ? 'rgba(15,23,42,0.85)' : '#fff',
                  color: 'inherit',
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
              />

              <div>
                <h3 style={{ marginBottom: 8 }}>Message in a bottle</h3>
                <p style={{ margin: 0, color: darkMode ? '#94a3b8' : '#667085' }}>
                  Leave a note for future players (optional).
                </p>
              </div>
              <textarea
                value={messageInBottle}
                onChange={(e) => setMessageInBottle(e.target.value)}
                placeholder="To everyone playing after me..."
                rows={2}
                style={{
            width: '100%',
                  borderRadius: 16,
                  padding: '16px 18px',
                  border: '1px solid rgba(148,163,184,0.4)',
                  background: darkMode ? 'rgba(15,23,42,0.85)' : '#fff',
                  color: 'inherit',
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                <button
                  onClick={handleSaveReflection}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundColor: '#22c55e',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  💾 Save reflection
                </button>
                <button
                  onClick={handlePlayAgain}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  🔁 Play another round
                </button>
                <button
                  onClick={handleReturnHome}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundColor: darkMode ? 'rgba(148,163,184,0.2)' : '#e2e8f0',
                    color: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  🏠 Back to landing
                </button>
              </div>
            </div>
          </section>

          {(reflectionLog.length > 0 || bottleMessages.length > 0) && (
            <section
              style={{
                borderRadius: 20,
                padding: '24px 28px',
                background: darkMode ? 'rgba(15,23,42,0.6)' : '#fff',
                boxShadow: darkMode ? '0 20px 40px rgba(15,23,42,0.4)' : '0 20px 40px rgba(15,23,42,0.1)',
                border: darkMode ? '1px solid rgba(148,163,184,0.25)' : '1px solid #e2e8f0',
                display: 'grid',
                gap: 20
              }}
            >
              {reflectionLog.length > 0 && (
                <div>
                  <h2 style={{ marginBottom: 12 }}>Saved reflections</h2>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
                    {reflectionLog.map((entry, idx) => (
                      <li
                        key={`${entry.createdAt}-${idx}`}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 16,
                          background: darkMode ? 'rgba(30,41,59,0.7)' : '#f8fafc',
                          display: 'grid',
                          gap: 4
                        }}
                      >
                        <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
                          {entry.theme} · {new Date(entry.createdAt).toLocaleString()}
                        </span>
                        <span>{entry.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {bottleMessages.length > 0 && (
                <div>
                  <h2 style={{ marginBottom: 12 }}>Messages in a bottle</h2>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
                    {bottleMessages.map((entry, idx) => (
                      <li
                        key={`${entry.createdAt}-${idx}`}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 16,
                          background: darkMode ? 'rgba(30,41,59,0.7)' : '#fefce8',
                          border: darkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid #facc15'
                        }}
                      >
                        <span style={{ display: 'block', marginBottom: 4, fontSize: 13, opacity: 0.75 }}>
                          Dropped {new Date(entry.createdAt).toLocaleString()}
                        </span>
                        <span>{entry.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section
            style={{
              borderRadius: 20,
              background: darkMode ? 'rgba(15,23,42,0.7)' : '#fff',
              border: darkMode ? '1px solid rgba(148,163,184,0.3)' : '1px solid #e2e8f0',
              boxShadow: darkMode ? '0 25px 50px rgba(15,23,42,0.45)' : '0 25px 50px rgba(15,23,42,0.12)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: darkMode ? '1px solid rgba(148,163,184,0.25)' : '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0 }}>Round breakdown</h2>
            </div>
            <div style={{ maxHeight: '60vh', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
                  <tr style={{ background: darkMode ? 'rgba(30,41,59,0.95)' : '#f8fafc', color: darkMode ? '#cbd5f5' : '#475467' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Prompt</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Human response</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>AI response</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>You chose</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {questionHistory.map((question, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: darkMode ? '1px solid rgba(148,163,184,0.15)' : '1px solid #e2e8f0',
                        background: question.correct
                          ? (darkMode ? 'rgba(22,163,74,0.1)' : 'rgba(187,247,208,0.35)')
                          : (darkMode ? 'rgba(239,68,68,0.12)' : 'rgba(254,226,226,0.6)')
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{question.questionNumber}</td>
                      <td style={{ padding: '14px 16px', maxWidth: 280 }}>{question.prompt}</td>
                      <td style={{ padding: '14px 16px', maxWidth: 280 }}>{question.humanResponse}</td>
                      <td style={{ padding: '14px 16px', maxWidth: 280 }}>{question.aiResponse}</td>
                      <td style={{ padding: '14px 16px' }}>{question.userChoice}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 12px',
                            borderRadius: 999,
                            fontWeight: 600,
                            background: question.correct
                              ? (darkMode ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.18)')
                              : (darkMode ? 'rgba(248,113,113,0.25)' : 'rgba(248,113,113,0.18)'),
                            color: question.correct ? '#15803d' : '#b91c1c'
                          }}
                        >
                          {question.correct ? '✅ Correct' : '❌ Incorrect'}
                          <span style={{ fontSize: 12, opacity: 0.8 }}>
                            Truth: {question.correctAnswer}
                          </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 20px 80px',
        color: darkMode ? '#e2e8f0' : '#0f172a',
        background: darkMode ? '#020617' : '#f5f7fb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32
      }}
    >
      <div style={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>Human or AI?</h2>
        {currentItem && (
          <>
            <p style={{ fontSize: '1.05rem', marginBottom: 12 }}>
              <strong>Prompt:</strong> {currentItem.prompt}
            </p>
            <p style={{ color: darkMode ? '#94a3b8' : '#475467', marginBottom: 16 }}>
              Question {index + 1} of {shuffledData.length}
            </p>
            <div
              className="timer-container"
              style={{
                margin: '0 auto',
                padding: '6px 14px',
                borderRadius: 999,
                backgroundColor: timeLeft <= 10 ? '#ef4444' : '#6366f1',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600
              }}
            >
              ⏱️ {timeLeft}s left · limit {timeLimit}s
            </div>
          </>
        )}
      </div>

      {gameMode === 'swipe' ? (
        <div
          style={{
            width: '100%',
            maxWidth: 820,
            display: 'grid',
            gap: 24,
            textAlign: 'center'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              fontSize: '0.95rem',
              color: darkMode ? '#94a3b8' : '#475467'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '2rem' }}>🤖</span>
              Swipe left for <strong>AI</strong>
            </span>
            <span
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: darkMode ? 'rgba(148,163,184,0.15)' : '#e2e8f0',
                fontWeight: 600
              }}
            >
              Use ← / →
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <strong>Human</strong> swipe right
              <span style={{ fontSize: '2rem' }}>👤</span>
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <AnimatePresence>
              {responseToShow && (
                <motion.div
                  key={index}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(e, info) => {
                    if (info.offset.x > 100) handleSwipe('right');
                    else if (info.offset.x < -100) handleSwipe('left');
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  style={{
                    width: '100%',
                    maxWidth: 480,
                    padding: '32px 28px',
                    background: darkMode ? 'rgba(15,23,42,0.85)' : '#fff',
                    border: darkMode ? '1px solid rgba(148,163,184,0.25)' : '1px solid #e2e8f0',
                    borderRadius: 28,
                    boxShadow: darkMode ? '0 30px 50px rgba(15,23,42,0.55)' : '0 30px 60px rgba(15,23,42,0.12)',
                    cursor: 'grab',
                    lineHeight: 1.6
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      minHeight: 180,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {responseToShow}
                  </div>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: darkMode ? '#94a3b8' : '#667085',
                      marginTop: 20,
                      display: 'inline-flex',
                      gap: 8,
                      alignItems: 'center',
                      padding: '6px 12px',
                      borderRadius: 999,
                      background: darkMode ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.12)'
                    }}
                  >
                    <span>👆</span> Drag the card or press the arrow keys.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            maxWidth: 920,
            display: 'grid',
            gap: 24
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.95rem',
              color: darkMode ? '#94a3b8' : '#475467'
            }}
          >
            <span>Tap the response you believe came from a human writer.</span>
          </div>

          <AnimatePresence>
            {currentItem && (
              <div
                style={{
                  display: 'grid',
                  gap: 20,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
                }}
              >
                <motion.div
                  key={`response-1-${index}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  style={{
                    padding: '28px 24px',
                    background: darkMode ? 'rgba(15,23,42,0.8)' : '#fff',
                    border: darkMode ? '1px solid rgba(148,163,184,0.25)' : '1px solid #e2e8f0',
                    borderRadius: 24,
                    boxShadow: darkMode ? '0 24px 40px rgba(15,23,42,0.45)' : '0 24px 50px rgba(15,23,42,0.12)',
                    cursor: 'pointer',
                    display: 'grid',
                    gap: 16
                  }}
                  onClick={() => handleClick(true)}
                >
                  <span
                    style={{
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: 1.6,
                      color: darkMode ? '#c7d2fe' : '#6366f1'
                    }}
                  >
                    Option A
                  </span>
                  <div style={{ lineHeight: 1.6 }}>
                    {isHumanFirst ? currentItem.human : currentItem.ai}
                  </div>
                </motion.div>
                <motion.div
                  key={`response-2-${index}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  style={{
                    padding: '28px 24px',
                    background: darkMode ? 'rgba(15,23,42,0.8)' : '#fff',
                    border: darkMode ? '1px solid rgba(148,163,184,0.25)' : '1px solid #e2e8f0',
                    borderRadius: 24,
                    boxShadow: darkMode ? '0 24px 40px rgba(15,23,42,0.45)' : '0 24px 50px rgba(15,23,42,0.12)',
                    cursor: 'pointer',
                    display: 'grid',
                    gap: 16
                  }}
                  onClick={() => handleClick(false)}
                >
                  <span
                    style={{
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: 1.6,
                      color: darkMode ? '#c7d2fe' : '#6366f1'
                    }}
                  >
                    Option B
                  </span>
                  <div style={{ lineHeight: 1.6 }}>
                    {isHumanFirst ? currentItem.ai : currentItem.human}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
