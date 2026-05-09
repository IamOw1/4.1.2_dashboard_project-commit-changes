# COBA AI Drone Agent - Local Installation Script for Windows
# This script sets up the project for local development without Docker
# Run with: .\install.ps1

param(
    [switch]$SkipLLM
)

Write-Host "🚀 Starting COBA AI Drone Agent local installation..." -ForegroundColor Green

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop
        Write-Host "[INFO] $Command found" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "[ERROR] $Command is not installed. Please install it first." -ForegroundColor Red
        return $false
    }
}

# Function to install Python package
function Install-PythonPackage {
    param([string]$Package)
    try {
        python -c "import $Package" 2>$null
        Write-Host "[INFO] $Package already installed" -ForegroundColor Green
    }
    catch {
        Write-Host "[WARN] $Package not found, installing..." -ForegroundColor Yellow
        pip install $Package
    }
}

# Check Python 3.11+
Write-Host "Checking Python version..." -ForegroundColor Green
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python (\d+)\.(\d+)") {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 11)) {
            Write-Host "[ERROR] Python 3.11+ required, found $pythonVersion" -ForegroundColor Red
            exit 1
        }
        Write-Host "[INFO] Python $pythonVersion ✓" -ForegroundColor Green
    }
}
catch {
    Write-Host "[ERROR] Python not found" -ForegroundColor Red
    exit 1
}

# Check other dependencies
if (!(Test-Command "pip")) { exit 1 }
if (!(Test-Command "node")) { exit 1 }
if (!(Test-Command "npm")) { exit 1 }

# Check SQLite
try {
    python -c "import sqlite3; print('SQLite version:', sqlite3.sqlite_version)" | Out-Null
    Write-Host "[INFO] SQLite3 available" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] SQLite3 not available in Python" -ForegroundColor Red
    exit 1
}

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Green
pip install -r requirements.txt

# Install additional packages for RC input
Install-PythonPackage "pygame"

# Install Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Green
npm install

# Create necessary directories
Write-Host "Creating data directories..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path "data\memory" | Out-Null
New-Item -ItemType Directory -Force -Path "data\missions" | Out-Null
New-Item -ItemType Directory -Force -Path "data\reports" | Out-Null
New-Item -ItemType Directory -Force -Path "data\state" | Out-Null
New-Item -ItemType Directory -Force -Path "data\flight_data" | Out-Null
New-Item -ItemType Directory -Force -Path "data\detections" | Out-Null
New-Item -ItemType Directory -Force -Path "data\maps" | Out-Null
New-Item -ItemType Directory -Force -Path "data\tiles" | Out-Null
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

# Setup environment file
if (!(Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[INFO] Created .env from .env.example" -ForegroundColor Green
        Write-Host "[WARN] Please edit .env with your API keys and settings" -ForegroundColor Yellow
    }
    else {
        Write-Host "[WARN] .env.example not found, creating basic .env" -ForegroundColor Yellow
        @"
# COBA AI Drone Agent Environment Variables

# AI API Keys (optional, will use local LLM if not set)
OPENAI_API_KEY=your_openai_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here

# Local LLM Configuration
LLM_MODEL_PATH=./models
LLM_ENDPOINT=http://localhost:11434

# Database
DATABASE_PATH=data/memory/knowledge_base.db

# Simulation
SIMULATION_MODE=true
SIMULATOR_TYPE=grid

# RC Configuration
RC_SOURCE=real
RC_DEVICE=0

# Other settings
LOG_LEVEL=INFO
"@ | Out-File -FilePath ".env" -Encoding UTF8
    }
}
else {
    Write-Host "[INFO] .env already exists" -ForegroundColor Green
}

# Initialize database
Write-Host "Initializing database..." -ForegroundColor Green
python -c "
import sqlite3
import os

