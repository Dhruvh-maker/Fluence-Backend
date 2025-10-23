# Fluence Pay Backend - Setup Guide

## Overview
This guide will help you run all microservices locally for development and testing.

## Prerequisites
1. **Docker Desktop** - Make sure Docker is installed and running
2. **Git** - For cloning the repository (optional)

## Quick Start

### Start All Services
Run the startup script:
```bash
start-all-services.bat
```

This script will:
- ✅ Check Docker installation
- 🗄️ Start PostgreSQL and Redis databases
- 🚀 Start all microservices
- 🔍 Verify all services are healthy
- 📋 Display all access URLs

## Service Architecture

### Internal Ports (All services use port 3000 internally)
- **Auth Service**: `auth-service:3000`
- **Merchant Onboarding**: `merchant-onboarding-service:3000`
- **Cashback & Budget**: `cashback-budget-service:3000`
- **Notification**: `notification-service:3000`
- **Points & Wallet**: `points-wallet-service:3000`
- **Referral**: `referral-service:3000`
- **Social Features**: `social-features-service:3000`

### External Ports (Mapped to different external ports)
- **Auth Service**: `localhost:3000` → `auth-service:3000`
- **Merchant Service**: `localhost:3001` → `merchant-onboarding-service:3000`
- **Cashback Service**: `localhost:3002` → `cashback-budget-service:3000`
- **Notification Service**: `localhost:3003` → `notification-service:3000`
- **Points Service**: `localhost:3004` → `points-wallet-service:3000`
- **Referral Service**: `localhost:3005` → `referral-service:3000`
- **Social Service**: `localhost:3006` → `social-features-service:3000`

### API Gateway
- **Nginx Gateway**: `localhost:80` → Routes to all services with path prefixes

## Access URLs

### Local Access
- **Auth Service**: http://localhost:3000
- **Merchant Service**: http://localhost:3001
- **Cashback Service**: http://localhost:3002
- **Notification Service**: http://localhost:3003
- **Points Service**: http://localhost:3004
- **Referral Service**: http://localhost:3005
- **Social Service**: http://localhost:3006
- **API Gateway**: http://localhost:80


### API Gateway Routes
- **Auth**: http://localhost:80/api/auth/
- **Merchants**: http://localhost:80/api/merchants/
- **Cashback**: http://localhost:80/api/cashback/
- **Notifications**: http://localhost:80/api/notifications/
- **Wallet**: http://localhost:80/api/wallet/
- **Points**: http://localhost:80/api/points/
- **Referral**: http://localhost:80/api/referral/
- **Social**: http://localhost:80/api/social/

## Management Commands

### Start Services
```bash
# Start all services with external access
start-all-with-external-access.bat
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean reset)
docker-compose down -v
```

### View Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f auth-service
docker-compose logs -f merchant-onboarding-service
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart auth-service
```

## Health Checks

All services include health check endpoints:
- **Auth Service**: http://localhost:3000/health
- **Merchant Service**: http://localhost:3001/health
- **Cashback Service**: http://localhost:3002/health
- **Notification Service**: http://localhost:3003/health
- **Points Service**: http://localhost:3004/health
- **Referral Service**: http://localhost:3005/health
- **Social Service**: http://localhost:3006/health

## Troubleshooting

### Services Not Starting
1. Check Docker is running: `docker info`
2. Check logs: `docker-compose logs`
3. Restart services: `docker-compose restart`


### Port Conflicts
If you have port conflicts, you can modify the external ports in `docker-compose.yml`:
```yaml
ports:
  - "3000:3000"  # Change 3000 to your preferred port
```

### Database Issues
1. Reset databases: `docker-compose down -v`
2. Restart: `docker-compose up -d`

## Development

### Frontend Testing
Open `frontend-testing.html` in your browser to test the API endpoints.

### Environment Variables
All services use environment variables defined in `docker-compose.yml`. Key variables:
- `NODE_ENV=development`
- `PORT=3000` (internal port)
- Database connection strings
- JWT secrets
- Service URLs for inter-service communication

## Security Notes

⚠️ **Important**: This setup is for development only. For production:
1. Change all default passwords
2. Use proper SSL certificates
3. Configure firewall rules
4. Use environment-specific configurations
5. Implement proper authentication and authorization

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify all prerequisites are installed
3. Ensure no port conflicts
4. Check firewall settings
5. Verify ngrok authtoken is correct
