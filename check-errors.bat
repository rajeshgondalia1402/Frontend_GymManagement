@echo off
echo ========================================
echo TypeScript Error Check
echo ========================================
cd /d E:\Gym\gym-management\frontend
echo.
echo Checking for TypeScript errors...
echo.
call npx tsc --noEmit
echo.
if %errorlevel% equ 0 (
    echo ========================================
    echo SUCCESS! No TypeScript errors found.
    echo ========================================
) else (
    echo ========================================
    echo ERRORS FOUND! Please review above.
    echo ========================================
)
echo.
pause
