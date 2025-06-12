import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import IoTDevices from './pages/IoTDevices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import api from './utils/axios';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [mode, setMode] = useState('light');
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);

  // Check if user is authenticated based on token presence
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsUserAuthenticated(!!token);
    
    // Add event listener to detect authentication changes
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        setIsUserAuthenticated(!!e.newValue);
        if (!e.newValue) {
          // User logged out, reset theme to light
          setMode('light');
        }
      }
    };
    
    // Add event listeners for custom login/logout events
    const handleUserLogout = () => {
      console.log('User logout event detected');
      // Reset theme to light on logout
      setMode('light');
    };
    
    const handleUserLogin = (event) => {
      console.log('User login event detected');
      // Get theme from event if available
      if (event.detail && event.detail.theme) {
        console.log(`Applying user theme from login event: ${event.detail.theme}`);
        setMode(event.detail.theme);
      } else {
        // Fallback - theme will be fetched in the other useEffect
        console.log('No theme in login event, will fetch from API');
      }
    };
    
    // Add event listener for theme change events
    const handleThemeChange = (event) => {
      if (event.detail && event.detail.theme) {
        console.log(`Theme change event detected: ${event.detail.theme}`);
        setMode(event.detail.theme);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogout', handleUserLogout);
    window.addEventListener('userLogin', handleUserLogin);
    window.addEventListener('themeChange', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogout', handleUserLogout);
      window.removeEventListener('userLogin', handleUserLogin);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#fff',
        paper: mode === 'dark' ? '#1e1e1e' : '#fff',
      },
    },
  });

  // Reset theme to light when user logs out
  useEffect(() => {
    if (!isUserAuthenticated) {
      setMode('light');
    }
  }, [isUserAuthenticated]);

  // Get the theme preference from the backend API for the current user
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        // First try to get settings from the settings endpoint
        try {
          const response = await api.get('/settings/');
          console.log('Settings response:', response.data);
          
          if (response.data && response.data.system) {
            const { theme } = response.data.system;
            if (theme) {
              setMode(theme);
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
          
          // Try user endpoint as fallback
          try {
            const userResponse = await api.get('/user/');
            console.log('User response:', userResponse.data);
          } catch (userError) {
            console.error('User endpoint fallback failed:', userError);
            
            // Try dashboard summary as final fallback
            try {
              const dashboardResponse = await api.get('/dashboard/summary/');
              console.log('Dashboard response:', dashboardResponse.data);
              
              if (dashboardResponse.data && dashboardResponse.data.user_preferences) {
                const { theme } = dashboardResponse.data.user_preferences;
                if (theme) {
                  setMode(theme);
                  return;
                }
              }
            } catch (dashboardError) {
              console.error('Dashboard endpoint fallback failed:', dashboardError);
            }
          }
        }
        
        // If we get here, use default theme
        console.log('Using default theme');
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };
    
    // Only fetch preferences if user is authenticated
    if (isUserAuthenticated) {
      fetchUserPreferences();
    } else {
      // Reset to light theme when not authenticated
      setMode('light');
    }
  }, [isUserAuthenticated]);

  const toggleTheme = async (newTheme) => {
    // Update local state
    setMode(newTheme);
    
    // Only save theme to backend for authenticated users
    if (localStorage.getItem('token')) {
      try {
        await api.patch('/settings/update_theme/', { theme: newTheme });
        console.log(`Theme preference saved for current user: ${newTheme}`);
      } catch (error) {
        console.error('Error saving theme preference to backend:', error);
      }
    }
  };

  // Expose toggleTheme function globally for components that can't access it via props
  useEffect(() => {
    window.toggleTheme = toggleTheme;
    return () => {
      delete window.toggleTheme;
    };
  }, [toggleTheme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout toggleTheme={toggleTheme} currentTheme={mode} />
                  </PrivateRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="iot-devices" element={<IoTDevices />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
