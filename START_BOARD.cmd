@echo off
cd /d "%~dp0"
where node >nul 2>&1
if not errorlevel 1 (
  node "%~dp0serve-board.mjs"
  goto :done
)
where py >nul 2>&1
if not errorlevel 1 (
  echo Open http://127.0.0.1:8765 in your browser.
  py -3 -m http.server 8765 --bind 127.0.0.1 --directory "%~dp0midam-ad-board\dist"
  goto :done
)
where python >nul 2>&1
if not errorlevel 1 (
  echo Open http://127.0.0.1:8765 in your browser.
  python -m http.server 8765 --bind 127.0.0.1 --directory "%~dp0midam-ad-board\dist"
  goto :done
)
echo Install Node.js or Python 3, then run START_BOARD.cmd again.
:done
pause
