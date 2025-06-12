import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Chip, CircularProgress } from '@mui/material';
import api from '../utils/axios';
import { DeviceHub as DeviceIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon, ErrorOutline as ErrorIcon } from '@mui/icons-material';

// Import dashboard components
import DashboardOverview from '../components/dashboard/DashboardOverview';
import QuickActions from '../components/dashboard/QuickActions';
import DeviceStatus from '../components/dashboard/DeviceStatus';
import OrderStatistics from '../components/dashboard/OrderStatistics';
import RecentOrders from '../components/dashboard/RecentOrders';
import ChartsAndGraphs from '../components/dashboard/ChartsAndGraphs';

// Import shared styles
import { getStatusColor } from '../components/dashboard/DashboardStyles';

// Add keyframes for animations
const styleTag = document.createElement('style');
styleTag.textContent = `
@keyframes rise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0.7;
  }
  100% {
    transform: translateY(-100px) scale(0.3);
    opacity: 0;
  }
}

@keyframes flowAnimation {
  0% {
    transform: translate(-50%, -50%);
    left: -10%;
  }
  100% {
    transform: translate(-50%, -50%);
    left: 110%;
  }
}
`;
document.head.appendChild(styleTag);

function Dashboard() {
  // State for dashboard statistics
  const [stats, setStats] = useState({
    pending_orders: 0,
    processing_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
    total_orders: 0,
    total_revenue: 0,
    today_revenue: 0,
    this_week_revenue: 0,
    total_devices: 0,
    this_month_revenue: 0,
    this_year_revenue: 0,
    all_time_revenue: 0,
    today_orders: 0,
    this_week_orders: 0,
    this_month_orders: 0,
    this_year_orders: 0,
    all_time_orders: 0,
    time_range: 'week'
  });
  
  
  // State for recent orders
  const [recentOrders, setRecentOrders] = useState([]);
  
  // State for devices
  const [devices, setDevices] = useState([]);
  const [deviceReadings, setDeviceReadings] = useState({});
  const [loadingDevices, setLoadingDevices] = useState(false);
  
  // Fetch dashboard statistics
  const fetchDashboardStats = async (range = 'week') => {
    try {
      const response = await api.get(`/dashboard/stats/?timeRange=${range}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Fetch recent orders
  const fetchRecentOrders = async () => {
    try {
      const response = await api.get('/dashboard/recent-orders/');
      setRecentOrders(response.data);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };
  
  // Fetch stats, recent orders, and devices on component mount
  useEffect(() => {
    fetchDashboardStats();
    fetchRecentOrders();
    fetchDevices();
  }, []);
  
  // Fetch all IoT devices and their sensor readings
  const fetchDevices = async () => {
    try {
      setLoadingDevices(true);
      
      // Fetch all devices from the IoT Devices page
      const response = await api.get('/devices/');
      setDevices(response.data);
      
      // Generate readings for all devices, not just online ones
      // This ensures we show all devices in the Device Status section
      const allDevices = response.data;
      const readings = {};
      
      // Ensure we have at least one device of each type for demo purposes
      const requiredDeviceTypes = [
        'WATER_LEVEL_SENSOR',
        'FLOW_METER',
        'WATER_QUALITY_SENSOR',
        'PRESSURE_SENSOR',
        'TEMPERATURE_SENSOR'
      ];
      
      // Check if we have all required device types and they're online
      const deviceTypeMap = {};
      allDevices.forEach(device => {
        if (device.status === 'ONLINE') {
          deviceTypeMap[device.device_type] = true;
        }
      });
      
      // For each location, generate readings for online devices
      const locationMap = {};
      allDevices.forEach(device => {
        if (!locationMap[device.location]) {
          locationMap[device.location] = {
            devices: [],
            deviceTypes: {}
          };
        }
        
        locationMap[device.location].devices.push(device);
        
        if (device.status === 'ONLINE') {
          locationMap[device.location].deviceTypes[device.device_type] = true;
        }
      });
      
      // Generate readings for each device
      allDevices.forEach(device => {
        // Only generate readings for online devices
        if (device.status === 'ONLINE') {
          const deviceId = device.id;
          
          // Generate different readings based on device type
          switch (device.device_type) {
            case 'WATER_LEVEL_SENSOR':
              readings[deviceId] = {
                water_level: Math.floor(Math.random() * 100), // 0-100%
                last_reading: new Date().toISOString()
              };
              break;
            case 'FLOW_METER':
              readings[deviceId] = {
                flow_rate: (Math.random() * 10).toFixed(2), // 0-10 L/min
                total_flow: (Math.random() * 1000).toFixed(2), // 0-1000 L
                last_reading: new Date().toISOString()
              };
              break;
            case 'WATER_QUALITY_SENSOR':
              readings[deviceId] = {
                ph: (Math.random() * 4 + 5).toFixed(1), // pH 5-9
                tds: Math.floor(Math.random() * 500), // 0-500 ppm
                turbidity: Math.floor(Math.random() * 10), // 0-10 NTU
                last_reading: new Date().toISOString()
              };
              break;
            case 'PRESSURE_SENSOR':
              readings[deviceId] = {
                pressure: (Math.random() * 6 + 2).toFixed(2), // 2-8 bar
                last_reading: new Date().toISOString()
              };
              break;
            case 'TEMPERATURE_SENSOR':
              readings[deviceId] = {
                temperature: (Math.random() * 15 + 20).toFixed(1), // 20-35°C
                last_reading: new Date().toISOString()
              };
              break;
            default:
              readings[deviceId] = {
                status: 'Unknown device type',
                last_reading: new Date().toISOString()
              };
          }
        }
      });
      
      setDeviceReadings(readings);
      setLoadingDevices(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setLoadingDevices(false);
    }
  };
  
  // Get device sensor readings from all IoT devices
  const getDeviceData = () => {
    const deviceData = [];
    if (devices.length === 0) return deviceData;
    
    // Group devices by location
    const locationMap = {};
    devices.forEach(device => {
      if (!locationMap[device.location]) {
        locationMap[device.location] = [];
      }
      locationMap[device.location].push(device);
    });
    
    // For each location, create a location data object
    Object.keys(locationMap).forEach(location => {
      const locationDevices = locationMap[location];
      const hasOnlineDevices = locationDevices.some(d => d.status === 'ONLINE');
      
      const locationData = {
        location,
        hasOnlineDevices,
        devices: locationDevices.map(device => {
          const isOnline = device.status === 'ONLINE';
          const reading = deviceReadings[device.id] || {};
          
          // Create a device data object
          const deviceData = {
            id: device.id,
            name: device.name,
            type: device.device_type,
            status: device.status,
            lastActive: device.last_active || 'Never',
            readings: isOnline ? reading : null
          };
          
          return deviceData;
        })
      };
      
      deviceData.push(locationData);
    });
    
    return deviceData;
  };
  
  // Get device status chip
  const getDeviceStatusChip = (status) => {
    let color, icon;
    
    switch (status) {
      case 'ONLINE':
        color = '#10b981';
        icon = <CheckCircleIcon fontSize="small" />;
        break;
      case 'OFFLINE':
        color = '#6b7280';
        icon = <ErrorIcon fontSize="small" />;
        break;
      case 'MAINTENANCE':
        color = '#f59e0b';
        icon = <WarningIcon fontSize="small" />;
        break;
      default:
        color = '#ef4444';
        icon = <ErrorIcon fontSize="small" />;
    }
    
    return { color, icon };
  };
  
  // Function to format date
  const formatDate = (dateString) => {
    try {
      if (!dateString || dateString === 'Never') return 'Never';
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Calculate device status counts
  const deviceStatusCounts = {
    online: devices.filter(d => d.status === 'ONLINE').length || 0,
    offline: devices.filter(d => d.status === 'OFFLINE').length || 0,
    maintenance: devices.filter(d => d.status === 'MAINTENANCE').length || 0,
    error: devices.filter(d => d.status === 'ERROR').length || 0,
    total: devices.length || 0
  };

  // Sample data for KPI cards
  const kpiData = {
    orders: {
      icon: <span>📦</span>,
      value: (stats.total_orders || 0).toString(),
      description: `${stats.today_orders || 0} new orders today`
    },
    sales: {
      icon: <span>💰</span>,
      value: `₱${parseFloat(stats.total_revenue || 0).toFixed(2)}`,
      description: `₱${parseFloat(stats.today_revenue || 0).toFixed(2)} today`
    },
    deliveries: {
      icon: <span>👥</span>,
      value: `${stats.pending_orders || 0} Orders`,
      description: 'Orders not yet delivered'
    },
    devices: {
      icon: <DeviceIcon />,
      value: deviceStatusCounts.total.toString(),
      online: deviceStatusCounts.online,
      error: deviceStatusCounts.error,
      maintenance: deviceStatusCounts.maintenance,
      offline: deviceStatusCounts.offline,
      description: `${deviceStatusCounts.online} online, ${deviceStatusCounts.offline} offline`
    },
    refills: {
      icon: <span>🔄</span>,
      value: '12 Refills',
      description: '2 scheduled for tomorrow'
    }
  };

  return (
    <Box sx={{
      flexGrow: 1,
      minHeight: '100vh',
      p: 4,
      backgroundColor: theme => theme.palette.mode === 'dark' ? theme.palette.background.default : '#f8fafc',
      '& .MuiGrid-item': {
        transition: 'transform 0.2s ease'
      }
    }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: theme => theme.palette.mode === 'dark' ? theme.palette.primary.light : '#1e293b' }}>
        Dashboard Overview
      </Typography>
      
      {/* KPI Cards */}
      <DashboardOverview kpiData={kpiData} />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Quick Actions and Device Status */}
        <Grid container item xs={12} spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={3}>
            <QuickActions />
          </Grid>
          
          {/* Device Status */}
          <Grid item xs={12} md={9}>
            <DeviceStatus 
              deviceData={getDeviceData()} 
              loadingDevices={loadingDevices} 
              fetchDevices={fetchDevices} 
              getDeviceStatusChip={getDeviceStatusChip} 
              formatDate={formatDate} 
            />
          </Grid>
        </Grid>

        {/* Order Statistics */}
        <Grid item xs={12} md={4}>
          <OrderStatistics />
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={8}>
          <RecentOrders 
            recentOrders={recentOrders} 
            getStatusColor={getStatusColor} 
            formatDate={formatDate} 
          />
        </Grid>

        {/* Charts & Graphs */}
        <Grid item xs={12}>
          <ChartsAndGraphs deviceData={getDeviceData()} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
