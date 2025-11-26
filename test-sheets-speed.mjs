import { appendRound, checkExistingRound } from './src/lib/google/sheets.js';

async function testSpeed() {
    console.log('🚀 Starting Sheets Speed Test...');

    // Env vars should be loaded by node --env-file=.env.local
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const sheetName = process.env.GOOGLE_SHEETS_TAB_NAME || 'round_results';
    const roundId = 'test-' + Date.now();

    if (!spreadsheetId) {
        console.error('❌ Missing GOOGLE_SHEETS_SPREADSHEET_ID');
        process.exit(1);
    }

    const payload = {
        roundId,
        category: 'Test Category',
        numQuestions: 5,
        score: 3,
        accuracyPct: 60,
        avgTimeSeconds: 1.5,
        session: {
            email: 'test@example.com',
            given_name: 'Test',
            family_name: 'User'
        }
    };

    try {
        console.time('Total Operation');

        console.time('Check Existing');
        const exists = await checkExistingRound(spreadsheetId, sheetName, roundId);
        console.timeEnd('Check Existing');
        console.log('Exists:', exists);

        console.time('Append Round');
        await appendRound(spreadsheetId, sheetName, payload);
        console.timeEnd('Append Round');

        console.timeEnd('Total Operation');
        console.log('✅ Test Complete');
    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testSpeed();
