import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

export default withApiAuthRequired(async function testAuth(req, res) {
    console.log('🔵 [TEST-AUTH] API route called');

    try {
        const session = await getSession(req, res);
        console.log('✅ [TEST-AUTH] Session found:', session?.user?.email);

        return res.status(200).json({
            authenticated: true,
            email: session?.user?.email,
            message: 'Auth0 is working!'
        });
    } catch (error) {
        console.error('❌ [TEST-AUTH] Error:', error);
        return res.status(500).json({
            authenticated: false,
            error: error.message
        });
    }
});
