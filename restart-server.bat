@echo off
echo Stopping server...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Starting server...
node run.js

