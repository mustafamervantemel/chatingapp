#!/bin/bash

echo "🚀 SesliAsk.NeT Production Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}npm is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Node.js and npm are installed${NC}"
}

# Install backend dependencies
install_backend() {
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Backend dependency installation failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
    cd ..
}

# Install frontend dependencies
install_frontend() {
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Frontend dependency installation failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    cd ..
}

# Setup database
setup_database() {
    echo -e "${YELLOW}Setting up database...${NC}"
    cd backend
    npm run migrate
    if [ $? -ne 0 ]; then
        echo -e "${RED}Database setup failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Database setup completed${NC}"
    cd ..
}

# Build frontend
build_frontend() {
    echo -e "${YELLOW}Building frontend...${NC}"
    cd frontend
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}Frontend build failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Frontend build completed${NC}"
    cd ..
}

# Start backend
start_backend() {
    echo -e "${YELLOW}Starting backend server...${NC}"
    cd backend
    
    # Check if PM2 is installed
    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}Using PM2 for production${NC}"
        pm2 start index.js --name "sesliask-backend" --env production
    else
        echo -e "${YELLOW}PM2 not found, starting with node${NC}"
        echo -e "${YELLOW}For production, consider installing PM2: npm install -g pm2${NC}"
        nohup npm start > ../logs/backend.log 2>&1 &
        echo $! > ../backend.pid
    fi
    
    cd ..
}

# Create logs directory
create_logs() {
    mkdir -p logs
    echo -e "${GREEN}✓ Logs directory created${NC}"
}

# Main deployment function
deploy() {
    check_requirements
    create_logs
    install_backend
    install_frontend
    setup_database
    build_frontend
    start_backend
    
    echo -e "${GREEN}======================================"
    echo -e "🎉 Deployment completed successfully!"
    echo -e "======================================"
    echo -e "Backend: http://localhost:5000"
    echo -e "Frontend: Serve the 'frontend/dist' folder"
    echo -e "Health check: http://localhost:5000/api/health"
    echo -e "======================================"
}

# Run deployment
deploy