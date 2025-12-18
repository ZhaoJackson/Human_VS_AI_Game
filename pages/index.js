import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const handleGetStarted = () => {
    if (user) {
      router.push('/start');
    } else {
      router.push('/api/auth/login?returnTo=/start');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8B7355 0%, #D2B48C 50%, #F5F5DC 100%)',
      color: '#3E2723',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Turing Test by Social Intervention Group
        </div>
        {!isLoading && (
          user ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{user.email}</span>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/auth/logout" style={{
                padding: '10px 20px',
                borderRadius: 999,
                background: 'rgba(139,115,85,0.3)',
                color: '#3E2723',
                textDecoration: 'none',
                fontSize: '0.9rem',
                border: '1px solid rgba(139,115,85,0.4)'
              }}>
                Log out
              </a>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-html-link-for-pages */
            <a href="/api/auth/login?returnTo=/start" style={{
              padding: '10px 24px',
              borderRadius: 999,
              background: '#8B7355',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 600
            }}>
              Sign in
            </a>
          )
        )}
      </header>

      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '120px 20px 80px',
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: 'url(/cssw_logo.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}>
        {/* Dark overlay for better text readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1
        }}></div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{
            fontSize: 'clamp(3rem, 6vw, 5rem)',
            fontWeight: 700,
            marginBottom: 30,
            lineHeight: 1.2,
            color: '#fff',
            textShadow: '0 4px 30px rgba(0,0,0,0.5)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            Can you tell a human from an AI?
          </h1>

          <p style={{
            fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
            marginBottom: 50,
            color: '#fff',
            maxWidth: 800,
            margin: '0 auto 50px',
            lineHeight: 1.6,
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            Turing test under mental health context
          </p>

          <button
            onClick={() => router.push('/start')}
            style={{
              padding: '20px 60px',
              fontSize: '1.4rem',
              borderRadius: 999,
              border: 'none',
              background: '#fff',
              color: '#3E2723',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
              transition: 'all 0.3s ease',
              fontFamily: '"Times New Roman", Times, serif'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 15px 50px rgba(0,0,0,0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)';
            }}
          >
            Play
          </button>
        </div>
      </section>

      {/* How to Play Section */}
      <section style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px)',
        padding: '60px 20px',
        borderTop: '1px solid rgba(139,115,85,0.3)',
        borderBottom: '1px solid rgba(139,115,85,0.3)'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 700,
            marginBottom: 30,
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            HOW TO PLAY
          </h2>

          <p style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
            lineHeight: 1.8,
            color: '#3E2723',
            marginBottom: 20,
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            You will see two responses to mental health-related questions.
          </p>

          <p style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
            lineHeight: 1.8,
            color: '#3E2723',
            marginBottom: 20,
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            Your task is to determine which response is from a <strong>human</strong> and which one is from <strong>AI</strong>.
          </p>

          <p style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
            lineHeight: 1.8,
            color: '#3E2723',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            The true source of each response is revealed at the end of each round.
          </p>
        </div>
      </section>

      {/* Turing Image Section */}
      <section style={{
        padding: '100px 20px',
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url(/turing.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}>
        {/* Dark overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1
        }}></div>

        <h2 style={{
          fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
          fontWeight: 700,
          color: '#fff',
          textShadow: '0 4px 30px rgba(0,0,0,0.7)',
          position: 'relative',
          zIndex: 2,
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          Play the Turing Test
        </h2>
      </section>

      {/* Information Section */}
      <section style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px)',
        padding: '60px 20px',
        borderTop: '1px solid rgba(139,115,85,0.3)',
        borderBottom: '1px solid rgba(139,115,85,0.3)'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Test Your AI Detection Skills */}
          <div style={{ marginBottom: 50 }}>
            <h3 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 700,
              marginBottom: 20,
              color: '#3E2723',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Test Your AI Detection Skills
            </h3>
            <p style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
              lineHeight: 1.8,
              color: '#3E2723',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Challenge yourself to distinguish between human-written responses and AI-generated content in the context of mental health discussions. Sharpen your ability to detect AI in sensitive conversations.
            </p>
          </div>

          {/* How It Works */}
          <div>
            <h3 style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: 700,
              marginBottom: 20,
              color: '#3E2723',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              How It Works
            </h3>
            <p style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
              lineHeight: 1.8,
              color: '#3E2723',
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              Each round presents 3 questions with real responses from Columbia students and AI-generated alternatives. Use your intuition and analytical skills to identify authentic human experiences in mental health contexts.
            </p>
          </div>

          {/* Attribution */}
          <div style={{
            marginTop: 60,
            padding: 30,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(139,115,85,0.3)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              opacity: 0.95,
              fontFamily: '"Times New Roman", Times, serif'
            }}>
              This research tool is designed and maintained by the{' '}
              <strong>Social Intervention Group</strong> at{' '}
              <strong>Columbia School of Social Work</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'rgba(139,115,85,0.4)',
        backdropFilter: 'blur(10px)',
        padding: '30px 40px',
        borderTop: '1px solid rgba(139,115,85,0.4)',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 30,
          fontSize: '0.9rem',
          opacity: 0.9
        }}>
          <span>© 2025 Zichen Zhao</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <a href="/contact" style={{
            color: '#3E2723',
            textDecoration: 'none',
            borderBottom: '1px solid rgba(62,39,35,0.3)',
            transition: 'border-color 0.2s'
          }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3E2723'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(62,39,35,0.3)'}>
            Contact
          </a>
          <span style={{ opacity: 0.5 }}>•</span>
          <a href="/privacy" style={{
            color: '#3E2723',
            textDecoration: 'none',
            borderBottom: '1px solid rgba(62,39,35,0.3)',
            transition: 'border-color 0.2s'
          }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3E2723'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(62,39,35,0.3)'}>
            Privacy
          </a>
          <span style={{ opacity: 0.5 }}>•</span>
          <a href="/about" style={{
            color: '#3E2723',
            textDecoration: 'none',
            borderBottom: '1px solid rgba(62,39,35,0.3)',
            transition: 'border-color 0.2s'
          }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3E2723'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(62,39,35,0.3)'}>
            About
          </a>
        </div>
      </footer>
    </div>
  );
}
