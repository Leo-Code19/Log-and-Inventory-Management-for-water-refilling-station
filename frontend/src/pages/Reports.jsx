import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography,
  Button,
  Collapse,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';

function Reports() {
  const { isAuthenticated } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productType, setProductType] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    total_orders: 0,
    total_sales: 0,
    total_deliveries: 0,
    total_refills: 0
  });

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  // Fetch report data from the API
  const fetchReportData = async () => {
    if (!reportType || !isAuthenticated) return;
    
    setLoading(true);
    
    try {
      // Prepare query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);
      if (customerSearch) params.append('customer_id', customerSearch);
      if (productType) params.append('product_type', productType);
      
      // Use existing API endpoints based on report type
      let response;
      let processedData = [];
      let summary = {};
      
      switch(reportType) {
        case 'sales':
          response = await api.get('/reports/sales/', { params });
          processedData = response.data.data || [];
          summary = response.data.summary || {};
          break;
        case 'inventory':
          response = await api.get('/reports/inventory/', { params });
          processedData = response.data.data || [];
          summary = response.data.summary || {};
          break;
        case 'delivery':
          response = await api.get('/reports/delivery/', { params });
          processedData = response.data.data || [];
          summary = response.data.summary || {};
          break;
        case 'refill':
          response = await api.get('/reports/refill-history/', { params });
          processedData = response.data.data || [];
          summary = response.data.summary || {};
          break;
        case 'orders':
          response = await api.get('/reports/customer-orders/', { params });
          processedData = response.data.data || [];
          summary = response.data.summary || {};
          break;
        default:
          processedData = [];
          summary = {};
          break;
      }
      
      setReportData(processedData);
      setSummaryData({
        ...summaryData,
        ...summary
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Generate mock data for demo purposes
      generateMockData(reportType);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate mock data for demo purposes when API fails
  const generateMockData = (type) => {
    let mockData = [];
    let mockSummary = {};
    
    switch(type) {
      case 'sales':
        mockData = Array.from({length: 7}, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 5000) + 1000
        }));
        mockSummary = { total_sales: 25000, total_orders: 120 };
        break;
        
      case 'inventory':
        mockData = [
          { id: 1, name: 'Water Filter', type: 'accessory', status: 'active', quantity: 45 },
          { id: 2, name: '5-Gallon Container', type: 'container', status: 'active', quantity: 120 },
          { id: 3, name: 'Water Dispenser', type: 'device', status: 'active', quantity: 30 },
          { id: 4, name: 'Purifier', type: 'device', status: 'low_stock', quantity: 5 }
        ];
        mockSummary = { total_devices: 4, active_devices: 3 };
        break;
        
      case 'delivery':
        mockData = [
          { id: 1, customer_name: 'John Doe', delivery_date: '2023-06-01', status: 'completed', address: '123 Main St' },
          { id: 2, customer_name: 'Jane Smith', delivery_date: '2023-06-02', status: 'pending', address: '456 Oak Ave' },
          { id: 3, customer_name: 'Bob Johnson', delivery_date: '2023-06-03', status: 'in_transit', address: '789 Pine Rd' }
        ];
        mockSummary = { total_deliveries: 3, pending_deliveries: 1 };
        break;
        
      case 'refill':
        mockData = Array.from({length: 5}, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 15) + 5
        }));
        mockSummary = { total_refills: 75 };
        break;
        
      case 'orders':
        mockData = [
          { id: 1, customer_name: 'John Doe', order_date: '2023-06-01', total_amount: 1500, status: 'completed' },
          { id: 2, customer_name: 'Jane Smith', order_date: '2023-06-02', total_amount: 2500, status: 'pending' },
          { id: 3, customer_name: 'Bob Johnson', order_date: '2023-06-03', total_amount: 3500, status: 'processing' }
        ];
        mockSummary = { total_orders: 3, total_sales: 7500 };
        break;
        
      default:
        break;
    }
    
    setReportData(mockData);
    setSummaryData({
      ...summaryData,
      ...mockSummary
    });
  };
  
  // Fetch dashboard summary data
  const fetchDashboardSummary = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Use the existing dashboard summary endpoint
      const response = await api.get('/dashboard/summary/');
      
      // Transform the data to match the expected format
      const summaryData = {
        total_orders: response.data.orders?.total || 0,
        total_sales: response.data.sales?.total || 0,
        total_deliveries: response.data.deliveries?.total || 0,
        total_refills: response.data.refills?.total || 0
      };
      
      setSummaryData(summaryData);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      // Provide fallback data
      setSummaryData({
        total_orders: 120,
        total_sales: 25000,
        total_deliveries: 85,
        total_refills: 75
      });
    }
  };
  
  // Effect to fetch dashboard summary on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardSummary();
      // Since we now have a default report type, fetch it immediately
      fetchReportData();
    }
  }, [isAuthenticated]);
  
  // Effect to fetch report data when filters change
  useEffect(() => {
    if (reportType && isAuthenticated) {
      fetchReportData();
    }
  }, [reportType, startDate, endDate, customerSearch, productType, isAuthenticated]);

  const renderSalesReport = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Order ID</TableCell>
            <TableCell>Customer Name</TableCell>
            <TableCell>Items Ordered</TableCell>
            <TableCell>Total Amount</TableCell>
            <TableCell>Payment Method</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reportData.length > 0 ? (
            reportData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.order_id}</TableCell>
                <TableCell>{row.customer_name}</TableCell>
                <TableCell>{row.items}</TableCell>
                <TableCell>{row.total_amount}</TableCell>
                <TableCell>{row.payment_method || 'Cash'}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                {loading ? 'Loading...' : 'No data available'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderInventoryReport = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product Name</TableCell>
            <TableCell>Stock In</TableCell>
            <TableCell>Stock Out</TableCell>
            <TableCell>Current Stock</TableCell>
            <TableCell>Low Stock Alert</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reportData.length > 0 ? (
            reportData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.product_name}</TableCell>
                <TableCell>{row.stock_in}</TableCell>
                <TableCell>{row.stock_out}</TableCell>
                <TableCell>{row.current_stock}</TableCell>
                <TableCell>{row.low_stock_alert}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">
                {loading ? 'Loading...' : 'No data available'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDeliveryReport = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Delivery ID</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>No. of Orders</TableCell>
            <TableCell>Route</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reportData.length > 0 ? (
            reportData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.delivery_id}</TableCell>
                <TableCell>{row.driver}</TableCell>
                <TableCell>{row.number_of_orders}</TableCell>
                <TableCell>{row.route}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                {loading ? 'Loading...' : 'No data available'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderRefillHistoryReport = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Refill ID</TableCell>
            <TableCell>Customer Name</TableCell>
            <TableCell>Container Type</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reportData.length > 0 ? (
            reportData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.refill_id}</TableCell>
                <TableCell>{row.customer_name}</TableCell>
                <TableCell>{row.container_type}</TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell>{row.amount}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                {loading ? 'Loading...' : 'No data available'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCustomerOrdersReport = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Order ID</TableCell>
            <TableCell>Customer Name</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Total Amount</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reportData.length > 0 ? (
            reportData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.order_id}</TableCell>
                <TableCell>{row.customer_name}</TableCell>
                <TableCell>{row.items}</TableCell>
                <TableCell>{row.total_amount}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                {loading ? 'Loading...' : 'No data available'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderReportTable = () => {
    if (loading) {
      return (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
          Loading report data...
        </Typography>
      );
    }
    
    switch(reportType) {
      case 'sales':
        return renderSalesReport();
      case 'inventory':
        return renderInventoryReport();
      case 'delivery':
        return renderDeliveryReport();
      case 'refill':
        return renderRefillHistoryReport();
      case 'orders':
        return renderCustomerOrdersReport();
      default:
        // This should never happen now that we set a default report type
        return (
          <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
            Please select a report type to view the data
          </Typography>
        );
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const exportToPDF = () => {
    if (loading || !reportData.length) {
      alert('No data available to export');
      return;
    }
    
    try {
      // Create a simple PDF with basic formatting
      const doc = new jsPDF();
      
      // Add a title
      const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      doc.setFontSize(16);
      doc.text(title, 105, 15, { align: 'center' });
      
      // Set up table dimensions
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const usableWidth = pageWidth - (margin * 2);
      let y = 25; // Starting y position after title
      
      // Get headers
      const headers = [];
      if (reportData.length > 0) {
        for (const key in reportData[0]) {
          // Convert snake_case to Title Case
          headers.push(key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
        }
      }
      
      // Calculate column widths (distribute evenly)
      const colWidth = usableWidth / headers.length;
      
      // Draw header row
      doc.setFillColor(41, 128, 185); // Header background color
      doc.setDrawColor(0);
      doc.setTextColor(255); // White text for header
      doc.setFontSize(10);
      doc.rect(margin, y, usableWidth, 8, 'F');
      
      headers.forEach((header, i) => {
        doc.text(header, margin + (i * colWidth) + (colWidth / 2), y + 5, { align: 'center' });
      });
      
      y += 8; // Move down after header
      
      // Draw data rows
      doc.setTextColor(0); // Black text for data
      doc.setFontSize(8);
      
      reportData.forEach((item, rowIndex) => {
        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.setFillColor(240, 240, 240); // Light gray for even rows
          doc.rect(margin, y, usableWidth, 7, 'F');
        }
        
        // Add row data
        let i = 0;
        for (const key in item) {
          const value = item[key] ? item[key].toString() : '';
          // Truncate long values
          const displayValue = value.length > 20 ? value.substring(0, 18) + '...' : value;
          doc.text(displayValue, margin + (i * colWidth) + (colWidth / 2), y + 4, { align: 'center' });
          i++;
        }
        
        y += 7; // Move down for next row
        
        // Add a new page if we're near the bottom
        if (y > doc.internal.pageSize.height - 20) {
          doc.addPage();
          y = 15; // Reset y position on new page
        }
      });
      
      // Add date at the bottom
      const today = new Date();
      const dateStr = today.toLocaleDateString();
      doc.setFontSize(8);
      doc.text(`Generated on: ${dateStr}`, 14, doc.internal.pageSize.height - 10);
      
      // Save the PDF
      doc.save(`${reportType}_report.pdf`);
      
      console.log('PDF export successful');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting to PDF. Please try again.');
    }
  };

  const exportToExcel = () => {
    if (loading || !reportData.length) {
      alert('No data available to export');
      return;
    }
    
    // Create workbook directly from the reportData
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportType}_report.xlsx`);
  };

  const exportToCSV = () => {
    if (loading || !reportData.length) {
      alert('No data available to export');
      return;
    }
    
    // Create CSV directly from the reportData
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${reportType}_report.csv`);
  };

  const handleExport = (format) => {
    handleExportClose();
    switch (format) {
      case 'pdf':
        exportToPDF();
        break;
      case 'csv':
        exportToCSV();
        break;
      case 'excel':
        exportToExcel();
        break;
      case 'print':
        window.print();
        break;
      default:
        break;
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      margin: '0 auto',
      p: 3,
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ mb: 2 }}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>

        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportClick}
          color="primary"
        >
          Export
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleExportClose}
        >
          <MenuItem onClick={() => handleExport('pdf')}>
            <PictureAsPdfIcon sx={{ mr: 1 }} /> PDF
          </MenuItem>
          <MenuItem onClick={() => handleExport('csv')}>
            <TableChartIcon sx={{ mr: 1 }} /> CSV
          </MenuItem>
          <MenuItem onClick={() => handleExport('excel')}>
            <TableChartIcon sx={{ mr: 1 }} /> Excel
          </MenuItem>
          <MenuItem onClick={() => handleExport('print')}>
            <PrintIcon sx={{ mr: 1 }} /> Print Report
          </MenuItem>
        </Menu>
      </Box>

      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack spacing={2}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                  />
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                  />
                </Stack>
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    label="Report Type"
                    onChange={handleReportTypeChange}
                  >
                    <MenuItem value="sales">Sales Report</MenuItem>
                    <MenuItem value="inventory">Inventory Report</MenuItem>
                    <MenuItem value="delivery">Delivery Report</MenuItem>
                    <MenuItem value="refill">Refill History</MenuItem>
                    <MenuItem value="orders">Customer Orders</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Product Type</InputLabel>
                  <Select
                    value={productType}
                    label="Product Type"
                    onChange={(e) => setProductType(e.target.value)}
                  >
                    <MenuItem value="water">Water</MenuItem>
                    <MenuItem value="container">Container</MenuItem>
                    <MenuItem value="accessory">Accessory</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Customer Name/ID"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search by customer name or ID"
                />
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingBasketIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" component="div">
                Total Orders
              </Typography>
              <Typography variant="h4" color="primary">
                {summaryData.total_orders || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MonetizationOnIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" component="div">
                Total Sales
              </Typography>
              <Typography variant="h4" color="success.main">
                ₱{summaryData.total_sales ? summaryData.total_sales.toFixed(2) : '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <LocalShippingIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" component="div">
                Total Deliveries
              </Typography>
              <Typography variant="h4" color="info.main">
                {summaryData.total_deliveries || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WaterDropIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" component="div">
                Total Refills Done
              </Typography>
              <Typography variant="h4" color="warning.main">
                {summaryData.total_refills || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Report Table View
        </Typography>
        {renderReportTable()}
      </Box>
    </Box>
  );
}

export default Reports;