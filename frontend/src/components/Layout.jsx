import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import { Alert, Snackbar } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  Button,
  Paper,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Devices as IoTIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import api from '../utils/axios';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Orders', icon: <OrdersIcon />, path: '/orders' },
  { text: 'IoT Devices', icon: <IoTIcon />, path: '/iot-devices' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const MainContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  width: '100vw',
  backgroundImage: 'url("/background.jpg")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  overflow: 'hidden',
  display: 'flex',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.1)',
    zIndex: 0
  }
}));

const SidebarContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgb(144, 179, 206)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '0 24px 24px 0',
  boxShadow: theme.palette.mode === 'dark' ? '4px 0 10px rgba(0, 0, 0, 0.3)' : '4px 0 10px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden'
}));

const LogoContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '2rem 1rem',
  position: 'relative',
});

const Logo = styled('img')({
  width: '180px',
  height: 'auto',
  marginBottom: '1.5rem',
});

const UserAvatar = styled(Avatar)({
  width: 100,
  height: 100,
  marginBottom: '1rem',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
});

function Layout({ toggleTheme, currentTheme }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mode, setMode] = useState(currentTheme || 'light');
  const { logout, currentUser } = useAuth();

  // Update local mode state when the currentTheme prop changes
  useEffect(() => {
    if (currentTheme) {
      setMode(currentTheme);
    }
  }, [currentTheme]);

  const theme = getTheme(mode);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  // Remove this line as it's now redundant
  // const { logout, currentUser } = useAuth();

  // We no longer need to listen to storage changes since we're not using localStorage for themes
  
  // Handle theme toggle using the passed toggleTheme prop
  const handleThemeToggle = (newTheme) => {
    if (toggleTheme) {
      toggleTheme(newTheme);
      window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: newTheme } }));
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/orders') return 'Orders';
    if (path === '/iot-devices') return 'IoT Devices';
    if (path === '/reports') return 'Reports';
    if (path === '/settings') return 'Settings';
    return 'CLEAAR Oasis';
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/login');
    setOpenLogoutDialog(false);
  };

  const handleLogoutCancel = () => {
    setOpenLogoutDialog(false);
  };

  const drawer = (
    <SidebarContainer elevation={3}>
      <LogoContainer>
        <Logo src="/logo.png" alt="CLEAAR Oasis Logo" />
        <UserAvatar src={currentUser?.profilePicture}>
          <AccountIcon />
        </UserAvatar>
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main', fontWeight: 500 }}>
          {currentUser?.username || 'User'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          @{currentUser?.username || 'user'}
        </Typography>
      </LogoContainer>
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mx: 2 }} />
      <List sx={{ 
        flexGrow: 1, 
        px: 2, 
        py: 2,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '4px'
        }
      }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            sx={{
              borderRadius: '12px',
              mb: 1,
              backgroundColor: location.pathname === item.path ? 
                'rgba(26, 54, 93, 1)' : 'transparent',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: location.pathname === item.path ?
                  'rgba(26, 54, 93, 0.9)' : 'rgba(255, 255, 255, 0.1)',
                transform: 'translateX(4px)',
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: '#fff', 
                minWidth: '45px',
                opacity: location.pathname === item.path ? 1 : 0.8,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ 
                color: '#fff',
                opacity: location.pathname === item.path ? 1 : 0.8,
                '& .MuiTypography-root': {
                  fontSize: '1.1rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }
              }} 
            />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mx: 2 }} />
      <Box sx={{ p: 2 }}>
        <ListItem 
          button 
          onClick={handleLogoutClick}  // Changed from handleLogout to handleLogoutClick
          sx={{
            borderRadius: '12px',
            backgroundColor: 'rgba(220, 38, 38, 0.9)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(220, 38, 38, 1)',
              transform: 'translateX(4px)',
            }
          }}
        >
          <ListItemIcon sx={{ color: '#fff', minWidth: '45px' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            sx={{ 
              color: '#fff',
              '& .MuiTypography-root': {
                fontSize: '1.1rem',
                fontWeight: 500,
              }
            }} 
          />
        </ListItem>
      </Box>
    </SidebarContainer>
  );

  const [notifications, setNotifications] = useState([]);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');

  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpenAlert(false);
  };

  const showNotification = (message, type = 'info') => {
    setAlertMessage(message);
    setAlertType(type);
    setOpenAlert(true);
  };

  return (
    <MainContainer>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgb(255, 255, 255)',
          boxShadow: theme.palette.mode === 'dark' ? '0 4px 10px rgba(0, 0, 0, 0.3)' : '0 4px 10px rgba(0, 0, 0, 0.1)',
          borderRadius: '0 0 16px 16px',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          color: theme.palette.text.primary
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="primary"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                color: theme.palette.primary.main, 
                fontWeight: 600,
                letterSpacing: '-0.5px',
              }}
            >
              {getPageTitle()}
            </Typography>
          </Box>
          <IconButton
            color="primary"
            onClick={() => handleThemeToggle(theme.palette.mode === 'dark' ? 'light' : 'dark')}
            aria-label="toggle theme"
            sx={{ ml: 1 }}
          >
            {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'transparent',
              border: 'none',
              height: '100%',
              overflow: 'hidden'
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar />
        <Box
          sx={{
            p: 3,
            flexGrow: 1,
            overflow: 'auto',
            position: 'relative',
            zIndex: 1,
            '&::-webkit-scrollbar': {
              width: '6px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '6px'
            }
          }}
        >
          <Outlet />
        </Box>
      </Box>
      
      {/* Add the Dialog component here */}
      <Dialog
        open={openLogoutDialog}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <Typography id="logout-dialog-description">
            Are you sure you want to log out?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogoutConfirm} color="primary" variant="contained" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openAlert}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alertType} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </MainContainer>
  );
}

export default Layout;
