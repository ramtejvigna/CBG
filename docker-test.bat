@echo off
setlocal enabledelayedexpansion

echo 🚀 CBG Docker Build and Test Script
echo ==================================

set /p DOCKER_USERNAME="Enter your Docker Hub username: "

if "%DOCKER_USERNAME%"=="" (
    echo ❌ Docker Hub username is required
    exit /b 1
)

echo.
echo 📦 Building Docker images...

REM Build server image
echo 🔧 Building server image...
cd server
docker build -t %DOCKER_USERNAME%/cbg-server:latest .
if %errorlevel% neq 0 (
    echo ❌ Server build failed
    exit /b 1
)
echo ✅ Server image built successfully

REM Build client image  
echo 🔧 Building client image...
cd ..\client
docker build -t %DOCKER_USERNAME%/cbg-client:latest .
if %errorlevel% neq 0 (
    echo ❌ Client build failed
    exit /b 1
)
echo ✅ Client image built successfully

cd ..

echo.
echo 🧪 Testing images locally...

REM Test server image
echo 🔍 Testing server image...
docker run --rm -d --name cbg-server-test -p 5001:5000 ^
  -e PORT=5000 ^
  -e NODE_ENV=production ^
  -e JWT_SECRET="test-secret" ^
  %DOCKER_USERNAME%/cbg-server:latest

REM Wait for server to start
timeout /t 5 /nobreak > nul

REM Check if server is healthy
curl -f http://localhost:5001/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Server is healthy
    docker stop cbg-server-test > nul
) else (
    echo ❌ Server health check failed
    docker logs cbg-server-test
    docker stop cbg-server-test > nul
    exit /b 1
)

REM Test client image
echo 🔍 Testing client image...
docker run --rm -d --name cbg-client-test -p 3001:3000 ^
  -e NODE_ENV=production ^
  -e NEXT_PUBLIC_API_URL="http://localhost:5001" ^
  %DOCKER_USERNAME%/cbg-client:latest

REM Wait for client to start
timeout /t 10 /nobreak > nul

REM Check if client is accessible
curl -f http://localhost:3001 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Client is accessible
    docker stop cbg-client-test > nul
) else (
    echo ❌ Client accessibility check failed
    docker logs cbg-client-test
    docker stop cbg-client-test > nul
    exit /b 1
)

echo.
echo 🎉 All tests passed! Images are ready for deployment.
echo.
echo 📤 To push to Docker Hub, run:
echo docker push %DOCKER_USERNAME%/cbg-server:latest
echo docker push %DOCKER_USERNAME%/cbg-client:latest
echo.
echo 🚀 Then deploy to Railway using the images:
echo   - Server: %DOCKER_USERNAME%/cbg-server:latest
echo   - Client: %DOCKER_USERNAME%/cbg-client:latest

pause