db_path = 'data/memory/knowledge_base.db'
os.makedirs(os.path.dirname(db_path), exist_ok=True)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create existing tables
cursor.execute('''
CREATE TABLE IF NOT EXISTS experience (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    state TEXT,
    action TEXT,
    reward REAL,
    next_state TEXT,
    mission_id TEXT,
    metadata TEXT
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY,
    key TEXT UNIQUE,
    value TEXT,
    category TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

# Create new llm_models table
cursor.execute('''
CREATE TABLE IF NOT EXISTS llm_models (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT,
    provider TEXT NOT NULL,
    endpoint_url TEXT,
    model_path TEXT,
    status TEXT DEFAULT 'inactive',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

# Insert default local LLM entry
cursor.execute('''
INSERT OR IGNORE INTO llm_models (name, version, provider, endpoint_url, status)
VALUES (?, ?, ?, ?, ?)
''', ('deepseek-coder', '1.0', 'local_ollama', 'http://localhost:11434', 'inactive'))

conn.commit()
conn.close()
print('Database initialized successfully')
"

# Install Ollama for local LLM (if not skipped)
if (!$SkipLLM) {
    Write-Host "Setting up local LLM with Ollama..." -ForegroundColor Green

    # Check if Ollama is installed
    if (!(Test-Command "ollama")) {
        Write-Host "[WARN] Ollama not found. Installing Ollama..." -ForegroundColor Yellow

        # Download and install Ollama for Windows
        try {
            Invoke-WebRequest -Uri "https://ollama.ai/download/OllamaSetup.exe" -OutFile "OllamaSetup.exe"
            Start-Process -FilePath "OllamaSetup.exe" -ArgumentList "/S" -Wait
            Remove-Item "OllamaSetup.exe"
            Write-Host "[INFO] Ollama installed successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "[ERROR] Failed to install Ollama automatically" -ForegroundColor Red
            Write-Host "[WARN] Please install Ollama manually from https://ollama.ai/" -ForegroundColor Yellow
            Write-Host "[WARN] Then run: ollama pull deepseek-coder" -ForegroundColor Yellow
            exit 1
        }
    }
    else {
        Write-Host "[INFO] Ollama already installed" -ForegroundColor Green
    }

    # Start Ollama service
    Write-Host "Starting Ollama service..." -ForegroundColor Green
    try {
        $ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
        if ($ollamaProcess) {
            Write-Host "[INFO] Ollama is already running" -ForegroundColor Green
        }
        else {
            Start-Process -FilePath "ollama" -ArgumentList "serve" -NoNewWindow
            Start-Sleep -Seconds 2
        }
    }
    catch {
        Write-Host "[WARN] Could not start Ollama service automatically" -ForegroundColor Yellow
    }

    # Pull the model
    Write-Host "Downloading DeepSeek Coder model..." -ForegroundColor Green
    try {
        $models = ollama list 2>$null
        if ($models -match "deepseek-coder") {
            Write-Host "[INFO] DeepSeek Coder model already available" -ForegroundColor Green
        }
        else {
            ollama pull deepseek-coder
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[ERROR] Failed to download model" -ForegroundColor Red
                Write-Host "[WARN] You can try again later or use a different model" -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host "[WARN] Could not check/download model" -ForegroundColor Yellow
    }

    # Test LLM
    Write-Host "Testing local LLM..." -ForegroundColor Green
    python -c "
import requests
import time

try:
    time.sleep(3)
    
    response = requests.post('http://localhost:11434/api/generate', 
                           json={'model': 'deepseek-coder', 'prompt': 'Hello', 'stream': False},
                           timeout=10)
    
    if response.status_code == 200:
        print('Local LLM is working!')
        import sqlite3
        conn = sqlite3.connect('data/memory/knowledge_base.db')
        conn.execute(\"UPDATE llm_models SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE name = 'deepseek-coder'\")
        conn.commit()
        conn.close()
    else:
        print('LLM test failed, but continuing...')
        
except Exception as e:
    print(f'LLM test failed: {e}')
    print('Continuing with installation...')
"
}

# Check system
Write-Host "Running system check..." -ForegroundColor Green
python check_system.py

Write-Host "Installation completed successfully! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Edit .env file with your API keys if needed"
Write-Host "2. Run .\run.ps1 to start the application"
Write-Host "3. Access the dashboard at http://localhost:3000"
Write-Host "4. API available at http://localhost:8000"
Write-Host ""
Write-Host "For RC setup, see README.md section on connecting DJI RC-N1"