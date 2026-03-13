import { getSession } from '@auth0/nextjs-auth0';
import { appendRound, checkExistingRound } from '../../src/lib/google/sheets';
import Joi from 'joi';

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

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
    participantId: Joi.string().required(),
    category: Joi.string().required(),
    score: Joi.number().integer().min(0).required(),
    accuracyPct: Joi.number().min(0).max(100).required(),
    avgTimeSeconds: Joi.number().min(0).required(),
    questionHistory: Joi.array().items(questionSchema).min(1).required(),
    // user is optional — only present when AUTH_ENABLED=true
    user: Joi.object().optional().unknown(true),
});

export default async function handler(req, res) {
    console.log(`🔵 [SUBMIT-DATA] API route hit - METHOD: ${req.method}`);

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // ── Auth gate (only enforced when AUTH_ENABLED=true) ─────────────────
        if (AUTH_ENABLED) {
            console.log('🔵 [SUBMIT-DATA] Auth enabled — checking session...');
            let user = req.body.user;
            if (!user) {
                const session = await getSession(req, res);
                if (!session?.user) {
                    console.error('❌ [SUBMIT-DATA] No user session found');
                    return res.status(401).json({ error: 'Unauthorized', description: 'User not authenticated' });
                }
                user = session.user;
            }
            console.log(`✅ [SUBMIT-DATA] User authenticated: ${user.email}`);
        } else {
            console.log('🔵 [SUBMIT-DATA] Auth disabled — open access');
        }

        // ── Validate payload ──────────────────────────────────────────────────
        const { error, value } = roundSchema.validate(req.body);
        if (error) {
            console.error('❌ [SUBMIT-DATA] Validation error:', error.details[0].message);
            return res.status(400).json({ error: `Invalid request: ${error.details[0].message}` });
        }

        const { roundId, participantId, category, score, accuracyPct, avgTimeSeconds, questionHistory } = value;

        // ── Duplicate check ───────────────────────────────────────────────────
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        const sheetName = process.env.GOOGLE_SHEETS_TAB_NAME || 'round_results';

        const exists = await checkExistingRound(spreadsheetId, sheetName, roundId);
        if (exists) {
            console.warn(`⚠️ [SUBMIT-DATA] Round ${roundId} already logged`);
            return res.status(200).json({ status: 'duplicate', message: 'Round already logged' });
        }

        // ── Write to Sheets ───────────────────────────────────────────────────
        await appendRound(spreadsheetId, sheetName, {
            roundId,
            participantId,
            category,
            score,
            accuracyPct,
            avgTimeSeconds,
            questionHistory,
        });
        console.log('✅ [SUBMIT-DATA] Successfully logged to Sheets');

        return res.status(200).json({ status: 'success', message: 'Round logged successfully' });

    } catch (error) {
        console.error('🔴 [SUBMIT-DATA] Internal Server Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
        });
    }
}
