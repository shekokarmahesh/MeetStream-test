import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, Users, Settings, LogOut, ChevronRight } from 'lucide-react';
import katalystLogo from '@/assets/katalystlogi.png';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [navigate, isAuthenticated, isLoading]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const features = [
    {
      icon: Calendar,
      title: 'Calendar Management',
      description: 'View and manage your upcoming meetings and events',
      href: '/calendar',
      badge: 'Primary',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'Track time spent in meetings and optimize your schedule',
      href: '#',
      badge: 'Coming Soon',
      color: 'text-green-600 bg-green-50'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Collaborate with team members and share calendars',
      href: '#',
      badge: 'Coming Soon',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      icon: Settings,
      title: 'Smart Insights',
      description: 'AI-powered insights about your meeting patterns',
      href: '#',
      badge: 'Coming Soon',
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img 
                  src={katalystLogo} 
                  alt="Katalyst Logo" 
                  className="w-6 h-6 object-contain"
                />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Katalyst
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.picture} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-white shadow-lg">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback className="text-2xl">{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
            Welcome back, {user.name?.split(' ')[0]}!
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Ready to optimize your calendar and boost productivity?
          </p>
          <Badge variant="secondary" className="text-xs">
            ✨ AI-Powered Calendar Management
          </Badge>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm ${
                feature.href === '#' ? 'opacity-75' : 'hover:scale-[1.02]'
              }`}
              onClick={() => feature.href !== '#' && navigate(feature.href)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={feature.badge === 'Primary' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {feature.badge}
                    </Badge>
                    {feature.href !== '#' && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Quick Start</span>
            </CardTitle>
            <CardDescription className="text-blue-100">
              Get started with your most important features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                asChild 
                variant="secondary" 
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <Link to="/calendar" className="flex items-center justify-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>View Calendar</span>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-transparent hover:bg-white/10 text-white border-white/30"
                disabled
              >
                <Clock className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HomePage;
