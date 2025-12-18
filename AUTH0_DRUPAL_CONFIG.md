# Auth0 Configuration for iframe Embedding

## Required Auth0 Dashboard Settings

To make authentication work in the embedded Drupal iframe at **https://sig.columbia.edu**, you need to configure these settings in your Auth0 Dashboard:

### 1. Application Settings

Navigate to: **Applications → [Your Application] → Settings**

#### Allowed Callback URLs
Add both your Vercel and Drupal URLs:
```
https://turing-app.vercel.app/api/auth/callback,
https://sig.columbia.edu/api/auth/callback,
https://*.columbia.edu/api/auth/callback
```

#### Allowed Logout URLs
Add:
```
https://turing-app.vercel.app,
https://sig.columbia.edu,
https://*.columbia.edu
```

#### Allowed Web Origins
**CRITICAL for iframe auth:**
```
https://turing-app.vercel.app,
https://sig.columbia.edu,
https://*.columbia.edu
```

#### Allowed Origins (CORS)
```
https://turing-app.vercel.app,
https://sig.columbia.edu,
https://*.columbia.edu
```

### 2. Advanced Settings

Navigate to: **Applications → [Your Application] → Settings → Advanced Settings**

#### Grant Types
Ensure these are enabled:
- ✅ Authorization Code
- ✅ Refresh Token
- ✅ Implicit (for iframe context)

#### OAuth
- **JsonWebToken Signature Algorithm**: RS256
- **OIDC Conformant**: Enabled

### 3. Cross-Origin Authentication

Navigate to: **Applications → [Your Application] → Settings → Cross-Origin Authentication**

- Enable: **Cross-Origin Authentication**
- Allowed Origins: Add your Drupal domain
```
https://sig.columbia.edu
https://*.columbia.edu
```

## Drupal Configuration

### Your Drupal Page
URL: **https://sig.columbia.edu/content/turing-test-lets-play**

### iframe Embed Code

Use exactly this code in your Drupal HTML block:

```html
<iframe 
  src="https://turing-app.vercel.app" 
  width="100%" 
  height="900"
  allow="popup"
  title="Turing Test Application"
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
></iframe>
```

**Important attributes:**
- `allow="popup"` - Required for popup authentication
- `sandbox="..."` - Allows necessary iframe interactions

### Content Security Policy (if applicable)

If your Drupal site has CSP headers, ensure they allow:

```
frame-src https://turing-app.vercel.app;
script-src 'unsafe-inline' 'unsafe-eval';
```

## Testing Checklist

After configuration:

1. ✅ Visit https://sig.columbia.edu/content/turing-test-lets-play
2. ✅ Verify iframe loads correctly
3. ✅ Click "Sign In" - should show popup or new tab option
4. ✅ Auth0 login page loads
5. ✅ After sign-in, window/tab closes automatically
6. ✅ Back on Drupal page, iframe shows authenticated state
7. ✅ Can start and play game within iframe

## Common Issues

### Error: "Invalid Callback URL"
- **Fix**: Add `https://sig.columbia.edu/api/auth/callback` to "Allowed Callback URLs" in Auth0

### Error: "Origin not allowed"
- **Fix**: Add `https://sig.columbia.edu` to "Allowed Web Origins" in Auth0

### Popup blocked, no message shown
- **Fix**: Ensure `allow="popup"` is in iframe tag
- **Fix**: User may need to allow popups in browser settings

### After auth, stays on Vercel page
- **Fix**: This should now be resolved with latest code
- **Check**: Browser console for any errors

## Quick Setup Summary

**In Auth0 Dashboard, add these URLs:**
1. Allowed Callback URLs: `https://sig.columbia.edu/api/auth/callback`
2. Allowed Logout URLs: `https://sig.columbia.edu`
3. Allowed Web Origins: `https://sig.columbia.edu`
4. Allowed Origins (CORS): `https://sig.columbia.edu`
5. Cross-Origin Authentication → Allowed Origins: `https://sig.columbia.edu`

**In Drupal:**
- Use the iframe code above with `allow="popup"` attribute

## Support

If issues persist after configuration:
- Check browser console for error messages
- Verify all Auth0 URLs are saved (scroll down and click "Save Changes")
- Test in different browsers
- Contact: zichen.zhao@columbia.edu
