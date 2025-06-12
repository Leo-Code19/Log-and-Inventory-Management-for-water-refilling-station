import {
  Typography,
  TextField,
  Card,
  CardContent,
  Stack,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import { Business, Refresh, Info } from '@mui/icons-material';
import api from '../../utils/axios';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function StationInformation() {
  const { currentUser } = useAuth();
  const [stationData, setStationData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState('initializing');

  // Fetch station info from core StationInformation endpoint
  const fetchStationInfo = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resp = await api.get(`/station-info/?t=${Date.now()}`);
      let info = resp.data;
      if (Array.isArray(info)) info = info[0];
      setStationData({
        name: info.station_name || currentUser.username,
        address: info.address,
        contactNumber: info.contact_number
      });
      setDataSource('station-info');
    } catch (err) {
      console.error('Error fetching station-info:', err);
      setError('Failed to load station information');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchStationInfo();
  }, [currentUser]);

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchStationInfo();
  };

  // No polling: only fetch once on mount and on manual refresh

  return (
    <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Business color="primary" />
            <Typography variant="h6">Station Information</Typography>
          </Stack>
          <Tooltip title="Refresh station information">
            <span>  {/* Wrapper span to fix the disabled button in Tooltip issue */}
              <IconButton onClick={handleRefresh} disabled={loading || refreshing} color="primary">
                <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Station Name"
              name="name"
              value={stationData.name || 'Loading...'}
              disabled
              variant="outlined"
              sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& .MuiInputBase-input': { fontWeight: 'medium' }
              }}
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={stationData.address || 'Loading...'}
              disabled
              variant="outlined"
              sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& .MuiInputBase-input': { fontWeight: 'medium' }
              }}
            />
            <TextField
              fullWidth
              label="Contact Number"
              name="contactNumber"
              value={stationData.contactNumber || 'Loading...'}
              disabled
              variant="outlined"
              sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& .MuiInputBase-input': { fontWeight: 'medium' }
              }}
            />
            <Alert
              severity="info"
              sx={{ borderRadius: 2, mt: 2 }}
            >
              Station information can only be modified through the admin panel
            </Alert>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Info fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    Data source: {dataSource === 'initializing' ? 'Loading...' : dataSource}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {lastUpdated.toLocaleString()}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default StationInformation;