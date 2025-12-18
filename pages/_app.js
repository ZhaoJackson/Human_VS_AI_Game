import { UserProvider } from '@auth0/nextjs-auth0/client';
import { GameProvider } from '../src/features/game/contexts/GameContext';
import { SessionProvider } from '../src/features/game/contexts/SessionContext';
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
    <>
      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        *::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        * {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }

        /* Ensure body and html take full height */
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
        }
      `}</style>
      <UserProvider user={pageProps.user}>
        <SessionProvider>
          <GameProvider>
            <DarkModeHandler />
            <Component {...pageProps} />
          </GameProvider>
        </SessionProvider>
      </UserProvider>
    </>
  );
}

export default MyApp;