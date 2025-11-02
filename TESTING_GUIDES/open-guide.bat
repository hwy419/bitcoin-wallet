@echo off
REM Launch the Interactive HTML Testing Guide in the default browser (Windows)

set "HTML_FILE=%~dp0testing-guide.html"

if not exist "%HTML_FILE%" (
    echo Error: testing-guide.html not found!
    echo Run: python build-html-guide.py
    pause
    exit /b 1
)

echo Opening Bitcoin Wallet Testing Guide...
echo File: %HTML_FILE%

start "" "%HTML_FILE%"

echo.
echo Opened in browser!
echo.
echo Tip: Bookmark this page for quick access!
echo Use the search box in the sidebar to find guides quickly
echo Click checkboxes to track your testing progress
echo.
pause
