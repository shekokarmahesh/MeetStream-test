import type { GoogleUser, GoogleCredentialPayload, User, GoogleTokenResponse } from '@/types/auth';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${window.location.origin}/oauth/callback`;

// OAuth 2.0 scopes for Google Calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

export const decodeGoogleCredential = (credential: string): GoogleCredentialPayload => {
  try {
    const payload = JSON.parse(atob(credential.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding Google credential:', error);
    throw new Error('Invalid Google credential');
  }
};

export const extractUserFromCredential = (response: GoogleUser): User => {
  const payload = decodeGoogleCredential(response.credential);
  
  return {
    name: payload.name,
    email: payload.email,
    picture: payload.picture,
  };
};

/**
 * Initiates OAuth 2.0 authorization code flow
 * Opens Google OAuth consent screen in a popup
 */
export const initiateGoogleOAuth = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Client ID not configured'));
      return;
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', SCOPES);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', generateRandomState());

    // Open popup window
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authUrl.toString(),
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      reject(new Error('Failed to open OAuth popup. Please allow popups for this site.'));
      return;
    }

    // Listen for authorization code from callback
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
        window.removeEventListener('message', messageHandler);
        popup.close();
        resolve(event.data.code);
      } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
        window.removeEventListener('message', messageHandler);
        popup.close();
        reject(new Error(event.data.error || 'OAuth authentication failed'));
      }
    };

    window.addEventListener('message', messageHandler);

    // Check if popup was closed (with COOP error suppression)
    const checkPopupClosed = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', messageHandler);
          reject(new Error('OAuth popup was closed'));
        }
      } catch (error) {
        // Suppress COOP (Cross-Origin-Opener-Policy) errors
        // These are expected when checking popup status across origins
      }
    }, 1000);

    // Cleanup interval after 5 minutes (fallback)
    setTimeout(() => {
      clearInterval(checkPopupClosed);
    }, 5 * 60 * 1000);
  });
};

/**
 * Exchanges authorization code for access token
 */
export const exchangeCodeForToken = async (code: string): Promise<GoogleTokenResponse> => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET || '',
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to exchange code for token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

/**
 * Fetches user info using access token
 */
export const fetchUserInfo = async (accessToken: string): Promise<User> => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    return {
      name: data.name,
      email: data.email,
      picture: data.picture,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};

/**
 * Refreshes access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<GoogleTokenResponse> => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to refresh token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Generate random state for OAuth security
 */
const generateRandomState = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const initializeGoogleAuth = (callback: (response: GoogleUser) => void) => {
  if (!window.google) {
    console.error('Google Identity Services not loaded');
    return;
  }

  if (!GOOGLE_CLIENT_ID) {
    console.error('Google Client ID not found. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.');
    return false;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback,
    });
    return true;
  } catch (error) {
    console.error('Failed to initialize Google Auth:', error);
    return false;
  }
};

export const renderGoogleButton = (
  element: HTMLElement,
  options?: {
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    width?: number;
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  }
) => {
  if (!window.google) {
    console.error('Google Identity Services not loaded');
    return;
  }

  const defaultOptions = {
    theme: 'outline' as const,
    size: 'large' as const,
    width: 300,
    text: 'signin_with' as const,
    shape: 'rectangular' as const,
  };

  window.google.accounts.id.renderButton(element, {
    ...defaultOptions,
    ...options,
  });
};
