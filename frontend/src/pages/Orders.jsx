import { useState, useEffect } from 'react';
import api from '../utils/axios';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Tooltip,
  Alert,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as OrderIcon,
  Person as CustomerIcon,
  Add as AddIcon,
  LocalShipping as DeliveryIcon,
  Store as WalkInIcon,
  Schedule as ScheduledIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function Orders() {
  const [tabValue, setTabValue] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [emailError, setEmailError] = useState('');

  const [newOrder, setNewOrder] = useState({
    customer: '',
    orderType: 'WALK_IN',
    containerSize: '',
    quantity: 1,
    pricePerUnit: 0,
    totalAmount: 0
  });

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDateRange, setFilterDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  
  const [overviewStats, setOverviewStats] = useState(null);

  // Options for order types and container sizes
  const orderTypes = [
    { value: 'WALK_IN', label: 'Walk-in' },
    { value: 'DELIVERY', label: 'Delivery' },
    { value: 'SCHEDULED', label: 'Scheduled' }
  ];
  const containerSizes = [
    { value: 'GALLON', label: 'Gallon', defaultPrice: 35 },
    { value: 'ROUND', label: 'Round', defaultPrice: 25 },
    { value: 'SLIM', label: 'Slim', defaultPrice: 20 }
  ];

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers/');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchOverviewStats = async () => {
    try {
      const { data } = await api.get('/dashboard/overview/');
      setOverviewStats(data);
    } catch (error) {
      console.error('Error fetching overview stats in Orders:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      console.log('Making API request to fetch orders...');
      const response = await api.get('/orders/');
      console.log('Orders fetched successfully:', response.data);
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchOverviewStats();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.address) {
      console.error('Name, phone and address are required');
      return;
    }

    const customerData = {
      ...newCustomer,
      email: newCustomer.email || null  // Set empty email to null
    };

    if (customerData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerData.email)) {
        console.error('Invalid email format');
        return;
      }
    }

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}/`, customerData);
      } else {
        await api.post('/customers/', customerData);
      }
      
      fetchCustomers();
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      setEditingCustomer(null);
      setEmailError('');
      setOpen(false);
    } catch (error) {
      if (error.response?.data?.email) {
        setEmailError('This email is already registered');
      } else {
        console.error('Error saving customer:', error);
      }
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setNewCustomer(customer);
    setOpen(true);
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setDeleteError('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/customers/${customerToDelete.id}/`);
      await fetchCustomers();
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      setDeleteError('');
    } catch (error) {
      setDeleteError('Failed to delete customer. Please try again.');
      console.error('Error deleting customer:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
    setDeleteError('');
  };

  const handleContainerSizeChange = (event) => {
    const size = event.target.value;
    const defaultPrice = containerSizes.find(c => c.value === size)?.defaultPrice || 0;
    setNewOrder(prev => ({
      ...prev,
      containerSize: size,
      pricePerUnit: defaultPrice,
      totalAmount: defaultPrice * prev.quantity
    }));
  };

  const handleCreateOrder = async () => {
    if (!newOrder.customer || !newOrder.containerSize || newOrder.quantity < 1) {
      console.error('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/orders/', {
        customer: newOrder.customer,
        order_type: newOrder.orderType,  // Change orderType to order_type
        container_size: newOrder.containerSize,
        quantity: newOrder.quantity,
        price_per_unit: newOrder.pricePerUnit,
        total_amount: newOrder.totalAmount,
        status: 'PENDING'
      });
      // Fetch updated orders list
      await fetchOrders();
      // Reset form
      setNewOrder({
        customer: '',
        orderType: 'WALK_IN',
        containerSize: '',
        quantity: 1,
        pricePerUnit: 0,
        totalAmount: 0
      });
      // Switch to Orders tab to show the new order
      setTabValue(0);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const applyFilters = () => {
    let result = [...orders];
    
    // Filter by status
    if (filterStatus !== 'ALL') {
      result = result.filter(order => order.status === filterStatus);
    }
    
    // Filter by date range
    if (filterDateRange.startDate && filterDateRange.endDate) {
      const start = new Date(filterDateRange.startDate);
      const end = new Date(filterDateRange.endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      
      result = result.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= start && orderDate <= end;
      });
    }
    
    setFilteredOrders(result);
  };
  
  const resetFilters = () => {
    setFilterStatus('ALL');
    setFilterDateRange({ startDate: '', endDate: '' });
    setFilteredOrders(orders);
  };
  
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.post(`/orders/${orderId}/status/`, { status: newStatus });
      // Refresh orders list after status update
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      // Show error message to user
      setSnackbar({
        open: true,
        message: 'Failed to update order status',
        severity: 'error'
      });
    }
  };
  
  const handleViewOrderDetails = (order) => {
    console.log('handleViewOrderDetails called with order:', order);
    
    // Reset any previous delivery details
    setDeliveryDetails(null);
    setIsLoadingDetails(false);
    
    // Set the selected order and open dialog
    console.log('Setting selected order and opening dialog');
    setSelectedOrder(order);
    console.log('Selected order set, now setting showOrderDialog to true');
    setShowOrderDialog(true);
    
    // Force a re-render to ensure state updates
    setTimeout(() => {
      console.log('After state update - showOrderDialog:', true, 'selectedOrder:', order);
    }, 0);
    
    // Then fetch delivery details if needed
    if (order.order_type === 'DELIVERY') {
      setIsLoadingDetails(true);
      api.get(`/deliveries/?order=${order.id}`)
        .then(response => {
          if (response.data && response.data.length > 0) {
            setDeliveryDetails(response.data[0]);
            console.log('Delivery details loaded for order:', order.id);
          } else {
            setDeliveryDetails(null);
            console.log('No delivery details found for order:', order.id);
          }
        })
        .catch(error => {
          console.error('Error fetching delivery details:', error);
          setDeliveryDetails(null);
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    } else {
      setDeliveryDetails(null);
    }
  };
  
  const handleCloseOrderDetails = () => {
    console.log('Closing order details dialog');
    setShowOrderDialog(false);
    setSelectedOrder(null);
    setDeliveryDetails(null);
    setIsLoadingDetails(false);
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const exportOrderToCSV = (order) => {
    const customer = customers.find(c => c.id === order.customer) || { name: 'Unknown' };
    const containerSize = containerSizes.find(s => s.value === order.container_size)?.label || order.container_size;
    const orderType = orderTypes.find(t => t.value === order.order_type)?.label || order.order_type;
    
    const headers = ['Order ID', 'Customer', 'Order Type', 'Container Size', 'Quantity', 'Price per Unit', 'Total Amount', 'Status', 'Created At'];
    const data = [
      order.id,
      customer.name,
      orderType,
      containerSize,
      order.quantity,
      order.price_per_unit,
      order.total_amount,
      order.status,
      formatDate(order.created_at)
    ];
    
    const csvContent = [
      headers.join(','),
      data.join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `order-${order.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportAllOrdersToCSV = () => {
    if (filteredOrders.length === 0) return;
    
    const headers = ['Order ID', 'Customer', 'Order Type', 'Container Size', 'Quantity', 'Price per Unit', 'Total Amount', 'Status', 'Created At'];
    
    const rows = filteredOrders.map(order => {
      const customer = customers.find(c => c.id === order.customer) || { name: 'Unknown' };
      const containerSize = containerSizes.find(s => s.value === order.container_size)?.label || order.container_size;
      const orderType = orderTypes.find(t => t.value === order.order_type)?.label || order.order_type;
      
      return [
        order.id,
        customer.name,
        orderType,
        containerSize,
        order.quantity,
        order.price_per_unit,
        order.total_amount,
        order.status,
        formatDate(order.created_at)
      ].join(',');
    });
    
    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders-export-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    console.log('Fetching orders...');
    fetchOrders();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [filterStatus, filterDateRange.startDate, filterDateRange.endDate]);

  return (
    <Box sx={{
      p: 4,
      minHeight: '100vh',
      bgcolor: theme => theme.palette.mode === 'dark' ? theme.palette.background.default : '#f5f5f5'
    }}>
      <Box sx={{ mb: 3 }}>
        {overviewStats && (
          <Grid container spacing={2}>
            <Grid item>
              <Typography variant="h6">Total Orders Today: {overviewStats.orders.daily}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="h6">Total Sales Today: {overviewStats.sales.daily}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="h6">Pending Orders Today: {overviewStats.pending.daily}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="h6">Refills Done Today: {overviewStats.refills.daily.count}</Typography>
            </Grid>
          </Grid>
        )}
      </Box>
      <Card elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="order management tabs"
          sx={{
            bgcolor: 'primary.main',
            borderRadius: '8px 8px 0 0',
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': { color: '#fff' }
            }
          }}
        >
          <Tab icon={<OrderIcon />} label="Orders" iconPosition="start" />
          <Tab icon={<AddIcon />} label="Create Order" iconPosition="start" />
          <Tab icon={<CustomerIcon />} label="Customers" iconPosition="start" />
        </Tabs>
      </Card>

      <TabPanel value={tabValue} index={0}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <OrderIcon color="primary" />
                Orders Overview
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* Status Filter */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="ALL">All Statuses</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="PROCESSING">Processing</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
                
                {/* Date Range Filter */}
                <TextField
                  label="From"
                  type="date"
                  size="small"
                  value={filterDateRange.startDate}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="To"
                  type="date"
                  size="small"
                  value={filterDateRange.endDate}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                
                {/* Export Button */}
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={exportAllOrdersToCSV}
                  disabled={filteredOrders.length === 0}
                >
                  Export
                </Button>
                
                {/* Reset Button */}
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Order Type</TableCell>
                    <TableCell>Container Size</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Price per Unit</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const customer = customers.find(c => c.id === order.customer);
                    return (
                      <TableRow 
                        key={order.id} 
                        hover
                        onClick={(e) => {
                          console.log('Row clicked for order:', order.id);
                          // Don't trigger row click if clicking on interactive elements
                          if (
                            e.target.closest('button') ||
                            e.target.closest('.MuiSelect-root') ||
                            e.target.closest('.MuiChip-root')
                          ) {
                            console.log('Click was on an interactive element, ignoring...');
                            return;
                          }
                          console.log('Calling handleViewOrderDetails...');
                          handleViewOrderDetails(order);
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell 
                          sx={{ color: 'primary.main', fontWeight: 'medium' }}
                        >
                          #{order.id}
                        </TableCell>
                        <TableCell>{customer?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Chip
                            icon={
                              order.order_type === 'WALK_IN' ? <WalkInIcon /> :
                              order.order_type === 'DELIVERY' ? <DeliveryIcon /> :
                              <ScheduledIcon />
                            }
                            label={orderTypes.find(t => t.value === order.order_type)?.label}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={containerSizes.find(s => s.value === order.container_size)?.label}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>₱{order.price_per_unit}</TableCell>
                        <TableCell>
                          <Typography color="primary" fontWeight="bold">
                            ₱{order.total_amount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={order.status}
                              size="small"
                              color={
                                order.status === 'PENDING' ? 'warning' : 
                                order.status === 'PROCESSING' ? 'info' : 
                                order.status === 'COMPLETED' ? 'success' : 
                                'error' // CANCELLED
                              }
                            />
                            <Select
                              size="small"
                              value=""
                              displayEmpty
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              sx={{ 
                                minWidth: 120,
                                height: 32,
                                ml: 1,
                                '& .MuiSelect-select': {
                                  py: 0.5
                                }
                              }}
                              renderValue={() => 'Change Status'}
                            >
                              {order.status !== 'PENDING' && (
                                <MenuItem value="PENDING">Set as Pending</MenuItem>
                              )}
                              {order.status !== 'PROCESSING' && (
                                <MenuItem value="PROCESSING">Set as Processing</MenuItem>
                              )}
                              {order.status !== 'COMPLETED' && (
                                <MenuItem value="COMPLETED">Set as Completed</MenuItem>
                              )}
                              {order.status !== 'CANCELLED' && (
                                <MenuItem value="CANCELLED">Set as Cancelled</MenuItem>
                              )}
                            </Select>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="medium" 
                              color="primary"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation(); // Prevent row click
                                console.log('View details icon clicked for order:', order);
                                try {
                                  handleViewOrderDetails(order);
                                } catch (error) {
                                  console.error('Error in handleViewOrderDetails:', error);
                                }
                              }}
                              sx={{ boxShadow: 1, zIndex: 1000 }}
                            >
                              <ViewIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="secondary" 
                              onClick={(e) => exportOrderToCSV(order)}
                              title="Export to CSV"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card elevation={3} sx={{ maxWidth: 700, mx: 'auto', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddIcon color="primary" />
              Create New Order
            </Typography>
            <Divider sx={{ my: 2 }} />
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateOrder();
            }}>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Select Customer</InputLabel>
                  <Select
                    value={newOrder.customer}
                    onChange={(e) => setNewOrder({ ...newOrder, customer: e.target.value })}
                    required
                    sx={{ borderRadius: 2 }}
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CustomerIcon fontSize="small" />
                          <Typography>{customer.name}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Order Type</InputLabel>
                  <Select
                    value={newOrder.orderType}
                    onChange={(e) => setNewOrder({ ...newOrder, orderType: e.target.value })}
                    required
                    sx={{ borderRadius: 2 }}
                  >
                    {orderTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {type.value === 'WALK_IN' ? <WalkInIcon /> :
                           type.value === 'DELIVERY' ? <DeliveryIcon /> :
                           <ScheduledIcon />}
                          <Typography>{type.label}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Container Size</InputLabel>
                  <Select
                    value={newOrder.containerSize}
                    onChange={handleContainerSizeChange}
                    required
                    sx={{ borderRadius: 2 }}
                  >
                    {containerSizes.map((size) => (
                      <MenuItem key={size.value} value={size.value}>
                        {size.label} - ₱{size.defaultPrice}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Quantity"
                  type="number"
                  value={newOrder.quantity}
                  onChange={(e) => {
                    const quantity = parseInt(e.target.value) || 0;
                    setNewOrder(prev => ({
                      ...prev,
                      quantity,
                      totalAmount: prev.pricePerUnit * quantity
                    }));
                  }}
                  InputProps={{ inputProps: { min: 1, step: 1 } }}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />

                <TextField
                  label="Price per Unit"
                  type="number"
                  value={newOrder.pricePerUnit}
                  onChange={(e) => {
                    const pricePerUnit = parseFloat(e.target.value) || 0;
                    setNewOrder(prev => ({
                      ...prev,
                      pricePerUnit,
                      totalAmount: prev.quantity * pricePerUnit
                    }));
                  }}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />

                <TextField
                  label="Total Amount"
                  type="number"
                  value={newOrder.totalAmount}
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ borderRadius: 2 }}
                  startIcon={<AddIcon />}
                >
                  Create Order
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CustomerIcon color="primary" />
                Customer Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingCustomer(null);
                  setNewCustomer({ name: '', email: '', phone: '', address: '' });
                  setOpen(true);
                }}
                sx={{ borderRadius: 2 }}
              >
                Add New Customer
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CustomerIcon color="primary" fontSize="small" />
                          <Typography>{customer.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit Customer">
                          <IconButton onClick={() => handleEdit(customer)} color="primary" size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Customer">
                          <IconButton onClick={() => handleDeleteClick(customer)} color="error" size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Customer Dialog */}
        <Dialog 
          open={open} 
          onClose={() => setOpen(false)}
          PaperProps={{ sx: { borderRadius: 2 } }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingCustomer ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                fullWidth
                required
                error={!newCustomer.name}
                helperText={!newCustomer.name ? 'Name is required' : ''}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                label="Email (Optional)"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                fullWidth
                error={!!emailError}
                helperText={emailError}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                label="Phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                fullWidth
                required
                error={!newCustomer.phone}
                helperText={!newCustomer.phone ? 'Phone is required' : ''}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                label="Address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                fullWidth
                multiline
                rows={3}
                required
                error={!newCustomer.address}
                helperText={!newCustomer.address ? 'Address is required' : ''}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setOpen(false)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddCustomer}
              variant="contained"
              startIcon={editingCustomer ? <EditIcon /> : <AddIcon />}
              sx={{ borderRadius: 2 }}
            >
              {editingCustomer ? 'Save Changes' : 'Add Customer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>
              Are you sure you want to delete customer: <strong>{customerToDelete?.name}</strong>?
            </Alert>
            {deleteError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {deleteError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={handleDeleteCancel}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              startIcon={<DeleteIcon />}
              sx={{ borderRadius: 2 }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      {/* Order Details Dialog */}
      <Dialog
        open={showOrderDialog}
        onClose={handleCloseOrderDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 2,
            minWidth: '80vw',
            maxHeight: '90vh'
          } 
        }}
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <OrderIcon color="primary" />
                <Typography variant="h6">Order Details - #{selectedOrder.id}</Typography>
              </Box>
              <IconButton onClick={handleCloseOrderDetails} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Order Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Order ID</Typography>
                          <Typography variant="body1" fontWeight="500">#{selectedOrder.id}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip
                            label={selectedOrder.status}
                            size="small"
                            color={
                              selectedOrder.status === 'PENDING' ? 'warning' : 
                              selectedOrder.status === 'PROCESSING' ? 'info' : 
                              selectedOrder.status === 'COMPLETED' ? 'success' : 
                              'error' // CANCELLED
                            }
                            sx={{ mt: 0.5 }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Created Date</Typography>
                          <Typography variant="body1">{formatDate(selectedOrder.created_at)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                          <Typography variant="body1">{formatDate(selectedOrder.status_changed_at || selectedOrder.created_at)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Order Type</Typography>
                          <Typography variant="body1">
                            {orderTypes.find(t => t.value === selectedOrder.order_type)?.label || selectedOrder.order_type}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Container Size</Typography>
                          <Typography variant="body1">
                            {containerSizes.find(s => s.value === selectedOrder.container_size)?.label || selectedOrder.container_size}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Customer Information</Typography>
                      <Grid container spacing={2}>
                        {(() => {
                          const customer = customers.find(c => c.id === selectedOrder.customer);
                          return customer ? (
                            <>
                              <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">Name</Typography>
                                <Typography variant="body1" fontWeight="500">{customer.name}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Phone</Typography>
                                <Typography variant="body1">{customer.phone}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Email</Typography>
                                <Typography variant="body1">{customer.email || 'N/A'}</Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">Address</Typography>
                                <Typography variant="body1">{customer.address}</Typography>
                              </Grid>
                            </>
                          ) : (
                            <Grid item xs={12}>
                              <Typography variant="body1">Customer information not available</Typography>
                            </Grid>
                          );
                        })()} 
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Order Summary</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Item</TableCell>
                              <TableCell align="right">Quantity</TableCell>
                              <TableCell align="right">Price per Unit</TableCell>
                              <TableCell align="right">Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                {containerSizes.find(s => s.value === selectedOrder.container_size)?.label || selectedOrder.container_size}
                              </TableCell>
                              <TableCell align="right">{selectedOrder.quantity}</TableCell>
                              <TableCell align="right">₱{selectedOrder.price_per_unit}</TableCell>
                              <TableCell align="right">₱{selectedOrder.total_amount}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell colSpan={2} />
                              <TableCell align="right"><strong>Total Amount</strong></TableCell>
                              <TableCell align="right">
                                <Typography variant="body1" fontWeight="bold" color="primary">
                                  ₱{selectedOrder.total_amount}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Delivery Information Section - Only show for delivery orders */}
                {selectedOrder.order_type === 'DELIVERY' && (
                  <Grid item xs={12}>
                    <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DeliveryIcon color="primary" />
                          Delivery Information
                        </Typography>
                        
                        {deliveryDetails ? (
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">Delivery Date</Typography>
                              <Typography variant="body1" fontWeight="500">
                                {deliveryDetails.delivery_date ? formatDate(deliveryDetails.delivery_date) : 'Not scheduled'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">Driver Name</Typography>
                              <Typography variant="body1">{deliveryDetails.driver_name || 'Not assigned'}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Delivery Notes</Typography>
                              <Typography variant="body1" sx={{ mt: 0.5, p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)' }}>
                                {deliveryDetails.notes || 'No notes provided'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">Delivery Status</Typography>
                              <Chip
                                label={deliveryDetails.status || 'SCHEDULED'}
                                size="small"
                                color={
                                  deliveryDetails.status === 'DELIVERED' ? 'success' :
                                  deliveryDetails.status === 'IN_TRANSIT' ? 'info' :
                                  deliveryDetails.status === 'SCHEDULED' ? 'warning' :
                                  'default'
                                }
                                sx={{ mt: 0.5 }}
                              />
                            </Grid>
                          </Grid>
                        ) : (
                          <Alert severity="info" sx={{ borderRadius: 2 }}>
                            This is a delivery order, but no delivery details are available yet.
                            {selectedOrder.scheduled_date && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2">
                                  <strong>Scheduled Delivery Date:</strong> {formatDate(selectedOrder.scheduled_date)}
                                </Typography>
                                {selectedOrder.driver_name && (
                                  <Typography variant="body2">
                                    <strong>Driver:</strong> {selectedOrder.driver_name}
                                  </Typography>
                                )}
                                {selectedOrder.notes && (
                                  <Typography variant="body2">
                                    <strong>Notes:</strong> {selectedOrder.notes}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportOrderToCSV(selectedOrder)}
              >
                Export to CSV
              </Button>
              <Button
                variant="contained"
                onClick={handleCloseOrderDetails}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default Orders;