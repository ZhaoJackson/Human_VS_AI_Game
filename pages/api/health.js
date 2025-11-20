export default function handler(req, res) {
    console.log(`🔵 [HEALTH] API route hit - METHOD: ${req.method}`);
    if (req.method === 'POST') {
        console.log('🔵 [HEALTH] POST body:', req.body);
    }
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), method: req.method });
}
