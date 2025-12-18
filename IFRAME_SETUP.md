# iframe Embedding Setup Guide

## For Columbia Drupal Administrators

This guide explains how to embed the Turing Test application in Columbia's Drupal website and configure it to work correctly with authentication.

## Quick Start

### 1. Embed Code for Drupal

Use the following iframe embed code in your Drupal content:

```html
<iframe 
  src="https://turing-app.vercel.app" 
  width="100%" 
  height="900"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  allow="popup"
  title="Turing Test Application"
></iframe>
```

**Important**: The `allow="popup"` attribute is REQUIRED for authentication to work in the iframe.

### 2. How Authentication Works in iframe

When users click "Sign In" while the app is embedded:
1. The app detects it's running in an iframe
2. Opens Auth0 login in a popup window (not inside the iframe)
3. After successful login, the popup closes and the iframe refreshes
4. User is now authenticated and can play the game

## Browser Compatibility

| Browser | Works with iframe Auth? | Notes |
|---------|------------------------|-------|
| **Chrome** | ✅ Yes | Full support with popups |
| **Firefox** | ✅ Yes | Full support with popups |
| **Edge** | ✅ Yes | Full support with popups |
| **Safari** | ⚠️ Partial | May require "Allow Popups" permission |

## Configuration Requirements

### Auth0 Dashboard Settings (Already Configured)

The following Auth0 settings have been pre-configured for iframe embedding:

- **Allowed Web Origins**: Includes `https://*.columbia.edu`
- **Allowed Callback URLs**: Includes the Vercel deployment URL
- **Cookie Settings**: `SameSite=None; Secure` for cross-origin support

### Drupal Page Settings

1. **HTTPS Required**: The Drupal page MUST be served over HTTPS for authentication to work
2. **Popup Blocker**: Users may need to allow popups for the Columbia domain
3. **Content Security Policy**: Ensure Drupal doesn't block the popup authentication

## Troubleshooting

### Issue: "Sign In" button doesn't do anything

**Solution**: Check that the iframe has `allow="popup"` attribute

```html
<iframe ... allow="popup"></iframe>
```

### Issue: Popup is blocked by browser

**Solution**: User needs to allow popups for the site. Show this message to users:

> "Please allow popups for this site to sign in. Click the popup blocker icon in your browser's address bar and allow popups."

### Issue: Authentication fails after popup closes

**Solution**: Ensure the page is served over HTTPS. Authentication cookies require HTTPS in cross-origin contexts.

### Issue: iframe shows "Refused to frame" error

**Solution**: Verify the domain is correctly configured. The app allows embedding from:
- `https://*.columbia.edu`
- `https://columbia.edu`

## Alternative Embedding Options

If popup authentication doesn't work for your use case:

### Option 1: Link to Full Page

Instead of embedding, link directly to the app:

```html
<a href="https://turing-app.vercel.app" target="_blank" class="button">
  Launch Turing Test
</a>
```

### Option 2: Redirect Authentication

Use this if you want authentication to happen on the full page:

```javascript
// Custom embed code with redirect
if (!isAuthenticated) {
  window.location.href = 'https://turing-app.vercel.app';
}
```

## Testing Checklist

Before deploying to production, verify:

- [ ] iframe loads correctly on the Drupal page
- [ ] "Sign In" button opens popup window
- [ ] Auth0 login page loads in popup
- [ ] After authentication, popup closes
- [ ] iframe refreshes and shows authenticated state
- [ ] User can complete the game workflow
- [ ] Test on Chrome, Firefox, and Safari

## Security Notes

1. **Popup Windows**: The popup authentication is more secure than embedded authentication as it prevents clickjacking attacks
2. **HTTPS Only**: All authentication happens over HTTPS with secure cookies
3. **Domain Restriction**: The app only allows embedding from verified Columbia domains

## Support

For issues or questions:
- **Developer**: Zichen Zhao (zichen.zhao@columbia.edu)
- **PI**: Elwin Wu (elwin.wu@columbia.edu)

## Technical Details

For developers who want to understand the implementation:

### Cookie Configuration
```javascript
{
  sameSite: 'none',  // Required for cross-origin iframe
  secure: true,      // Required when sameSite=none
  httpOnly: true,    // Security best practice
  maxAge: 7 * 24 * 60 * 60  // 7 days
}
```

### Content Security Policy
```
frame-ancestors 'self' https://*.columbia.edu https://columbia.edu
```

### iframe Detection
The app uses `window.self !== window.top` to detect when it's embedded and automatically switches to popup authentication.
