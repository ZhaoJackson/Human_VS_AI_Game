export default function Contact() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #8B7355 0%, #D2B48C 50%, #F5F5DC 100%)',
            color: '#3E2723',
            fontFamily: '"Times New Roman", Times, serif'
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
                    color: '#3E2723'
                }}>
                    Turing Test by Social Intervention Group
                </div>
                <a href="/" style={{
                    padding: '10px 24px',
                    borderRadius: 999,
                    background: '#8B7355',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 600
                }}>
                    Back to Home
                </a>
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
                    border: '1px solid rgba(139,115,85,0.3)',
                    padding: 48
                }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        marginBottom: 40,
                        color: '#3E2723'
                    }}>
                        Contact Us
                    </h1>

                    {/* Research Team */}
                    <section style={{ marginBottom: 48 }}>
                        <h2 style={{
                            fontSize: '1.8rem',
                            fontWeight: 600,
                            marginBottom: 24,
                            color: '#3E2723'
                        }}>
                            Research Team
                        </h2>

                        {/* Principal Investigator */}
                        <div style={{
                            background: 'rgba(255,255,255,0.6)',
                            borderRadius: 16,
                            padding: 24,
                            marginBottom: 20,
                            border: '1px solid rgba(139,115,85,0.2)'
                        }}>
                            <h3 style={{
                                fontSize: '1.3rem',
                                fontWeight: 600,
                                marginBottom: 8,
                                color: '#3E2723'
                            }}>
                                Principal Investigator
                            </h3>
                            <p style={{
                                fontSize: '1.1rem',
                                lineHeight: 1.8,
                                margin: '12px 0'
                            }}>
                                <strong>Elwin Wu</strong><br />
                                Professor<br />
                                Columbia School of Social Work
                            </p>
                            <p style={{
                                fontSize: '1.1rem',
                                margin: '12px 0'
                            }}>
                                <a href="mailto:elwin.wu@columbia.edu" style={{
                                    color: '#8B7355',
                                    textDecoration: 'none',
                                    borderBottom: '1px solid rgba(139,115,85,0.4)',
                                    transition: 'border-color 0.2s'
                                }}>
                                    elwin.wu@columbia.edu
                                </a>
                            </p>
                        </div>

                        {/* Developer */}
                        <div style={{
                            background: 'rgba(255,255,255,0.6)',
                            borderRadius: 16,
                            padding: 24,
                            border: '1px solid rgba(139,115,85,0.2)'
                        }}>
                            <h3 style={{
                                fontSize: '1.3rem',
                                fontWeight: 600,
                                marginBottom: 8,
                                color: '#3E2723'
                            }}>
                                Web Developer & Researcher
                            </h3>
                            <p style={{
                                fontSize: '1.1rem',
                                lineHeight: 1.8,
                                margin: '12px 0'
                            }}>
                                <strong>Zichen Zhao</strong><br />
                                Columbia Graduate School of Arts and Sciences
                            </p>
                            <p style={{
                                fontSize: '1.1rem',
                                margin: '12px 0'
                            }}>
                                <a href="mailto:zichen.zhao@columbia.edu" style={{
                                    color: '#8B7355',
                                    textDecoration: 'none',
                                    borderBottom: '1px solid rgba(139,115,85,0.4)',
                                    transition: 'border-color 0.2s'
                                }}>
                                    zichen.zhao@columbia.edu
                                </a>
                            </p>
                        </div>
                    </section>

                    {/* General Inquiries */}
                    <section>
                        <h2 style={{
                            fontSize: '1.8rem',
                            fontWeight: 600,
                            marginBottom: 16,
                            color: '#3E2723'
                        }}>
                            General Inquiries
                        </h2>
                        <p style={{
                            fontSize: '1.1rem',
                            lineHeight: 1.8,
                            color: '#3E2723'
                        }}>
                            For questions about the research, technical issues, or general inquiries,
                            please contact either team member via email. We aim to respond within 2-3 business days.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
