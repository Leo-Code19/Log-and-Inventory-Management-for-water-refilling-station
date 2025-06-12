import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import api from '../utils/axios';

export const usePreferences = () => {
  const theme = useTheme();
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      // Try to get user settings
      const response = await api.get('/settings/');
      if (response.data && response.data.system_preferences) {
        setPreferences(response.data.system_preferences);
        console.log('Loaded preferences from settings endpoint:', response.data.system_preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      // If we can't get preferences, try to get current user
      try {
        const userResponse = await api.get('/user/current/');
        console.log('User data:', userResponse.data);
      } catch (userError) {
        console.error('Error fetching user data:', userError);
      }
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      console.log('Updating preferences with:', newPreferences);
      const response = await api.put('/settings/update_profile/', {
        system_preferences: newPreferences
      });
      console.log('Update response:', response.data);
      setPreferences(newPreferences);
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  };

  return {
    preferences,
    updatePreferences,
  };
};