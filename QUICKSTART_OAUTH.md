# Quick Start Guide: OAuth Integration

This guide will help you get the OAuth-enabled Katalyst app running in under 10 minutes.

## 🚀 Quick Setup (5 Steps)

### Step 1: Install Dependencies (1 min)

```bash
npm install
```

The `@modelcontextprotocol/sdk` is already included in package.json.

### Step 2: Configure Google OAuth (3 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create **OAuth 2.0 Client ID**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add Authorized redirect URIs:
     ```
     http://localhost:5173/oauth/callback
     ```
   - Click "Create"
   - **Copy the Client ID and Client Secret**

### Step 3: Set Environment Variables (1 min)

Create a `.env` file in the project root:

```env
# Google OAuth (from Step 2)
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here

# MCP Configuration
VITE_MCP_SERVER_URL=http://localhost:5173/api/mcp
MCP_SERVER_URL=https://apollo.composio.dev/v3/mcp/f61fe1ab-bd1b-4562-8f12-d9449d4febce/mcp?include_composio_helper_actions=true

# AI Configuration (your existing values)
VITE_OPENROUTER_API_KEY=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
VITE_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
VITE_CONTRACT_PARSER_MODEL=google/gemma-3-12b-it:free
```

### Step 4: Start Development Server (30 sec)

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Step 5: Test OAuth Flow (1 min)

1. Click "Sign in with Google"
2. Popup opens with Google OAuth consent
3. Select your Google account
4. Grant calendar permissions
5. You're redirected to home page
6. Navigate to Calendar page
7. See your personal calendar events!

## ✅ Verification Checklist

- [ ] OAuth popup opens when clicking sign in
- [ ] You can grant permissions successfully
- [ ] You're redirected to home page after login
- [ ] Your name and email appear in navigation
- [ ] Calendar page shows your events
- [ ] AI summary button works on events

## 🧪 Test Multi-User Support

1. Open app in **normal browser window**
   - Sign in as User A
   - Navigate to calendar
   - Note the events you see

2. Open app in **incognito/private window**
   - Sign in as User B (different Google account)
   - Navigate to calendar
   - Verify you see different events

3. **Success!** Each user sees only their own calendar

## 🔍 Troubleshooting

### "Failed to open OAuth popup"
**Solution**: Allow popups for localhost in your browser settings

### "redirect_uri_mismatch" error
**Solution**: 
1. Check the exact URI in the error message
2. Add it to Google Console Authorized redirect URIs
3. Make sure there are no trailing slashes

### "Token exchange failed"
**Solution**:
1. Verify `VITE_GOOGLE_CLIENT_SECRET` is set correctly
2. Check for typos in Client ID/Secret
3. Ensure no extra spaces in .env values

### Calendar events not loading
**Solution**:
1. Check browser console for errors
2. Verify `VITE_MCP_SERVER_URL` is correct
3. Ensure `MCP_SERVER_URL` backend variable is set
4. Test the Composio MCP endpoint separately

### "MCP client not connected"
**Solution**:
1. Verify you have a valid access token
2. Check network tab for failed requests
3. Try logout and login again
4. Click "Retry Connection" button

## 🎯 What Changed?

### Before (Static Account)
- Single Google account configured on backend
- All users saw the same calendar
- No per-user authentication

### After (Dynamic OAuth)
- Each user logs in with their own Google account
- Users see only their own calendar events
- Secure per-user token management
- Automatic token refresh

## 📖 Next Steps

1. **Read Full Documentation**: See `OAUTH_INTEGRATION.md` for details
2. **Test with Multiple Accounts**: Verify isolation
3. **Deploy to Production**: Follow README deployment guide
4. **Configure Production OAuth**: Update redirect URIs

## 🎨 Key Files to Understand

```
src/
├── lib/
│   ├── mcpClient.ts        # Dynamic MCP client with user tokens
│   └── googleAuth.ts       # OAuth 2.0 flow implementation
├── hooks/
│   ├── useAuth.ts          # Token management & refresh
│   └── useCalendarMCP.ts   # Calendar hook with MCP SDK
└── pages/
    ├── auth/LoginPage.tsx  # OAuth login button
    └── oauth/CallbackPage.tsx  # OAuth callback handler
```

## 💡 Pro Tips

1. **Token Refresh**: Happens automatically 5 minutes before expiry
2. **Logout**: Clears all tokens from localStorage
3. **Multiple Accounts**: Use different browsers/incognito windows
4. **Debugging**: Check browser console and Network tab
5. **State Management**: Token stored in localStorage with expiry

## 🚢 Production Deployment

When ready to deploy:

1. Update `.env` with production URLs:
   ```env
   VITE_MCP_SERVER_URL=https://your-app.vercel.app/api/mcp-proxy
   ```

2. Add redirect URI to Google Console:
   ```
   https://your-app.vercel.app/oauth/callback
   ```

3. Set environment variables in Vercel dashboard

4. Deploy and test!

## 🎉 Success!

You now have a fully functional multi-user calendar app with:
- ✅ Per-user OAuth authentication
- ✅ Dynamic MCP client instances
- ✅ Automatic token refresh
- ✅ Secure calendar access
- ✅ AI-powered meeting summaries

## 📞 Need Help?

1. Check `OAUTH_INTEGRATION.md` for detailed docs
2. Review `MIGRATION_SUMMARY.md` for implementation details
3. Look at browser console for error messages
4. Verify all environment variables
5. Open a GitHub issue with details

---

**Happy Coding!** 🚀

