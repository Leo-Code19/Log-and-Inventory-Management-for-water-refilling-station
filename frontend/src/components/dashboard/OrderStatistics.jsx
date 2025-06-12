import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import api from '../../utils/axios';

// Styled Paper component
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '16px',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 10px 20px rgba(0, 0, 0, 0.3)' 
    : '0 10px 20px rgba(0,0,0,0.05)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 12px 24px rgba(0, 0, 0, 0.4)'
      : '0 12px 24px rgba(0,0,0,0.1)'
  },
  '& .MuiTypography-h5': {
    color: theme.palette.mode === 'dark' 
      ? theme.palette.primary.light 
      : '#1e293b',
    fontWeight: 600
  },
  '& .MuiTypography-h6': {
    color: theme.palette.mode === 'dark'
      ? theme.palette.text.primary
      : 'inherit'
  },
  '& .MuiTypography-body1': {
    color: theme.palette.mode === 'dark'
      ? theme.palette.text.secondary
      : 'inherit'
  }
}));

const OrderStatistics = () => {
  const [timeRange, setTimeRange] = useState('day');
  const [stats, setStats] = useState({
    completed_orders: 0,
    cancelled_orders: 0,
    pending_orders: 0,
    processing_orders: 0,
    total_orders: 0,
    total_revenue: 0
  });

  const fetchOrderStats = async (range) => {
    try {
      const response = await api.get(`/dashboard/stats/?timeRange=${range}`);
      // Extract only the order-related stats
      const orderStats = {
        completed_orders: response.data.completed_orders || 0,
        cancelled_orders: response.data.cancelled_orders || 0,
        pending_orders: response.data.pending_orders || 0,
        processing_orders: response.data.processing_orders || 0,
        total_orders: response.data.total_orders || 0,
        total_revenue: response.data.total_revenue || 0
      };
      setStats(orderStats);
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  useEffect(() => {
    fetchOrderStats(timeRange);
  }, [timeRange]);

  const handleTimeRangeChange = (event, newValue) => {
    setTimeRange(newValue);
  };

  return (
    <StyledPaper elevation={0}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b' }}>Order Statistics</Typography>
        <Tabs 
          value={timeRange} 
          onChange={handleTimeRangeChange}
          sx={{ 
            '& .MuiTab-root': { 
              minWidth: 'auto', 
              px: 2,
              fontWeight: 500,
              fontSize: '0.875rem',
              textTransform: 'none'
            } 
          }}
        >
          <Tab value="day" label="Day" />
          <Tab value="week" label="Week" />
          <Tab value="month" label="Month" />
          <Tab value="year" label="Year" />
        </Tabs>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ textAlign: 'center', p: 2, borderRadius: '10px', bgcolor: '#dcfce7', color: '#10b981', width: '48%' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {stats.completed_orders || 0}
          </Typography>
          <Typography variant="body2">Completed</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', p: 2, borderRadius: '10px', bgcolor: '#fee2e2', color: '#ef4444', width: '48%' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {stats.cancelled_orders || 0}
          </Typography>
          <Typography variant="body2">Cancelled</Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ textAlign: 'center', p: 2, borderRadius: '10px', bgcolor: '#fff9db', color: '#f59e0b', width: '48%' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {stats.pending_orders || 0}
          </Typography>
          <Typography variant="body2">Pending</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', p: 2, borderRadius: '10px', bgcolor: '#e0f2fe', color: '#0ea5e9', width: '48%' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {stats.processing_orders || 0}
          </Typography>
          <Typography variant="body2">Processing</Typography>
        </Box>
      </Box>
      
      <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body1" color="text.secondary">Total Orders:</Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>{stats.total_orders || 0}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body1" color="text.secondary">Total Revenue:</Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>₱{parseFloat(stats.total_revenue || 0).toFixed(2)}</Typography>
      </Box>
    </StyledPaper>
  );
};

export default OrderStatistics;
