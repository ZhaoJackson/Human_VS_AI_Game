import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SessionContext = createContext();

/**
 * SessionProvider - Tracks cumulative game statistics across multiple rounds
 * 
 * Maintains session-level data including:
 * - Total rounds played
 * - Overall accuracy
 * - Cumulative time
 * - Individual round history
 * 
 * Persists to localStorage for session continuity
 */
export function SessionProvider({ children }) {
    const [sessionId] = useState(() => {
        // Only access localStorage in browser environment
        if (typeof window === 'undefined') {
            return generateSessionId();
        }

        // Check if existing session in localStorage
        const saved = localStorage.getItem('turing:session');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.sessionId || generateSessionId();
        }
        return generateSessionId();
    });

    const [sessionStats, setSessionStats] = useState(() => {
        // Only access localStorage in browser environment
        if (typeof window === 'undefined') {
            return {
                sessionId: generateSessionId(),
                roundsPlayed: 0,
                totalQuestions: 0,
                totalCorrect: 0,
                startTime: Date.now(),
                rounds: []
            };
        }

        // Try to load from localStorage on mount
        const saved = localStorage.getItem('turing:session');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    sessionId: parsed.sessionId || sessionId,
                    roundsPlayed: parsed.roundsPlayed || 0,
                    totalQuestions: parsed.totalQuestions || 0,
                    totalCorrect: parsed.totalCorrect || 0,
                    startTime: parsed.startTime || Date.now(),
                    rounds: parsed.rounds || []
                };
            } catch (e) {
                console.error('Failed to parse session data:', e);
            }
        }

        // Default state
        return {
            sessionId,
            roundsPlayed: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            startTime: Date.now(),
            rounds: []
        };
    });

    // Save to localStorage whenever session stats change (only in browser)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('turing:session', JSON.stringify(sessionStats));
        }
    }, [sessionStats]);

    /**
     * Add a completed round to the session
     */
    const addRoundToSession = useCallback((roundData) => {
        setSessionStats(prev => ({
            ...prev,
            roundsPlayed: prev.roundsPlayed + 1,
            totalQuestions: prev.totalQuestions + roundData.numQuestions,
            totalCorrect: prev.totalCorrect + roundData.score,
            rounds: [...prev.rounds, {
                roundId: roundData.roundId,
                score: roundData.score,
                numQuestions: roundData.numQuestions,
                accuracy: roundData.accuracyPct,
                avgTime: roundData.avgTimeSeconds,
                category: roundData.category,
                timestamp: Date.now()
            }]
        }));
    }, []);

    /**
     * Clear session data (used on logout or manual reset)
     */
    const clearSession = useCallback(() => {
        const newSessionId = generateSessionId();
        const newStats = {
            sessionId: newSessionId,
            roundsPlayed: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            startTime: Date.now(),
            rounds: []
        };
        setSessionStats(newStats);
        if (typeof window !== 'undefined') {
            localStorage.setItem('turing:session', JSON.stringify(newStats));
        }
    }, []);

    /**
     * Calculate overall session accuracy
     */
    const getOverallAccuracy = useCallback(() => {
        if (sessionStats.totalQuestions === 0) return 0;
        return (sessionStats.totalCorrect / sessionStats.totalQuestions) * 100;
    }, [sessionStats]);

    /**
     * Get session duration in seconds
     */
    const getSessionDuration = useCallback(() => {
        return Math.floor((Date.now() - sessionStats.startTime) / 1000);
    }, [sessionStats.startTime]);

    return (
        <SessionContext.Provider value={{
            sessionId,
            sessionStats,
            addRoundToSession,
            clearSession,
            getOverallAccuracy,
            getSessionDuration
        }}>
            {children}
        </SessionContext.Provider>
    );
}

/**
 * Hook to access session context
 */
export function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
