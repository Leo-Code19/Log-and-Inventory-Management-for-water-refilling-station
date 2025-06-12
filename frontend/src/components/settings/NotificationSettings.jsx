import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  FormControlLabel,
  Switch,
  Typography
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useSocket } from '../../contexts/SocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../utils/axios';

function NotificationSettings({ setMessage, saving, setSaving, currentUser }) {
  const socket = useSocket();
  const { showNotification } = useNotification();
  // Local state to track if we're currently saving to avoid race conditions
  const [isSaving, setIsSaving] = useState(false);
  
  // Track if this component has made changes that need to be synced
  const [localChanges, setLocalChanges] = useState(false);
  
  // State for notification settings
  const [notifications, setNotifications] = useState({
    lowInventory: false,
    refillSchedule: false,
    criticalErrors: false
  });
  
  // Force sync with parent component's notifications state when it changes
  // but only if we're not currently saving changes ourselves
  useEffect(() => {
    console.log('Parent component notification state changed:', notifications);
    if (!isSaving) {
      // Clear the local changes flag since we're syncing with parent
      setLocalChanges(false);
    }
  }, [notifications, isSaving]);
  
  // We'll let the parent component handle fetching settings
  // This component will focus only on handling user interactions and saving changes

  useEffect(() => {
    if (!socket) return;

    // Listen for IoT events
    socket.on('lowWaterLevel', (data) => {
      if (notifications.lowInventory) {
        showNotification(`Low water level detected in tank ${data.tankId}: ${data.level}%`, 'warning');
      }
    });

    socket.on('refillReminder', (data) => {
      if (notifications.refillSchedule) {
        showNotification(`Refill reminder: Tank ${data.tankId} is scheduled for refill`, 'info');
      }
    });

    socket.on('criticalError', (data) => {
      if (notifications.criticalErrors) {
        showNotification(`Critical error in device ${data.deviceId}: ${data.error}`, 'error');
      }
    });

    return () => {
      socket.off('lowWaterLevel');
      socket.off('refillReminder');
      socket.off('criticalError');
    };
  }, [socket, notifications]);

  const saveNotifications = async () => {
    try {
      const res = await api.get('/settings/notifications/');
      if (res.data) {
        setNotifications({
          lowInventory: res.data.low_inventory_alerts,
          refillSchedule: res.data.refill_schedule_reminders,
          criticalErrors: res.data.critical_error_alerts
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  useEffect(() => {
    saveNotifications();
  }, []);

  const handleNotificationChange = (name) => async (e) => {
    setSaving(true);
    const newValue = e.target.checked;
    try {
      const payload = {
        low_inventory_alerts: name === 'lowInventory' ? newValue : notifications.lowInventory,
        refill_schedule_reminders: name === 'refillSchedule' ? newValue : notifications.refillSchedule,
        critical_error_alerts: name === 'criticalErrors' ? newValue : notifications.criticalErrors
      };
      const patchRes = await api.patch('/settings/notifications/', payload);
      if (patchRes.status === 200) {
        setNotifications({
          lowInventory: patchRes.data.low_inventory_alerts,
          refillSchedule: patchRes.data.refill_schedule_reminders,
          criticalErrors: patchRes.data.critical_error_alerts
        });
        showNotification(`${name} notifications ${newValue ? 'enabled' : 'disabled'}`, 'success');
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showNotification('Failed to update notification settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card elevation={3} sx={{ borderRadius: 2, p: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={3}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6">Notification Settings</Typography>
        </Stack>

        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={notifications.lowInventory}
                onChange={handleNotificationChange('lowInventory')}
                disabled={saving}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>Low Inventory Alerts</Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={notifications.refillSchedule}
                onChange={handleNotificationChange('refillSchedule')}
                disabled={saving}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>Refill Schedule Reminders</Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={notifications.criticalErrors}
                onChange={handleNotificationChange('criticalErrors')}
                disabled={saving}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>Critical Error Alerts</Typography>
              </Box>
            }
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;