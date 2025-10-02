#!/bin/bash

# Postify Quick Start Script

echo "🚀 Starting Postify Development Environment"
echo "=========================================="

# Check if .env files exist
if [ ! -f "server/.env" ]; then
    echo "⚠️  Server .env file not found. Please copy server/env.example to server/.env and configure your OpenAI API key."
    exit 1
fi

if [ ! -f "client/.env" ]; then
    echo "📝 Creating client .env file from example..."
    cp client/env.example client/.env
fi

# Install dependencies if node_modules don't exist
if [ ! -d "client/node_modules" ] || [ ! -d "server/node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install:all
fi

echo "🎯 Starting both client and server..."
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo "❤️  Health Check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Start both services
pnpm dev
