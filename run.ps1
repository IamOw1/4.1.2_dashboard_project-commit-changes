# COBA AI Drone Agent - Windows Run Script
# Run with: .\run.ps1 [mode]

param(
    [string]$Mode = "help"
)

$RED = "`e[91m"
$GREEN = "`e[92m"
$YELLOW = "`e[93m"
$BLUE = "`e[94m"
$NC = "`e[0m"

function Write-ColoredOutput {
    param([string]$Color, [string]$Message)
    Write-Host "$Color$Message$NC"
}

function Show-Help {
    Write-ColoredOutput $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-ColoredOutput $GREEN "🚁 COBA AI Drone Agent 2.0 - Windows Runner"
    Write-ColoredOutput $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    Write-ColoredOutput $YELLOW "Usage:"
    Write-Host "  .\run.ps1 [mode]"
    Write-Host ""
    Write-ColoredOutput $YELLOW "Modes:"
    Write-Host "  check      Check system integrity"
    Write-Host "  agent      Run agent only"
    Write-Host "  api        Run API server (port 8000)"
    Write-Host "  dashboard  Run dashboard (port 8501)"
    Write-Host "  frontend   Run React frontend (port 3000)"
    Write-Host "  all        Run all components"
    Write-Host "  help       Show this help"
    Write-Host ""
    Write-ColoredOutput $YELLOW "Examples:"
    Write-Host "  .\run.ps1 check              # Check system"
    Write-Host "  .\run.ps1 agent              # Run agent"
    Write-Host "  .\run.ps1 api                # Run API"
    Write-Host "  .\run.ps1 frontend           # Run React UI"
    Write-Host "  .\run.ps1 all                # Run everything"
}

function Test-Python {
    try {
        $pythonVersion = python --version 2>&1
        if ($pythonVersion -match "Python (\d+)\.(\d+)") {
            $major = [int]$matches[1]
            $minor = [int]$matches[2]
            if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 11)) {
                Write-ColoredOutput $RED "✗ Python 3.11+ required"
                exit 1
            }
            Write-ColoredOutput $GREEN "✓ Python $pythonVersion"
        }
    }
    catch {
        Write-ColoredOutput $RED "✗ Python not found"
        exit 1
    }
}

function Test-Dependencies {
    Write-ColoredOutput $BLUE "Checking dependencies..."

    # Test Python packages
    try {
        python -c "import yaml" 2>$null
    }
    catch {
        Write-ColoredOutput $RED "✗ PyYAML not installed"
        Write-Host "Install with: pip install -r requirements.txt"
        exit 1
    }

    try {
        python -c "import fastapi" 2>$null
    }
    catch {
        Write-ColoredOutput $RED "✗ FastAPI not installed"
        Write-Host "Install with: pip install -r requirements.txt"
        exit 1
    }

    # Test Node.js
    try {
        $null = Get-Command node -ErrorAction Stop
    }
    catch {
        Write-ColoredOutput $RED "✗ Node.js not installed"
        exit 1
    }

    try {
        $null = Get-Command npm -ErrorAction Stop
    }
    catch {
        Write-ColoredOutput $RED "✗ npm not installed"
        exit 1
    }

    Write-ColoredOutput $GREEN "✓ Dependencies OK"
}

switch ($Mode) {
    "check" {
        Write-ColoredOutput $BLUE "Checking system integrity..."
        python check_system.py
    }

    "agent" {
        Test-Python
        Test-Dependencies
        Write-ColoredOutput $GREEN "🚁 Starting agent..."
        python main.py agent
    }

    "api" {
        Test-Python
        Test-Dependencies
        Write-ColoredOutput $GREEN "🚁 Starting API server..."
        python main.py api $args
    }

    "dashboard" {
        Test-Python
        Test-Dependencies
        Write-ColoredOutput $GREEN "🚁 Starting dashboard..."
        python main.py dashboard
    }

    "frontend" {
        Test-Dependencies
        Write-ColoredOutput $GREEN "🚁 Starting React frontend..."
        Write-ColoredOutput $BLUE "Frontend will be at: http://localhost:3000"
        npm run dev
    }

    "all" {
        Test-Python
        Test-Dependencies
        Write-ColoredOutput $GREEN "🚁 Starting all components..."
        Write-ColoredOutput $BLUE "URLs:"
        Write-Host "  API: http://localhost:8000"
        Write-Host "  Dashboard: http://localhost:8501"
        Write-Host "  Frontend: http://localhost:3000"
        Write-Host ""

        # Start Ollama if available
        try {
            $ollamaProcess = Get-Process ollama -ErrorAction SilentlyContinue
            if (-not $ollamaProcess) {
                Write-ColoredOutput $YELLOW "Starting Ollama service..."
                Start-Process ollama -ArgumentList "serve" -NoNewWindow
                Start-Sleep -Seconds 2
            }
        }
        catch {
            Write-ColoredOutput $YELLOW "Could not start Ollama automatically"
        }

        # Start backend
        $backendJob = Start-Job -ScriptBlock {
            python main.py all
        }

        # Start frontend
        $frontendJob = Start-Job -ScriptBlock {
            npm run dev
        }

        Write-ColoredOutput $GREEN "All services started! Press Ctrl+C to stop."

        # Wait for jobs
        try {
            Wait-Job $backendJob, $frontendJob
        }
        catch {
            Write-ColoredOutput $YELLOW "Stopping services..."
            Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
            Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
        }
    }

    "help" {
        Show-Help
    }

    default {
        Write-ColoredOutput $RED "✗ Unknown mode: $Mode"
        Write-Host ""
        Show-Help
        exit 1
    }
}