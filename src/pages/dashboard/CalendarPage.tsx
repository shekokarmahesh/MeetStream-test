import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCalendarMCP } from '@/hooks/useCalendarMCP';
import { EventCard } from '../../components/calendar/EventCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Shield, 
  ArrowLeft,
  CalendarDays,
  History
} from 'lucide-react';
import katalystLogo from '@/assets/katalystlogi.png';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user, getAccessToken, logout, isLoading } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  // Get access token on mount
  useEffect(() => {
    const loadAccessToken = async () => {
      console.log('🔍 CalendarPage: Checking authentication...');
      console.log('🔍 isLoading:', isLoading);
      console.log('🔍 User:', user);
      
      // Wait for auth to finish loading
      if (isLoading) {
        console.log('⏳ Auth still loading, waiting...');
        return;
      }
      
      // Check if user exists
      if (!user) {
        console.log('❌ No user found, redirecting to login');
        navigate('/');
        return;
      }

      console.log('✅ User found:', user.email);
      console.log('🔑 Has accessToken:', !!user.accessToken);

      // Check if user has access token
      if (!user.accessToken) {
        console.warn('⚠️ User logged in with old method, needs re-authentication');
        setNeedsReauth(true);
        return;
      }

      console.log('🔑 Getting access token...');
      const token = await getAccessToken();
      if (!token) {
        console.error('❌ Failed to get access token');
        setNeedsReauth(true);
        return;
      }
      
      console.log('✅ Access token obtained, length:', token.length);
      setAccessToken(token);
    };

    loadAccessToken();
  }, [user, getAccessToken, navigate, isLoading]);

  const {
    state,
    error,
    upcomingEvents,
    pastEvents,
    loading,
    fetchEvents,
    retry
  } = useCalendarMCP(accessToken);

  useEffect(() => {
    if (state === 'connected') {
      fetchEvents();
      setShowError(false);
    } else if (state === 'failed') {
      // Wait 5 seconds before showing error to allow for reconnection attempts
      const timer = setTimeout(() => {
        setShowError(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state, fetchEvents]);

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show re-authentication required message
  if (needsReauth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-xl text-orange-900">Re-authentication Required</CardTitle>
            <CardDescription className="text-orange-700">
              Please log out and sign in again to access your calendar with the new authentication system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800 leading-relaxed">
                We've upgraded to a more secure OAuth system that gives you better control over your calendar data. 
                This requires you to sign in again to grant the necessary permissions.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={() => {
                  logout();
                  navigate('/');
                }} 
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Log Out and Sign In Again
              </Button>
              <Separator />
              <Button 
                onClick={() => navigate('/home')} 
                variant="ghost" 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while connecting or not ready
  // Don't show failed state during initial connection attempts
  if (state !== 'connected' && !showError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Calendar className="h-8 w-8 text-white animate-pulse" />
            </div>
            <CardTitle className="text-xl">Connecting to Calendar</CardTitle>
            <CardDescription>Please wait while we establish a secure connection...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secure Connection</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only show failed state if connection permanently failed and timeout passed
  if (state === 'failed' && showError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-900">Connection Failed</CardTitle>
            <CardDescription className="text-red-700">
              {error || 'Unable to connect to calendar service'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-3">
              <Button onClick={retry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
              <Separator />
              <Button 
                onClick={() => navigate('/home')} 
                variant="ghost" 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/home')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img 
                    src={katalystLogo} 
                    alt="Katalyst Logo" 
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  My Calendar
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Live Sync
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Meetings */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-white">
                  <CalendarDays className="h-5 w-5" />
                  <span>Upcoming Meetings</span>
                  <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/20">
                    {upcomingEvents.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Your scheduled meetings and events
                </CardDescription>
              </CardHeader>
            </Card>
            
            <div className="space-y-4">
              {loading ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center space-y-4">
                      <div className="space-y-3 w-full">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : upcomingEvents.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No upcoming meetings</h3>
                    <p className="text-muted-foreground text-sm">
                      Your calendar is clear for now. Time to focus on deep work!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>
          </div>

          {/* Past Meetings */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-gray-600 to-gray-700 border-0 text-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-white">
                  <History className="h-5 w-5" />
                  <span>Past Meetings</span>
                  <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/20">
                    {pastEvents.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-100">
                  Your meeting history and completed events
                </CardDescription>
              </CardHeader>
            </Card>
            
            <div className="space-y-4">
              {loading ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center space-y-4">
                      <div className="space-y-3 w-full">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : pastEvents.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No past meetings</h3>
                    <p className="text-muted-foreground text-sm">
                      Your meeting history will appear here once you start having meetings.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pastEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



