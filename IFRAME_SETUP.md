# iframe Embedding for Drupal

## Quick Setup

Add this iframe code to your Drupal page:

```html
<iframe 
  src="https://turing-app.vercel.app" 
  width="100%" 
  height="900"  
  allow="popup"
  title="Turing Test"
></iframe>
```

**Important**: The `allow="popup"` attribute is required.

## How Sign-In Works

When users click "Sign In" in the embedded app:

1. **Best case**: A popup window opens for Auth0 login
   - User signs in
   - Popup closes automatically  
   - User continues in the embedded app

2. **If popup is blocked**: User sees a confirmation dialog
   - Click "OK" to open sign-in in a new tab
   - Sign in there
   - Close the tab and return to Drupal
   - Embedded app refreshes automatically

## Troubleshooting

**Popup blocked warning appears**:
- User should click "OK" to use new tab method
- Or allow popups for the site in browser settings

**After sign-in, stays on Vercel page**:
- This is the new tab method working correctly
- User should close that tab and return to Drupal
- The embedded app will refresh with their authenticated session

## Browser Support

- ✅ **Chrome/Edge**: Full popup support
- ✅ **Firefox**: Full popup support  
- ⚠️ **Safari**: May require popup permission or use new tab method

## Support

For issues: zichen.zhao@columbia.edu
