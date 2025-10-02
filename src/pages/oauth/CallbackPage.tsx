import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    const handleCallback = () => {
      try {
        // Get authorization code from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Authorization failed: ${error}`);
          
          // Send error message to opener window
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'GOOGLE_OAUTH_ERROR',
                error: error,
              },
              window.location.origin
            );
          }
          
          // Close window after delay
          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }

        if (code) {
          setStatus('success');
          setMessage('Authorization successful! Closing window...');
          
          // Send authorization code to opener window
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'GOOGLE_OAUTH_SUCCESS',
                code: code,
              },
              window.location.origin
            );
          }
          
          // Close window after short delay
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          setStatus('error');
          setMessage('No authorization code received');
          
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred during authorization');
        console.error('Callback error:', err);
        
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'processing' && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle>
            {status === 'processing' && 'Authenticating...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Error'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            {status === 'processing'
              ? 'Please wait...'
              : 'This window will close automatically.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}



