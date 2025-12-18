import { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
    const [darkMode, setDarkMode] = useState(false);
    const [timeLimit, setTimeLimit] = useState(60);
    const [fontSize, setFontSize] = useState(16);
    const [gameMode, setGameMode] = useState('swipe');

    useEffect(() => {
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            const { darkMode: savedDarkMode, fontSize: savedFontSize, gameMode: savedGameMode } = JSON.parse(savedSettings);
            setDarkMode(savedDarkMode);
            setFontSize(savedFontSize);
            setGameMode(savedGameMode || 'swipe');
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('gameSettings', JSON.stringify({ darkMode, fontSize, gameMode }));
    }, [darkMode, fontSize, gameMode]);

    return (
        <GameContext.Provider value={{
            darkMode,
            setDarkMode,
            timeLimit,
            setTimeLimit,
            fontSize,
            setFontSize,
            gameMode,
            setGameMode
        }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}
