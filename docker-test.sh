#!/bin/bash

# Docker build and test script for CBG application

set -e

echo "🚀 CBG Docker Build and Test Script"
echo "=================================="

# Get Docker Hub username
read -p "Enter your Docker Hub username: " DOCKER_USERNAME

if [ -z "$DOCKER_USERNAME" ]; then
    echo "❌ Docker Hub username is required"
    exit 1
fi

echo ""
echo "📦 Building Docker images..."

# Build server image
echo "🔧 Building server image..."
cd server
docker build -t ${DOCKER_USERNAME}/cbg-server:latest .
echo "✅ Server image built successfully"

# Build client image  
echo "🔧 Building client image..."
cd ../client
docker build -t ${DOCKER_USERNAME}/cbg-client:latest .
echo "✅ Client image built successfully"

cd ..

echo ""
echo "🧪 Testing images locally..."

# Test server image
echo "🔍 Testing server image..."
docker run --rm -d --name cbg-server-test -p 5001:5000 \
  -e PORT=5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="$DATABASE_URL" \
  -e JWT_SECRET="test-secret" \
  ${DOCKER_USERNAME}/cbg-server:latest

# Wait for server to start
sleep 5

# Check if server is healthy
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ Server is healthy"
    docker stop cbg-server-test
else
    echo "❌ Server health check failed"
    docker logs cbg-server-test
    docker stop cbg-server-test
    exit 1
fi

# Test client image
echo "🔍 Testing client image..."
docker run --rm -d --name cbg-client-test -p 3001:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL="http://localhost:5001" \
  ${DOCKER_USERNAME}/cbg-client:latest

# Wait for client to start
sleep 10

# Check if client is accessible
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Client is accessible"
    docker stop cbg-client-test
else
    echo "❌ Client accessibility check failed"
    docker logs cbg-client-test
    docker stop cbg-client-test
    exit 1
fi

echo ""
echo "🎉 All tests passed! Images are ready for deployment."
echo ""
echo "📤 To push to Docker Hub, run:"
echo "docker push ${DOCKER_USERNAME}/cbg-server:latest"
echo "docker push ${DOCKER_USERNAME}/cbg-client:latest"
echo ""
echo "🚀 Then deploy to Railway using the images:"
echo "  - Server: ${DOCKER_USERNAME}/cbg-server:latest"
echo "  - Client: ${DOCKER_USERNAME}/cbg-client:latest"