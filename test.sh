#!/bin/bash

# COBA AI Drone Agent - Test Runner Script
# Runs all test suites for the project

set -e

echo "🧪 Running COBA AI Drone Agent Tests..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if pytest is available
if ! command -v python3 -m pytest &> /dev/null; then
    print_error "pytest not found. Install with: pip install pytest pytest-asyncio pytest-cov"
    exit 1
fi

# Create test results directory
mkdir -p test_results

# Run unit tests
print_header "Running Unit Tests"
print_status "Running unit tests..."
python3 -m pytest tests/unit/ -v --tb=short --junitxml=test_results/unit_results.xml
UNIT_EXIT_CODE=$?

# Run integration tests
print_header "Running Integration Tests"
print_status "Running integration tests..."
python3 -m pytest tests/integration/ -v --tb=short --junitxml=test_results/integration_results.xml
INT_EXIT_CODE=$?

# Run with coverage if available
if python3 -c "import pytest_cov" &> /dev/null; then
    print_header "Running Tests with Coverage"
    print_status "Running tests with coverage report..."
    python3 -m pytest tests/ --cov=. --cov-report=html:test_results/coverage_html --cov-report=xml:test_results/coverage.xml --cov-report=term
    COVERAGE_EXIT_CODE=$?
else
    print_warning "pytest-cov not available, skipping coverage"
    COVERAGE_EXIT_CODE=0
fi

# Run LLM integration test (if Ollama available)
print_header "Testing LLM Integration"
if command -v ollama &> /dev/null && pgrep -x "ollama" > /dev/null; then
    print_status "Testing LLM client..."
    python3 -c "
import asyncio
from agent.llm_client import get_llm_client

async def test_llm():
    client = get_llm_client()
    health = await client.health_check()
    if health:
        print('✓ LLM health check passed')
        response = await client.generate('Hello, test message')
        if response.error:
            print(f'✗ LLM generation failed: {response.error}')
            return False
        else:
            print('✓ LLM generation successful')
            return True
    else:
        print('✗ LLM health check failed')
        return False

result = asyncio.run(test_llm())
exit(0 if result else 1)
"
    LLM_EXIT_CODE=$?
else
    print_warning "Ollama not running, skipping LLM tests"
    LLM_EXIT_CODE=0
fi

# Run RC integration test
print_header "Testing RC Integration"
print_status "Testing RC mock and arbitration..."
python3 -c "
import asyncio
from hardware.rc_input import RCInputSource, get_rc_input
from controllers.control_arbitrator import get_control_arbitrator
from sim.mock_rc import MockRC

async def test_rc():
    # Test mock RC
    mock_rc = MockRC({'scenario': 'idle'})
    await mock_rc.initialize()
    state = await mock_rc.get_state()
    print(f'✓ Mock RC state: connected={state.connected}')
    
    # Test arbitrator
    arbitrator = get_control_arbitrator()
    command = arbitrator.arbitrate(state)
    print(f'✓ Arbitration result: {command.action} from {command.source.value}')
    
    # Test active operator scenario
    mock_rc.set_scenario('active_pilot')
    state = await mock_rc.get_state()
    command = arbitrator.arbitrate(state)
    print(f'✓ Active pilot arbitration: {command.action} from {command.source.value}')
    
    await mock_rc.shutdown()
    return True

try:
    result = asyncio.run(test_rc())
    RC_EXIT_CODE=0
except Exception as e:
    print(f'✗ RC test failed: {e}')
    RC_EXIT_CODE=1
"
RC_EXIT_CODE=$?

# Summary
print_header "Test Summary"

TOTAL_EXIT_CODE=$((UNIT_EXIT_CODE + INT_EXIT_CODE + COVERAGE_EXIT_CODE + LLM_EXIT_CODE + RC_EXIT_CODE))

echo ""
if [ $UNIT_EXIT_CODE -eq 0 ]; then
    print_status "✓ Unit tests: PASSED"
else
    print_error "✗ Unit tests: FAILED"
fi

if [ $INT_EXIT_CODE -eq 0 ]; then
    print_status "✓ Integration tests: PASSED"
else
    print_error "✗ Integration tests: FAILED"
fi

if [ $COVERAGE_EXIT_CODE -eq 0 ]; then
    print_status "✓ Coverage tests: PASSED"
else
    print_error "✗ Coverage tests: FAILED"
fi

if [ $LLM_EXIT_CODE -eq 0 ]; then
    print_status "✓ LLM integration: PASSED"
else
    print_error "✗ LLM integration: FAILED"
fi

if [ $RC_EXIT_CODE -eq 0 ]; then
    print_status "✓ RC integration: PASSED"
else
    print_error "✗ RC integration: FAILED"
fi

echo ""
if [ $TOTAL_EXIT_CODE -eq 0 ]; then
    print_status "🎉 All tests passed!"
    echo "Test results saved in test_results/"
    exit 0
else
    print_error "❌ Some tests failed. Check test_results/ for details."
    exit 1
fi