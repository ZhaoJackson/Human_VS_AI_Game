import { getSession } from '@auth0/nextjs-auth0';
import { appendRoundData, checkRoundExists } from '../../src/lib/google/sheets';
import Joi from 'joi';

// Validation schema
const roundSchema = Joi.object({
    roundId: Joi.string().guid({ version: 'uuidv4' }).required(),
    category: Joi.string().required(),
    numQuestions: Joi.number().integer().min(1).required(),
    score: Joi.number().integer().min(0).required(),
    accuracyPct: Joi.number().min(0).max(100).required(),
    avgTimeSeconds: Joi.number().min(0).required()
});

export default async function handler(req, res) {
    console.log(`🔵 [SUBMIT-DATA] API route hit - METHOD: ${req.method}`);

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 1. Authentication Check
        console.log('🔵 [SUBMIT-DATA] Checking session...');
        const session = await getSession(req, res);
        if (!session?.user) {
            console.error('❌ [SUBMIT-DATA] No user session found');
            return res.status(401).json({ error: 'Unauthorized', description: 'User not authenticated' });
        }

        const user = session.user;
        console.log(`✅ [SUBMIT-DATA] User authenticated: ${user.email}`);

        // 2. Validate Request Body
        console.log('🔵 [SUBMIT-DATA] Validating payload...');
        const { error, value } = roundSchema.validate(req.body);
        if (error) {
            console.error('❌ [SUBMIT-DATA] Validation error:', error.details[0].message);
            return res.status(400).json({ error: `Invalid request: ${error.details[0].message}` });
        }

        const { roundId, category, numQuestions, score, accuracyPct, avgTimeSeconds } = value;

        // 3. Check for Duplicates
        console.log(`🔵 [SUBMIT-DATA] Checking for duplicate round: ${roundId}`);
        const exists = await checkRoundExists(roundId);
        if (exists) {
            console.warn(`⚠️ [SUBMIT-DATA] Round ${roundId} already logged`);
            return res.status(200).json({ status: 'duplicate', message: 'Round already logged' });
        }

        // 4. Append to Google Sheets
        console.log('🔵 [SUBMIT-DATA] Appending to Google Sheets...');
        const rowData = {
            timestamp: new Date().toISOString(),
            round_id: roundId,
            email: user.email,
            uni: user.nickname || user.email.split('@')[0], // Fallback if nickname missing
            first_name: user.given_name || '',
            last_name: user.family_name || '',
            category,
            num_questions: numQuestions,
            score,
            accuracy_pct: accuracyPct,
            avg_time_s: avgTimeSeconds,
            app_version: process.env.npm_package_version || '1.0.0',
            notes: ''
        };

        await appendRoundData(rowData);
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
