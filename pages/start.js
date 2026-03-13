import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { data } from '../src/features/game/data/turing_data';
import { buildTripletIds } from '../src/lib/sampling';
import GameSettings from '../src/components/game/GameSettings';
import { isInIframe } from '../src/utils/iframeDetector';

// Set NEXT_PUBLIC_AUTH_ENABLED=true in .env.local to re-enable Columbia login
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

export default function Start() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState('');
  const [numPrompts, setNumPrompts] = useState(3);
  const [selectedMode, setSelectedMode] = useState('click');
  const [showSettings, setShowSettings] = useState(false);
  // user/error/isLoading kept for re-activation; not required when AUTH_ENABLED=false
  const { user, error, isLoading } = useUser();
  const authError = router.query.auth === 'domain';

  // Triplet count per condition (= unique playable experiences)
  const tripletCountByCondition = useMemo(() => {
    const counts = {};
    data.forEach(item => {
      const cond = item.condition?.trim();
      if (!cond) return;
      counts[cond] = (counts[cond] || 0) + buildTripletIds(item).length;
    });
    return counts;
  }, []);

  const conditions = useMemo(
    () => Object.keys(tripletCountByCondition).sort((a, b) => a.localeCompare(b)),
    [tripletCountByCondition]
  );

  // Max prompts for the currently selected category (or total for mixed)
  const categoryMax = useMemo(() => {
    if (!selectedTheme) return Object.values(tripletCountByCondition).reduce((a, b) => a + b, 0);
    return tripletCountByCondition[selectedTheme] || 0;
  }, [selectedTheme, tripletCountByCondition]);

  const exceedsMax = selectedTheme && numPrompts > categoryMax;
  const effectivePrompts = exceedsMax ? categoryMax : numPrompts;

  // When AUTH_ENABLED=false anyone can start; when true, require a signed-in user
  const canStart = AUTH_ENABLED ? (user && selectedMode) : !!selectedMode;

  const handleStart = () => {
    if (!canStart) return;

    const params = new URLSearchParams();
    if (selectedTheme) params.append('theme', selectedTheme);
    params.append('mode', selectedMode);
    params.append('prompts', String(effectivePrompts));

    router.push(`/game?${params.toString()}`);
  };

  // Check if we just authenticated from Drupal and should redirect back
  useEffect(() => {
    if (user && !isLoading && typeof window !== 'undefined') {
      // Check URL for fromDrupal parameter
      const urlParams = new URLSearchParams(window.location.search);
      const fromDrupal = urlParams.get('fromDrupal') === 'true';

      console.log('[AUTH] User authenticated:', user.email);
      console.log('[AUTH] URL params:', window.location.search);
      console.log('[AUTH] fromDrupal parameter:', fromDrupal);

      // If they came from Drupal, redirect back after showing message
      if (fromDrupal) {
        console.log('[AUTH] Redirecting back to Drupal in 2 seconds...');

        setTimeout(() => {
          console.log('[AUTH] Executing redirect now...');
          window.location.href = 'https://sig.columbia.edu/content/turing-test-lets-play';
        }, 2000);

        return; // Exit early to prevent other auth flows
      }

      if (window.opener && sessionStorage.getItem('authInProgress')) {
        sessionStorage.setItem('authCompleted', 'true');
        sessionStorage.removeItem('authInProgress');

        try {
          window.opener.postMessage({ type: 'auth-success', user }, window.location.origin);
        } catch (e) {
          console.log('Could not message opener:', e);
        }

        const closeWindow = () => {
          alert('Authentication successful! This window will close. Please return to the main page.');
          window.close();

          setTimeout(() => {
            if (!window.closed) {
              document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: 'Times New Roman', serif;">
                  <h1>✅ Authentication Successful!</h1>
                  <p style="font-size: 1.2rem; margin: 20px 0;">You can now close this window and return to the main page.</p>
                  <p style="color: #666;">If this window doesn't close automatically, please close it manually.</p>
                </div>
              `;
            }
          }, 500);
        };

        setTimeout(closeWindow, 1000);
      }
    }
  }, [user, isLoading]);

  return (
    <>
    <Head><title>Start a Round — Turing Test | Social Intervention Group</title></Head>
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A2E4A 0%, #75AADB 50%, #F7F4EF 100%)'
    }}>
      {/* Header */}
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
            fontFamily: '"Source Sans 3", sans-serif',
          }}
        >
          Settings
        </button>
      </header>

      {showSettings && <GameSettings onClose={() => setShowSettings(false)} />}

      <div style={{
        padding: '40px 20px 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32
      }}>
        <div style={{ maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Section 1: Authentication
              — Shown only when AUTH_ENABLED=true.
              — Full Columbia login UI is preserved below; re-enable by setting
                NEXT_PUBLIC_AUTH_ENABLED=true in .env.local */}
          {AUTH_ENABLED && (
          <section style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(117,170,219,0.4)',
            padding: 32,
            textAlign: 'center'
          }}>
            {error && (
              <div style={{
                marginBottom: 16,
                padding: '12px 16px',
                borderRadius: 12,
                background: '#fee2e2',
                color: '#b91c1c',
                fontSize: '0.9rem'
              }}>
                Unable to load session. Please refresh and try again.
              </div>
            )}

            {authError && (
              <div style={{
                marginBottom: 16,
                padding: '12px 16px',
                borderRadius: 12,
                background: '#fef3c7',
                color: '#b45309',
                fontSize: '0.9rem'
              }}>
                Access is limited to <code>@columbia.edu</code> accounts. Please sign in with your Columbia email.
              </div>
            )}

            {isLoading ? (
              <div style={{ fontSize: '1rem', color: '#1A2E4A' }}>
                Checking session...
              </div>
            ) : !user ? (
              <>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  marginBottom: 12,
                  color: '#1A2E4A',
                  fontFamily: 'Lora, "Times New Roman", serif'
                }}>
                  Sign In Required
                </h2>
                <p style={{
                  fontSize: '1.1rem',
                  marginBottom: 24,
                  color: '#1A2E4A',
                  lineHeight: 1.6,
                  fontFamily: '"Source Sans 3", sans-serif'
                }}>
                  Please sign in with your Columbia email to continue
                </p>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/api/auth/login?returnTo=/start"
                  target={isInIframe() ? "_blank" : undefined}
                  style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    borderRadius: 999,
                    backgroundColor: '#C4957A',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(196,149,122,0.3)',
                    fontFamily: '"Source Sans 3", sans-serif',
                    cursor: 'pointer'
                  }}
                >
                  Sign in with Columbia Google
                </a>
              </>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: '12px 20px',
                background: 'rgba(117,170,219,0.1)',
                borderRadius: 12,
                border: '1px solid rgba(117,170,219,0.4)'
              }}>
                <span style={{ fontSize: '1.5rem' }}>✓</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.9rem', color: '#1A2E4A', fontWeight: 600 }}>
                    Signed in
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#1A2E4A' }}>
                    {user.email}
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/api/auth/logout"
                  style={{
                    marginLeft: 'auto',
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: '1px solid rgba(117,170,219,0.4)',
                    color: '#1A2E4A',
                    textDecoration: 'none',
                    fontSize: '0.85rem'
                  }}
                >
                  Log out
                </a>
              </div>
            )}
          </section>
          )}

          {/* Section 2: How to Play */}
          <section style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(117,170,219,0.4)',
            padding: 32
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              marginBottom: 20,
              color: '#1A2E4A',
              fontFamily: 'Lora, "Times New Roman", serif'
            }}>
              How to Play
            </h2>
            <ol style={{
              fontSize: '1.1rem',
              lineHeight: 1.8,
              color: '#1A2E4A',
              paddingLeft: 24,
              fontFamily: '"Source Sans 3", sans-serif'
            }}>
              <li style={{ marginBottom: 12 }}>
                You will see responses to mental health-related questions
              </li>
              <li style={{ marginBottom: 12 }}>
                Determine which response is from a <strong>human</strong> and which is from <strong>AI</strong>
              </li>
              <li style={{ marginBottom: 12 }}>
                The true source of each response is revealed at the end of the round
              </li>
            </ol>
          </section>

          {/* Section 3: Topic Selection */}
          <section style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(117,170,219,0.4)',
            padding: 32
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              marginBottom: 20,
              color: '#1A2E4A',
              fontFamily: 'Lora, "Times New Roman", serif'
            }}>
              Choose a Topic
            </h2>
            <label htmlFor="theme-select" style={{
              display: 'block',
              marginBottom: 12,
              fontSize: '1rem',
              color: '#1A2E4A',
              fontFamily: '"Source Sans 3", sans-serif'
            }}>
              Select a mental health topic for this round:
            </label>
            <select
              id="theme-select"
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '1rem',
                borderRadius: 12,
                border: '1px solid rgba(117,170,219,0.4)',
                backgroundColor: '#fff',
                fontFamily: '"Source Sans 3", sans-serif',
                cursor: 'pointer'
              }}
            >
              <option value="">Surprise me (all topics)</option>
              {conditions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition} ({tripletCountByCondition[condition] || 0})
                </option>
              ))}
            </select>
          </section>

          {/* Section 3b: Number of Prompts */}
          <section style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(117,170,219,0.4)',
            padding: 32
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  marginBottom: 8,
                  color: '#1A2E4A',
                  fontFamily: 'Lora, "Times New Roman", serif'
                }}>
                  Number of Prompts
                </h2>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#1A2E4A',
                  marginBottom: 20,
                  fontFamily: '"Source Sans 3", sans-serif'
                }}>
                  How many prompts per round? (default: 3)
                  {selectedTheme && (
                    <span style={{ display: 'block', marginTop: 4, fontWeight: 600 }}>
                      {selectedTheme} has {categoryMax} available prompt{categoryMax !== 1 ? 's' : ''}.
                    </span>
                  )}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => setNumPrompts(n)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        border: numPrompts === n
                          ? '2px solid #C4957A'
                          : '2px solid rgba(117,170,219,0.4)',
                        background: numPrompts === n
                          ? '#C4957A'
                          : 'rgba(255,255,255,0.7)',
                        color: numPrompts === n ? '#fff' : '#1A2E4A',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        fontFamily: '"Source Sans 3", sans-serif',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inline warning when selection exceeds category capacity */}
              {exceedsMax && (
                <div style={{
                  flexShrink: 0,
                  maxWidth: 260,
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: 'rgba(251,191,36,0.15)',
                  border: '1px solid rgba(217,119,6,0.4)',
                  color: '#92400e',
                  fontSize: '0.88rem',
                  lineHeight: 1.55,
                  fontFamily: '"Source Sans 3", sans-serif'
                }}>
                  <strong>Note:</strong> You chose {numPrompts}, but <em>{selectedTheme}</em> only has {categoryMax} prompt{categoryMax !== 1 ? 's' : ''}. The round will play all {categoryMax} available.
                </div>
              )}
            </div>
          </section>

          {/* Section 4: Game Mode Selection */}
          <section style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(117,170,219,0.4)',
            padding: 32
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              marginBottom: 20,
              color: '#1A2E4A',
              fontFamily: 'Lora, "Times New Roman", serif'
            }}>
              Select Game Mode
            </h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Click Mode - default */}
              <div
                onClick={() => setSelectedMode('click')}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: selectedMode === 'click'
                    ? '2px solid #75AADB'
                    : '2px solid rgba(117,170,219,0.3)',
                  background: selectedMode === 'click'
                    ? 'rgba(117,170,219,0.1)'
                    : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <input
                    type="radio"
                    name="gameMode"
                    checked={selectedMode === 'click'}
                    onChange={() => setSelectedMode('click')}
                    style={{ width: 20, height: 20, cursor: 'pointer' }}
                  />
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: 600,
                    margin: 0,
                    fontFamily: '"Source Sans 3", sans-serif'
                  }}>
                    Click Mode
                  </h3>
                </div>
                <p style={{
                  margin: '8px 0 0 32px',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  color: '#1A2E4A',
                  fontFamily: '"Source Sans 3", sans-serif'
                }}>
                  See both responses side by side. Click on the response you think is human. Compare and analyze before making your choice.
                </p>
              </div>

              {/* Swipe Mode — disabled for now; re-enable by removing the `false &&` wrapper */}
              {false && <div
                onClick={() => setSelectedMode('swipe')}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: selectedMode === 'swipe'
                    ? '2px solid #75AADB'
                    : '2px solid rgba(117,170,219,0.3)',
                  background: selectedMode === 'swipe'
                    ? 'rgba(117,170,219,0.1)'
                    : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <input
                    type="radio"
                    name="gameMode"
                    checked={selectedMode === 'swipe'}
                    onChange={() => setSelectedMode('swipe')}
                    style={{ width: 20, height: 20, cursor: 'pointer' }}
                  />
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: 600,
                    margin: 0,
                    fontFamily: '"Source Sans 3", sans-serif'
                  }}>
                    Swipe Mode
                  </h3>
                </div>
                <p style={{
                  margin: '8px 0 0 32px',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  color: '#1A2E4A',
                  fontFamily: '"Source Sans 3", sans-serif'
                }}>
                  See one response at a time. Swipe left for AI. Swipe right for Human. You can also use keyboard arrow keys <code>←</code> | <code>→</code>
                </p>
              </div>}
            </div>
          </section>

          {/* Section 5: Start Button */}
          <section style={{ textAlign: 'center' }}>
            <button
              onClick={handleStart}
              disabled={!canStart}
              style={{
                padding: '18px 48px',
                fontSize: '1.3rem',
                borderRadius: 999,
                backgroundColor: canStart ? '#C4957A' : '#d0d7de',
                color: canStart ? '#fff' : 'rgba(26,46,74,0.4)',
                border: 'none',
                cursor: canStart ? 'pointer' : 'not-allowed',
                boxShadow: canStart ? '0 8px 24px rgba(196,149,122,0.35)' : 'none',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                fontFamily: '"Source Sans 3", sans-serif'
              }}
              onMouseOver={(e) => {
                if (canStart) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(196,149,122,0.45)';
                }
              }}
              onMouseOut={(e) => {
                if (canStart) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(196,149,122,0.35)';
                }
              }}
            >
              {AUTH_ENABLED && !user ? '🔒 Sign in to Start' : 'Start Round'}
            </button>
            {AUTH_ENABLED && !user && (
              <p style={{
                marginTop: 12,
                fontSize: '0.9rem',
                color: '#1A2E4A',
                fontFamily: '"Source Sans 3", sans-serif'
              }}>
                Please sign in above to begin
              </p>
            )}
          </section>
        </div>
      </div>
      <footer style={{
        padding: '24px 40px',
        textAlign: 'center',
        borderTop: '1px solid rgba(26,46,74,0.15)',
      }}>
        <p style={{
          fontSize: '0.9rem',
          color: '#1A2E4A',
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
    </>
  );
}