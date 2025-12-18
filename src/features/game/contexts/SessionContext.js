import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SessionContext = createContext();

export function SessionProvider({ children }) {
    const [sessionId] = useState(() => {
        if (typeof window === 'undefined') {
            return generateSessionId();
        }

        const saved = localStorage.getItem('turing:session');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.sessionId || generateSessionId();
        }
        return generateSessionId();
    });

    const [sessionStats, setSessionStats] = useState(() => {
        return {
            sessionId,
            roundsPlayed: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            startTime: Date.now(),
            rounds: []
        };
    });

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
    }, []);

    const getOverallAccuracy = useCallback(() => {
        if (sessionStats.totalQuestions === 0) return 0;
        return (sessionStats.totalCorrect / sessionStats.totalQuestions) * 100;
    }, [sessionStats]);

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

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}

function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
