@echo off
echo ========================================
echo Installing Required Dependencies
echo ========================================
cd /d E:\Gym\gym-management\frontend
echo.
echo Installing npm packages...
call npm install
echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run build (to verify no errors)
echo 2. Run: npm run dev (to start development server)
echo.
pause
