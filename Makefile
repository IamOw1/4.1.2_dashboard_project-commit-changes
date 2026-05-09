# COBA AI Drone Agent - Makefile
# Simple build automation for local development

.PHONY: help install test run clean lint format

# Default target
help:
	@echo "COBA AI Drone Agent - Available targets:"
	@echo ""
	@echo "Installation:"
	@echo "  install      Run installation script (Linux/Mac)"
	@echo "  install-win  Run installation script (Windows)"
	@echo ""
	@echo "Testing:"
	@echo "  test         Run all tests"
	@echo "  test-unit    Run unit tests only"
	@echo "  test-int     Run integration tests only"
	@echo ""
	@echo "Running:"
	@echo "  run          Start all services"
	@echo "  run-backend  Start backend only (API + Agent)"
	@echo "  run-frontend Start frontend only"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint         Run linting"
	@echo "  format       Format code"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean        Clean build artifacts and caches"
	@echo "  check        Run system checks"

# Installation
install:
	./install.sh

install-win:
	./install.ps1

# Testing
test:
	./test.sh

test-unit:
	pytest tests/unit/ -v

test-int:
	pytest tests/integration/ -v

# Running
run:
	./run.sh all

run-backend:
	./run.sh api

run-frontend:
	./run.sh frontend

# Code Quality
lint:
	@echo "Running linting..."
	python -m flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	python -m flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

format:
	@echo "Formatting code..."
	python -m black . --line-length 100
	python -m isort . --profile black

# Maintenance
clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name "node_modules" -exec rm -rf {} +
	find . -type d -name "dist" -exec rm -rf {} +
	find . -type d -name ".next" -exec rm -rf {} +

check:
	./run.sh check