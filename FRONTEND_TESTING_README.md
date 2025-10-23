# 🚀 Fluence Pay Frontend Testing Interface

A comprehensive testing interface for all 7 microservices in the Fluence Pay application.

## 📋 **Overview**

This frontend testing interface provides a single, unified interface to test all microservices functionality without needing separate tools or API clients.

## 🎯 **Features**

### **Complete Service Coverage**
- ✅ **Auth Service (Port 4001)**: Authentication, profile management, password reset
- ✅ **Points & Wallet Service (Port 4005)**: Wallet balance, points management, transactions
- ✅ **Referral Service (Port 4006)**: Referral codes, statistics, leaderboard
- ✅ **Social Features Service (Port 4007)**: Social accounts, posts, platforms
- ✅ **Notification Service (Port 4004)**: Notifications, settings, statistics
- ✅ **Merchant Onboarding Service (Port 4002)**: Merchant applications, profiles
- ✅ **Cashback Budget Service (Port 4003)**: Budgets, campaigns, transactions

### **User-Friendly Interface**
- ✅ **Modern Design**: Clean, responsive interface with service-specific color coding
- ✅ **Authentication**: Built-in login/register functionality
- ✅ **Real-time Testing**: Test endpoints with live responses
- ✅ **Error Handling**: Clear error messages and success indicators
- ✅ **Mobile Responsive**: Works on desktop, tablet, and mobile devices

## 🚀 **Quick Start**

### **1. Start All Services**
```bash
# Windows
start-services.bat

# Linux/Mac
./start-services.sh

# Or manually
docker-compose up -d
```

### **2. Open Testing Interface**
```bash
# Open frontend-testing.html in your browser
# Or serve it with a simple HTTP server
python -m http.server 8000
# Then visit: http://localhost:8000/frontend-testing.html
```

### **3. Start Testing**
1. **Register/Login**: Use the authentication section to create an account or login
2. **Test Endpoints**: Click "Test" buttons on any endpoint to see live responses
3. **View Responses**: Responses appear in colored boxes below each service
4. **Debug Issues**: Check console for detailed error information

## 🔧 **Service Endpoints**

### **Auth Service (Port 4001)**
- **GET** `/api/auth/profile` - Get user profile
- **POST** `/api/auth/refresh` - Refresh authentication token
- **POST** `/api/auth/forgot-password` - Request password reset

### **Points & Wallet Service (Port 4005)**
- **GET** `/api/wallet/balance` - Get wallet balance
- **POST** `/api/wallet/award-points` - Award points (with sample data)
- **GET** `/api/wallet/transactions` - Get transaction history
- **GET** `/api/points/statistics` - Get points statistics

### **Referral Service (Port 4006)**
- **GET** `/api/referral/code` - Get referral code
- **GET** `/api/referral/stats` - Get referral statistics
- **GET** `/api/referral/leaderboard` - Get referral leaderboard

### **Social Features Service (Port 4007)**
- **GET** `/api/social/accounts` - Get social accounts
- **GET** `/api/social/posts` - Get social posts
- **GET** `/api/social/platforms` - Get available platforms

### **Notification Service (Port 4004)**
- **GET** `/api/notifications` - Get notifications
- **GET** `/api/notifications/unread-count` - Get unread count
- **GET** `/api/notifications/settings` - Get notification settings

### **Merchant Onboarding Service (Port 4002)**
- **GET** `/api/merchant/profile` - Get merchant profile
- **GET** `/api/merchant/applications` - Get merchant applications
- **GET** `/api/merchant/application-status` - Get application status

### **Cashback Budget Service (Port 4003)**
- **GET** `/api/budget` - Get budgets
- **GET** `/api/campaigns` - Get campaigns
- **GET** `/api/transactions` - Get transactions

## 🎨 **Interface Features**

### **Service Cards**
Each service has its own card with:
- **Color-coded borders** for easy identification
- **Port information** for reference
- **Grouped endpoints** by functionality
- **One-click testing** for each endpoint

### **Authentication System**
- **Register**: Create new user accounts
- **Login**: Authenticate existing users
- **Logout**: Clear authentication
- **Status Display**: Shows current authentication state

### **Response Display**
- **Formatted JSON**: Pretty-printed responses
- **Status Codes**: HTTP status codes and messages
- **Request Details**: Full URL, method, and headers
- **Color Coding**: Green for success, red for errors

