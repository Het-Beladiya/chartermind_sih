@echo off
TITLE Create Clean Shareable Zip
COLOR 0A

echo ======================================================================
echo    Packaging CharterMind for Hackathon Teammates (Zip Export)
echo ======================================================================
echo.
echo Excluding heavy/machine-specific folders:
echo   - node_modules/ (Teammates install via 'npm install')
echo   - venv/ and .venv/ (Teammates install via 'pip install -r requirements.txt')
echo   - dist/ and build/
echo   - __pycache__/
echo.

cd /d "%~dp0"

set "ZIP_DEST=%USERPROFILE%\Desktop\CharterMind_SIH_Shareable.zip"

echo Compressing files to: %ZIP_DEST% ...
tar -a -c -f "%ZIP_DEST%" ^
  --exclude="node_modules" ^
  --exclude="venv" ^
  --exclude=".venv" ^
  --exclude="dist" ^
  --exclude="build" ^
  --exclude=".git" ^
  --exclude="__pycache__" ^
  backend frontend README.md run_dev.bat run_dev.sh .env .gitignore

if exist "%ZIP_DEST%" (
    echo.
    echo ======================================================================
    echo  SUCCESS! Clean zip archive created:
    echo  %ZIP_DEST%
    echo.
    echo  You can now send this file to your teammates via:
    echo   * Google Drive
    echo   * Telegram / Discord / WhatsApp
    echo   * USB Pendrive
    echo ======================================================================
) else (
    echo.
    echo [ERROR] Failed to create zip archive. Please check permissions.
)

echo.
pause
