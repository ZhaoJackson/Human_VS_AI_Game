import { handleAuth, handleLogin, handleCallback } from '@auth0/nextjs-auth0';

export default handleAuth({
  async login(req, res) {
    const { returnTo } = req.query;

    try {
      await handleLogin(req, res, {
        authorizationParams: {
          prompt: 'login',
        },
        returnTo: Array.isArray(returnTo) ? returnTo[0] : returnTo || '/game',
      });
    } catch (error) {
      console.error('❌ [AUTH] Login error:', error);
      res.redirect('/?auth=error');
    }
  },
  async callback(req, res) {
    try {
      await handleCallback(req, res, {
        afterCallback: async (req, res, session) => {
          console.log('✅ [AUTH] Callback successful for:', session.user.email);
          return session;
        },
      });
    } catch (error) {
      console.error('❌ [AUTH] Callback error:', error.message);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
      res.redirect('/?auth=callback-error');
    }
  },
  onError(req, res, error) {
    console.error('❌ [AUTH] Route error:', {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    res.status(error.status || 500).end(error.message);
  },
});

