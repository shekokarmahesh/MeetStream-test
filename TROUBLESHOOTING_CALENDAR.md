# Calendar Page Troubleshooting Guide

## 🔍 Common Issues & Solutions

### Issue 1: "MCP client not connected" or Connection Timeout

**Symptoms:**
- Calendar page shows "Connecting to Calendar" forever
- Console shows connection errors
- Events don't load

**Solutions:**

#### A. Check Your Environment Variables

1. Open `.env` file
2. Verify these are set correctly:
   ```env
   VITE_MCP_SERVER_URL=http://localhost:5173/api/mcp
   MCP_SERVER_URL=https://apollo.composio.dev/v3/mcp/your-id/mcp?include_composio_helper_actions=true
   ```

3. **Important**: Make sure `VITE_MCP_SERVER_URL` points to your proxy, not directly to Composio

#### B. Test the MCP Proxy

1. Open browser console (F12)
2. Run this command:
   ```javascript
   fetch('http://localhost:5173/api/mcp', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 })
   }).then(r => r.json()).then(console.log)
   ```

3. If you get an error, the proxy isn't working

#### C. Restart Development Server

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

---

### Issue 2: CORS Errors

**Symptoms:**
- Console shows "CORS policy" errors
- "Access-Control-Allow-Origin" errors

**Solutions:**

#### A. Verify Proxy is Running
The proxy handles CORS. Make sure you're using the proxy URL:
```env
VITE_MCP_SERVER_URL=http://localhost:5173/api/mcp  ✅ Correct
VITE_MCP_SERVER_URL=https://apollo.composio.dev/... ❌ Wrong (direct access)
```

#### B. Check Vite Proxy Configuration
The `vite.config.ts` should have the proxy setup (already done).

---

### Issue 3: OAuth Token Issues

**Symptoms:**
- "Unauthorized" or "401" errors
- "Invalid token" messages
- Calendar loads but shows no events

**Solutions:**

#### A. Verify Token is Present

1. Open browser console
2. Run:
   ```javascript
   localStorage.getItem('user')
   ```
3. You should see a JSON object with `accessToken`

#### B. Refresh Your Login

1. Click "Logout"
2. Sign in again with Google
3. Grant calendar permissions
4. Try calendar page again

#### C. Check Token Expiry

The token auto-refreshes, but if it fails:
1. Logout and login again
2. Check console for refresh errors

---

### Issue 4: No Calendar Events Showing

**Symptoms:**
- Calendar page loads successfully
- No error messages
- But "No upcoming meetings" shows even though you have events

**Solutions:**

#### A. Check Date Range
The app fetches events from:
- **Past**: Last 30 days
- **Upcoming**: Next 30 days

Make sure you have events in this range!

#### B. Check Calendar Permissions

1. Go to your Google account settings
2. Navigate to "Security" → "Third-party apps"
3. Find your app
4. Make sure it has Calendar permissions

#### C. Test with a New Event

1. Go to Google Calendar directly
2. Create a test event for tomorrow
3. Refresh the Katalyst calendar page
4. The event should appear

---

### Issue 5: Tools Not Found

**Symptoms:**
- Console shows "Calendar list events tool not found"
- Or "Tool not available" errors

**Solutions:**

#### A. Check MCP Server URL

Your `MCP_SERVER_URL` should include the Composio calendar tools:
```env
MCP_SERVER_URL=https://apollo.composio.dev/v3/mcp/YOUR_ID/mcp?include_composio_helper_actions=true
```

The `?include_composio_helper_actions=true` part is important!

#### B. Verify Composio Account

1. Login to Composio dashboard
2. Check that Google Calendar integration is active
3. Re-authenticate if needed

---

## 🧪 Diagnostic Steps

### Step 1: Check Browser Console

1. Press `F12` to open DevTools
2. Go to "Console" tab
3. Look for errors (red text)
4. Share the error messages

### Step 2: Check Network Requests

1. Press `F12` → "Network" tab
2. Click on "Calendar Management"
3. Look for failed requests (red)
4. Click on failed request → "Preview" tab
5. Check the error message

### Step 3: Check LocalStorage

```javascript
// In browser console
JSON.parse(localStorage.getItem('user'))
```

Should show:
```json
{
  "name": "Your Name",
  "email": "your@email.com",
  "accessToken": "ya29.a0...",  // Should be present
  "refreshToken": "1//...",      // Should be present
  "tokenExpiry": 1234567890      // Should be present
}
```

### Step 4: Test MCP Connection

```javascript
// In browser console
const token = JSON.parse(localStorage.getItem('user')).accessToken;

fetch('http://localhost:5173/api/mcp', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 1
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ MCP Connection working!', data);
})
.catch(err => {
  console.error('❌ MCP Connection failed:', err);
});
```

---

## 📋 Environment Checklist

Make sure ALL these are set in `.env`:

```env
# ✅ Google OAuth
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# ✅ MCP Frontend (Proxy URL)
VITE_MCP_SERVER_URL=http://localhost:5173/api/mcp

# ✅ MCP Backend (Actual Server)
MCP_SERVER_URL=https://apollo.composio.dev/v3/mcp/f61fe1ab-bd1b-4562-8f12-d9449d4febce/mcp?include_composio_helper_actions=true

# ✅ OpenRouter AI
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxx
VITE_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
VITE_CONTRACT_PARSER_MODEL=google/gemma-3-12b-it:free
```

---

## 🔄 Quick Reset

If nothing else works, try this:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear browser data
# In browser: F12 → Application → Clear storage → Clear site data

# 3. Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 4. Restart dev server
npm run dev

# 5. Login again and test
```

---

## 📞 Still Having Issues?

Please provide:

1. **Error messages** from browser console
2. **Failed network requests** from Network tab
3. **Your environment setup** (without sensitive keys)
4. **What you see** on the calendar page

I'll help you debug further!

