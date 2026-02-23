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
        category,
        score,
        accuracyPct,
        avgTimeSeconds,
        questionHistory = [],
        aiSourceCombined = '',
        session,
    } = payload;

    const timestamp = new Date().toISOString();
    const uni = session.email?.split('@')[0] || '';
    const first = session.given_name || session.name?.split(' ')?.[0] || '';
    const last = session.family_name || session.name?.split(' ')?.slice(1).join(' ') || '';

    // Per-question columns (up to 3 questions)
    const qCols = [];
    for (let i = 0; i < 3; i++) {
        const q = questionHistory[i];
        qCols.push(
            q?.prompt        || '',   // Prompt N
            q?.humanResponse || '',   // Human response N
            q?.aiResponse    || '',   // AI response N
            q?.aiSource      || '',   // AI Source N
            q?.userChoice    || '',   // User chose N
            q != null ? String(q.correct) : '',  // Result N (true / false)
        );
    }

    // Columns:
    // Timestamp | Round ID | Email | UNI | First Name | Last Name | Category |
    // [Prompt 1 | Human response 1 | AI response 1 | AI Source 1 | User chose 1 | Result 1] × 3 |
    // Score | Accuracy Percentage | Average Time (sec) | AI Source
    const row = [
        timestamp,
        roundId,
        session.email || '',
        uni,
        first,
        last,
        category,
        ...qCols,
        score,
        accuracyPct,
        avgTimeSeconds,
        aiSourceCombined,
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