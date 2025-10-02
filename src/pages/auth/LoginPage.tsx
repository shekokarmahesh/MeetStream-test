import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  initiateGoogleOAuth,
  exchangeCodeForToken,
  fetchUserInfo
} from '@/lib/googleAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import katalystLogo from '@/assets/katalystlogi.png';
import type { User } from '@/types/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [navigate, isAuthenticated]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get authorization code
      const authCode = await initiateGoogleOAuth();
      
      // Step 2: Exchange code for tokens
      const tokenResponse = await exchangeCodeForToken(authCode);
      
      // Step 3: Fetch user info
      const userInfo = await fetchUserInfo(tokenResponse.access_token);
      
      // Step 4: Create user object with tokens
      const userData: User = {
        ...userInfo,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiry: Date.now() + (tokenResponse.expires_in * 1000),
      };
      
      // Step 5: Login and navigate
      login(userData);
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="mx-auto w-20 h-20 flex items-center justify-center">
              <img 
                src={katalystLogo} 
                alt="Katalyst Logo" 
                className="w-16 h-16 object-contain drop-shadow-lg"
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Welcome to Katalyst
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Your intelligent calendar companion
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-8">
            <div className="space-y-4">
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full h-12 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 text-center">{error}</p>
                </div>
              )}
              
              <div className="relative">
                <Separator className="my-6" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-3 text-xs text-muted-foreground">
                    Secure Authentication
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground text-center leading-relaxed">
                By signing in, you agree to our{' '}
                <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Experience seamless calendar management with AI-powered insights
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
