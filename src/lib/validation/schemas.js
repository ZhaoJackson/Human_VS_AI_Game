import Joi from 'joi';

/**
 * Validation schemas for API requests
 */

export const roundLogSchema = Joi.object({
    roundId: Joi.string().trim().uuid({ version: 'uuidv4' }).required(),
    category: Joi.string().allow('').required(),
    numQuestions: Joi.number().integer().min(0).max(1000).required(),
    score: Joi.number().integer().min(0).max(1000).required(),
    accuracyPct: Joi.number().min(0).max(100).required(),
    avgTimeSeconds: Joi.number().min(0).max(600).required(),
});
