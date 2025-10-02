# MCP SDK OAuth Integration Guide

## Overview

This document describes the integration of `@modelcontextprotocol/sdk` for per-user dynamic OAuth token handling in the Katalyst calendar app. This enables users to see their own Google Calendar events rather than events from a statically connected account.

## Architecture Changes

### Before Integration
- Used `use-mcp` library with static/global MCP client
- Single account calendar access
- No per-user token management

### After Integration
- Uses `@modelcontextprotocol/sdk` for dynamic client instantiation
- Per-user OAuth token handling
- Multi-user support with isolated calendar access
- Automatic token refresh and lifecycle management

## Implementation Details

### 1. OAuth Flow

#### Frontend Flow
1. User clicks "Sign in with Google" button
2. `initiateGoogleOAuth()` opens popup with Google consent screen
3. User grants calendar permissions
4. Google redirects to `/oauth/callback` with authorization code
5. Callback page sends code to parent window via `postMessage`
6. `exchangeCodeForToken()` exchanges code for access & refresh tokens
7. `fetchUserInfo()` retrieves user profile data
8. User object with tokens stored in localStorage
9. User redirected to home page

#### Token Structure
```typescript
interface User {
  name: string;
  email: string;
  picture: string;
  accessToken?: string;      // Google OAuth access token
  refreshToken?: string;      // For token refresh
  tokenExpiry?: number;       // Timestamp when token expires
}
```

### 2. MCP Client Initialization

#### Dynamic Client Creation
```typescript
import { createMCPClient } from '@/lib/mcpClient';

const mcpClient = createMCPClient(userAccessToken);
await mcpClient.connect();
```

#### Client Features
- **Per-User Instantiation**: Each user gets their own MCP client
- **Token-Based Auth**: Uses user's Google OAuth token
- **Auto-Disconnect**: Cleans up on unmount or token change
- **Error Handling**: Graceful failures with retry logic

### 3. Token Lifecycle Management

#### Token Refresh
```typescript
const getAccessToken = async (): Promise<string | null> => {
  // Check if token is expired or expiring soon (5 min buffer)
  if (tokenExpiry && Date.now() >= tokenExpiry - 5 * 60 * 1000) {
    if (refreshToken) {
      // Refresh token automatically
      const newToken = await refreshAccessToken(refreshToken);
      updateUserTokens(newToken.access_token, undefined, newToken.expires_in);
      return newToken.access_token;
    }
  }
  return accessToken;
};
```

#### Auto-Refresh Triggers
- On app initialization (if token expired)
- Before MCP operations (5-minute buffer)
- On API errors related to authentication

### 4. Backend Proxy Updates

The MCP proxy now forwards user tokens:

```javascript
// Forward user's OAuth token if present
if (req.headers.authorization) {
  forwardHeaders.Authorization = req.headers.authorization;
}
```

This allows the Composio MCP server to access the user's specific Google Calendar.

## Environment Configuration

### Required Variables

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_client_secret  # For token exchange

# MCP Server Configuration
VITE_MCP_SERVER_URL=https://your-app.vercel.app/api/mcp-proxy

# Backend Proxy (Vercel)
MCP_SERVER_URL=https://apollo.composio.dev/v3/mcp/your-mcp-id/mcp?include_composio_helper_actions=true

