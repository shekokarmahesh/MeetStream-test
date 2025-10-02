import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/auth';
import { refreshAccessToken } from '@/lib/googleAuth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        
        // Check if token is expired
        if (parsedUser.tokenExpiry && Date.now() >= parsedUser.tokenExpiry) {
          // Token expired, try to refresh
          handleTokenRefresh(parsedUser);
        } else {
          setUser(parsedUser);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenRefresh = async (userData: User) => {
    if (!userData.refreshToken) {
      // No refresh token, user needs to login again
      logout();
      return;
    }

    try {
      const tokenResponse = await refreshAccessToken(userData.refreshToken);
      
      const updatedUser: User = {
        ...userData,
        accessToken: tokenResponse.access_token,
        tokenExpiry: Date.now() + (tokenResponse.expires_in * 1000),
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
    }
  };

  const login = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUserTokens = useCallback((accessToken: string, refreshToken?: string, expiresIn?: number) => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      accessToken,
      refreshToken: refreshToken || user.refreshToken,
      tokenExpiry: expiresIn ? Date.now() + (expiresIn * 1000) : user.tokenExpiry,
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    // Check if token is expired or about to expire (within 5 minutes)
    if (user.tokenExpiry && Date.now() >= user.tokenExpiry - 5 * 60 * 1000) {
      if (user.refreshToken) {
        try {
          const tokenResponse = await refreshAccessToken(user.refreshToken);
          
          const updatedUser: User = {
            ...user,
            accessToken: tokenResponse.access_token,
            tokenExpiry: Date.now() + (tokenResponse.expires_in * 1000),
          };

          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          
          return tokenResponse.access_token;
        } catch (error) {
          console.error('Error refreshing token:', error);
          logout();
          return null;
        }
      }
    }

    return user.accessToken || null;
  }, [user]);

  const isAuthenticated = !!user && !!user.accessToken;

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
    updateUserTokens,
    getAccessToken,
  };
};
