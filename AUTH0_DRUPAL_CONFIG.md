# Auth0 Configuration for iframe Embedding

## Required Auth0 Dashboard Settings

To make authentication work in the embedded Drupal iframe, you need to configure these settings in your Auth0 Dashboard:

### 1. Application Settings

Navigate to: **Applications → [Your Application] → Settings**

#### Allowed Callback URLs
Add both your Vercel and Drupal URLs:
```
https://turing-app.vercel.app/api/auth/callback,
https://socialwork.columbia.edu/api/auth/callback,
https://*.columbia.edu/api/auth/callback
```

#### Allowed Logout URLs
Add:
```
https://turing-app.vercel.app,
https://socialwork.columbia.edu,
https://*.columbia.edu
```

#### Allowed Web Origins
**CRITICAL for iframe auth:**
```
https://turing-app.vercel.app,
https://socialwork.columbia.edu,
https://*.columbia.edu
```

#### Allowed Origins (CORS)
```
https://turing-app.vercel.app,
https://socialwork.columbia.edu,
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
https://socialwork.columbia.edu
https://*.columbia.edu
```

## Drupal Configuration

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

1. ✅ Can load iframe on Drupal page
2. ✅ Click "Sign In" shows popup or new tab option
3. ✅ Auth0 login page loads
4. ✅ After sign-in, window/tab closes automatically
5. ✅ Back on Drupal page, iframe shows authenticated state
6. ✅ Can start and play game within iframe

## Common Issues

### Error: "Invalid Callback URL"
- **Fix**: Add Drupal domains to "Allowed Callback URLs" in Auth0

### Error: "Origin not allowed"
- **Fix**: Add Drupal domain to "Allowed Web Origins" in Auth0

### Popup blocked, no message shown
- **Fix**: Ensure `allow="popup"` is in iframe tag
- **Fix**: User may need to allow popups in browser settings

### After auth, stays on Vercel page
- **Fix**: This should now be resolved with latest code
- **Check**: Browser console for any errors

## Support

If issues persist after configuration:
- Check browser console for error messages
- Verify all Auth0 URLs are saved
- Test in different browsers
- Contact: zichen.zhao@columbia.edu
