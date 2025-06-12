import React from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Paper 
} from '@mui/material';
import { styled } from '@mui/material/styles';

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

const RecentOrders = ({ recentOrders, getStatusColor, formatDate }) => {
  return (
    <StyledPaper elevation={0}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>Recent Orders</Typography>
      <TableContainer sx={{ flex: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentOrders.map((order) => {
              const statusStyle = getStatusColor(order.status);
              return (
                <TableRow key={order.id} hover>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>₱{parseFloat(order.total_amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      size="small"
                      sx={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        fontWeight: 500,
                        borderRadius: '6px'
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {recentOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No recent orders</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledPaper>
  );
};

export default RecentOrders;
