import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, useTheme, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import api from '../../utils/axios';

// Styled Paper component
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '20px',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : '#fff',
  backdropFilter: 'blur(12px)',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 10px 20px rgba(0, 0, 0, 0.4)' 
    : '0 10px 20px rgba(0,0,0,0.05)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 12px 24px rgba(0, 0, 0, 0.5)'
      : '0 12px 24px rgba(0,0,0,0.1)',
    '& .chart-container': {
      transform: 'scale(1.02)',
    }
  },
  '& .MuiTypography-h5': {
    color: theme.palette.mode === 'dark' 
      ? '#60a5fa'
      : '#1e293b',
    fontWeight: 700,
    letterSpacing: '-0.5px'
  },
  '& .MuiTypography-h6': {
    color: theme.palette.mode === 'dark'
      ? '#93c5fd'
      : '#1e293b',
    fontWeight: 600,
    letterSpacing: '-0.3px'
  },
  '& .MuiTypography-body1, & .MuiTypography-body2': {
    color: theme.palette.mode === 'dark'
      ? '#93c5fd'
      : 'inherit'
  },
  '& .chart-container': {
    transition: 'transform 0.3s ease',
    padding: theme.spacing(2),
    borderRadius: '16px',
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(30, 41, 59, 0.5)' 
      : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
  }
}));