### **Error Handling**
- **Network Errors**: Connection issues and timeouts
- **Authentication Errors**: Missing or invalid tokens
- **API Errors**: Service-specific error messages
- **User Feedback**: Clear success/error notifications

## 🔍 **Testing Workflows**

### **1. Authentication Flow**
1. Click "Register" to create a new account
2. Fill in name, email, and password
3. Submit to register and automatically login
4. Test authenticated endpoints

### **2. Points & Wallet Flow**
1. Get wallet balance to see current state
2. Award points to add to wallet
3. Check transaction history
4. View points statistics

### **3. Referral Flow**
1. Get your referral code
2. Check referral statistics
3. View referral leaderboard
4. Test referral validation

### **4. Social Features Flow**
1. Check connected social accounts
2. View social posts
3. See available platforms
4. Test social analytics

### **5. Notification Flow**
1. Check notifications
2. View unread count
3. Check notification settings
4. Test notification management

### **6. Merchant Flow**
1. Check merchant profile
2. View applications
3. Check application status
4. Test merchant management

### **7. Cashback Flow**
1. Check budgets
2. View campaigns
3. Check transactions
4. Test budget management

## 🛠️ **Development Features**

### **Sample Data**
- **POST requests** include sample data where appropriate
- **Realistic values** for testing purposes
- **Proper formatting** for API consumption

### **CORS Handling**
- **Pre-configured** for localhost development
- **Service-specific** URL mapping
- **Error handling** for connection issues

### **Token Management**
- **Automatic storage** in localStorage
- **Bearer token** authentication
- **Token refresh** capabilities

## 📱 **Responsive Design**

### **Desktop (1200px+)**
- **Grid layout** with multiple service cards per row
- **Full functionality** with all features visible
- **Hover effects** and animations

### **Tablet (768px - 1199px)**
- **Responsive grid** with 2 columns
- **Touch-friendly** buttons and inputs
- **Optimized spacing** for touch interaction

### **Mobile (< 768px)**
- **Single column** layout
- **Stacked cards** for easy scrolling
- **Touch-optimized** interface elements

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Services Not Starting**
```bash
# Check if Docker is running
docker --version

# Check service status
docker-compose ps

# View service logs
docker-compose logs -f [service-name]
```

#### **CORS Errors**
- Ensure all services are running on correct ports
- Check that services are accessible via localhost
- Verify API Gateway configuration

#### **Authentication Issues**
- Clear localStorage and try again
- Check if auth service is running on port 4001
- Verify JWT token format

#### **Network Errors**
- Check if all services are running
- Verify port availability
- Check firewall settings

### **Debug Mode**
Open browser developer tools to see:
- **Network requests** and responses
- **Console errors** and warnings
- **Local storage** contents
- **Authentication tokens**

## 🎯 **Best Practices**

### **Testing Order**
1. **Start with Auth Service** - Register/login first
2. **Test Core Services** - Points, Referral, Social
3. **Test Supporting Services** - Notifications, Merchant, Cashback
4. **Test Integration** - Cross-service functionality

### **Data Management**
- **Use test data** for development
- **Clear localStorage** between test sessions
- **Reset services** if needed: `docker-compose restart`

### **Performance Testing**
- **Load testing** with multiple requests
- **Concurrent testing** of multiple services
- **Error scenario testing** with invalid data

## 🚀 **Production Considerations**

### **Security**
- **HTTPS only** in production
- **Environment variables** for configuration
- **API rate limiting** and authentication
- **Input validation** and sanitization

### **Monitoring**
- **Service health checks** on all endpoints
- **Performance monitoring** for response times
- **Error tracking** and logging
- **User analytics** and usage patterns

## 📞 **Support**

### **Getting Help**
- **Check service logs**: `docker-compose logs -f`
- **Verify configuration**: Check docker-compose.yml
- **Test individual services**: Use curl or Postman
- **Check network connectivity**: Ping localhost ports

### **Common Commands**
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart [service-name]

# View logs
docker-compose logs -f [service-name]

# Check service status
docker-compose ps
```

## 🎉 **Ready to Test!**

The frontend testing interface provides a complete testing environment for all Fluence Pay microservices. Simply start the services and open the HTML file in your browser to begin testing!

**Happy Testing!** 🚀
