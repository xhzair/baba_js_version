@echo off
chcp 65001 >nul
echo.
echo 🌐 Baba实验本地服务器启动器
echo ================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到Python
    echo    请先安装Python 3.x: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查音频文件
if not exist "audio" (
    echo ❌ 错误：audio目录不存在！
    echo    请确保音频文件位于 baba_js_version\audio\ 目录中
    echo.
    pause
    exit /b 1
)

echo 📁 当前目录: %CD%
echo 🎵 检查音频文件...

REM 启动Python服务器
echo 🚀 启动Python服务器...
echo.
python start_server.py

REM 如果服务器停止，等待用户按键
echo.
pause 