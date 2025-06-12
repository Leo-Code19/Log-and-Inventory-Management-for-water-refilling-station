import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data in AuthContext...');
      // Use the existing endpoints from your backend
      // Fetch user data including profile picture
      const userResponse = await api.get('/user/current/');
      
      // Since there's no specific profile endpoint, we'll use the main settings endpoint
      // which returns system, station, and notification settings
      const settingsResponse = await api.get('/settings/');
      
      // Combine user data with settings data
      const userData = {
        ...userResponse.data,
        // Use station settings if available, or set to null if not
        profilePicture: userResponse.data.profile_picture
          ? userResponse.data.profile_picture.startsWith('http')
            ? userResponse.data.profile_picture
            : `http://localhost:8000${userResponse.data.profile_picture}`
          : null,
        // Store the settings for use throughout the app
        settings: settingsResponse.data
      };
      console.log('User data received:', userData);
      setCurrentUser(userData);
      setIsAuthenticated(true);
      
      // Extract theme from the system preferences we already fetched
      try {
        // The theme is in the system object of the settings response
        const userTheme = settingsResponse.data.system.theme || 'light';
        console.log('User theme preference fetched:', userTheme);
        
        // Store the theme in a variable to pass to the login event
        return userTheme;
      } catch (prefError) {
        console.error('Error extracting user preferences:', prefError);
        return 'light'; // Default theme if preferences can't be extracted
      }
      
    } catch (error) {
      console.error('Error fetching user data in AuthContext:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setCurrentUser(null);
      setIsAuthenticated(false);
      return 'light'; // Default theme
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      console.log('Attempting login...'); // Debug log
      const response = await api.post('/login/', {
        username,
        password,
      });
      console.log('Login response:', response.data); // Debug log

      const { token, refresh } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refresh);

      // Fetch user data and theme preference
      const userTheme = await fetchUserData();
      
      // Create a custom event to notify the app that a user has logged in with their theme
      const loginEvent = new CustomEvent('userLogin', { 
        detail: { theme: userTheme } 
      });
      window.dispatchEvent(loginEvent);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear auth tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Clear any user-specific data
    setCurrentUser(null);
    setIsAuthenticated(false);
    
    // Create a custom event to notify the app that a user has logged out
    const logoutEvent = new CustomEvent('userLogout');
    window.dispatchEvent(logoutEvent);
    
    // Force reload to reset the application state completely
    window.location.href = '/login';
  };

  const value = {
    currentUser,
    login,
    logout,
    loading,
    isAuthenticated,
    setCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}