import Link from 'next/link';

export default function Privacy() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1A2E4A 0%, #75AADB 50%, #F7F4EF 100%)',
            color: '#1A2E4A',
            fontFamily: '"Times New Roman", Times, serif'
        }}>
            {/* Header */}
            <header style={{
                padding: '20px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#1A2E4A',
            }}>
                <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#fff'
                }}>
                    Turing Test by Social Intervention Group
                </div>
                <Link href="/" style={{
                    padding: '10px 24px',
                    borderRadius: 999,
                    background: '#C4957A',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600
                }}>
                    Back to Home
                </Link>
            </header>

            {/* Main Content */}
            <main style={{
                maxWidth: 900,
                margin: '0 auto',
                padding: '80px 20px'
            }}>
                <div style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 20,
                    border: '1px solid rgba(117,170,219,0.4)',
                    padding: 48
                }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        marginBottom: 40,
                        color: '#1A2E4A'
                    }}>
                        Privacy & Data Collection
                    </h1>

                    {/* What We Collect */}
                    <section style={{ marginBottom: 48 }}>
                        <h2 style={{
                            fontSize: '1.8rem',
                            fontWeight: 600,
                            marginBottom: 20,
                            color: '#1A2E4A'
                        }}>
                            What Data Do We Collect?
                        </h2>
                        <p style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.8,
                            marginBottom: 20
                        }}>
                            This research tool collects the following information to help us understand
                            how people interact with AI-generated content in mental health contexts:
                        </p>

                        {/* Game Session Records */}
                        <div style={{
                            background: 'rgba(255,255,255,0.6)',
                            borderRadius: 16,
                            padding: 24,
                            marginBottom: 20,
                            border: '1px solid rgba(117,170,219,0.3)'
                        }}>
                            <h3 style={{
                                fontSize: '1.3rem',
                                fontWeight: 600,
                                marginBottom: 12,
                                color: '#1A2E4A'
                            }}>
                                Game Session Records
                            </h3>
                            <p style={{
                                fontSize: '1.1rem',
                                lineHeight: 1.8
                            }}>
                                We record your gameplay performance and choices, including:
                            </p>
                            <ul style={{
                                fontSize: '1.1rem',
                                lineHeight: 1.8,
                                paddingLeft: 24
                            }}>
                                <li>Your selections for each question (AI or Human)</li>
                                <li>Accuracy metrics and response times</li>
                                <li>Selected topics and game modes</li>
                                <li>Timestamps of your sessions</li>
                                <li>Your Columbia email address (for authentication)</li>
                            </ul>
                        </div>

                        {/* Storage */}
                        <div style={{
                            background: 'rgba(255,255,255,0.6)',
                            borderRadius: 16,
                            padding: 24,
                            marginBottom: 20,
                            border: '1px solid rgba(117,170,219,0.3)'
                        }}>
                            <h3 style={{
                                fontSize: '1.3rem',
                                fontWeight: 600,
                                marginBottom: 12,
                                color: '#1A2E4A'
                            }}>
                                Data Storage
                            </h3>
                            <p style={{
                                fontSize: '1.1rem',
                                lineHeight: 1.8
                            }}>
                                All game session data is securely stored in Google Sheets and is only
                                accessible to the research team. Your data is used solely for research
                                purposes and is not shared with third parties.
                            </p>
                        </div>
                    </section>

                    {/* Future Plans */}
                    <section style={{ marginBottom: 48 }}>
                        <h2 style={{
                            fontSize: '1.8rem',
                            fontWeight: 600,
                            marginBottom: 20,
                            color: '#1A2E4A'
                        }}>
                            Future Data Collection
                        </h2>
                        <p style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.8,
                            marginBottom: 16
                        }}>
                            We plan to collect user feedback about the game experience in the future.
                            This will help us:
                        </p>
                        <ul style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.8,
                            paddingLeft: 24,
                            marginBottom: 16
                        }}>
                            <li>Improve the game design and user experience</li>
                            <li>Better understand what makes AI detection challenging</li>
                            <li>Refine the content and question quality</li>
                        </ul>
                        <p style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.8
                        }}>
                            Any future feedback collection will be optional and clearly communicated.
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section>
                        <h2 style={{
                            fontSize: '1.8rem',
                            fontWeight: 600,
                            marginBottom: 20,
                            color: '#1A2E4A'
                        }}>
                            Your Rights
                        </h2>
                        <p style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.8,
                            marginBottom: 16
                        }}>
                            You have the right to:
                        </p>
                        <ul style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.8,
                            paddingLeft: 24
                        }}>
                            <li>Request access to your collected data</li>
                            <li>Request deletion of your data</li>
                            <li>Withdraw from the study at any time</li>
                            <li>Ask questions about how your data is used</li>
                        </ul>
                        <p style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.8,
                            marginTop: 20
                        }}>
                            To exercise any of these rights, please contact us via the{' '}
                            <Link href="/contact" style={{
                                color: '#75AADB',
                                textDecoration: 'none',
                                borderBottom: '1px solid rgba(117,170,219,0.5)'
                            }}>
                                Contact page
                            </Link>.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
