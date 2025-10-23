@echo off
echo 🚀 Starting Fluence Pay Microservices...
echo.

REM Check if Docker is running
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running

echo.
echo 🗄️ Starting PostgreSQL and Redis...
docker-compose up -d postgres redis

echo.
echo ⏳ Waiting for databases to be ready...
timeout /t 15 /nobreak >nul

echo.
echo 🚀 Starting all microservices...
docker-compose up -d

echo.
echo ⏳ Waiting for services to start...
timeout /t 20 /nobreak >nul

echo.
echo 🔍 Checking service health...

REM Check each service
set "all_services_healthy=true"

curl -s http://localhost:3000/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ auth-service is not running on port 3000
    set "all_services_healthy=false"
) else (
    echo ✅ auth-service is running on port 3000
)

curl -s http://localhost:3001/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ merchant-service is not running on port 3001
    set "all_services_healthy=false"
) else (
    echo ✅ merchant-service is running on port 3001
)

curl -s http://localhost:3002/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ cashback-service is not running on port 3002
    set "all_services_healthy=false"
) else (
    echo ✅ cashback-service is running on port 3002
)

curl -s http://localhost:3003/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ notification-service is not running on port 3003
    set "all_services_healthy=false"
) else (
    echo ✅ notification-service is running on port 3003
)

curl -s http://localhost:3004/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ points-service is not running on port 3004
    set "all_services_healthy=false"
) else (
    echo ✅ points-service is running on port 3004
)

curl -s http://localhost:3005/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ referral-service is not running on port 3005
    set "all_services_healthy=false"
) else (
    echo ✅ referral-service is running on port 3005
)

curl -s http://localhost:3006/health >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ social-service is not running on port 3006
    set "all_services_healthy=false"
) else (
    echo ✅ social-service is running on port 3006
)

if "%all_services_healthy%"=="false" (
    echo.
    echo ❌ Some services are not healthy. Please check the logs:
    echo    docker-compose logs
    pause
    exit /b 1
)

echo.
echo 🎉 All services are now running!
echo.
echo 📋 Service URLs:
echo    Auth Service: http://localhost:3000
echo    Merchant Service: http://localhost:3001
echo    Cashback Service: http://localhost:3002
echo    Notification Service: http://localhost:3003
echo    Points Service: http://localhost:3004
echo    Referral Service: http://localhost:3005
echo    Social Service: http://localhost:3006
echo    API Gateway: http://localhost:80
echo.
echo 📱 Frontend Testing Interface: Open frontend-testing.html in your browser
echo.
echo 🛠️ Management Commands:
echo    To stop all services: docker-compose down
echo    To view logs: docker-compose logs -f
echo    To restart services: docker-compose restart
echo.
echo Press any key to continue...
pause >nul
