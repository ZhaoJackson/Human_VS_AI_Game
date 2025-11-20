import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useUser } from '@auth0/nextjs-auth0/client';
import { data } from '../src/features/game/data/turing_data';
import { useGame } from '../src/features/game/contexts/GameContext';
import GameSettings from '../src/components/game/GameSettings';

export default function Game() {
  const { darkMode, gameMode, timeLimit, fontSize } = useGame();
  const { user } = useUser();

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
  const [roundId, setRoundId] = useState('');
  const [loggingState, setLoggingState] = useState('idle'); // idle | pending | success | error | duplicate
  const [logError, setLogError] = useState('');
  const [formCompleted, setFormCompleted] = useState(false);
  const [roundIdCopied, setRoundIdCopied] = useState(false);
  const [lastLoggedRoundId, setLastLoggedRoundId] = useState('');
  const timerRef = useRef(null);

  const generateRoundId = useCallback(() => {
    return crypto.randomUUID();
  }, []);

  const clearFormQuery = useCallback(() => {
    if (!router.isReady) return;
    if (!('form' in router.query || 'rid' in router.query)) return;

    const updatedQuery = { ...router.query };
    delete updatedQuery.form;
    delete updatedQuery.rid;

    router.replace(
      { pathname: router.pathname, query: updatedQuery },
      undefined,
      { shallow: true }
    );
  }, [router]);

  const totalQuestions = questionHistory.length || shuffledData.length;

  const averageTimeSeconds = useMemo(() => {
    if (!questionHistory.length) return 0;
    const totalTime = questionHistory.reduce((acc, q) => acc + (q.timeTaken || 0), 0);
    return questionHistory.length ? Number((totalTime / questionHistory.length).toFixed(2)) : 0;
  }, [questionHistory]);

  const accuracyPercent = useMemo(() => {
    if (!totalQuestions) return 0;
    return Math.round((score / totalQuestions) * 100);
  }, [score, totalQuestions]);

  const feedbackFormUrl = useMemo(() => {
    if (!roundId) return '';
    const baseUrl = process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL;
    if (!baseUrl) return '';

    try {
      const url = new URL(baseUrl);
      const email = user?.email || '';
      const firstName = user?.given_name || (user?.name ? user.name.split(' ')[0] : '');
      const lastName = user?.family_name || (user?.name ? user.name.split(' ').slice(1).join(' ') : '');
      const localPart = email ? email.split('@')[0] : '';
      const themeLabel = selectedTheme || 'Mixed prompts';

      const mappings = {
        email: process.env.NEXT_PUBLIC_FEEDBACK_FORM_EMAIL_FIELD,
        firstName: process.env.NEXT_PUBLIC_FEEDBACK_FORM_FIRST_NAME_FIELD,
        lastName: process.env.NEXT_PUBLIC_FEEDBACK_FORM_LAST_NAME_FIELD,
        uni: process.env.NEXT_PUBLIC_FEEDBACK_FORM_UNI_FIELD,
        category: process.env.NEXT_PUBLIC_FEEDBACK_FORM_CATEGORY_FIELD || 'category',
        roundId: process.env.NEXT_PUBLIC_FEEDBACK_FORM_ROUND_ID_FIELD || 'round_id',
      };

      if (mappings.email && email) url.searchParams.set(mappings.email, email);
      if (mappings.firstName && firstName) url.searchParams.set(mappings.firstName, firstName);
      if (mappings.lastName && lastName) url.searchParams.set(mappings.lastName, lastName);
      if (mappings.uni && localPart) url.searchParams.set(mappings.uni, localPart);

      url.searchParams.set(mappings.category, themeLabel);
      url.searchParams.set(mappings.roundId, roundId);

      return url.toString();
    } catch (error) {
      console.warn('Invalid NEXT_PUBLIC_FEEDBACK_FORM_URL', error);
      return '';
    }
  }, [roundId, selectedTheme, user]);

  useEffect(() => {
    if (!router.isReady) return;
    const incomingTheme = Array.isArray(router.query.theme)
      ? router.query.theme[0]
      : router.query.theme || '';
    if (incomingTheme !== selectedTheme) {
      setSelectedTheme(incomingTheme);
    }
  }, [router.isReady, router.query.theme, selectedTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorage = (event) => {
      if (event.key !== 'turing:formStatus' || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        if (payload.status === 'ok' && payload.rid && payload.rid === roundId) {
          setFormCompleted(true);
        }
      } catch (error) {
        console.warn('Unable to parse form status from storage', error);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [roundId]);

  useEffect(() => {
    if (!roundIdCopied) return;
    const timeout = setTimeout(() => setRoundIdCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [roundIdCopied]);

  useEffect(() => {
    if (typeof window === 'undefined' || !roundId) return;
    const stored = window.localStorage.getItem('turing:formStatus');
    if (!stored) return;

    try {
      const payload = JSON.parse(stored);
      if (payload.status === 'ok' && payload.rid === roundId) {
        setFormCompleted(true);
      }
    } catch (error) {
      console.warn('Unable to hydrate form status from storage', error);
    }
  }, [roundId]);

  useEffect(() => {
    if (!router.isReady) return;
    const formParam = Array.isArray(router.query.form) ? router.query.form[0] : router.query.form;
    const ridParam = Array.isArray(router.query.rid) ? router.query.rid[0] : router.query.rid;

    if (formParam === 'ok' && ridParam) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('turing:formStatus', JSON.stringify({
          status: 'ok',
          rid: ridParam,
          at: Date.now(),
        }));
      }

      if (roundId && ridParam === roundId) {
        setFormCompleted(true);
      }
    }
  }, [router.isReady, router.query.form, router.query.rid, roundId]);

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
    clearFormQuery();
    const newRound = generateRoundId();
    setRoundId(newRound);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('turing:lastRoundId', newRound);
      window.localStorage.removeItem('turing:formStatus');
    }
    setLoggingState('idle');
    setLogError('');
    setFormCompleted(false);
    setLastLoggedRoundId('');
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
      : (isHumanFirst ? 'AI' : 'Human');
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
    setRoundId('');
    setLoggingState('idle');
    setLogError('');
    setFormCompleted(false);
    setLastLoggedRoundId('');
    clearFormQuery();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('turing:lastRoundId');
      window.localStorage.removeItem('turing:formStatus');
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handlePlayAgain = () => {
    if (!formCompleted) return;
    startGame();
  };

  const handleReturnHome = () => {
    resetSessionState();
    router.push('/');
  };

  const handleOpenFeedbackForm = () => {
    if (!feedbackFormUrl || typeof window === 'undefined') return;
    window.open(feedbackFormUrl, '_blank', 'noopener');
  };

  const handleRetryLog = () => {
    setLoggingState('idle');
    setLogError('');
  };

  const handleCopyRoundId = async () => {
    if (!roundId || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(roundId);
      setRoundIdCopied(true);
    } catch (error) {
      console.warn('Unable to copy round ID', error);
    }
  };

  useEffect(() => {
    if (!finished || !roundId) return;
    if (!totalQuestions) return;
    if (lastLoggedRoundId === roundId) return;
    if (loggingState !== 'idle') return;

    const controller = new AbortController();
    const accuracyForApi = Number((totalQuestions ? (score / totalQuestions) * 100 : 0).toFixed(2));
    const avgTimeForApi = Number(averageTimeSeconds.toFixed(2));
    const category = selectedTheme || 'Mixed prompts';

    const logRoundResults = async () => {
      console.log('🟢 [FRONTEND] Starting to log round results...');
      console.log('🟢 [FRONTEND] Round ID:', roundId);
      console.log('🟢 [FRONTEND] Payload:', {
        roundId,
        category,
        numQuestions: totalQuestions,
        score,
        accuracyPct: accuracyForApi,
        avgTimeSeconds: avgTimeForApi,
      });

      setLoggingState('pending');

      // Create timeout for the request
      const timeoutId = setTimeout(() => {
        console.error('🔴 [FRONTEND] Request timeout after 10 seconds');
        controller.abort();
      }, 10000);

      try {
        console.log('🟢 [FRONTEND] Sending POST request to /api/submit-data...');
        const response = await fetch('/api/submit-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roundId,
            category,
            numQuestions: totalQuestions,
            score,
            accuracyPct: accuracyForApi,
            avgTimeSeconds: avgTimeForApi,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('🟢 [FRONTEND] Response received:', response.status, response.statusText);

        if (!response.ok) {
          const message = await response.text();
          console.error('🔴 [FRONTEND] Response not OK:', message);
          throw new Error(message || 'Failed to log results');
        }

        const data = await response.json();
        console.log('🟢 [FRONTEND] Response data:', data);

        if (controller.signal.aborted) return;

        if (data.status === 'duplicate') {
          console.log('⚠️  [FRONTEND] Duplicate round detected');
          setLoggingState('duplicate');
        } else {
          console.log('✅ [FRONTEND] Round logged successfully');
          setLoggingState('success');
        }
        setLastLoggedRoundId(roundId);
        setLogError('');
      } catch (error) {
        clearTimeout(timeoutId);
        if (controller.signal.aborted) {
          console.error('🔴 [FRONTEND] Request was aborted/timed out');
          setLoggingState('error');
          setLogError('Request timed out after 10 seconds');
          return;
        }
        console.error('🔴 [FRONTEND] Error logging round:', error);
        console.error('🔴 [FRONTEND] Error message:', error.message);
        setLoggingState('error');
        setLogError(error.message);
      }
    };

    logRoundResults();

    return () => controller.abort();
  }, [
    averageTimeSeconds,
    finished,
    lastLoggedRoundId,
    loggingState,
    roundId,
    score,
    selectedTheme,
    totalQuestions,
  ]);

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
                <strong>3.</strong> After the round, complete the Google feedback form to unlock the next game.
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
    const themeLabel = selectedTheme || 'Mixed prompts';
    const averageDisplay = averageTimeSeconds ? `${averageTimeSeconds.toFixed(1)}s` : '—';
    const playAgainDisabled = !formCompleted;
    const feedbackButtonLabel = formCompleted ? 'Reopen Feedback Form' : 'Open Feedback Form';
    const loggingDescriptions = {
      idle: 'Preparing to log this round to Google Sheets…',
      pending: 'Logging round results to Google Sheets…',
      success: 'Round logged successfully to Google Sheets.',
      duplicate: 'This round was already logged earlier—no duplicate entry was created.',
      error: logError ? `Logging failed: ${logError}` : 'Logging failed. Please try again.',
    };
    const loggingDescription = loggingDescriptions[loggingState] || loggingDescriptions.idle;

    return (
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          width: '100%',
          padding: '40px 20px 80px',
          background: darkMode ? '#020617' : '#f5f7fb',
          color: darkMode ? '#e2e8f0' : '#0f172a',
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
              gap: 28,
            }}
          >
            <div>
              <h1 style={{ fontSize: '2.25rem', marginBottom: 12 }}>Round complete 🎯</h1>
              <p style={{ margin: 0, color: darkMode ? '#c7d2fe' : '#475467' }}>
                Theme: {themeLabel} · Accuracy {accuracyPercent}% · {humanCorrect} human answers spotted
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
              }}
            >
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 18,
                  background: darkMode ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)',
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
                  background: darkMode ? 'rgba(22,163,74,0.2)' : 'rgba(34,197,94,0.12)',
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
                  background: darkMode ? 'rgba(244,114,182,0.18)' : 'rgba(236,72,153,0.12)',
                }}
              >
                <p style={{ margin: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Avg time
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 700 }}>{averageDisplay}</p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 20,
                background: darkMode ? 'rgba(15,23,42,0.55)' : '#f8fafc',
                borderRadius: 20,
                padding: '24px 24px 28px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h2 style={{ marginBottom: 8 }}>Submit required feedback</h2>
                  <p style={{ margin: 0, color: darkMode ? '#94a3b8' : '#667085' }}>
                    We collect reflections through a Google Form. Submitting it unlocks the next round.
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 999,
                      background: darkMode ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)',
                      color: darkMode ? '#c7d2fe' : '#1d4ed8',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Round ID: <code style={{ fontSize: 13 }}>{roundId || 'pending'}</code>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRoundId}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 999,
                      border: '1px solid rgba(148,163,184,0.4)',
                      background: 'transparent',
                      color: darkMode ? '#e2e8f0' : '#475467',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    {roundIdCopied ? 'Copied!' : 'Copy round ID'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <button
                    type="button"
                    onClick={handleOpenFeedbackForm}
                    disabled={!feedbackFormUrl}
                    style={{
                      padding: '12px 28px',
                      borderRadius: 999,
                      border: 'none',
                      backgroundColor: feedbackFormUrl ? '#2563eb' : 'rgba(148,163,184,0.4)',
                      color: '#fff',
                      cursor: feedbackFormUrl ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                    }}
                  >
                    {feedbackButtonLabel}
                  </button>
                  {feedbackFormUrl && (
                    <a
                      href={feedbackFormUrl}
                      target="_blank"
                      rel="noopener"
                      style={{
                        padding: '12px 24px',
                        borderRadius: 999,
                        border: '1px solid rgba(148,163,184,0.6)',
                        color: darkMode ? '#e2e8f0' : '#475467',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Open in current tab
                    </a>
                  )}
                </div>

                {!feedbackFormUrl && (
                  <p style={{ margin: 0, color: '#f97316', fontSize: '0.9rem' }}>
                    Configure `NEXT_PUBLIC_FEEDBACK_FORM_URL` and field mappings to enable the feedback form button.
                  </p>
                )}

                <p style={{ margin: 0, color: darkMode ? '#94a3b8' : '#475467', fontSize: '0.95rem' }}>
                  {formCompleted
                    ? 'Feedback received! “Play another round” is unlocked.'
                    : 'Submit the Google Form to unlock “Play another round.”'}
                </p>
              </div>

              <div
                style={{
                  padding: '20px 24px',
                  borderRadius: 16,
                  background: darkMode ? 'rgba(15,23,42,0.7)' : '#fff',
                  border: darkMode ? '1px solid rgba(148,163,184,0.25)' : '1px solid rgba(148,163,184,0.2)',
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <strong>Round logging status</strong>
                  <span
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      background:
                        loggingState === 'success' || loggingState === 'duplicate'
                          ? (darkMode ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.18)')
                          : loggingState === 'error'
                            ? (darkMode ? 'rgba(239,68,68,0.25)' : 'rgba(248,113,113,0.18)')
                            : (darkMode ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.18)'),
                      color:
                        loggingState === 'success' || loggingState === 'duplicate'
                          ? '#15803d'
                          : loggingState === 'error'
                            ? '#b91c1c'
                            : darkMode
                              ? '#c7d2fe'
                              : '#1d4ed8',
                    }}
                  >
                    {loggingState.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: 0, color: darkMode ? '#cbd5f5' : '#475467', fontSize: '0.95rem' }}>
                  {loggingDescription}
                </p>
                {loggingState === 'error' && (
                  <button
                    type="button"
                    onClick={handleRetryLog}
                    style={{
                      justifySelf: 'start',
                      padding: '10px 20px',
                      borderRadius: 999,
                      border: '1px solid rgba(248,113,113,0.6)',
                      background: darkMode ? 'rgba(248,113,113,0.2)' : 'rgba(248,113,113,0.12)',
                      color: darkMode ? '#fecaca' : '#b91c1c',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    Retry logging
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button
                  onClick={handlePlayAgain}
                  disabled={playAgainDisabled}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundColor: playAgainDisabled ? 'rgba(148,163,184,0.35)' : '#2563eb',
                    color: '#fff',
                    cursor: playAgainDisabled ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
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
                    color: darkMode ? '#e2e8f0' : '#475467',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  🏠 Back to landing
                </button>
              </div>
            </div>

            <p style={{ margin: 0, color: darkMode ? '#94a3b8' : '#667085', fontSize: '0.85rem' }}>
              We store round stats (email, UNI, score, accuracy, timing) to improve the program and audit outcomes.
              Questions? Contact privacy@yourdomain.edu.
            </p>
          </section>

          <section
            style={{
              borderRadius: 20,
              background: darkMode ? 'rgba(15,23,42,0.7)' : '#fff',
              border: darkMode ? '1px solid rgba(148,163,184,0.3)' : '1px solid #e2e8f0',
              boxShadow: darkMode ? '0 25px 50px rgba(15,23,42,0.45)' : '0 25px 50px rgba(15,23,42,0.12)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: darkMode ? '1px solid rgba(148,163,184,0.25)' : '1px solid #e2e8f0',
              }}
            >
              <h2 style={{ margin: 0 }}>Round breakdown</h2>
            </div>
            <div style={{ maxHeight: '60vh', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr
                    style={{
                      background: darkMode ? 'rgba(30,41,59,0.95)' : '#f8fafc',
                      color: darkMode ? '#cbd5f5' : '#475467',
                    }}
                  >
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
                          ? darkMode
                            ? 'rgba(22,163,74,0.1)'
                            : 'rgba(187,247,208,0.35)'
                          : darkMode
                            ? 'rgba(239,68,68,0.12)'
                            : 'rgba(254,226,226,0.6)',
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
                              ? darkMode
                                ? 'rgba(34,197,94,0.25)'
                                : 'rgba(34,197,94,0.18)'
                              : darkMode
                                ? 'rgba(248,113,113,0.25)'
                                : 'rgba(248,113,113,0.18)',
                            color: question.correct ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {question.correct ? '✅ Correct' : '❌ Incorrect'}
                          <span style={{ fontSize: 12, opacity: 0.8 }}>Truth: {question.correctAnswer}</span>
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

export const getServerSideProps = withPageAuthRequired();
