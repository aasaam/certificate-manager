@echo off
goto check_Permissions

:check_Permissions
  echo Administrative permissions required. Detecting permissions...

  net session >nul 2>&1
  if %errorLevel% == 0 (
    certutil -addstore -f -enterprise -user root "%~dp0PROVIDER_NAME.cer"
  ) else (
    echo Failure: Current permissions inadequate.
  )

  pause >nul

