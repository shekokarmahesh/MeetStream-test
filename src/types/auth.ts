export interface User {
  name: string;
  email: string;
  picture: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export interface GoogleUser {
  credential: string;
  select_by: string;
}

export interface GoogleCredentialPayload {
  name: string;
  email: string;
  picture: string;
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

export interface GoogleAuthCodeResponse {
  code: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: GoogleOAuthConfig) => void;
          renderButton: (element: HTMLElement, options: GoogleButtonOptions) => void;
        };
      };
    };
  }
}

export interface GoogleOAuthConfig {
  client_id: string;
  callback: (response: GoogleUser) => void;
}

export interface GoogleButtonOptions {
  theme: 'outline' | 'filled_blue' | 'filled_black';
  size: 'large' | 'medium' | 'small';
  width?: number;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
}
