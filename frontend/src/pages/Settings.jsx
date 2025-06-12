import { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Alert, CircularProgress, Container, Paper, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';

// Import components
import UserManagement from '../components/settings/UserManagement';
import StationInformation from '../components/settings/StationInformation';
import NotificationSettings from '../components/settings/NotificationSettings';
import SystemPreferences from '../components/settings/SystemPreferences';

function Settings() {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false); // Start with loading false
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Initialize all user-specific data with default values
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [stationData, setStationData] = useState({
    name: "Cleaar Oasis Purified Water Drinking",
    address: "street 2 mandaluyong city",
    contactNumber: "09192555227"
  });

  const [notifications, setNotifications] = useState({
    lowInventory: false,
    refillSchedule: false,
    criticalErrors: false
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
  });

  // Sync preferences from AuthContext on load
  useEffect(() => {
    if (user && user.settings && user.settings.system) {
      setPreferences({
        theme: user.settings.system.theme,
        language: user.settings.system.language,
      });
    }
  }, [user, setPreferences]);

  // Initialize userData from the auth context
  useEffect(() => {
    if (user) {
      console.log('User detected, initializing userData');
      setUserData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        password: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]); // Only run when user changes
  
  // Define fetchSettings with useCallback to prevent recreation on each render
  const fetchSettings = useCallback(async () => {
    // Set loading state at the beginning
    setLoading(true);
    console.log('Fetching user-specific settings...');
    
    try {
      // 1. Try to fetch all user-specific settings from the main endpoint
      try {
        const settingsResponse = await api.get('/settings/user/');
        console.log('User-specific settings data:', settingsResponse.data);
        
        // Extract user-specific notification settings
        if (settingsResponse.data && settingsResponse.data.notifications) {
          const notificationData = settingsResponse.data.notifications;
          setNotifications({
            lowInventory: notificationData.low_inventory_alerts === true || notificationData.low_inventory_alerts === 'true',
            refillSchedule: notificationData.refill_schedule_reminders === true || notificationData.refill_schedule_reminders === 'true',
            criticalErrors: notificationData.critical_error_alerts === true || notificationData.critical_error_alerts === 'true'
          });
          console.log('Loaded user-specific notification settings');
        }
        
        // Extract user-specific system preferences
        if (settingsResponse.data && settingsResponse.data.system_preferences) {
          const preferencesData = settingsResponse.data.system_preferences;
          setPreferences({
            theme: preferencesData.theme || 'light',
            language: preferencesData.language || 'en'
          });
          console.log('Loaded user-specific system preferences');
        }
        
        // Extract user-specific station information if available
        if (settingsResponse.data && settingsResponse.data.station) {
          const stationInfo = {
            name: settingsResponse.data.station.station_name || 'Cleaar Oasis Purified Water Drinking',
            address: settingsResponse.data.station.address || 'street 2 mandaluyong city',
            contactNumber: settingsResponse.data.station.contact_number || '09192555227'
          };
          setStationData(stationInfo);
          console.log('Loaded station information');
        }
        
        // Mark settings as loaded
        setSettingsLoaded(true);
        setLoading(false);
        return;
      } catch (settingsError) {
        console.error('Error fetching from main settings endpoint, trying individual endpoints:', settingsError);
      }
      
      // 2. If the main endpoint failed, try individual endpoints for each setting type
      let fetchedAnyData = false;
      
      // 2.1 Get user profile data
      try {
        const userResponse = await api.get('/user/current/');
        const userData = userResponse.data;
        console.log('User profile data:', userData);
        
        if (userData) {
          setUserData(prevData => ({
            ...prevData,
            first_name: userData.first_name || prevData.first_name,
            last_name: userData.last_name || prevData.last_name,
            email: userData.email || prevData.email,
            username: userData.username || prevData.username
          }));
          fetchedAnyData = true;
        }
      } catch (userError) {
        console.error('Error fetching user profile data:', userError);
      }
      
      // 2.2 Get user-specific notification settings
      try {
        const notificationResponse = await api.get('/user/notifications/');
        const notificationData = notificationResponse.data;
        console.log('User notification settings:', notificationData);
        
        if (notificationData) {
          setNotifications({
            lowInventory: notificationData.low_inventory_alerts === true || notificationData.low_inventory_alerts === 'true',
            refillSchedule: notificationData.refill_schedule_reminders === true || notificationData.refill_schedule_reminders === 'true',
            criticalErrors: notificationData.critical_error_alerts === true || notificationData.critical_error_alerts === 'true'
          });
          fetchedAnyData = true;
        }
      } catch (notificationError) {
        console.error('Error fetching user notification settings:', notificationError);
        
        // Fallback to dashboard endpoint for notifications
        try {
          const dashboardResponse = await api.get('/dashboard/summary/');
          if (dashboardResponse.data && dashboardResponse.data.user_settings && 
              dashboardResponse.data.user_settings.notifications) {
            const notificationData = dashboardResponse.data.user_settings.notifications;
            setNotifications({
              lowInventory: notificationData.low_inventory_alerts === true || notificationData.low_inventory_alerts === 'true',
              refillSchedule: notificationData.refill_schedule_reminders === true || notificationData.refill_schedule_reminders === 'true',
              criticalErrors: notificationData.critical_error_alerts === true || notificationData.critical_error_alerts === 'true'
            });
            console.log('Loaded user notification settings from dashboard');
            fetchedAnyData = true;
          } else {
            // Use default notification settings if all fetches fail
            console.log('Using default notification settings');
          }
        } catch (dashboardError) {
          console.error('Error fetching dashboard for notifications:', dashboardError);
        }
      }
      
      // 2.3 Get user-specific system preferences
      try {
        const preferencesResponse = await api.get('/user/preferences/');
        const preferencesData = preferencesResponse.data;
        console.log('User system preferences:', preferencesData);
        
        if (preferencesData) {
          setPreferences({
            theme: preferencesData.theme || 'light',
            language: preferencesData.language || 'en'
          });
          fetchedAnyData = true;
        }
      } catch (preferencesError) {
        console.error('Error fetching user system preferences:', preferencesError);
        
        // Try dashboard as fallback for preferences
        try {
          const dashboardResponse = await api.get('/dashboard/summary/');
          if (dashboardResponse.data && dashboardResponse.data.user_preferences) {
            const prefs = dashboardResponse.data.user_preferences;
            setPreferences({
              theme: prefs.theme || 'light',
              language: prefs.language || 'en'
            });
            console.log('Loaded user preferences from dashboard');
            fetchedAnyData = true;
          } else {
            console.log('Using default preferences');
          }
        } catch (dashboardError) {
          console.error('Error fetching dashboard for preferences:', dashboardError);
        }
      }
      
      // 2.4 Get station information (might be shared but we'll handle it as user-specific)
      try {
        const stationResponse = await api.get('/station-info/');
        // support both list and single-object responses
        let stationPayload = stationResponse.data;
        let stationInfo;
        if (Array.isArray(stationPayload)) {
          if (stationPayload.length > 0) stationInfo = stationPayload[0];
          else throw new Error('No station-info returned');
        } else {
          stationInfo = stationPayload;
        }
        if (stationInfo) {
          setStationData({
            name: stationInfo.station_name || 'Cleaar Oasis Purified Water Drinking',
            address: stationInfo.address || 'street 2 mandaluyong city',
            contactNumber: stationInfo.contact_number || '09192555227'
          });
          console.log('Loaded station information');
          fetchedAnyData = true;
        }
      } catch (stationError) {
        console.error('Error fetching station information:', stationError);
      }
      
      // If we couldn't fetch any data, show a message
      if (!fetchedAnyData) {
        setMessage({ type: 'warning', text: 'Could not load all settings. Using defaults.' });
      } else {
        // Mark settings as loaded if we fetched any data
        setSettingsLoaded(true);
      }
      
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      setMessage({ type: 'error', text: 'Failed to load your settings' });
    } finally {
      // Always set loading to false at the end, regardless of success or failure
      setLoading(false);
    }
  }, []);
  
  // Separate effect for fetching settings
  useEffect(() => {
    // Only fetch settings if we have a user and haven't loaded settings yet
    if (user && !settingsLoaded) {
      console.log('Fetching settings for user', user.username);
      // Use setTimeout to break potential circular dependencies
      setTimeout(() => {
        fetchSettings();
      }, 0);
    }
  }, [user, settingsLoaded, fetchSettings]); // Include fetchSettings in dependencies
  
  // Debug logs
  useEffect(() => {
    console.log('Settings userData updated:', userData);
  }, [userData]);
  
  useEffect(() => {
    console.log('Loading state changed:', loading);
  }, [loading]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          pt: 2,
          px: { xs: 2, sm: 3 },
        }}
      >


      {message.text && (
        <Alert
          severity={message.type}
          sx={{
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': { fontSize: '1rem' },
            boxShadow: theme.shadows[2],
          }}
        >
          {message.text}
        </Alert>
      )}

      <Grid 
        container 
        spacing={3}
        component={motion.div}
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        <Grid 
          item 
          xs={12} 
          md={6}
          component={motion.div}
          variants={{
            hidden: { opacity: 0, x: -20 },
            show: { opacity: 1, x: 0 }
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              backgroundColor: 'background.paper',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <UserManagement
              setMessage={setMessage}
              saving={saving}
              setSaving={setSaving}
            />
          </Paper>
        </Grid>

        <Grid 
          item 
          xs={12} 
          md={6}
          component={motion.div}
          variants={{
            hidden: { opacity: 0, x: 20 },
            show: { opacity: 1, x: 0 }
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              backgroundColor: 'background.paper',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <StationInformation currentUser={user} />
          </Paper>
        </Grid>

        <Grid 
          item 
          xs={12} 
          md={6}
          component={motion.div}
          variants={{
            hidden: { opacity: 0, x: -20 },
            show: { opacity: 1, x: 0 }
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              backgroundColor: 'background.paper',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <NotificationSettings
              notifications={notifications}
              setNotifications={setNotifications}
              setMessage={setMessage}
              saving={saving}
              setSaving={setSaving}
              // Pass user context to ensure user-specific notifications
              currentUser={user}
            />
          </Paper>
        </Grid>

        <Grid 
          item 
          xs={12} 
          md={6}
          component={motion.div}
          variants={{
            hidden: { opacity: 0, x: 20 },
            show: { opacity: 1, x: 0 }
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 2,
              backgroundColor: 'background.paper',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <SystemPreferences
              preferences={preferences}
              setPreferences={setPreferences}
              setMessage={setMessage}
              saving={saving}
              setSaving={setSaving}
              // Pass user context to ensure user-specific preferences
              currentUser={user}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
    </Container>
  );
}

export default Settings;
