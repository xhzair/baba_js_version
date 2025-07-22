@echo off
echo 正在启动Baba游戏截图生成器的本地服务器...
echo.
echo 服务器启动后，请在浏览器中访问：
echo http://localhost:8000/screenshot_generator_enhanced.html
echo.
echo 按 Ctrl+C 停止服务器
echo.
python -m http.server 8000
pause 