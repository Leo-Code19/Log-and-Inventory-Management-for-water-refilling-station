# Water Refilling Station Management System

A comprehensive management system for water refilling stations, featuring order management, IoT device monitoring, and reporting capabilities.

## Features

- User authentication and authorization
- Dashboard with key metrics and statistics
- Order management system
- IoT device monitoring and control
- Detailed reports and analytics
- System settings and configuration

## Tech Stack

### Frontend
- React with Vite
- Material-UI for components
- React Router for navigation
- Recharts for data visualization
- Axios for API calls

### Backend
- Django
- Django REST Framework
- JWT Authentication
- PostgreSQL database

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:5173

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - Unix/MacOS:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Set up the database:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

7. Start the development server:
   ```bash
   python manage.py runserver
   ```

The backend API will be available at http://localhost:8000

## API Endpoints

- Authentication:
  - POST /api/login/
  - GET /api/user/

- Dashboard:
  - GET /api/dashboard/stats/
  - GET /api/dashboard/recent-orders/

- Orders:
  - GET /api/orders/
  - POST /api/orders/
  - GET /api/orders/{id}/
  - PUT /api/orders/{id}/
  - DELETE /api/orders/{id}/

- Devices:
  - GET /api/devices/
  - POST /api/devices/
  - GET /api/devices/{id}/
  - PUT /api/devices/{id}/
  - DELETE /api/devices/{id}/

- Reports:
  - GET /api/reports/sales/
  - GET /api/reports/inventory/
  - GET /api/reports/order-stats/

- Settings:
  - GET /api/settings/
  - PUT /api/settings/{id}/

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 