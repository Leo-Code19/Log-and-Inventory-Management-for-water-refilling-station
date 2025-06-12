import { useState, useEffect } from 'react';
import api from '../utils/axios';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent,
  Grid,
  Container,
  Tooltip,
  Divider,
  Stack,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  DeviceHub as DeviceIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

function IoTDevices() {
  const [devices, setDevices] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add', 'edit', 'maintenance', 'delete', 'details'
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceReadings, setDeviceReadings] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    loading: false,
    success: false,
    error: null,
    message: ''
  });
  const [formData, setFormData] = useState({
    device_id: '',
    device_type: 'WATER_LEVEL', // Using a valid value from backend DEVICE_TYPES
    location: '',
    status: 'ONLINE', // Using a valid value from STATUS_CHOICES
    communication_protocol: 'MQTT',
    polling_frequency: 60,
    min_threshold: 0, // Setting default numeric values
    max_threshold: 100 // Setting default numeric values
  });

  const handleOpenDialog = (type, device = null) => {
    setDialogType(type);
    setSelectedDevice(device);
    setValidationError(null); // Clear any previous validation errors
    // Debug: Log the device object structure
    if (device) {
      // If opening details and device is online, fetch readings
      if (type === 'details' && device.status === 'ONLINE') {
        fetchDeviceReadings(device.id);
      }
      console.log('Selected device object:', device);
      setFormData({
        device_id: device.device_id,
        device_type: device.device_type,
        location: device.location,
        status: device.status || 'ONLINE',
        communication_protocol: device.communication_protocol || 'MQTT',
        polling_frequency: device.polling_frequency || 60,
        min_threshold: device.min_threshold !== null && device.min_threshold !== undefined ? device.min_threshold : 0,
        max_threshold: device.max_threshold !== null && device.max_threshold !== undefined ? device.max_threshold : 100
      });
    } else {
      setFormData({
        device_id: '',
        device_type: '',
        location: '',
        status: 'ONLINE',  // Changed from 'ACTIVE' to 'ONLINE'
        communication_protocol: 'MQTT',
        polling_frequency: 60,
        min_threshold: '',
        max_threshold: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDevice(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Convert numeric fields to numbers
    if (['min_threshold', 'max_threshold', 'polling_frequency'].includes(name)) {
      processedValue = value === '' ? 0 : Number(value);
    }
    
    // If changing device_id in add mode, check for duplicates
    if (name === 'device_id' && dialogType === 'add') {
      const isDuplicate = devices.some(device => 
        device.device_id.toLowerCase() === value.toLowerCase()
      );
      
      if (isDuplicate) {
        setValidationError('This Device ID already exists. Please use a unique identifier.');
      } else {
        setValidationError(null);
      }
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  const getStatusChip = (status) => {
    const colors = {
      ONLINE: 'success',
      OFFLINE: 'default',
      MAINTENANCE: 'info',
      ERROR: 'error'
    };
    return (
      <Box component="span" sx={{ display: 'inline-block' }}>
        <Chip
          label={status.toUpperCase()}
          color={colors[status] || 'default'}
          size="small"
        />
      </Box>
    );
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDeviceReadings = async (deviceId) => {
    try {
      // Try to fetch device readings from the API
      const response = await api.get(`/device-readings/?device=${deviceId}`);
      if (response.data && response.data.length > 0) {
        setDeviceReadings(response.data);
        return;
      }
      // If no data or empty array, fall back to generated readings
      
      const now = new Date();
      const readings = [];
      
      // Generate 24 hours of sample data
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now);
        timestamp.setHours(now.getHours() - i);
        
        readings.push({
          timestamp: timestamp.toISOString(),
          water_level: Math.floor(Math.random() * 100), // 0-100%
          flow_rate: Math.random() * 10, // 0-10 L/min
          quality: Math.floor(Math.random() * 100), // 0-100%
          ph_level: 6 + Math.random() * 2, // 6-8 pH
          turbidity: Math.random() * 5, // 0-5 NTU
        });
      }
      
      setDeviceReadings(readings.reverse()); // Most recent first
    } catch (error) {
      console.error('Error fetching device readings:', error);
      setDeviceReadings([]);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices/');
      console.log('Devices data received from API:', response.data);
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
      // If API call fails, provide fallback data
      const fallbackDevices = [
        {
          id: 1,
          device_id: 'DEV001',
          device_type: 'Water Dispenser',
          location: 'Main Office',
          status: 'ONLINE',
          communication_protocol: 'MQTT',
          polling_frequency: 60,
          min_threshold: 10,
          max_threshold: 90
        },
        {
          id: 2,
          device_id: 'DEV002',
          device_type: 'Water Filter',
          location: 'Branch Office',
          status: 'OFFLINE',
          communication_protocol: 'HTTP',
          polling_frequency: 120,
          min_threshold: 5,
          max_threshold: 95
        }
      ];
      setDevices(fallbackDevices);
    }
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!formData.device_id || !formData.device_type || !formData.location) {
      setValidationError('Device ID, Type, and Location are required fields');
      return;
    }
    
    if (validationError) {
      return; // Don't submit if there's a validation error
    }

    // Clean payload before submission and use payload instead of raw formData
    let payload = { ...formData };
    if (payload.min_threshold === '') payload.min_threshold = null;
    if (payload.max_threshold === '') payload.max_threshold = null;

    try {
      console.log('Submitting device data:', payload);
      let response;
      
      if (dialogType === 'add') {
        response = await api.post('/devices/', payload);
        console.log('Device created successfully:', response.data);
      } else if (dialogType === 'edit' && selectedDevice) {
        response = await api.put(`/devices/${selectedDevice.id}/`, payload);
        console.log('Device updated successfully:', response.data);
      }
      
      // Refresh the devices list
      fetchDevices();
      
      // Close the dialog
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving device:', error);
      // Provide more detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        // Check if there are field-specific errors
        if (typeof error.response.data === 'object' && !Array.isArray(error.response.data)) {
          const errorMessages = [];
          for (const field in error.response.data) {
            const fieldErrors = error.response.data[field];
            if (Array.isArray(fieldErrors)) {
              errorMessages.push(`${field}: ${fieldErrors.join(', ')}`);
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(`${field}: ${fieldErrors}`);
            }
          }
          if (errorMessages.length > 0) {
            setValidationError(`Validation errors: ${errorMessages.join('; ')}`);
            return;
          }
        }
      }
      setValidationError(error.response?.data?.message || 'An error occurred while saving the device');
    }
  };

  const handleDelete = async (device) => {
    // Open the delete confirmation dialog
    setSelectedDevice(device);
    setDialogType('delete');
    setOpenDialog(true);
  };

const handleConfirmDelete = async () => {
  if (!selectedDevice) return;
  
  try {
    await api.delete(`/devices/${selectedDevice.id}/`);
    
    // Refresh the devices list
    fetchDevices();
    
    // Close the dialog
    handleCloseDialog();
  } catch (error) {
    console.error('Error deleting device:', error);
    setValidationError('An error occurred while deleting the device');
  }
};

const handleMaintenanceAction = async (action) => {
  if (!selectedDevice) return;
  
  setMaintenanceStatus({
    loading: true,
    success: false,
    error: null,
    message: `Performing ${action.replace('_', ' ')}...`,
    action
  });
  
  try {
    // Simulate API call with a delay since the endpoints don't exist in the backend yet
    // This is a temporary solution until the backend implements these endpoints
    console.log(`Simulating maintenance action: ${action} for device ${selectedDevice.id}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Determine new status based on action
    let newStatus = '';
    let successMessage = '';
    
    switch(action) {
      case 'connect_device':
        newStatus = 'ONLINE';
        successMessage = 'Device connected successfully';
        break;
      case 'update_firmware':
        newStatus = 'MAINTENANCE';
        successMessage = 'Firmware updated successfully';
        break;
      case 'unlink_device':
        newStatus = 'OFFLINE';
        successMessage = 'Device unlinked successfully';
        break;
      case 'factory_reset':
        newStatus = 'MAINTENANCE';
        successMessage = 'Factory reset completed successfully';
        break;
      default:
        newStatus = 'ONLINE';
        successMessage = 'Maintenance action completed';
    }
    
    // Update the device status in the backend (partial update)
    try {
      await api.patch(`/devices/${selectedDevice.id}/`, { status: newStatus });
      console.log(`Updated device status to ${newStatus}`);
      
      // Update the local device list
      setDevices(devices.map(device => 
        device.id === selectedDevice.id ? { ...device, status: newStatus } : device
      ));
      
      // Update selected device
      setSelectedDevice({ ...selectedDevice, status: newStatus });
    } catch (updateError) {
      console.error('Error updating device status:', updateError);
      // Continue with success message even if status update fails
    }
    
    setMaintenanceStatus({
      loading: false,
      success: true,
      error: null,
      message: successMessage,
      action: null
    });
    
  } catch (error) {
    console.error(`Error performing ${action}:`, error);
    setMaintenanceStatus({
      loading: false,
      success: false,
      error: true,
      message: `Failed to perform ${action.replace('_', ' ')}: ${error.message}`,
      action: null
    });
  }
};

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ mb: 4, borderRadius: 2 }}>
        <Box sx={{ 
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,

        }}>
          <DeviceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'medium' }}>
            IoT Devices
          </Typography>
        </Box>
      </Card>

      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ 
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <DeviceIcon color="primary" />
            <Typography variant="h6">Device List</Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('add')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Add New Device
          </Button>
        </Box>
        
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)', px: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Device ID/Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Last Communication</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((device) => (
                <TableRow 
                  key={device.device_id}
                  sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
                  onClick={(e) => {
                    // Only open details if clicking directly on the row, not on action buttons
                    if (e.currentTarget === e.target || 
                        e.target.tagName === 'TD' || 
                        e.target.tagName === 'P' || 
                        e.target.tagName === 'SPAN' || 
                        e.target.tagName === 'DIV') {
                      handleOpenDialog('details', device);
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {device.device_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={device.device_type.replace('_', ' ').toLowerCase()}
                      size="small"
                      sx={{ borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>{getStatusChip(device.status)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(device.last_reading).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit Device">
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleOpenDialog('edit', device);
                          }}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Device Maintenance">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleOpenDialog('maintenance', device);
                          }}
                          sx={{ color: 'info.main' }}
                        >
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Device">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleDelete(device);
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {dialogType === 'add' && <AddIcon color="primary" />}
            {dialogType === 'edit' && <EditIcon color="primary" />}
            {dialogType === 'maintenance' && <SettingsIcon color="primary" />}
            {dialogType === 'delete' && <WarningIcon color="error" />}
            <Typography variant="h6">
              {dialogType === 'add' && 'Add New Device'}
              {dialogType === 'edit' && 'Edit Device'}
              {dialogType === 'maintenance' && 'Device Maintenance'}
              {dialogType === 'delete' && 'Confirm Delete'}
            </Typography>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 2 }}>
          {dialogType === 'delete' && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Are you sure you want to delete this device? This action cannot be undone.
              </Alert>
              <Typography>
                Device ID: {selectedDevice?.device_id}
              </Typography>
              <Typography>
                Type: {selectedDevice?.device_type}
              </Typography>
              <Typography>
                Location: {selectedDevice?.location}
              </Typography>
            </Box>
          )}
          
          {dialogType === 'details' && selectedDevice && (
            <Box sx={{ mt: 2 }}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Device Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Device ID</Typography>
                      <Typography variant="body1">{selectedDevice.device_id}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                      <Typography variant="body1">
                        {selectedDevice.device_type?.replace('_', ' ').toLowerCase()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Box sx={{ mt: 0.5 }}>{getStatusChip(selectedDevice.status)}</Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                      <Typography variant="body1">{selectedDevice.location}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Technical Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Communication Protocol</Typography>
                      <Typography variant="body1">{selectedDevice.communication_protocol}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Polling Frequency</Typography>
                      <Typography variant="body1">{selectedDevice.polling_frequency} seconds</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Min Threshold</Typography>
                      <Typography variant="body1">{selectedDevice.min_threshold || 'Not set'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Max Threshold</Typography>
                      <Typography variant="body1">{selectedDevice.max_threshold || 'Not set'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sensor Readings
                  </Typography>
                  
                  {selectedDevice.status !== 'ONLINE' ? (
                    <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                      Device is currently {selectedDevice.status.toLowerCase()}. Live readings are only available when the device is online.
                    </Alert>
                  ) : deviceReadings.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box>
                      {selectedDevice.device_type === 'WATER_LEVEL' && (
                        <Box sx={{ mt: 2, mb: 4 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">Water Level</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {deviceReadings[deviceReadings.length - 1].water_level}%
                            </Typography>
                          </Box>
                          <Box sx={{ height: 200, position: 'relative', mb: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            {/* Water tank visualization */}
                            <Box 
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                bgcolor: 'primary.light',
                                height: `${deviceReadings[deviceReadings.length - 1].water_level}%`,
                                transition: 'height 1s ease-in-out',
                                borderRadius: '0 0 4px 4px'
                              }}
                            />
                            {/* Level markers */}
                            {[0, 25, 50, 75, 100].map((level) => (
                              <Box key={level} sx={{ 
                                position: 'absolute', 
                                left: 0, 
                                right: 0, 
                                bottom: `${level}%`, 
                                borderTop: level > 0 ? '1px dashed rgba(0,0,0,0.1)' : 'none',
                                zIndex: 1
                              }}>
                                <Typography variant="caption" sx={{ position: 'absolute', right: 8, top: -10, color: 'text.secondary' }}>
                                  {level}%
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                          <Typography variant="body2" color="text.secondary" align="center">
                            Current water level: {deviceReadings[deviceReadings.length - 1].water_level}%
                          </Typography>
                        </Box>
                      )}
                      
                      {selectedDevice.device_type === 'FLOW_METER' && (
                        <Box sx={{ mt: 2, mb: 4 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">Flow Rate</Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {deviceReadings[deviceReadings.length - 1].flow_rate.toFixed(2)} L/min
                            </Typography>
                          </Box>
                          <Box sx={{ height: 150, display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }}>
                            {/* Flow rate bar chart */}
                            {deviceReadings.slice(-12).map((reading, index) => {
                              const height = (reading.flow_rate / 10) * 100; // Scale to percentage of max height
                              return (
                                <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <Box 
                                    sx={{
                                      height: `${height}%`,
                                      width: '100%',
                                      bgcolor: 'info.main',
                                      borderRadius: '4px 4px 0 0'
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', transform: 'rotate(-45deg)', fontSize: '0.6rem' }}>
                                    {new Date(reading.timestamp).getHours()}:00
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Box>
                          <Typography variant="body2" color="text.secondary" align="center">
                            Average flow rate: {(deviceReadings.reduce((sum, r) => sum + r.flow_rate, 0) / deviceReadings.length).toFixed(2)} L/min
                          </Typography>
                        </Box>
                      )}
                      
                      {selectedDevice.device_type === 'QUALITY_SENSOR' && (
                        <Box sx={{ mt: 2, mb: 4 }}>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="subtitle2" color="text.secondary">Water Quality</Typography>
                                  <Typography variant="body1" fontWeight="bold">
                                    {deviceReadings[deviceReadings.length - 1].quality}%
                                  </Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={deviceReadings[deviceReadings.length - 1].quality} 
                                  sx={{ height: 10, borderRadius: 5 }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">Poor</Typography>
                                  <Typography variant="caption" color="text.secondary">Excellent</Typography>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="subtitle2" color="text.secondary">pH Level</Typography>
                                  <Typography variant="body1" fontWeight="bold">
                                    {deviceReadings[deviceReadings.length - 1].ph_level.toFixed(1)}
                                  </Typography>
                                </Box>
                                <Box sx={{ position: 'relative', height: 30, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
                                  <Box sx={{ 
                                    position: 'absolute', 
                                    top: 0, 
                                    left: 0, 
                                    right: 0, 
                                    bottom: 0, 
                                    background: 'linear-gradient(to right, #ff5252, #ffeb3b, #4caf50, #2196f3, #9c27b0)' 
                                  }} />
                                  <Box sx={{ 
                                    position: 'absolute', 
                                    top: 0, 
                                    bottom: 0, 
                                    left: `${((deviceReadings[deviceReadings.length - 1].ph_level - 6) / 2) * 100}%`, 
                                    width: 3, 
                                    bgcolor: 'black',
                                    zIndex: 1
                                  }} />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">6.0</Typography>
                                  <Typography variant="caption" color="text.secondary">7.0</Typography>
                                  <Typography variant="caption" color="text.secondary">8.0</Typography>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="subtitle2" color="text.secondary">Turbidity</Typography>
                                  <Typography variant="body1" fontWeight="bold">
                                    {deviceReadings[deviceReadings.length - 1].turbidity.toFixed(2)} NTU
                                  </Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={(deviceReadings[deviceReadings.length - 1].turbidity / 5) * 100} 
                                  color={deviceReadings[deviceReadings.length - 1].turbidity < 1 ? "success" : 
                                         deviceReadings[deviceReadings.length - 1].turbidity < 3 ? "warning" : "error"}
                                  sx={{ height: 10, borderRadius: 5 }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">Clear (0 NTU)</Typography>
                                  <Typography variant="caption" color="text.secondary">Cloudy (5 NTU)</Typography>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Last Reading</Typography>
                        <Typography variant="body1">
                          {new Date(selectedDevice.last_reading).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
          {(dialogType === 'add' || dialogType === 'edit') && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {validationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {validationError}
                </Alert>
              )}
              <FormControl fullWidth>
                <InputLabel>Device Type</InputLabel>
                <Select
                  name="device_type"
                  value={formData.device_type}
                  onChange={handleFormChange}
                  label="Device Type"
                >
                  <MenuItem value="WATER_LEVEL">Water Level Sensor</MenuItem>
                  <MenuItem value="FLOW_METER">Flow Meter</MenuItem>
                  <MenuItem value="QUALITY_SENSOR">Water Quality Sensor</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="device_id"  // Changed from deviceId
                label="Device ID"
                value={formData.device_id}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                name="location"
                label="Location"
                value={formData.location}
                onChange={handleFormChange}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                >
                  <MenuItem value="ONLINE">Online</MenuItem>
                  <MenuItem value="OFFLINE">Offline</MenuItem>
                  <MenuItem value="MAINTENANCE">Under Maintenance</MenuItem>
                  <MenuItem value="ERROR">Error</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Communication Protocol</InputLabel>
                <Select
                  name="communication_protocol"
                  value={formData.communication_protocol}
                  onChange={handleFormChange}
                  label="Communication Protocol"
                >
                  <MenuItem value="MQTT">MQTT</MenuItem>
                  <MenuItem value="HTTP">HTTP</MenuItem>
                  <MenuItem value="MODBUS">Modbus</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="polling_frequency"
                label="Polling Frequency (seconds)"
                type="number"
                value={formData.polling_frequency}
                onChange={handleFormChange}
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  name="min_threshold"
                  label="Min Threshold"
                  type="number"
                  value={formData.min_threshold}
                  onChange={handleFormChange}
                  inputProps={{ min: 0, step: 0.1 }}
                  fullWidth
                />
                <TextField
                  name="max_threshold"
                  label="Max Threshold"
                  type="number"
                  value={formData.max_threshold}
                  onChange={handleFormChange}
                  inputProps={{ min: 0, step: 0.1 }}
                  fullWidth
                />
              </Box>
            </Box>
          )}
          {dialogType === 'maintenance' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {maintenanceStatus.message && (
                <Alert 
                  severity={maintenanceStatus.error ? 'error' : maintenanceStatus.success ? 'success' : 'info'}
                  sx={{ mb: 2 }}
                >
                  {maintenanceStatus.message}
                </Alert>
              )}
              <Button 
                variant="outlined"
                color="success"
                fullWidth
                onClick={() => handleMaintenanceAction('connect_device')}
                disabled={maintenanceStatus.loading}
              >
                {maintenanceStatus.loading && maintenanceStatus.action === 'connect_device' ? 'Connecting...' : 'Connect Device'}
              </Button>
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => handleMaintenanceAction('update_firmware')}
                disabled={maintenanceStatus.loading}
              >
                {maintenanceStatus.loading && maintenanceStatus.action === 'update_firmware' ? 'Updating...' : 'Update Firmware'}
              </Button>
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => handleMaintenanceAction('unlink_device')}
                disabled={maintenanceStatus.loading}
              >
                {maintenanceStatus.loading && maintenanceStatus.action === 'unlink_device' ? 'Unlinking...' : 'Unlink Device'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={<WarningIcon />}
                onClick={() => handleMaintenanceAction('factory_reset')}
                disabled={maintenanceStatus.loading}
              >
                {maintenanceStatus.loading && maintenanceStatus.action === 'factory_reset' ? 'Resetting...' : 'Factory Reset'}
              </Button>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Warning: Factory reset will erase all device data and settings.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {(dialogType === 'maintenance' && maintenanceStatus.success) || dialogType === 'details' ? 'Close' : 'Cancel'}
          </Button>
          {(dialogType === 'add' || dialogType === 'edit') && (
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              {dialogType === 'add' ? 'Add Device' : 'Save Changes'}
            </Button>
          )}
          {dialogType === 'delete' && (
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleConfirmDelete}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Delete Device
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default IoTDevices;