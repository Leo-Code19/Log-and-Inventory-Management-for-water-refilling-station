import { useState, useRef, useEffect } from 'react';
import {
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  Divider,
  Avatar,
  Badge,
  CircularProgress,
} from '@mui/material';
import { 
  Person,
  Edit as EditIcon, 
  Key as KeyIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../../utils/axios';
import { useAuth } from '../../contexts/AuthContext';

const Input = styled('input')({ display: 'none' });

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.primary.main,
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

function UserManagement({ setMessage, saving, setSaving }) {
  const { currentUser, setCurrentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    profilePicture: ''
  });
  
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [editMode, setEditMode] = useState({
    username: false,
    email: false,
    name: false
  });
  const [tempUserData, setTempUserData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: ''
  });
  
  // Fetch user data from the database when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // First try to get detailed user data from the user endpoint
        const response = await api.get('/user/current/');
        console.log('Fetched user data:', response.data);
        
        if (response.data) {
          setUserData({
            username: response.data.username || '',
            email: response.data.email || '',
            first_name: response.data.first_name || '',
            last_name: response.data.last_name || '',
            profilePicture: response.data.profile_picture || ''
          });
          
          setTempUserData({
            username: response.data.username || '',
            email: response.data.email || '',
            first_name: response.data.first_name || '',
            last_name: response.data.last_name || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to settings endpoint
        try {
          const settingsResponse = await api.get('/settings/user/');
          if (settingsResponse.data && settingsResponse.data.user) {
            const user = settingsResponse.data.user;
            setUserData({
              username: user.username || '',
              email: user.email || '',
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              profilePicture: user.profile_picture || ''
            });
            
            setTempUserData({
              username: user.username || '',
              email: user.email || '',
              first_name: user.first_name || '',
              last_name: user.last_name || ''
            });
          }
        } catch (settingsError) {
          console.error('Error fetching from settings endpoint:', settingsError);
          setMessage({ 
            type: 'error', 
            text: 'Failed to load user data. Please try refreshing the page.'
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [setMessage]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleProfilePictureUpload = async (event) => {
    event.preventDefault();
    setUploadProgress(0);
    
    const file = event.target.files[0];
    if (!file) {
      setMessage({ type: 'error', text: 'No file selected' });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size exceeds 5MB limit' });
      return;
    }
    
    // Check file type
    if (!file.type.match('image.*')) {
      setMessage({ type: 'error', text: 'Only image files are allowed' });
      return;
    }
    
    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      setSaving(true);
      console.log('Uploading profile picture for user:', currentUser?.username);
      
      // Add user ID to form data to ensure we're updating the correct user
      if (currentUser?.id) {
        formData.append('user_id', currentUser.id);
      }
      
      // Use the correct endpoint directly with user context
      try {
        const response = await api.put('/settings/update_profile/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          },
        });

        if (response.data?.profile_picture) {
          const profilePictureUrl = response.data.profile_picture.startsWith('http')
            ? response.data.profile_picture
            : `http://localhost:8000${response.data.profile_picture}`;
          setUserData(prev => ({
            ...prev,
            profilePicture: profilePictureUrl
          }));
          // Sync with global context for Layout avatar
          setCurrentUser(prev => ({
            ...prev,
            profilePicture: profilePictureUrl
          }));
          setMessage({ type: 'success', text: 'Profile picture updated successfully' });
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error.response?.data);
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.message || 
                error.response?.data?.profile_picture?.[0] ||
                'Failed to upload profile picture'
        });
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setMessage({ type: 'error', text: 'Failed to upload profile picture' });
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setSaving(true);
      console.log('Removing profile picture for user:', currentUser?.username);
      
      const response = await api.put('/settings/update_profile/', {
        remove_profile_picture: true,
        // Include user identifier to ensure we're updating the correct user
        user_id: currentUser?.id || null,
        profile: {
          email: userData.email,
          first_name: userData.first_name || '',
          last_name: userData.last_name || ''
        }
      });
      
      setUserData(prev => ({
        ...prev,
        profilePicture: ''
      }));
      // Sync removal with global context
      setCurrentUser(prev => ({
        ...prev,
        profilePicture: null
      }));
      
      setMessage({ type: 'success', text: 'Profile picture removed' });
    } catch (error) {
      console.error('Error removing profile picture:', error);
      setMessage({ type: 'error', text: 'Failed to remove profile picture' });
    } finally {
      setSaving(false);
    }
  };
  
  const handleUserDataChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };
  
  const handleTempDataChange = (e) => {
    setTempUserData({ ...tempUserData, [e.target.name]: e.target.value });
  };
  
  const startEditing = (field) => {
    setEditMode(prev => ({
      ...prev,
      [field]: true
    }));
    
    // Reset temp data to current value
    if (field === 'name') {
      // Special handling for name which consists of first_name and last_name
      setTempUserData(prev => ({
        ...prev,
        first_name: userData.first_name || '',
        last_name: userData.last_name || ''
      }));
    } else {
      // For other fields like username, email
      setTempUserData(prev => ({
        ...prev,
        [field]: userData[field] || ''
      }));
    }
  };
  
  const cancelEditing = (field) => {
    setEditMode(prev => ({
      ...prev,
      [field]: false
    }));
  };

  // Save username to backend
  const saveUsername = async (username) => {
    if (!username) {
      setMessage({ type: 'error', text: 'Username cannot be blank' });
      return false;
    }
    
    try {
      setSaving(true);
      console.log('Saving username for user:', currentUser?.username);
      
      // Use the correct endpoint directly with user context
      const response = await api.put('/settings/update_profile/', {
        username: username,
        profile: {
          // Include current values to avoid validation errors
          email: userData.email,
          first_name: userData.first_name || '',
          last_name: userData.last_name || ''
        },
        // Include user identifier to ensure we're updating the correct user
        user_id: currentUser?.id || null,
        notification_settings: {},
        system_preferences: {}
      });
      
      if (response.data) {
        setUserData(prevData => ({
          ...prevData,
          username: response.data.username || '',
          first_name: response.data.first_name || prevData.first_name,
          last_name: response.data.last_name || prevData.last_name,
          email: response.data.email || prevData.email
        }));
        setMessage({ type: 'success', text: 'Username updated successfully' });
        return true;
      }
      
      throw new Error('Failed to update username');
    } catch (error) {
      console.error('Error updating username:', error.response?.data);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 
              error.response?.data?.username?.[0] ||
              'Failed to update username'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  
  // Save email to backend
  const saveEmail = async (email) => {
    if (!email) {
      setMessage({ type: 'error', text: 'Email cannot be blank' });
      return false;
    }
    
    try {
      setSaving(true);
      console.log('Saving email for user:', currentUser?.username);
      
      // Use the correct endpoint directly with user context
      const response = await api.put('/settings/update_profile/', {
        email: email,
        profile: {
          // Include current values to avoid validation errors
          email: email,
          first_name: userData.first_name || '',
          last_name: userData.last_name || ''
        },
        // Include user identifier to ensure we're updating the correct user
        user_id: currentUser?.id || null,
        notification_settings: {},
        system_preferences: {}
      });
      
      if (response.data) {
        setUserData(prevData => ({
          ...prevData,
          email: response.data.email || '',
          first_name: response.data.first_name || prevData.first_name,
          last_name: response.data.last_name || prevData.last_name,
          username: response.data.username || prevData.username
        }));
        setMessage({ type: 'success', text: 'Email updated successfully' });
        return true;
      }
      
      throw new Error('Failed to update email');
    } catch (error) {
      console.error('Error updating email:', error.response?.data);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 
              error.response?.data?.email?.[0] ||
              'Failed to update email'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  // Save name (first_name and last_name) to backend
  const saveName = async (firstName, lastName) => {
    try {
      setSaving(true);
      console.log('Saving name for user:', currentUser?.username);
      
      // Validate fields
      if (!firstName && !lastName) {
        setMessage({ type: 'warning', text: 'Please enter at least one name field' });
        return false;
      }
      
      // Use the correct endpoint directly with user context
      // The backend API requires specific structure with first_name and last_name in the profile object
      const response = await api.put('/settings/update_profile/', {
        // Include first_name and last_name at the root level as well as in profile object
        first_name: firstName || '',
        last_name: lastName || '',
        profile: {
          // Include current values to avoid validation errors
          email: userData.email || '',
          first_name: firstName || '',
          last_name: lastName || ''
        },
        // Include user identifier to ensure we're updating the correct user
        user_id: currentUser?.id || null,
        // Include these empty objects to maintain API compatibility
        notification_settings: {},
        system_preferences: {}
      });
      
      if (response.data) {
        // Update local state with the returned data
        setUserData(prevData => ({
          ...prevData,
          first_name: response.data.first_name || firstName || '',
          last_name: response.data.last_name || lastName || '',
          email: response.data.email || prevData.email,
          username: response.data.username || prevData.username
        }));
        
        console.log('Name updated successfully:', {
          first_name: response.data.first_name || firstName || '',
          last_name: response.data.last_name || lastName || ''
        });
        
        setMessage({ type: 'success', text: 'Name updated successfully' });
        return true;
      }
      
      throw new Error('Failed to update name');
    } catch (error) {
      console.error('Error updating name:', error.response?.data);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 
              error.response?.data?.profile?.first_name?.[0] ||
              error.response?.data?.profile?.last_name?.[0] ||
              'Failed to update name'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  // Helper function to check if a field exists and is not blank
  const validateField = (field, fieldName) => {
    if (!field) {
      setMessage({ type: 'error', text: `${fieldName} cannot be blank` });
      return false;
    }
    return true;
  };
  
  // General profile save function (kept for compatibility)
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      console.log('Saving profile for user:', currentUser?.username);
      
      // Validate required fields
      if (!validateField(userData.username, 'Username') || 
          !validateField(userData.email, 'Email')) {
        return;
      }
      
      // Use the correct endpoint directly with user context
      const response = await api.put('/settings/update_profile/', {
        username: userData.username,
        email: userData.email,
        profile: {
          email: userData.email,
          first_name: userData.first_name || '',
          last_name: userData.last_name || ''
        },
        // Include user identifier to ensure we're updating the correct user
        user_id: currentUser?.id || null,
        // Keep empty objects for other settings to maintain API compatibility
        notification_settings: {},
        system_preferences: {}
      });
      
      if (response.data) {
        setUserData(prevData => ({
          ...prevData,
          ...response.data
        }));
        console.log('Profile updated successfully for user:', currentUser?.username);
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSaving(true);
      console.log('Changing password for user:', currentUser?.username);
      
      // Validate password fields
      if (!validateField(userData.password, 'Current password')) return;
      if (!validateField(userData.newPassword, 'New password')) return;
      if (!validateField(userData.confirmPassword, 'Confirm password')) return;
      
      if (userData.newPassword !== userData.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match' });
        return;
      }
      
      const response = await api.post('/settings/change_password/', {
        old_password: userData.password,
        new_password: userData.newPassword,
        confirm_password: userData.confirmPassword,
        // Include user identifier to ensure we're updating the correct user
        user_id: currentUser?.id || null
      });
      
      // The backend returns a message field on success
      if (response.data) {
        setUserData(prevData => ({
          ...prevData,
          password: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setMessage({ type: 'success', text: response.data.message || 'Password changed successfully' });
        // Close the password dialog
        setOpenPasswordDialog(false);
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 
              error.response?.data?.error ||
              'Failed to change password'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={3}>
            <Person color="primary" />
            <Typography variant="h6">User Management</Typography>
          </Stack>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress />
            </Box>
          ) : (
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Input
                  accept="image/*"
                  id="profile-picture-input"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePictureUpload}
                  style={{ display: 'none' }}
                />
                <StyledBadge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Tooltip title="Change Profile Picture">
                      <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                      >
                        <PhotoCameraIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <Avatar
                    src={userData.profilePicture || ''}
                    sx={{ width: 100, height: 100 }}
                  />
                </StyledBadge>
              </Box>

              {/* User's full name display - non-editable */}
              <Box sx={{ width: '100%', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Name: <span style={{ fontWeight: 400 }}>
                      {userData && (userData.first_name || userData.last_name) ? 
                        `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : 
                        'Not set'}
                    </span>
                  </Typography>
                  <Tooltip title="Name can only be edited by an administrator">
                    <Box sx={{ display: 'inline-flex', ml: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        (Admin only)
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
            </Box>

            {/* Username field */}
            <Box sx={{ width: '100%', mb: 2 }}>
              {!editMode.username ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Username: <span style={{ fontWeight: 400 }}>@{userData?.username || ''}</span>
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => startEditing('username')}
                    disabled={saving}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={tempUserData.username}
                    onChange={handleTempDataChange}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => cancelEditing('username')}
                      sx={{ borderRadius: 2 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={async () => {
                        if (tempUserData.username && tempUserData.username !== userData.username) {
                          const success = await saveUsername(tempUserData.username);
                          if (success) {
                            cancelEditing('username');
                          }
                        } else {
                          cancelEditing('username');
                        }
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      Save
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Email field */}
            <Box sx={{ width: '100%', mb: 2 }}>
              {!editMode.email ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Email: <span style={{ fontWeight: 400 }}>{userData?.email || ''}</span>
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => startEditing('email')}
                    disabled={saving}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={tempUserData.email}
                    onChange={handleTempDataChange}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => cancelEditing('email')}
                      sx={{ borderRadius: 2 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={async () => {
                        if (tempUserData.email && tempUserData.email !== userData.email) {
                          const success = await saveEmail(tempUserData.email);
                          if (success) {
                            cancelEditing('email');
                          }
                        } else {
                          cancelEditing('email');
                        }
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      Save
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Button
              variant="contained"
              startIcon={<KeyIcon />}
              onClick={() => setOpenPasswordDialog(true)}
              sx={{ borderRadius: 2 }}
            >
              Change Password
            </Button>
          </Stack>
        )}
        </CardContent>
      </Card>

      <Dialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <KeyIcon color="primary" />
            <Typography variant="h6">Change Password</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              name="password"
              value={userData.password || ''}
              onChange={handleUserDataChange}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              name="newPassword"
              value={userData.newPassword || ''}
              onChange={handleUserDataChange}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={userData.confirmPassword || ''}
              onChange={handleUserDataChange}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Password requirements:
              <ul style={{ marginBottom: 0 }}>
                <li>At least 8 characters long</li>
                <li>Cannot be too similar to your other personal information</li>
                <li>Cannot be a commonly used password</li>
                <li>Cannot be entirely numeric</li>
              </ul>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenPasswordDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleChangePassword();
              setOpenPasswordDialog(false);
            }}
            variant="contained"
            disabled={saving}
            sx={{ borderRadius: 2 }}
          >
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;
