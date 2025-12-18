/**
 * SessionStats Component
 * 
 * Displays cumulative session statistics across multiple rounds
 */
export function SessionStats({ sessionStats, darkMode = false }) {
    const overallAccuracy = sessionStats.totalQuestions > 0
        ? ((sessionStats.totalCorrect / sessionStats.totalQuestions) * 100).toFixed(1)
        : '0.0';

    const sessionDuration = formatDuration(Date.now() - sessionStats.startTime);

    if (sessionStats.roundsPlayed === 0) {
        return null; // Don't show if no rounds played yet
    }

    return (
        <section
            style={{
                borderRadius: 20,
                padding: '24px 28px',
                background: darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
                border: darkMode ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(99,102,241,0.2)',
                marginBottom: 24,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                    Session Summary
                </h3>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 16,
                }}
            >
                {/* Rounds Played */}
                <div>
                    <div style={{
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        opacity: 0.7,
                        marginBottom: 4
                    }}>
                        Rounds Played
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                        {sessionStats.roundsPlayed}
                    </div>
                </div>

                {/* Overall Accuracy */}
                <div>
                    <div style={{
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        opacity: 0.7,
                        marginBottom: 4
                    }}>
                        Overall Accuracy
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                        {overallAccuracy}%
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 2 }}>
                        ({sessionStats.totalCorrect}/{sessionStats.totalQuestions})
                    </div>
                </div>

                {/* Session Time */}
                <div>
                    <div style={{
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        opacity: 0.7,
                        marginBottom: 4
                    }}>
                        Session Time
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                        {sessionDuration}
                    </div>
                </div>
            </div>

            {/* Round History (compact) */}
            {sessionStats.rounds.length > 1 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>
                        Round History
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {sessionStats.rounds.map((round, idx) => (
                            <div
                                key={round.roundId}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 8,
                                    background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    fontSize: '0.85rem',
                                }}
                            >
                                Round {idx + 1}: {round.score}/{round.numQuestions}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

/**
 * Format duration from milliseconds to readable string
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}
