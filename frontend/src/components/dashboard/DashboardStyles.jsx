import { styled } from '@mui/material/styles';
import { Paper, Button } from '@mui/material';

// Styled Paper component used across dashboard components
export const StyledPaper = styled(Paper)(({ theme }) => ({
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

// Quick Action Button used in QuickActions component
export const QuickActionButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: '10px',
  padding: theme.spacing(1.5, 2),
  justifyContent: 'flex-start',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
  color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(2),
    fontSize: '24px'
  }
}));

// Add keyframes for animations
export const keyframes = `
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

// Helper function to get status color
export const getStatusColor = (status) => {
  switch(status) {
    case 'PENDING':
      return { bg: '#fff9db', color: '#f59e0b' };
    case 'PROCESSING':
      return { bg: '#e0f2fe', color: '#0ea5e9' };
    case 'COMPLETED':
      return { bg: '#dcfce7', color: '#10b981' };
    case 'CANCELLED':
      return { bg: '#fee2e2', color: '#ef4444' };
    default:
      return { bg: '#f1f5f9', color: '#64748b' };
  }
};
