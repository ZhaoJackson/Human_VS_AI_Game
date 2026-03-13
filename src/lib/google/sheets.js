import { google } from 'googleapis';

let sheetsClient = null;

/**
 * @returns {Promise<Object>}
 */
export async function getSheetsClient() {
    if (sheetsClient) {
        return sheetsClient;
    }

    const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n');
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];

    if (!email || !key) {
        throw new Error('Missing Google Sheets service account credentials. Check GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL and GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY in .env.local');
    }

    try {
        const auth = new google.auth.JWT({
            email,
            key,
            scopes,
        });

        sheetsClient = google.sheets({ version: 'v4', auth });
        return sheetsClient;
    } catch (error) {
        console.error('Failed to create Google Sheets client:', error);
        throw new Error('Failed to authenticate with Google Sheets API');
    }
}

/**
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {string} roundId
 * @returns {Promise<boolean>}
 */
export async function checkExistingRound(spreadsheetId, sheetName, roundId) {
    const sheets = await getSheetsClient();
    const range = `${sheetName}!B:B`;

    try {
        const { data } = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
            majorDimension: 'COLUMNS',
        });

        const roundIds = data?.values?.[0] || [];
        return roundIds.includes(roundId);
    } catch (error) {
        console.error('Error checking existing round:', error);
        throw new Error('Failed to check for duplicate round ID');
    }
}

/**
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {Object} payload
 * @returns {Promise<void>}
 */
export async function appendRound(spreadsheetId, sheetName, payload) {
    const sheets = await getSheetsClient();

    const {
        roundId,
        participantId,
        category,
        score,
        accuracyPct,
        avgTimeSeconds,
        questionHistory = [],
    } = payload;

    // Timestamp in Eastern Time (America/New_York)
    const timestamp = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date()) + ' ET';

    // Dynamic per-question columns — one block of 6 per question:
    // Prompt N | Human N | AI N | AI Source N | User Choice N | Result N
    const qCols = questionHistory.flatMap((q) => [
        q.prompt        || '',
        q.humanResponse || '',
        q.aiResponse    || '',
        q.aiSource      || '',
        q.userChoice    || '',
        String(q.correct),
    ]);

    // Column order:
    // Timestamp | Round ID | Participant ID | Category |
    // Score | Accuracy % | Average Time (sec) |
    // [Prompt N | Human N | AI N | AI Source N | User Choice N | Result N] × N
    const row = [
        timestamp,
        roundId,
        participantId || '',
        category,
        score,
        accuracyPct,
        avgTimeSeconds,
        ...qCols,
    ];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [row],
            },
        });
    } catch (error) {
        console.error('Error appending round to sheet:', error);
        throw new Error('Failed to write round data to Google Sheets');
    }
}

/**
 * @returns {Object}
 * @throws {Error}
 */
export function validateSheetsConfig() {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const sheetName = process.env.GOOGLE_SHEETS_TAB_NAME || 'Rounds';

    if (!spreadsheetId) {
        throw new Error('Missing GOOGLE_SHEETS_SPREADSHEET_ID in environment variables');
    }

    return { spreadsheetId, sheetName };
}