import React, { useState, useEffect } from 'react';
import { Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Box, CircularProgress, Alert, Divider, Stack } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';

// Import the StyledPaper component
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

// Quick Action Button
const QuickActionButton = styled(Button)(({ theme }) => ({
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

const QuickActions = () => {
  const navigate = useNavigate();
  const [openNewOrderDialog, setOpenNewOrderDialog] = useState(false);
  const [openDeliveryDialog, setOpenDeliveryDialog] = useState(false);
  const [openRefillDialog, setOpenRefillDialog] = useState(false);
  const [openInventoryDialog, setOpenInventoryDialog] = useState(false);
  const [waterLevelDevices, setWaterLevelDevices] = useState([]);
  const [selectedTank, setSelectedTank] = useState('');
  const [refillFormData, setRefillFormData] = useState({
    tank: '',
    initial_level: '',
    final_level: '',
    amount_added: '',
    notes: ''
  });
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inventoryAction, setInventoryAction] = useState('add'); // 'add', 'view'
  const [validationError, setValidationError] = useState(null);
  
  // Form data states
  const [orderFormData, setOrderFormData] = useState({
    customer: '',
    containerSize: '',
    quantity: 1,
    pricePerUnit: 0,
    totalAmount: 0,
    orderType: 'DELIVERY',
    status: 'PENDING'
  });
  
  const [deliveryFormData, setDeliveryFormData] = useState({
    customer: '',
    containerSize: '',
    quantity: 1,
    pricePerUnit: 0,
    totalAmount: 0,
    orderType: 'DELIVERY', // Always set to delivery
    status: 'PENDING',
    delivery_date: '',
    driver_name: '',
    notes: ''
  });
  
  // State for customers
  const [customers, setCustomers] = useState([]);
  
  // Container size options are defined below
  
  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers/');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };
  
  // Calculate total amount when quantity or price changes for delivery form
  useEffect(() => {
    const total = deliveryFormData.quantity * deliveryFormData.pricePerUnit;
    setDeliveryFormData(prev => ({ ...prev, totalAmount: total }));
  }, [deliveryFormData.quantity, deliveryFormData.pricePerUnit]);

  // Fetch devices and water level devices on component mount
  useEffect(() => {
    fetchDevices();
    fetchWaterLevelDevices();
  }, []);


  
  // Inventory form data
  const [inventoryFormData, setInventoryFormData] = useState({
    device_id: '',
    device_type: '',
    location: '',
    status: 'ONLINE',
    communication_protocol: 'MQTT',
    polling_frequency: 60,
    min_threshold: '',
    max_threshold: ''
  });
  
  // Container size options
  const containerSizes = [
    { value: 'GALLON', label: 'Gallon', defaultPrice: 35 },
    { value: 'ROUND', label: 'Round', defaultPrice: 25 },
    { value: 'SLIM', label: 'Slim', defaultPrice: 20 }
  ];
  
  // Handle navigation to different pages
  const handleNavigate = (path) => {
    navigate(path);
  };
  
  // Handle opening the new order dialog
  const handleOpenNewOrderDialog = async () => {
    try {
      // Fetch customers for the dropdown
      const response = await api.get('/customers/');
      setCustomers(response.data);
      setOpenNewOrderDialog(true);
    } catch (error) {
      console.error('Error fetching customers:', error);
      // If API fails, still open dialog but with empty customers list
      setOpenNewOrderDialog(true);
    }
  };
  
  // Handle form changes
  const handleOrderFormChange = (e) => {
    const { name, value } = e.target;
    
    // Create updated form data with the new value
    const updatedData = {
      ...orderFormData,
      [name]: value
    };
    
    // If quantity or container size changes, update the total amount
    if (name === 'quantity' || name === 'pricePerUnit' || name === 'containerSize') {
      // For container size, we could set a default price based on the selection
      let pricePerUnit = updatedData.pricePerUnit;
      
      if (name === 'containerSize') {
        // Set default prices based on container size
        const defaultPrice = containerSizes.find(c => c.value === value)?.defaultPrice || 0;
        pricePerUnit = defaultPrice;
        updatedData.pricePerUnit = pricePerUnit;
      }
      
      // Calculate total amount
      updatedData.totalAmount = updatedData.quantity * updatedData.pricePerUnit;
    }
    
    setOrderFormData(updatedData);
  };
  
  const handleRefillFormChange = (e) => {
    const { name, value } = e.target;
    setRefillFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'tank') {
        const selectedDevice = waterLevelDevices.find(d => d.id === parseInt(value));
        if (selectedDevice) {
          newData.initial_level = selectedDevice.water_level || 0;
        }
      } else if (name === 'final_level' && newData.initial_level !== '') {
        newData.amount_added = Math.max(0, parseFloat(value) - parseFloat(newData.initial_level)).toFixed(2);
      }
      return newData;
    });
  };
  
  const handleDeliveryFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'containerSize') {
      const defaultPrice = containerSizes.find(c => c.value === value)?.defaultPrice || 0;
      setDeliveryFormData(prev => ({
        ...prev,
        containerSize: value,
        pricePerUnit: defaultPrice
      }));
    } else {
      setDeliveryFormData({
        ...deliveryFormData,
        [name]: value
      });
    }
  };
  
  // Handle inventory form changes
  const handleInventoryFormChange = (e) => {
    // If changing device_id in add mode, check for duplicates
    if (e.target.name === 'device_id' && inventoryAction === 'add') {
      const isDuplicate = devices.some(device => 
        device.device_id.toLowerCase() === e.target.value.toLowerCase()
      );
      
      if (isDuplicate) {
        setValidationError('This Device ID already exists. Please use a unique identifier.');
      } else {
        setValidationError(null);
      }
    }
    
    setInventoryFormData({
      ...inventoryFormData,
      [e.target.name]: e.target.value
    });
  };
  
  // Fetch devices for inventory management
  // Fetch water level devices
  const fetchWaterLevelDevices = async () => {
    try {
      const response = await api.get('/devices/?device_type=WATER_LEVEL');
      setWaterLevelDevices(response.data);
    } catch (error) {
      console.error('Error fetching water level devices:', error);
    }
  };

  const fetchDevices = async () => {
    try {
      setLoading(true);
      // Use the configured axios instance which has the correct baseURL
      const response = await api.get('/devices/');
      setDevices(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setLoading(false);
    }
  };
  
  // Open inventory management dialog
  const handleOpenInventoryDialog = async () => {
    setInventoryFormData({
      device_id: '',
      device_type: '',
      location: '',
      status: 'ONLINE',
      communication_protocol: 'MQTT',
      polling_frequency: 60,
      min_threshold: '',
      max_threshold: ''
    });
    setValidationError(null); // Clear any previous validation errors
    setInventoryAction('add');
    setOpenInventoryDialog(true);
    fetchDevices();
  };
  
  // Submit new device to inventory
  const handleSubmitInventory = async () => {
    try {
      // Validate required fields
      if (!inventoryFormData.device_id || !inventoryFormData.device_type || !inventoryFormData.location) {
        setValidationError('Please fill in all required fields');
        return;
      }
      
      // Check for duplicate device ID
      const isDuplicate = devices.some(device => 
        device.device_id.toLowerCase() === inventoryFormData.device_id.toLowerCase()
      );
      
      if (isDuplicate) {
        setValidationError('This Device ID already exists. Please use a unique identifier.');
        return;
      }
      
      // Convert numeric fields
      const deviceData = {
        device_id: inventoryFormData.device_id,
        device_type: inventoryFormData.device_type,
        location: inventoryFormData.location,
        status: inventoryFormData.status || 'ONLINE',
        communication_protocol: inventoryFormData.communication_protocol,
        polling_frequency: parseInt(inventoryFormData.polling_frequency),
        min_threshold: inventoryFormData.min_threshold ? parseFloat(inventoryFormData.min_threshold) : null,
        max_threshold: inventoryFormData.max_threshold ? parseFloat(inventoryFormData.max_threshold) : null
      };
      
      // Send request to create device using API client
      const response = await api.post('/devices/', deviceData);
      
      // Reset form data
      setInventoryFormData({
        device_id: '',
        device_type: '',
        location: '',
        status: 'ONLINE',
        communication_protocol: 'MQTT',
        polling_frequency: 60,
        min_threshold: '',
        max_threshold: ''
      });
      
      // Close dialog
      setOpenInventoryDialog(false);
      
      // Navigate to IoT devices page using window.location for a full page refresh
      window.location.href = '/iot-devices';
    } catch (error) {
      console.error('Error creating device:', error.response?.data || error.message);
    }
  };
  
  // Handle form submissions
  const handleSubmitOrder = async () => {
    try {
      // Validate required fields
      if (!orderFormData.customer || !orderFormData.containerSize || orderFormData.quantity < 1) {
        console.error('Please fill in all required fields');
        return;
      }
      
      // Send request to create order with the correct structure - EXACTLY matching Orders.jsx
      await api.post('/orders/', {
        customer: orderFormData.customer,
        order_type: orderFormData.orderType,
        container_size: orderFormData.containerSize,
        quantity: orderFormData.quantity,
        price_per_unit: orderFormData.pricePerUnit,
        total_amount: orderFormData.totalAmount,
        status: 'PENDING'
      });
      
      // Close dialog and reset form
      setOpenNewOrderDialog(false);
      
      // Reset form data
      setOrderFormData({
        customer: '',
        containerSize: '',
        quantity: 1,
        pricePerUnit: 0,
        totalAmount: 0,
        orderType: 'DELIVERY',
        status: 'PENDING'
      });
      
      // Navigate to orders page
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error.response?.data || error.message);
    }
  };
  
  const handleSubmitDelivery = async () => {
    try {
      // Validate required fields for order
      if (!deliveryFormData.customer || !deliveryFormData.containerSize || deliveryFormData.quantity < 1) {
        alert('Please fill in all required order fields: Customer, Container Size, and Quantity');
        return;
      }
      
      // Validate required fields for delivery
      if (!deliveryFormData.delivery_date || !deliveryFormData.driver_name) {
        alert('Please fill in all required delivery fields: Delivery Date and Driver Name');
        return;
      }
      
      // Create the order with delivery type and scheduled date
      const response = await api.post('/orders/', {
        customer: deliveryFormData.customer,
        order_type: 'DELIVERY',  // Always set to delivery
        container_size: deliveryFormData.containerSize,
        quantity: deliveryFormData.quantity,
        price_per_unit: deliveryFormData.pricePerUnit,
        total_amount: deliveryFormData.totalAmount,
        scheduled_date: deliveryFormData.delivery_date, // Include the delivery date
        driver_name: deliveryFormData.driver_name,      // Include the driver name
        notes: deliveryFormData.notes,                  // Include any notes
        status: 'PENDING'
      });
      
      // Close dialog
      setOpenDeliveryDialog(false);
      
      // Reset form data
      setDeliveryFormData({
        customer: '',
        containerSize: '',
        quantity: 1,
        pricePerUnit: 0,
        totalAmount: 0,
        orderType: 'DELIVERY',
        status: 'PENDING',
        delivery_date: '',
        driver_name: '',
        notes: ''
      });
      
      // Show success message and navigate to orders page
      alert('Order with delivery schedule added successfully!');
      navigate('/orders'); // Using React Router's navigate instead of window.location
    } catch (error) {
      if (error.response && error.response.status === 401) {
        navigate('/login');
        return;
      }
      console.error('Error creating order with delivery schedule:', error);
      alert(`Error creating order with delivery schedule: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    }
  };
  
  const validateRefillForm = () => {
    if (!refillFormData.tank) {
      setValidationError('Please select a tank');
      return false;
    }
    if (!refillFormData.initial_level || isNaN(parseFloat(refillFormData.initial_level))) {
      setValidationError('Initial level must be a valid number');
      return false;
    }
    if (!refillFormData.final_level || isNaN(parseFloat(refillFormData.final_level))) {
      setValidationError('Final level must be a valid number');
      return false;
    }
    if (!refillFormData.amount_added || isNaN(parseFloat(refillFormData.amount_added))) {
      setValidationError('Amount added must be a valid number');
      return false;
    }
    return true;
  };

  const handleSubmitRefill = async () => {
    try {
      if (!validateRefillForm()) {
        return;
      }
      setLoading(true);
      // Convert string values to numbers
    const payload = {
      ...refillFormData,
      tank: parseInt(refillFormData.tank),
      initial_level: parseFloat(refillFormData.initial_level),
      final_level: parseFloat(refillFormData.final_level),
      amount_added: parseFloat(refillFormData.amount_added)
    };
    await api.post('/tank-refills/', payload);
      setOpenRefillDialog(false);
      setRefillFormData({
        tank: '',
        initial_level: '',
        final_level: '',
        amount_added: '',
        notes: ''
      });
    } catch (error) {
      setValidationError(error.response?.data?.detail || 'Failed to submit refill log');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <StyledPaper elevation={0}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1e293b' }}>Quick Actions</Typography>
      
      {/* New Order Button */}
      <QuickActionButton 
        startIcon={<span>➕</span>}
        onClick={handleOpenNewOrderDialog}
      >
        New Order
      </QuickActionButton>
      
      {/* New Device Button */}
      <QuickActionButton 
        startIcon={<span>📦</span>}
        onClick={handleOpenInventoryDialog}
      >
        New Device
      </QuickActionButton>
      
      {/* View Reports Button */}
      <QuickActionButton 
        startIcon={<span>📊</span>}
        onClick={() => handleNavigate('/reports')}
      >
        View Reports
      </QuickActionButton>
      
      {/* Add Delivery Schedule Button */}
      <QuickActionButton 
        startIcon={<span>📅</span>}
        onClick={async () => {
          try {
            // Fetch customers for the dropdown
            await fetchCustomers();
            setOpenDeliveryDialog(true);
          } catch (error) {
            console.error('Error fetching customers:', error);
            // If API fails, still open dialog but with empty customers list
            setOpenDeliveryDialog(true);
          }
        }}
      >
        Add Delivery Schedule
      </QuickActionButton>
      
      {/* Refill Tank Log Button */}
      <QuickActionButton 
        startIcon={<span>💧</span>}
        onClick={() => setOpenRefillDialog(true)}
      >
        Refill Tank Log
      </QuickActionButton>
      
      {/* New Order Dialog */}
      <Dialog open={openNewOrderDialog} onClose={() => setOpenNewOrderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Order</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="customer-label">Customer</InputLabel>
            <Select
              labelId="customer-label"
              name="customer"
              value={orderFormData.customer}
              onChange={handleOrderFormChange}
              label="Customer"
            >
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="container-size-label">Container Size</InputLabel>
            <Select
              labelId="container-size-label"
              name="containerSize"
              value={orderFormData.containerSize}
              onChange={handleOrderFormChange}
              label="Container Size"
            >
              {containerSizes.map((size) => (
                <MenuItem key={size.value} value={size.value}>
                  {size.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            name="quantity"
            label="Quantity"
            type="number"
            value={orderFormData.quantity}
            onChange={handleOrderFormChange}
            InputProps={{ inputProps: { min: 1 } }}
          />
          
          <TextField
            fullWidth
            margin="normal"
            name="pricePerUnit"
            label="Price Per Unit"
            type="number"
            value={orderFormData.pricePerUnit}
            onChange={handleOrderFormChange}
            InputProps={{ inputProps: { min: 1 } }}
          />
          
          <TextField
            fullWidth
            margin="normal"
            name="totalAmount"
            label="Total Amount"
            type="number"
            value={orderFormData.totalAmount}
            InputProps={{ readOnly: true }}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="order-type-label">Order Type</InputLabel>
            <Select
              labelId="order-type-label"
              name="orderType"
              value={orderFormData.orderType}
              onChange={handleOrderFormChange}
              label="Order Type"
            >
              <MenuItem value="DELIVERY">Delivery</MenuItem>
              <MenuItem value="PICKUP">Pickup</MenuItem>
              <MenuItem value="WALK_IN">Walk-in</MenuItem>
              <MenuItem value="SCHEDULED">Scheduled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewOrderDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitOrder}>Create Order</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delivery Schedule Dialog */}
      <Dialog open={openDeliveryDialog} onClose={() => setOpenDeliveryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Delivery Schedule</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="delivery-customer-label">Customer</InputLabel>
            <Select
              labelId="delivery-customer-label"
              name="customer"
              value={deliveryFormData.customer}
              onChange={handleDeliveryFormChange}
              label="Customer"
              required
            >
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="delivery-container-size-label">Container Size</InputLabel>
            <Select
              labelId="delivery-container-size-label"
              name="containerSize"
              value={deliveryFormData.containerSize}
              onChange={handleDeliveryFormChange}
              label="Container Size"
              required
            >
              {containerSizes.map((size) => (
                <MenuItem key={size.value} value={size.value}>
                  {size.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            name="quantity"
            label="Quantity"
            type="number"
            value={deliveryFormData.quantity}
            onChange={handleDeliveryFormChange}
            InputProps={{ inputProps: { min: 1 } }}
            required
          />
          
          <TextField
            fullWidth
            margin="normal"
            name="pricePerUnit"
            label="Price Per Unit"
            type="number"
            value={deliveryFormData.pricePerUnit}
            onChange={handleDeliveryFormChange}
            InputProps={{ inputProps: { min: 0 } }}
            required
          />
          
          <TextField
            fullWidth
            margin="normal"
            name="totalAmount"
            label="Total Amount"
            type="number"
            value={deliveryFormData.totalAmount}
            InputProps={{ readOnly: true }}
          />
          
          <TextField
            fullWidth
            margin="normal"
            name="delivery_date"
            label="Delivery Date"
            type="date"
            value={deliveryFormData.delivery_date}
            onChange={handleDeliveryFormChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          
          <TextField
            fullWidth
            margin="normal"
            name="driver_name"
            label="Driver Name"
            value={deliveryFormData.driver_name}
            onChange={handleDeliveryFormChange}
            required
          />
          
          <TextField
            fullWidth
            margin="normal"
            name="notes"
            label="Notes"
            value={deliveryFormData.notes}
            onChange={handleDeliveryFormChange}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeliveryDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitDelivery}>Create Order with Delivery</Button>
        </DialogActions>
      </Dialog>
      
      {/* Refill Tank Log Dialog */}
      <Dialog open={openRefillDialog} onClose={() => setOpenRefillDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Tank Refill</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {validationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationError}
              </Alert>
            )}
            <FormControl fullWidth>
              <InputLabel>Select Tank</InputLabel>
              <Select
                name="tank"
                value={refillFormData.tank}
                onChange={handleRefillFormChange}
                label="Select Tank"
              >
                {waterLevelDevices.map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.device_id} - Current Level: {device.water_level || 0}%
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="initial_level"
              label="Initial Water Level (%)"
              type="number"
              value={refillFormData.initial_level}
              onChange={handleRefillFormChange}
              fullWidth
              disabled
            />
            <TextField
              name="final_level"
              label="Final Water Level (%)"
              type="number"
              value={refillFormData.final_level}
              onChange={handleRefillFormChange}
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              name="amount_added"
              label="Amount Added (%)"
              type="number"
              value={refillFormData.amount_added}
              onChange={handleRefillFormChange}
              fullWidth
              disabled
            />
            <TextField
              name="notes"
              label="Notes"
              multiline
              rows={3}
              value={refillFormData.notes}
              onChange={handleRefillFormChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setOpenRefillDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitRefill}
            sx={{ borderRadius: 2, textTransform: 'none' }}
            disabled={!refillFormData.tank || !refillFormData.final_level || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Inventory Management Dialog */}
      <Dialog 
        open={openInventoryDialog} 
        onClose={() => setOpenInventoryDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <AddIcon color="primary" />
            <Typography variant="h6">
              {inventoryAction === 'add' ? 'Add New Device' : 'View Inventory'}
            </Typography>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ mt: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : inventoryAction === 'add' ? (
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
                  value={inventoryFormData.device_type}
                  onChange={handleInventoryFormChange}
                  label="Device Type"
                >
                  <MenuItem value="WATER_LEVEL">Water Level Sensor</MenuItem>
                  <MenuItem value="FLOW_METER">Flow Meter</MenuItem>
                  <MenuItem value="QUALITY_SENSOR">Water Quality Sensor</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="device_id"
                label="Device ID"
                value={inventoryFormData.device_id}
                onChange={handleInventoryFormChange}
                fullWidth
              />
              <TextField
                name="location"
                label="Location"
                value={inventoryFormData.location}
                onChange={handleInventoryFormChange}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Communication Protocol</InputLabel>
                <Select
                  name="communication_protocol"
                  value={inventoryFormData.communication_protocol}
                  onChange={handleInventoryFormChange}
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
                value={inventoryFormData.polling_frequency}
                onChange={handleInventoryFormChange}
                fullWidth
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  name="min_threshold"
                  label="Min Threshold"
                  type="number"
                  value={inventoryFormData.min_threshold}
                  onChange={handleInventoryFormChange}
                  fullWidth
                />
                <TextField
                  name="max_threshold"
                  label="Max Threshold"
                  type="number"
                  value={inventoryFormData.max_threshold}
                  onChange={handleInventoryFormChange}
                  fullWidth
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {devices.length} devices found in inventory
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={() => setInventoryAction('add')}
                sx={{ mb: 2 }}
              >
                Add New Device
              </Button>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={() => handleNavigate('/devices')}
              >
                View Full Inventory
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setOpenInventoryDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancel
          </Button>
          {inventoryAction === 'add' && (
            <Button 
              variant="contained" 
              onClick={handleSubmitInventory}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Add Device
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </StyledPaper>
  );
};

export default QuickActions;
