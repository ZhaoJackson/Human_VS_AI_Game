export default function logRound(req, res) {
    console.log('🔵 [LOG-ROUND] API route called - METHOD:', req.method);

    // Immediate response - no async, no auth, no logic
    return res.status(200).json({ status: 'ok - bare minimum' });
}