// Sales Trend Chart Component
const SalesTrendChart = ({ titleColor, gridLineColor, barColors }) => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await api.get('/orders/');
        const orders = response.data;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);

        const dateMap = {};
        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          dateMap[d.toISOString().split('T')[0]] = 0;
        }

        orders.forEach(order => {
          const dateStr = order.created_at.split('T')[0];
          if (dateMap.hasOwnProperty(dateStr)) {
            dateMap[dateStr] += parseFloat(order.total_amount) || 0;
          }
        });

        const weeklyData = Object.keys(dateMap).map(dateStr => {
          const d = new Date(dateStr);
          return {
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            sales: dateMap[dateStr]
          };
        });
        setSalesData(weeklyData);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesData();
  }, []);
  // Calculate chart dimensions
  const chartHeight = 180;
  const barWidth = 12;
  const maxValue = Math.max(...salesData.map(item => item.sales));
  
  return (
    <Box className="chart-container" sx={{ height: '280px', width: '100%', position: 'relative', overflow: 'hidden' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: titleColor }}>
            Sales Trend (Last 7 Days)
          </Typography>
          
          {/* Y-axis grid lines */}
          <Box sx={{ position: 'absolute', top: 50, bottom: 40, left: 30, right: 20 }}>
            {[0, 1, 2, 3, 4].map((_, index) => (
              <Box 
                key={index} 
                sx={{ 
                  position: 'absolute', 
                  left: 0, 
                  right: 0, 
                  bottom: `${index * 25}%`, 
                  height: 1, 
                  bgcolor: gridLineColor 
                }} 
              />
            ))}
          </Box>
          
          {/* Chart bars */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            height: chartHeight, 
            position: 'absolute',
            bottom: 40,
            left: 40,
            right: 20,
            justifyContent: 'space-between'
          }}>
            {salesData.map((item, index) => {
              const height = (item.sales / maxValue) * chartHeight;
              return (
                <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box 
                    sx={{
                      width: barWidth,
                      height,
                      fill: barColors[0],
                      borderRadius: '4px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scaleY(1.1)',
                        fill: barColors[1]
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ mt: 1, color: titleColor }}>
                    {item.day}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          
          {/* Y-axis labels */}
          <Box sx={{ position: 'absolute', top: 50, bottom: 40, left: 0, width: 30 }}>
            {[0, 1, 2, 3, 4].map((_, index) => {
              const value = Math.round((maxValue / 4) * (4 - index));
              return (
                <Typography
                  key={index}
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: `${index * 25}%`,
                    width: '100%',
                    textAlign: 'right',
                    pr: 1,
                    transform: 'translateY(50%)',
                    color: titleColor
                  }}
                >
                  ₱{value.toLocaleString()}
                </Typography>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
};

// Order Types Pie Chart Component
const OrderTypesPieChart = ({ titleColor, centerColor, borderColor, segmentColors }) => {
  const [orderTypesData, setOrderTypesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderTypes = async () => {
      try {
        const response = await api.get('/orders/');
        const orders = response.data;
        const typeCounts = {};
        orders.forEach(order => {
          const type = order.order_type || 'UNKNOWN';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        const total = orders.length || 1;
        const data = Object.entries(typeCounts).map(([type, count]) => ({
          type,
          count,
          percentage: (count / total) * 100
        }));
        setOrderTypesData(data);
      } catch (error) {
        console.error('Error fetching order types data:', error);
        setOrderTypesData([
          { type: 'WALK_IN', count: 1, percentage: 33.33 },
          { type: 'DELIVERY', count: 1, percentage: 33.33 },
          { type: 'SCHEDULED', count: 1, percentage: 33.33 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderTypes();
  }, []);

  // Calculate pie chart segments
  const calculateSegments = () => {
    if (!orderTypesData || orderTypesData.length === 0) return [];
    
    let cumulativePercentage = 0;
    
    return orderTypesData.map((item, index) => {
      const startAngle = cumulativePercentage;
      cumulativePercentage += item.percentage;
      
      return {
        ...item,
        startAngle: startAngle * 3.6, // Convert to degrees (360/100)
        endAngle: cumulativePercentage * 3.6,
        color: segmentColors[index % segmentColors.length]
      };
    });
  };

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const textColor = isDark ? '#93c5fd' : '#1e293b';
  
  // Modern color palette for pie segments
  const colors = isDark 
    ? ['#60a5fa', '#34d399', '#f472b6', '#a78bfa']
    : ['#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];
  
  // Calculate total for percentages
  const total = orderTypesData.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate pie segments
  let startAngle = 0;
  const segments = orderTypesData.map((item, index) => {
    const percentage = (item.count / total) * 100;
    const angle = (percentage / 100) * 360;
    const segment = {
      ...item,
      startAngle,
      endAngle: startAngle + angle,
      color: colors[index % colors.length]
    };
    startAngle += angle;
    return segment;
  });
  
  return (
    <Box sx={{ height: '250px', width: '100%', position: 'relative', p: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: titleColor }}>
            Order Types
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', height: '200px' }}>
            <Box sx={{ position: 'relative', width: 180, height: 180, margin: 'auto' }}>
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={borderColor}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                {calculateSegments().map((segment) => (
                  <circle
                    key={segment.type}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="1"
                    strokeDasharray={`${(segment.endAngle - segment.startAngle) * 0.628} 999`}
                    strokeDashoffset={`${-segment.startAngle * 0.628}`}
                    transform="rotate(-90 50 50)"
                  />
                ))}
              </svg>
              <Box sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                textAlign: 'center'
              }}>
                <Box sx={{ 
                  height: '40%', 
                  borderRadius: '50%', 
                  bgcolor: centerColor,
                  boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                }} />
              </Box>
            </Box>
            
            {/* Legend */}
            <Box sx={{ mt: 2 }}>
              {orderTypesData.map((segment, index) => (
                <Box key={segment.type} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: segmentColors[index % segmentColors.length],
                      mr: 1
                    }}
                  />
                  <Typography variant="body2">
                    {segment.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')} ({segment.count})
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

// Top Customers Bar Chart Component
const TopCustomersChart = ({ titleColor, progressColors }) => {
  const [loading, setLoading] = useState(true);
  const [topCustomersData, setTopCustomersData] = useState([]);

  useEffect(() => {
    const fetchTopCustomers = async () => {
      try {
        const [ordersRes, customersRes] = await Promise.all([
          api.get('/orders/'),
          api.get('/customers/')
        ]);
        const orders = ordersRes.data;
        const customers = customersRes.data;

        const spendingMap = {};
        orders.forEach(order => {
          spendingMap[order.customer] = (spendingMap[order.customer] || 0) + (parseFloat(order.total_amount) || 0);
        });

        const customerMap = {};
        customers.forEach(c => { customerMap[c.id] = c.name; });

        const data = Object.entries(spendingMap)
          .map(([cid, value]) => ({ name: customerMap[cid] || 'Unknown', value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        setTopCustomersData(data);
      } catch (error) {
        console.error('Error fetching top customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopCustomers();
  }, []);
  // Calculate max value for scaling
  const maxValue = Math.max(...topCustomersData.map(item => item.value));
  
  return (
    <Box sx={{ height: '250px', width: '100%', position: 'relative', p: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: titleColor }}>
            Top Customers
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            {topCustomersData.map((item, index) => {
              const width = `${(item.value / maxValue) * 100}%`;
              return (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{item.name}</Typography>
                    <Typography variant="body2" sx={{ color: progressColors[0] }}>₱{item.value.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ 
                    width: '100%', 
                    height: 10, 
                    bgcolor: progressColors[2], 
                    borderRadius: 5,
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <Box 
                      sx={{ 
                        height: '100%', 
                        width, 
                        background: `linear-gradient(90deg, ${progressColors[0]} 0%, ${progressColors[1]} 100%)`,
                        borderRadius: 5,
                        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          filter: 'brightness(1.1)',
                          transform: 'scaleX(1.01)'
                        }
                      }} 
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
};

// Main component
const ChartsAndGraphs = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const textColor = isDark ? '#93c5fd' : '#1e293b';
  const bgColor = isDark ? theme.palette.background.paper : '#fff';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0,0,0,0.05)';

  // Colors for chart segments
  const chartColors = [
    isDark ? '#60a5fa' : '#3b82f6', // Blue
    isDark ? '#34d399' : '#10b981', // Green
    isDark ? '#f87171' : '#ef4444', // Red
    isDark ? '#fbbf24' : '#f59e0b', // Orange
    isDark ? '#818cf8' : '#6366f1'  // Indigo
  ];

  return (
    <StyledPaper elevation={0}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: textColor }}>Sales Dashboard</Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <SalesTrendChart 
            titleColor={textColor}
            gridLineColor={gridColor}
            barColors={chartColors}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <OrderTypesPieChart 
            titleColor={textColor}
            centerColor={bgColor}
            borderColor={gridColor}
            segmentColors={chartColors}
          />
        </Grid>
        <Grid item xs={12}>
          <TopCustomersChart 
            titleColor={textColor}
            progressColors={chartColors}
          />
        </Grid>
      </Grid>
    </StyledPaper>
  );
};

export default ChartsAndGraphs;
