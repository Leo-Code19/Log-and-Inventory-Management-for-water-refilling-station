import { useEffect, useCallback, memo } from 'react';
import {
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import api from '../../utils/axios';

const SystemPreferences = memo(function SystemPreferences({ preferences, setPreferences, setMessage, saving, setSaving, currentUser }) {
  const theme = useTheme();

  // Load user preferences only when currentUser changes
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!currentUser) {
        console.log('No current user available, skipping preference load');
        return;
      }
      try {
        const response = await api.get('/settings/');
        const userPrefs = response.data.system;
        console.log('Loaded user-specific preferences:', userPrefs);
        setPreferences(prev => ({
          ...prev,
          theme: userPrefs.theme || prev.theme || 'light',
          language: userPrefs.language || prev.language || 'en',
        }));
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };
    if (currentUser) loadUserPreferences();
  }, [currentUser, setPreferences]);

  // Sync theme select when Layout toggle triggers a themeChange event
  useEffect(() => {
    const handleExternalThemeChange = (e) => {
      setPreferences(prev => ({
        ...prev,
        theme: e.detail.theme
      }));
    };
    window.addEventListener('themeChange', handleExternalThemeChange);
    return () => window.removeEventListener('themeChange', handleExternalThemeChange);
  }, [setPreferences]);

  // Memoize the savePreferences function to prevent unnecessary re-creation
  const savePreferences = useCallback(async (preferenceData) => {
    console.log('Saving preferences for user:', currentUser?.username, preferenceData);
    try {
      const response = await api.patch('/settings/update_theme/', {
        theme: preferenceData.theme
      });
      console.log('User preferences updated successfully for user:', currentUser?.username, response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error saving user preferences:', error.response || error);
      throw error;
    }
  }, [currentUser]);

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const preferenceData = {
        theme: preferences.theme,
        language: preferences.language,
      };
      console.log('Attempting to save preferences:', preferenceData);
      await savePreferences(preferenceData);
      
      // Dispatch theme change event to update the app's theme
      const themeChangeEvent = new CustomEvent('themeChange', { 
        detail: { theme: preferences.theme } 
      });
      window.dispatchEvent(themeChangeEvent);
      
      // Update the app's theme directly through the toggleTheme function in App.js
      if (window.toggleTheme && typeof window.toggleTheme === 'function') {
        window.toggleTheme(preferences.theme);
      }
      
      setMessage({ type: 'success', text: 'Your preferences have been updated successfully' });
    } catch (error) {
      console.error('Error in handleSavePreferences:', error);
      setMessage({ type: 'error', text: 'Failed to update your preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (event) => {
    const { name, value } = event.target;
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Common styles for form controls to reduce duplication
  const formControlStyles = {
    borderRadius: 2,
    color: theme.palette.text.primary,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
    }
  };

  return (
    <Card elevation={3} sx={{ 
      borderRadius: 2,
      bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
      color: theme.palette.text.primary
    }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={3}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" color="text.primary">System Preferences</Typography>
        </Stack>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: theme.palette.text.primary }}>Theme</InputLabel>
            <Select
              value={preferences.theme || 'light'}
              name="theme"
              onChange={handlePreferenceChange}
              label="Theme"
              sx={formControlStyles}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: theme.palette.text.primary }}>Language</InputLabel>
            <Select
              value={preferences.language || 'en'}
              name="language"
              onChange={handlePreferenceChange}
              label="Language"
              sx={formControlStyles}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="tl">Tagalog</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleSavePreferences}
            disabled={saving}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
});

export default SystemPreferences;