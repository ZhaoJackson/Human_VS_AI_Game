import { getSession } from '@auth0/nextjs-auth0';
import { appendRound, checkExistingRound } from '../../src/lib/google/sheets';
import Joi from 'joi';

// Validation schema
const questionSchema = Joi.object({
    questionNumber: Joi.number().integer().min(1).required(),
    prompt: Joi.string().required(),
    userChoice: Joi.string().required(),
    correct: Joi.boolean().required(),
    correctAnswer: Joi.string().required(),
    humanResponse: Joi.string().required(),
    aiResponse: Joi.string().required(),
    aiSource: Joi.string().allow('').optional(),
    timeTaken: Joi.number().allow(null).optional(),
});

const roundSchema = Joi.object({
    roundId: Joi.string().guid({ version: 'uuidv4' }).required(),
    category: Joi.string().required(),
    score: Joi.number().integer().min(0).required(),
    accuracyPct: Joi.number().min(0).max(100).required(),
    avgTimeSeconds: Joi.number().min(0).required(),
    questionHistory: Joi.array().items(questionSchema).min(1).required(),
    aiSourceCombined: Joi.string().allow('').optional(),
    user: Joi.object().optional().unknown(true)
});

export default async function handler(req, res) {
    console.log(`🔵 [SUBMIT-DATA] API route hit - METHOD: ${req.method}`);

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        console.log('🔵 [SUBMIT-DATA] Checking session...');

        let user;
        if (req.body.user) {
            console.log('[SUBMIT-DATA] Using client-side user data (fast path)');
            user = req.body.user;
        } else {
            const session = await getSession(req, res);
            if (!session?.user) {
                console.error('❌ [SUBMIT-DATA] No user session found');
                return res.status(401).json({ error: 'Unauthorized', description: 'User not authenticated' });
            }
            user = session.user;
        }

        console.log(`✅ [SUBMIT-DATA] User authenticated: ${user.email}`);

        console.log('🔵 [SUBMIT-DATA] Validating payload...');
        const { error, value } = roundSchema.validate(req.body);
        if (error) {
            console.error('❌ [SUBMIT-DATA] Validation error:', error.details[0].message);
            return res.status(400).json({ error: `Invalid request: ${error.details[0].message}` });
        }

        const { roundId, category, score, accuracyPct, avgTimeSeconds, questionHistory, aiSourceCombined } = value;

        console.log(`🔵 [SUBMIT-DATA] Checking for duplicate round: ${roundId}`);
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        const sheetName = process.env.GOOGLE_SHEETS_TAB_NAME || 'round_results';

        const exists = await checkExistingRound(spreadsheetId, sheetName, roundId);
        if (exists) {
            console.warn(`⚠️ [SUBMIT-DATA] Round ${roundId} already logged`);
            return res.status(200).json({ status: 'duplicate', message: 'Round already logged' });
        }

        console.log('🔵 [SUBMIT-DATA] Appending to Google Sheets...');
        const payload = {
            roundId,
            category,
            score,
            accuracyPct,
            avgTimeSeconds,
            questionHistory,
            aiSourceCombined: aiSourceCombined || '',
            session: user
        };

        await appendRound(spreadsheetId, sheetName, payload);
        console.log('✅ [SUBMIT-DATA] Successfully logged to Sheets');

        return res.status(200).json({ status: 'success', message: 'Round logged successfully' });

    } catch (error) {
        console.error('🔴 [SUBMIT-DATA] Internal Server Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
}