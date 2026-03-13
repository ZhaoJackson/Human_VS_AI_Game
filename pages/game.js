import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
// Auth import kept for re-activation; only used when AUTH_ENABLED=true
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useUser } from '@auth0/nextjs-auth0/client';
import { data } from '../src/features/game/data/turing_data';
import { pickFromPool, clearPool, buildTripletIds, resolveTriplet } from '../src/lib/sampling';
import { useGame } from '../src/features/game/contexts/GameContext';
import { useSession } from '../src/features/game/contexts/SessionContext';
import GameSettings from '../src/components/game/GameSettings';

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

export default function Game() {
  const { darkMode, timeLimit, fontSize } = useGame();
  // user is kept for re-activation; not required when AUTH_ENABLED=false
  const { user } = useUser();
  const { sessionStats, addRoundToSession, clearSession } = useSession();

  // Stable participant ID — generated once per browser session so the same person
  // can be linked across multiple rounds and the feedback form.
  const [participantId] = useState(() => {
    if (typeof window === 'undefined') return crypto.randomUUID();
    const saved = sessionStorage.getItem('turing:participantId');
    if (saved) return saved;
    const newId = crypto.randomUUID();
    sessionStorage.setItem('turing:participantId', newId);
    return newId;
  });

  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState('');
  const [activeGameMode, setActiveGameMode] = useState('click');
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
  const [loggingState, setLoggingState] = useState('idle');
  const [logError, setLogError] = useState('');
  const [formCompleted, setFormCompleted] = useState(false);
  const [roundIdCopied, setRoundIdCopied] = useState(false);
  const [lastLoggedRoundId, setLastLoggedRoundId] = useState('');
  const [currentNumPrompts, setCurrentNumPrompts] = useState(3);
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
    if (!totalQuestions) return '0.0';
    return ((score / totalQuestions) * 100).toFixed(1);
  }, [score, totalQuestions]);

  // feedbackFormUrl kept for legacy/re-activation use with AUTH_ENABLED=true
  const feedbackFormUrl = useMemo(() => {
    if (!roundId) return '';
    const baseUrl = process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL;
    if (!baseUrl) return '';
    try {
      const url = new URL(baseUrl);
      const participantField = process.env.NEXT_PUBLIC_FEEDBACK_FORM_PARTICIPANT_ID_FIELD;
      const roundField = process.env.NEXT_PUBLIC_FEEDBACK_FORM_ROUND_ID_FIELD || 'round_id';
      if (participantField) url.searchParams.set(participantField, participantId);
      url.searchParams.set(roundField, roundId);
      return url.toString();
    } catch (error) {
      console.warn('Invalid NEXT_PUBLIC_FEEDBACK_FORM_URL', error);
      return '';
    }
  }, [roundId, participantId]);

  // feedbackCollectionUrl — prefills participantId so responses link back to game rounds.
  const feedbackCollectionUrl = useMemo(() => {
    const DIRECT_LINK = 'https://forms.gle/vLRUDWqak7AjEgb99';
    const baseUrl = process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL;
    if (!baseUrl) return DIRECT_LINK;
    try {
      const url = new URL(baseUrl);
      const participantField = process.env.NEXT_PUBLIC_FEEDBACK_FORM_PARTICIPANT_ID_FIELD;
      if (participantField) url.searchParams.set(participantField, participantId);
      return url.toString();
    } catch {
      return DIRECT_LINK;
    }
  }, [participantId]);

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

  useEffect(() => {
    if (!router.isReady || gameStarted || finished) return;

    const incomingTheme = Array.isArray(router.query.theme)
      ? router.query.theme[0]
      : router.query.theme || '';

    const incomingMode = Array.isArray(router.query.mode)
      ? router.query.mode[0]
      : router.query.mode || 'click';

    const incomingPrompts = Math.max(1, Number(
      Array.isArray(router.query.prompts) ? router.query.prompts[0] : router.query.prompts
    ) || 3);

    setSelectedTheme(incomingTheme);
    // Swipe mode is deactivated — always use click regardless of URL param
    setActiveGameMode('click');
    startGame(incomingTheme, incomingPrompts);
  }, [router.isReady]);

  // theme / numPrompts params let callers bypass stale state
  const startGame = (theme = selectedTheme, numPrompts = 3) => {
    // Valid entries for this category
    const filtered = (theme
      ? data.filter(item => item.condition?.trim() === theme)
      : data
    ).filter(item => item.prompt && item.human1 && item.ai1);

    // Build all (entry × human × ai) triplet IDs for this category
    const allTripletIds = filtered.flatMap(item => buildTripletIds(item));

    // Clamp to available triplets so we never exceed what exists
    const count = Math.min(numPrompts, allTripletIds.length) || 1;

    // Sampling without replacement at triplet level
    const pickedTriplets = pickFromPool(theme, allTripletIds, count);

    // Resolve each triplet ID → normalized { ...entry, human, ai, aiSource }
    const entryMap = Object.fromEntries(filtered.map(item => [item.id, item]));
    const selected = pickedTriplets.map(tripletId => {
      const [entryId, expIdxStr] = tripletId.split(':');
      const entry = entryMap[entryId];
      if (!entry) return null;
      const { human, ai, aiSource } = resolveTriplet(entry, Number(expIdxStr));
      return { ...entry, human, ai, aiSource };
    }).filter(Boolean);

    setShuffledData(selected);
    setIndex(0);
    setScore(0);
    setHumanCorrect(0);
    setCurrentNumPrompts(count);
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

  useEffect(() => {
    if (shuffledData.length > 0 && index < shuffledData.length) {
      const item = shuffledData[index];
      // human/ai/aiSource are already resolved by startGame via resolveTriplet
      const showHuman = Math.random() > 0.5;
      setCurrentItem(item);
      setResponseToShow(showHuman ? item.human : item.ai);
      setIsHumanFirst(Math.random() > 0.5);
      setStartTime(Date.now());
    } else if (shuffledData.length > 0 && index >= shuffledData.length) {
      setFinished(true);
    }
  }, [shuffledData, index]);

  const handleSwipe = (direction) => {
    if (!currentItem || !responseToShow) return;

    const isHuman = responseToShow === currentItem.human;
    const correctGuess = (direction === 'right' && isHuman) || (direction === 'left' && !isHuman);
    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : null;

    setQuestionHistory(prev => [...prev, {
      questionNumber: index + 1,
      prompt: currentItem.prompt,
      userChoice: direction === 'right' ? 'Human' : 'AI',
      correct: correctGuess,
      correctAnswer: isHuman ? 'Human' : 'AI',
      humanResponse: currentItem.human,
      aiResponse: currentItem.ai,
      aiSource: currentItem.aiSource || '',
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

    setQuestionHistory(prev => [...prev, {
      questionNumber: index + 1,
      prompt: currentItem.prompt,
      userChoice,
      correct: correctGuess,
      correctAnswer: isHuman ? 'Human' : 'AI',
      humanResponse: currentItem.human,
      aiResponse: currentItem.ai,
      aiSource: currentItem.aiSource || '',
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
  };

  const handleReturnHome = () => {
    clearPool(null); // clear ALL category pools — fresh start next session
    clearSession();
    router.push('/start');
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

  const handleSaveRound = async () => {
    if (!finished || !roundId) return;
    if (loggingState === 'pending' || loggingState === 'success') return;

    const controller = new AbortController();
    const accuracyForApi = Number((totalQuestions ? (score / totalQuestions) * 100 : 0).toFixed(2));
    const avgTimeForApi = Number(averageTimeSeconds.toFixed(2));
    const category = selectedTheme || 'Mixed prompts';

    console.log('🟢 [FRONTEND] Starting to log round results...');
    console.log('🟢 [FRONTEND] Round ID:', roundId);
    console.log('🟢 [FRONTEND] Payload:', { roundId, category, score, accuracyPct: accuracyForApi, avgTimeSeconds: avgTimeForApi, questionHistory });

    setLoggingState('pending');

    const timeoutId = setTimeout(() => {
      console.error('🔴 [FRONTEND] Request timeout after 30 seconds');
      controller.abort();
    }, 30000);

    try {
      console.log('🟢 [FRONTEND] Sending POST request to /api/submit-data...');
      const response = await fetch('/api/submit-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roundId,
          participantId,
          category,
          score,
          accuracyPct: accuracyForApi,
          avgTimeSeconds: avgTimeForApi,
          questionHistory,
          // user kept for re-activation when AUTH_ENABLED=true
          ...(AUTH_ENABLED && user ? { user } : {}),
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
        console.log('✅ [SUBMIT] Round logged successfully');
        setLoggingState('success');
        setLastLoggedRoundId(roundId);

        addRoundToSession({
          roundId,
          category: selectedTheme || 'Mixed',
          numQuestions: totalQuestions,
          score,
          accuracyPct: (score / totalQuestions) * 100,
          avgTimeSeconds: averageTimeSeconds
        });
      }
      setLogError('');
    } catch (error) {
      clearTimeout(timeoutId);
      if (controller.signal.aborted) {
        console.error('🔴 [FRONTEND] Request was aborted/timed out');
        setLoggingState('error');
        setLogError('Request timed out after 30 seconds');
        return;
      }
      console.error('🔴 [FRONTEND] Error logging round:', error);
      console.error('🔴 [FRONTEND] Error message:', error.message);
      setLoggingState('error');
      setLogError(error.message);
    }
  };

  useEffect(() => {
    if (finished && roundId && loggingState === 'idle') {
      console.log('🟢 [AUTO-SAVE] Round finished, triggering auto-save...');
      handleSaveRound();
    }
  }, [finished, roundId, loggingState, handleSaveRound]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted || finished) return;

      if (activeGameMode === 'swipe') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleSwipe('left');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleSwipe('right');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, finished, activeGameMode, handleSwipe]);

  const renderHeader = () => (
    <header style={{
      padding: '20px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#1A2E4A',
    }}>
      <Link
        href="/"
        aria-label="Turing Test – go to home page"
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          fontFamily: 'Lora, "Times New Roman", serif',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: 4,
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.outline = '3px solid #F7F4EF'; e.currentTarget.style.outlineOffset = '4px'; }}
        onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
      >
        Turing Test
      </Link>
      {finished ? (
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '10px 24px',
            borderRadius: 999,
            background: '#F7F4EF',
            color: '#1A2E4A',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            fontFamily: '"Source Sans 3", sans-serif'
          }}
        >
          Home
        </button>
      ) : (
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: '10px 24px',
            borderRadius: 999,
            background: '#F7F4EF',
            color: '#1A2E4A',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            fontFamily: '"Source Sans 3", sans-serif'
          }}
        >
          Settings
        </button>
      )}
    </header>
  );


  if (finished) {
    const themeLabel = selectedTheme || 'Mixed prompts';
    const averageDisplay = averageTimeSeconds ? `${averageTimeSeconds.toFixed(1)}s` : '—';

    return (
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          width: '100%',
        background: 'linear-gradient(135deg, #1A2E4A 0%, #75AADB 50%, #F7F4EF 100%)',
        color: darkMode ? '#e2e8f0' : '#1A2E4A',
      }}
    >
      <Head><title>Results — Turing Test | Social Intervention Group</title></Head>
      {renderHeader()}
      {showSettings && <GameSettings onClose={() => setShowSettings(false)} />}

      <div style={{ padding: '40px 20px 80px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 32 }}>
            {/* TOP PANEL: Score and Stats */}
            <section
              style={{
                borderRadius: 24,
                padding: '36px 32px',
                background: darkMode ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                boxShadow: darkMode ? '0 30px 60px rgba(15,23,42,0.45)' : '0 30px 60px rgba(15,23,42,0.12)',
                border: darkMode ? '1px solid rgba(148,163,184,0.3)' : '1px solid rgba(117,170,219,0.4)',
                display: 'grid',
                gap: 28,
              }}
            >
              <div>
                <h1 style={{ fontSize: '2.25rem', marginBottom: 12 }}>Round complete</h1>
                <p style={{ margin: 0, color: darkMode ? '#e2e8f0' : '#1A2E4A' }}>
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
                    background: darkMode ? 'rgba(117,170,219,0.2)' : 'rgba(117,170,219,0.12)',
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
                    background: darkMode ? 'rgba(168,191,168,0.25)' : 'rgba(168,191,168,0.2)',
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
                    background: darkMode ? 'rgba(196,149,122,0.2)' : 'rgba(196,149,122,0.15)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                    Avg time
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 700 }}>{averageDisplay}</p>
                </div>
              </div>
            </section>

            {/* MIDDLE PANEL: Round Breakdown */}
            <section
              style={{
                borderRadius: 20,
                background: darkMode ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                border: darkMode ? '1px solid rgba(148,163,184,0.3)' : '1px solid rgba(117,170,219,0.4)',
                boxShadow: darkMode ? '0 25px 50px rgba(15,23,42,0.45)' : '0 25px 50px rgba(15,23,42,0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: darkMode ? '1px solid rgba(148,163,184,0.25)' : '1px solid rgba(117,170,219,0.3)',
                }}
              >
                <h2 style={{ margin: 0 }}>Round breakdown</h2>
              </div>
              <div style={{ maxHeight: '60vh', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                  <thead>
                    <tr
                      style={{
                        background: darkMode ? 'rgba(26,46,74,0.9)' : '#F7F4EF',
                        color: darkMode ? '#e2e8f0' : '#1A2E4A',
                      }}
                    >
                      <th style={{ padding: '14px 16px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left' }}>Prompt</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left' }}>Human response</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left' }}>AI response</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left' }}>AI Source</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left' }}>You chose</th>
                      <th style={{ padding: '14px 16px', textAlign: 'left' }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionHistory.map((question, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: darkMode ? '1px solid rgba(148,163,184,0.15)' : '1px solid rgba(117,170,219,0.2)',
                          background: question.correct
                            ? darkMode
                              ? 'rgba(168,191,168,0.15)'
                              : 'rgba(168,191,168,0.2)'
                            : darkMode
                              ? 'rgba(196,149,122,0.15)'
                              : 'rgba(196,149,122,0.1)',
                        }}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{question.questionNumber}</td>
                        <td style={{ padding: '14px 16px', maxWidth: 280 }}>{question.prompt}</td>
                        <td style={{ padding: '14px 16px', maxWidth: 280 }}>{question.humanResponse}</td>
                        <td style={{ padding: '14px 16px', maxWidth: 280 }}>{question.aiResponse}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            background: darkMode ? 'rgba(117,170,219,0.2)' : 'rgba(117,170,219,0.15)',
                            color: darkMode ? '#75AADB' : '#1A2E4A',
                          }}>
                            {question.aiSource || '—'}
                          </span>
                        </td>
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
                                  ? 'rgba(168,191,168,0.3)'
                                  : 'rgba(168,191,168,0.25)'
                                : darkMode
                                  ? 'rgba(196,149,122,0.3)'
                                  : 'rgba(196,149,122,0.2)',
                              color: question.correct ? '#1A2E4A' : '#C4957A',
                            }}
                          >
                            {question.correct ? '✅ Correct' : '❌ Incorrect'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* BOTTOM PANEL: Action Buttons */}
            <section
              style={{
                borderRadius: 24,
                padding: '28px 32px',
                background: darkMode ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                boxShadow: darkMode ? '0 30px 60px rgba(15,23,42,0.45)' : '0 30px 60px rgba(15,23,42,0.12)',
                border: darkMode ? '1px solid rgba(148,163,184,0.3)' : '1px solid rgba(117,170,219,0.4)',
              }}
            >
              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <button
                  onClick={handleReturnHome}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundColor: '#C4957A',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Play Again
                </button>
              </div>
            </section>

            {/* FEEDBACK PANEL — optional */}
            <section
              style={{
                borderRadius: 24,
                padding: '28px 32px',
                background: darkMode ? 'rgba(15,23,42,0.65)' : 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(20px)',
                boxShadow: darkMode ? '0 20px 40px rgba(15,23,42,0.35)' : '0 20px 40px rgba(15,23,42,0.08)',
                border: darkMode ? '1px dashed rgba(148,163,184,0.25)' : '1px dashed rgba(117,170,219,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 20,
              }}
            >
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 700, color: darkMode ? '#e2e8f0' : '#1A2E4A' }}>
                  Share Your Feedback
                </h2>
                <p style={{ margin: 0, fontSize: '0.92rem', color: darkMode ? '#94a3b8' : '#1A2E4A', lineHeight: 1.55 }}>
                  Optional — help us improve the experience. Takes about 2 minutes.
                </p>
              </div>
              <a
                href={feedbackCollectionUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '12px 28px',
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, #C4957A, #A87860)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 14px rgba(196,149,122,0.35)',
                  whiteSpace: 'nowrap',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(196,149,122,0.45)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(196,149,122,0.35)'; }}
              >
                Feedback Form
              </a>
            </section>

            {/* Funding attribution */}
            <footer style={{ textAlign: 'center', paddingBottom: 8 }}>
              <p style={{
                fontSize: '0.9rem',
                color: darkMode ? 'rgba(226,232,240,0.7)' : '#1A2E4A',
                margin: 0,
                fontFamily: '"Source Sans 3", sans-serif',
              }}>
                This project was originally funded by the{' '}
                <a
                  href="https://fourthpurpose.columbia.edu/news/columbia-university-mental-health-initiative-capturing-perspectives-mental-health"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#75AADB', textDecoration: 'none', borderBottom: '1px solid rgba(117,170,219,0.5)' }}
                >
                  Columbia University Mental Health Initiative
                </a>
              </p>
            </footer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        padding: '0 20px 80px',
        color: darkMode ? '#e2e8f0' : '#1A2E4A',
        width: '100%',
        background: 'linear-gradient(135deg, #1A2E4A 0%, #75AADB 50%, #F7F4EF 100%)'
      }}
    >
      <Head><title>Play — Turing Test | Social Intervention Group</title></Head>
      {renderHeader()}
      {showSettings && <GameSettings onClose={() => setShowSettings(false)} />}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          padding: '40px 0'
        }}
      >
        <div style={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>Human or AI?</h2>
          {currentItem && (
            <>
              <p style={{ fontSize: '1.05rem', marginBottom: 12 }}>
                <strong>Prompt:</strong> {currentItem.prompt}
              </p>
              <p style={{ color: darkMode ? '#e2e8f0' : '#1A2E4A', marginBottom: 16 }}>
                Question {index + 1} of {shuffledData.length}
              </p>
              {/* Timer removed - no time pressure */}
            </>
          )}
        </div>

        {activeGameMode === 'swipe' ? (
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
                color: darkMode ? '#e2e8f0' : '#1A2E4A'
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
                  background: darkMode ? 'rgba(117,170,219,0.2)' : 'rgba(117,170,219,0.15)',
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
                    // drag="x"  — swipe gestures disabled; re-enable with drag="x" + dragConstraints + onDragEnd
                    // dragConstraints={{ left: 0, right: 0 }}
                    // onDragEnd={(e, info) => {
                    //   if (info.offset.x > 100) handleSwipe('right');
                    //   else if (info.offset.x < -100) handleSwipe('left');
                    // }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    style={{
                      width: '100%',
                      maxWidth: 480,
                      padding: '32px 28px',
                      background: darkMode ? 'rgba(15,23,42,0.85)' : '#fff',
                      border: darkMode ? '1px solid rgba(117,170,219,0.25)' : '1px solid rgba(117,170,219,0.3)',
                      borderRadius: 28,
                      boxShadow: darkMode ? '0 30px 50px rgba(15,23,42,0.55)' : '0 30px 60px rgba(15,23,42,0.12)',
                      cursor: 'default',
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
                        color: darkMode ? '#e2e8f0' : '#1A2E4A',
                        marginTop: 20,
                        display: 'inline-flex',
                        gap: 8,
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderRadius: 999,
                        background: darkMode ? 'rgba(117,170,219,0.18)' : 'rgba(117,170,219,0.12)'
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
                color: darkMode ? '#e2e8f0' : '#1A2E4A'
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
                    role="button"
                    tabIndex={0}
                    aria-label="Select Option A as the human response"
                    style={{
                      padding: '28px 24px',
                      background: darkMode ? 'rgba(15,23,42,0.8)' : '#fff',
                      border: darkMode ? '1px solid rgba(117,170,219,0.25)' : '1px solid rgba(117,170,219,0.3)',
                      borderRadius: 24,
                      boxShadow: darkMode ? '0 24px 40px rgba(15,23,42,0.45)' : '0 24px 50px rgba(15,23,42,0.08)',
                      cursor: 'pointer',
                      display: 'grid',
                      gap: 16,
                      outline: 'none',
                    }}
                    onClick={() => handleClick(true)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(true); } }}
                    onFocus={(e) => { e.currentTarget.style.outline = '3px solid #1A2E4A'; e.currentTarget.style.outlineOffset = '3px'; }}
                    onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 1.6,
                        color: darkMode ? '#e2e8f0' : '#1A2E4A',
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
                    role="button"
                    tabIndex={0}
                    aria-label="Select Option B as the human response"
                    style={{
                      padding: '28px 24px',
                      background: darkMode ? 'rgba(15,23,42,0.8)' : '#fff',
                      border: darkMode ? '1px solid rgba(117,170,219,0.25)' : '1px solid rgba(117,170,219,0.3)',
                      borderRadius: 24,
                      boxShadow: darkMode ? '0 24px 40px rgba(15,23,42,0.45)' : '0 24px 50px rgba(15,23,42,0.08)',
                      cursor: 'pointer',
                      display: 'grid',
                      gap: 16,
                      outline: 'none',
                    }}
                    onClick={() => handleClick(false)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(false); } }}
                    onFocus={(e) => { e.currentTarget.style.outline = '3px solid #1A2E4A'; e.currentTarget.style.outlineOffset = '3px'; }}
                    onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 1.6,
                        color: darkMode ? '#e2e8f0' : '#1A2E4A',
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
    </div>
  );
}

// Server-side props — open to all when AUTH_ENABLED=false (default).
// To re-enable Columbia login: set NEXT_PUBLIC_AUTH_ENABLED=true in Vercel env vars,
// then swap the line below back to: withPageAuthRequired()
export const getServerSideProps = AUTH_ENABLED
  ? withPageAuthRequired()
  : async () => ({ props: {} });