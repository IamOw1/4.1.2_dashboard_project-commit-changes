#!/bin/bash
# ============================================================================
# COBA AI Drone Agent - Start Script
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  COBA AI Drone Agent v4.0${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Python
if ! command_exists python3; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo -e "${GREEN}✓ Python version: $PYTHON_VERSION${NC}"

# Check virtual environment
if [ -d "venv" ]; then
    echo -e "${GREEN}✓ Virtual environment found${NC}"
    source venv/bin/activate
else
    echo -e "${YELLOW}⚠ Virtual environment not found, creating...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
fi

# Create necessary directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p data/{missions,reports,state,memory,tiles,flight_data}
mkdir -p logs
mkdir -p backup

# Check configuration
if [ ! -f "config/config.yaml" ]; then
    echo -e "${YELLOW}⚠ Configuration file not found, creating default...${NC}"
    python main.py check
fi

# Parse arguments
MODE=${1:-all}

case $MODE in
    all)
        echo -e "${GREEN}Starting all components...${NC}"
        python main.py all
        ;;
    api)
        echo -e "${GREEN}Starting API server...${NC}"
        python main.py api
        ;;
    dashboard)
        echo -e "${GREEN}Starting dashboard...${NC}"
        python main.py dashboard
        ;;
    gui)
        echo -e "${GREEN}Starting GUI...${NC}"
        python main.py gui
        ;;
    agent)
        echo -e "${GREEN}Starting agent...${NC}"
        python main.py agent
        ;;
    check)
        echo -e "${GREEN}Checking system...${NC}"
        python main.py check
        ;;
    docker)
        echo -e "${GREEN}Starting with Docker...${NC}"
        docker-compose up --build
        ;;
    *)
        echo -e "${YELLOW}Usage: $0 {all|api|dashboard|gui|agent|check|docker}${NC}"
        exit 1
        ;;
esac
