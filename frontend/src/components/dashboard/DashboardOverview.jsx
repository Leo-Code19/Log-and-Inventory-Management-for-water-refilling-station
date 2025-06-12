import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import KPICard from './KPICard';
import { 
  DeviceHub as DeviceIcon,
  LocalShipping as DeliveryIcon,
  AttachMoney as SalesIcon,
  WaterDrop as RefillIcon
} from '@mui/icons-material';
import api from '../../utils/axios'; // assuming you have an api module

const DashboardOverview = () => {
  const [kpiData, setKpiData] = useState({
    orders: {
      value: 0,
      description: 'No orders today',
      icon: <SalesIcon />
    },
    sales: {
      value: 0,
      description: 'No sales today',
      icon: <SalesIcon />
    },
    deliveries: {
      value: 0,
      description: 'No pending deliveries',
      icon: <DeliveryIcon />
    },
    devices: {
      value: '0/0',
      description: 'Device Status',
      online: 0,
      error: 0,
      maintenance: 0,
      offline: 0,
      icon: <DeviceIcon />
    },
    refills: {
      value: 0,
      description: 'No refills today',
      icon: <RefillIcon />
    }
  });
  const [refillStats, setRefillStats] = useState({
    daily: { count: 0, total_amount: 0 },
    weekly: { count: 0, total_amount: 0 },
    monthly: { count: 0, total_amount: 0 },
    yearly: { count: 0, total_amount: 0 },
    trend: []
  });
  const [overviewStats, setOverviewStats] = useState({
    orders: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
    sales: { daily: 0, weekly: 0, monthly: 0, yearly: 0 }
  });

  const fetchOverviewStats = async () => {
    try {
      const { data } = await api.get('/dashboard/overview/');
      setKpiData({
        orders: {
          value: data.orders.daily,
          description: `${data.orders.daily} completed today`,
          icon: <SalesIcon />
        },
        sales: {
          value: data.sales.daily,
          description: `${data.sales.daily} completed sales today`,
          icon: <SalesIcon />
        },
        deliveries: {
          value: data.pending.total,
          description: `Today: ${data.pending.daily}`,
          icon: <DeliveryIcon />
        },
        devices: {
          value: `${data.devices.online}/${data.devices.total}`,
          online: data.devices.online,
          offline: data.devices.offline,
          maintenance: data.devices.maintenance,
          error: data.devices.error,
          icon: <DeviceIcon />
        },
        refills: {
          icon: <RefillIcon />
        }
      });
      setOverviewStats({ orders: data.orders, sales: data.sales });
      setRefillStats(data.refills);
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    }
  };

  useEffect(() => {
    fetchOverviewStats();
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={2.4}>
        <KPICard
          icon={kpiData?.orders?.icon || <SalesIcon />}
          title="Total Orders Today"
          value={kpiData?.orders?.value || 0}
          description={
            <Box sx={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', mt: -0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>
                  This Week:
                </Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.text.primary })}>
                  {overviewStats.orders.weekly || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>
                  This Month:
                </Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.text.primary })}>
                  {overviewStats.orders.monthly || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>
                  This Year:
                </Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.text.primary })}>
                  {overviewStats.orders.yearly || 0}
                </Typography>
              </Box>
            </Box>
          }
        />
      </Grid>
      <Grid item xs={12} md={2.4}>
        <KPICard
          icon={kpiData?.sales?.icon || <SalesIcon />}
          title="Total Sales Today"
          value={kpiData?.sales?.value || 0}
          description={
            <Box sx={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', mt: -0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>
                  This Week:
                </Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.text.primary })}>
                  {(overviewStats.sales.weekly || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>
                  This Month:
                </Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.text.primary })}>
                  {(overviewStats.sales.monthly || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>
                  This Year:
                </Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.text.primary })}>
                  {(overviewStats.sales.yearly || 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          }
        />
      </Grid>
      <Grid item xs={12} md={2.4}>
        <KPICard
          icon={kpiData?.deliveries?.icon || <DeliveryIcon />}
          title="Pending Orders"
          value={kpiData?.deliveries?.value || 0}
          description={kpiData?.deliveries?.description || 'No pending orders'}
        />
      </Grid>
      <Grid item xs={12} md={2.4}>
        <KPICard
          icon={kpiData?.devices?.icon || <DeviceIcon />}
          title="Device Status"
          value={kpiData?.devices?.value || '0/0'}
          description={
            <Box sx={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', mt: -0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>Online:</Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', fontWeight: 600, color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.success.main })}>{kpiData?.devices?.online || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>Error:</Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', fontWeight: 600, color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.error.main })}>{kpiData?.devices?.error || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>Maintenance:</Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', fontWeight: 600, color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.warning.main })}>{kpiData?.devices?.maintenance || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>Offline:</Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', fontWeight: 600, color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.text.disabled })}>{kpiData?.devices?.offline || 0}</Typography>
              </Box>
            </Box>
          }
        />
      </Grid>
      <Grid item xs={12} md={2.4}>
        <KPICard
          icon={kpiData?.refills?.icon || <RefillIcon />}
          title="Refills Done Today"
          value={`${refillStats?.daily?.count || 0} (${(refillStats?.daily?.total_amount || 0).toFixed(1)}L)`}
          description={
            <Box sx={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', mt: -0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>This Week:</Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.text.primary })}>
                  {refillStats?.weekly?.count || 0} ({(refillStats?.weekly?.total_amount || 0).toFixed(1)}L)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>This Month:</Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.text.primary })}>
                  {refillStats?.monthly?.count || 0} ({(refillStats?.monthly?.total_amount || 0).toFixed(1)}L)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#93c5fd' : theme.palette.text.secondary })}>This Year:</Typography>
                <Typography variant="body2" sx={theme => ({ fontSize: 'inherit', color: theme.palette.mode === 'dark' ? '#60a5fa' : theme.palette.text.primary })}>
                  {refillStats?.yearly?.count || 0} ({(refillStats?.yearly?.total_amount || 0).toFixed(1)}L)
                </Typography>
              </Box>
            </Box>
          }
        />
      </Grid>
    </Grid>
  );
};

export default DashboardOverview;
