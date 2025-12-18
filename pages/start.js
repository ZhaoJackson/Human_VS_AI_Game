import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0/client';
import { data } from '../src/features/game/data/turing_data';
import GameSettings from '../src/components/game/GameSettings';
import { isInIframe, handleIframeAuth } from '../src/utils/iframeDetector';

const getUniqueConditions = () => {
  const all = data
    .map((item) => item.condition?.trim() || 'Uncategorized')
    .sort((a, b) => a.localeCompare(b));
  return Array.from(new Set(all));
};

export default function Start() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedMode, setSelectedMode] = useState('swipe');
  const [showSettings, setShowSettings] = useState(false);
  const conditions = useMemo(getUniqueConditions, []);
  const { user, error, isLoading } = useUser();
  const authError = router.query.auth === 'domain';

  const canStart = user && (selectedTheme || true) && selectedMode;

  const handleStart = () => {
    if (!canStart) return;

    const params = new URLSearchParams();
    if (selectedTheme) params.append('theme', selectedTheme);
    params.append('mode', selectedMode);

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

      // Also check for popup/tab authentication
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8B7355 0%, #D2B48C 50%, #F5F5DC 100%)'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(139,115,85,0.25)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          fontFamily: '"Times New Roman", Times, serif',
          color: '#3E2723'
        }}>
          Turing Test by Social Intervention Group
        </div>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: '10px 24px',
            borderRadius: 999,
            background: '#8B7355',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600,
            fontFamily: '"Times New Roman", Times, serif'
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

          {/* Section 1: Authentication */}
          <section style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(139,115,85,0.3)',
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
              <div style={{ fontSize: '1rem', color: '#475467' }}>
                Checking session...
              </div>
            ) : !user ? (
              <>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  marginBottom: 12,
                  color: '#3E2723',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  Sign In Required
                </h2>
                <p style={{
                  fontSize: '1.1rem',
                  marginBottom: 24,
                  color: '#3E2723',
                  lineHeight: 1.6,
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  Please sign in with your Columbia email to continue
                </p>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href={isInIframe() ? "/api/auth/login?returnTo=" + encodeURIComponent("/start?fromDrupal=true") : "/api/auth/login?returnTo=/start"}
                  target={isInIframe() ? "_blank" : undefined}
                  style={{
                    display: 'inline-block',
                    padding: '14px 32px',
                    borderRadius: 999,
                    backgroundColor: '#8B7355',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(139,115,85,0.3)',
                    fontFamily: '"Times New Roman", Times, serif',
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
                background: 'rgba(34,197,94,0.1)',
                borderRadius: 12,
                border: '1px solid rgba(34,197,94,0.3)'
              }}>
                <span style={{ fontSize: '1.5rem' }}>✓</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.9rem', color: '#15803d', fontWeight: 600 }}>
                    Signed in
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#3E2723' }}>
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
                    border: '1px solid rgba(139,115,85,0.4)',
                    color: '#3E2723',
                    textDecoration: 'none',
                    fontSize: '0.85rem'
                  }}
                >
                  Log out
                </a>
              </div>
            )}
          </section>

          {/* Section 2: How to Play */}
          <section style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(139,115,85,0.3)',
            padding: 32
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              marginBottom: 20,
              color: '#3E2723',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              How to Play
            </h2>
            <ol style={{
              fontSize: '1.1rem',
              lineHeight: 1.8,
              color: '#3E2723',
              paddingLeft: 24,
              fontFamily: '"Times New Roman", Times, serif'
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
            border: '1px solid rgba(139,115,85,0.3)',
            padding: 32
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              marginBottom: 20,
              color: '#3E2723',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Choose a Topic
            </h2>
            <label htmlFor="theme-select" style={{
              display: 'block',
              marginBottom: 12,
              fontSize: '1rem',
              color: '#3E2723',
              fontFamily: '"Times New Roman", Times, serif'
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
                border: '1px solid rgba(139,115,85,0.4)',
                backgroundColor: '#fff',
                fontFamily: '"Times New Roman", Times, serif',
                cursor: 'pointer'
              }}
            >
              <option value="">Surprise me (all topics)</option>
              {conditions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </section>

          {/* Section 4: Game Mode Selection */}
          <section style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(139,115,85,0.3)',
            padding: 32
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              marginBottom: 20,
              color: '#3E2723',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Select Game Mode
            </h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Swipe Mode */}
              <div
                onClick={() => setSelectedMode('swipe')}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: selectedMode === 'swipe'
                    ? '2px solid #8B7355'
                    : '2px solid rgba(139,115,85,0.3)',
                  background: selectedMode === 'swipe'
                    ? 'rgba(139,115,85,0.1)'
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
                    fontFamily: '"Times New Roman", Times, serif'
                  }}>
                    Swipe Mode
                  </h3>
                </div>
                <p style={{
                  margin: '8px 0 0 32px',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  color: '#3E2723',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  See one response at a time. Swipe left for AI. Swipe right for Human. You can also use keyboard arrow keys <code>←</code> | <code>→</code>
                </p>
              </div>

              {/* Click Mode */}
              <div
                onClick={() => setSelectedMode('click')}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: selectedMode === 'click'
                    ? '2px solid #8B7355'
                    : '2px solid rgba(139,115,85,0.3)',
                  background: selectedMode === 'click'
                    ? 'rgba(139,115,85,0.1)'
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
                    fontFamily: '"Times New Roman", Times, serif'
                  }}>
                    Click Mode
                  </h3>
                </div>
                <p style={{
                  margin: '8px 0 0 32px',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  color: '#3E2723',
                  fontFamily: '"Times New Roman", Times, serif'
                }}>
                  See both responses side by side. Click on the response you think is human. Compare and analyze before making your choice.
                </p>
              </div>
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
                backgroundColor: canStart ? '#8B7355' : '#d0d7de',
                color: canStart ? '#fff' : '#667085',
                border: 'none',
                cursor: canStart ? 'pointer' : 'not-allowed',
                boxShadow: canStart ? '0 8px 24px rgba(139,115,85,0.35)' : 'none',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                fontFamily: '"Times New Roman", Times, serif'
              }}
              onMouseOver={(e) => {
                if (canStart) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(139,115,85,0.45)';
                }
              }}
              onMouseOut={(e) => {
                if (canStart) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,115,85,0.35)';
                }
              }}
            >
              {!user ? '🔒 Sign in to Start' : 'Start Round'}
            </button>
            {!user && (
              <p style={{
                marginTop: 12,
                fontSize: '0.9rem',
                color: '#667085',
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                Please sign in above to begin
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}