import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

export default handleAuth({
  async login(req, res) {
    const { returnTo } = req.query;

    await handleLogin(req, res, {
      authorizationParams: {
        prompt: 'login',
      },
      returnTo: Array.isArray(returnTo) ? returnTo[0] : returnTo || '/game',
    });
  },
  onError(req, res, error) {
    console.error('Auth0 route error', error);
    res.status(error.status || 500).end(error.message);
  },
});

