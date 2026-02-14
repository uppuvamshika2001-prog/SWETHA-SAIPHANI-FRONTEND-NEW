@echo off
echo ============================================
echo    FRONTEND SMOKE TEST
echo ============================================
echo.

echo [1/5] Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [FAILED] npm install failed
    exit /b 1
)
echo [PASSED] Dependencies installed
echo.

echo [2/5] Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo [FAILED] npm run build failed
    exit /b 1
)
echo [PASSED] Build completed successfully
echo.

echo [3/5] Starting frontend dev server on port 5174...
start "" cmd /c "npm run dev -- --port 5174"
echo [INFO] Dev server starting in background...
echo.

echo [4/5] Waiting for server to start (15 seconds)...
timeout /t 15 >nul
echo [INFO] Wait complete
echo.

echo [5/5] Checking homepage at http://localhost:5174...
curl -s -o NUL -w "HTTP Status: %%{http_code}\n" http://localhost:5174
if %errorlevel% neq 0 (
    echo [FAILED] Could not reach frontend at localhost:5174
    exit /b 1
)
echo [PASSED] Frontend is accessible
echo.

echo ============================================
echo    FRONTEND SMOKE TEST PASSED!
echo ============================================
echo.
echo Server running at: http://localhost:5174
echo Press any key to stop the server and exit...
pause >nul

echo Stopping node processes...
taskkill /IM node.exe /F >nul 2>&1
echo Done.
