// pages/index.js

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { data } from '../data/turing_data';

const getUniqueConditions = () => {
  const all = data
    .map((item) => item.condition?.trim() || 'Uncategorized')
    .sort((a, b) => a.localeCompare(b));
  return Array.from(new Set(all));
};

export default function Home() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState('');
  const conditions = useMemo(getUniqueConditions, []);

  const handleStart = () => {
    const query = selectedTheme ? `?theme=${encodeURIComponent(selectedTheme)}` : '';
    router.push(`/game${query}`);
  };

  return (
    <div
      style={{
        textAlign: 'center',
        marginTop: '12vh',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24
      }}
    >
      <div>
        <h1>🤖 Turing Test Game</h1>
        <p>Play a single round, review the outcome, then decide what to do next.</p>
      </div>

      <div
        style={{
          maxWidth: 520,
          width: '100%',
          padding: 24,
          borderRadius: 16,
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
          background: '#f8f9fb',
          textAlign: 'left'
        }}
      >
        <h2 style={{ marginBottom: 16 }}>Choose a Topic</h2>
        <label htmlFor="theme-select" style={{ display: 'block', marginBottom: 8 }}>
          Which theme should the round use?
        </label>
        <select
          id="theme-select"
          value={selectedTheme}
          onChange={(event) => setSelectedTheme(event.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '1rem',
            borderRadius: 12,
            border: '1px solid #d0d7de',
            backgroundColor: '#fff'
          }}
        >
          <option value="">Surprise me (all topics)</option>
          {conditions.map((condition) => (
            <option key={condition} value={condition}>
              {condition}
            </option>
          ))}
        </select>
        <p style={{ marginTop: 16, lineHeight: 1.6 }}>
          <span role="img" aria-label="cursor">
            👆
          </span>{' '}
          Pick a topic, then press start to jump straight into the round.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 12,
          maxWidth: 520,
          width: '100%',
          textAlign: 'left'
        }}
      >
        <h2>How to Play</h2>
        <div
          style={{
            display: 'grid',
            gap: 8,
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            border: '1px solid #e6ebf1'
          }}
        >
          <p>
            <span role="img" aria-label="human icon">
              👤
            </span>{' '}
            Swipe or press <code>→</code> if you believe the response is human.
          </p>
          <p>
            <span role="img" aria-label="robot icon">
              🤖
            </span>{' '}
            Swipe or press <code>←</code> if you think it was written by AI.
          </p>
          <p>
            <span role="img" aria-label="sparkles">
              ✨
            </span>{' '}
            After each round you can leave a reflection or play again with a fresh prompt.
          </p>
        </div>
      </div>

      <button
        onClick={handleStart}
        style={{
          marginTop: 12,
          padding: '14px 32px',
          fontSize: '1rem',
          borderRadius: 999,
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 16px 40px rgba(0, 112, 243, 0.3)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        ▶ Start Round
      </button>

      <p style={{ color: '#667085' }}>
        Prefer the old flow?{' '}
        <Link href="/game" style={{ color: '#0070f3', textDecoration: 'underline' }}>
          Jump straight to the game
        </Link>
      </p>
    </div>
  );
}