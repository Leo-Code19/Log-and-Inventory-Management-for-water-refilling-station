import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Paper component for KPI cards
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
  '& .MuiTypography-h4, & .MuiTypography-h5, & .MuiTypography-h6': {
    color: theme.palette.mode === 'dark' 
      ? '#60a5fa'  // Bright blue in dark mode
      : '#1e293b',
    fontWeight: 600
  },
  '& .MuiTypography-body1': {
    color: theme.palette.mode === 'dark'
      ? '#93c5fd'  // Lighter blue in dark mode
      : 'inherit'
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.mode === 'dark'
      ? '#60a5fa'  // Bright blue in dark mode
      : 'inherit'
  }
}));

const KPICard = ({ icon, title, value, description }) => (
  <StyledPaper elevation={0}>
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      mb: 2,
      pb: 2,
      borderBottom: '1px solid rgba(0,0,0,0.06)'
    }}>
      <Box sx={{
        mr: 2,
        fontSize: '28px',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        background: theme => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%)',
        boxShadow: theme => theme.palette.mode === 'dark'
          ? '0 4px 8px rgba(96, 165, 250, 0.2)'
          : '0 4px 8px rgba(0,0,0,0.05)'
      }}>
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
    </Box>
    <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>{value}</Typography>
    {typeof description === 'string' ? (
      <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>{description}</Typography>
    ) : (
      <Box sx={{ opacity: 0.8 }}>{description}</Box>
    )}
  </StyledPaper>
);

export default KPICard;
