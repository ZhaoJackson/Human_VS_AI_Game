/**
 * Application Constants
 * 
 * Centralized location for all app-wide constants.
 * These values are NOT environment-specific.
 */

export const GAME_CONFIG = {
    // Game Mechanics
    QUESTIONS_PER_ROUND: 3,
    DEFAULT_GAME_MODE: 'comparison', // 'swipe' or 'comparison'

    // UI Settings
    DEFAULT_FONT_SIZE: 16,
    MIN_FONT_SIZE: 12,
    MAX_FONT_SIZE: 24,

    // Theme
    DEFAULT_DARK_MODE: false,
};

export const ROUTES = {
    HOME: '/',
    GAME: '/game',
    ABOUT: '/about',
    API: {
        AUTH_LOGIN: '/api/auth/login',
        AUTH_LOGOUT: '/api/auth/logout',
        AUTH_CALLBACK: '/api/auth/callback',
        SUBMIT_ROUND: '/api/submit-data',
        HEALTH: '/api/health',
    },
};

export const LOCAL_STORAGE_KEYS = {
    LAST_ROUND_ID: 'turing:lastRoundId',
    FORM_STATUS: 'turing:formStatus',
    DARK_MODE: 'turing:darkMode',
    FONT_SIZE: 'turing:fontSize',
    GAME_MODE: 'turing:gameMode',
};

export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'You must be signed in to play the game',
    INVALID_EMAIL_DOMAIN: 'Only @columbia.edu email addresses are allowed',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    SAVE_FAILED: 'Failed to save round results. Please try again.',
};

export const SUCCESS_MESSAGES = {
    ROUND_SAVED: 'Round saved successfully',
    LOGOUT_SUCCESS: 'You have been signed out',
};
