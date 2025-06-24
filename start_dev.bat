@echo off
REM Document Processor Development Startup Script for Windows

echo 🚀 Starting Document Processor Development Environment...
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...

python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Start backend
echo 🔧 Starting backend server...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies if requirements.txt exists
if exist "requirements.txt" (
    echo 📦 Installing Python dependencies...
    pip install -r requirements.txt
)

REM Start backend server
echo 🚀 Starting FastAPI server...
start "Backend Server" cmd /k "python start_server.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Go back to root directory
cd ..

REM Start frontend
echo 🎨 Starting frontend server...
cd frontend

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    npm install
)

REM Start frontend server
echo 🚀 Starting React development server...
start "Frontend Server" cmd /k "npm start"

REM Go back to root directory
cd ..

echo.
echo 🎉 Development environment started!
echo.
echo 📡 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo 🌐 Frontend: http://localhost:3000
echo.
echo Close the command windows to stop the servers
pause 