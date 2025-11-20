import { UserProvider } from '@auth0/nextjs-auth0/client';
import { GameProvider } from '../src/features/game/contexts/GameContext';
import { useEffect } from 'react';
import { useGame } from '../src/features/game/contexts/GameContext';
import '../src/styles/globals.css';

function DarkModeHandler() {
  const { darkMode } = useGame();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return null;
}

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider user={pageProps.user}>
      <GameProvider>
        <DarkModeHandler />
        <Component {...pageProps} />
      </GameProvider>
    </UserProvider>
  );
}

export default MyApp;