# AI Configuration (unchanged)
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
VITE_CONTRACT_PARSER_MODEL=google/gemma-3-12b-it:free
```

### OAuth Scopes

The app requests the following Google OAuth scopes:
```typescript
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',  // User profile
  'https://www.googleapis.com/auth/userinfo.email',    // User email
  'https://www.googleapis.com/auth/calendar.readonly', // Read calendar
  'https://www.googleapis.com/auth/calendar.events',   // Manage events
];
```

## Key Components

### 1. `src/lib/mcpClient.ts`
- `DynamicMCPClient` class for per-user MCP instances
- `createMCPClient()` factory function
- Calendar operations (fetch, create events)
- SSE transport with user token

### 2. `src/hooks/useAuth.ts`
- Token storage and retrieval
- Automatic token refresh logic
- `getAccessToken()` with expiry checking
- User session management

### 3. `src/hooks/useCalendarMCP.ts`
- Replaces old `useCalendar` hook
- Dynamic MCP client initialization
- Connection state management
- Calendar event fetching with user token

### 4. `src/lib/googleAuth.ts`
- OAuth 2.0 authorization code flow
- Token exchange and refresh
- User info fetching
- Popup-based authentication

### 5. `src/pages/oauth/CallbackPage.tsx`
- Handles OAuth callback
- Extracts authorization code
- Sends code to parent via postMessage
- Visual feedback during auth

## Security Considerations

### Token Storage
- Tokens stored in localStorage (encrypted at rest by browser)
- Consider using httpOnly cookies for production
- Tokens cleared on logout

### Token Transmission
- Tokens sent via Authorization header
- HTTPS required for production
- CORS properly configured

### Token Refresh
- Automatic refresh with 5-minute buffer
- Logout on refresh failure
- No manual user intervention needed

### Best Practices
1. Never log or expose tokens in console/errors
2. Set appropriate token expiry times
3. Implement proper CORS policies
4. Use environment variables for secrets
5. Validate tokens on backend

## Testing

### Multi-User Testing
1. Open app in regular browser window
2. Sign in with User A
3. Open app in incognito/private window
4. Sign in with User B
5. Verify each user sees only their calendar events

### Token Refresh Testing
1. Sign in and note token expiry
2. Wait until near expiry (or manually set expiry)
3. Trigger calendar fetch
4. Verify token refreshes automatically
5. Check new token stored correctly

### Error Handling Testing
1. Revoke app permissions in Google Account settings
2. Try to fetch calendar events
3. Verify graceful error handling
4. Test retry functionality

## Migration Guide

### From Old Implementation
1. Remove `use-mcp` dependency (optional)
2. Replace `useCalendar` with `useCalendarMCP`
3. Pass `accessToken` to hook instead of static URL
4. Update environment variables
5. Test OAuth flow end-to-end

### Code Changes Required
```diff
// Old
- const { state, events } = useCalendar(MCP_SERVER_URL);

// New
+ const { getAccessToken } = useAuth();
+ const [accessToken, setAccessToken] = useState(null);
+ useEffect(() => {
+   getAccessToken().then(setAccessToken);
+ }, []);
+ const { state, events } = useCalendarMCP(accessToken);
```

## Troubleshooting

### "Failed to open OAuth popup"
- Check popup blocker settings
- Ensure HTTPS in production
- Verify redirect URI matches Google Console

### "Failed to exchange code for token"
- Check `VITE_GOOGLE_CLIENT_SECRET` is set
- Verify client secret is correct
- Check redirect URI configuration

### "MCP client not connected"
- Verify access token is valid
- Check MCP server URL
- Review network requests in DevTools

### "Token refresh failed"
- User may need to re-login
- Check refresh token is stored
- Verify token hasn't been revoked

## Deployment

### Vercel Deployment
1. Set environment variables in Vercel dashboard
2. Add both `VITE_*` (frontend) and non-prefixed (backend) vars
3. Configure redirect URI: `https://your-app.vercel.app/oauth/callback`
4. Update Google Console with production URLs
5. Deploy and test OAuth flow

### Environment Variables Checklist
- [ ] `VITE_GOOGLE_CLIENT_ID`
- [ ] `VITE_GOOGLE_CLIENT_SECRET`
- [ ] `VITE_MCP_SERVER_URL`
- [ ] `MCP_SERVER_URL` (backend)
- [ ] `VITE_OPENROUTER_API_KEY`

## Future Enhancements

1. **Secure Token Storage**
   - Implement backend session management
   - Use httpOnly cookies instead of localStorage

2. **Offline Support**
   - Cache calendar events
   - Queue actions when offline

3. **Advanced Token Management**
   - Token encryption
   - Multiple account support
   - Account switching UI

4. **Enhanced Error Handling**
   - Better error messages
   - Retry strategies
   - Fallback mechanisms

## Resources

- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [Composio MCP Documentation](https://composio.dev/docs)

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Test with multiple user accounts
4. Verify environment configuration
5. Contact support or open GitHub issue

