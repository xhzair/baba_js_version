#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地Web服务器启动脚本
用于避免CORS问题，确保WAV音频文件能正常加载
"""

import os
import sys
import http.server
import socketserver
import webbrowser
from pathlib import Path

# 设置服务器端口
PORT = 8000

# 确保在正确的目录中运行
script_dir = Path(__file__).parent
os.chdir(script_dir)

print(f"📁 当前工作目录: {os.getcwd()}")
print(f"🌐 启动本地Web服务器，端口: {PORT}")

# 检查音频文件是否存在
audio_dir = Path("audio")
if audio_dir.exists():
    wav_files = list(audio_dir.glob("digit_*.wav"))
    print(f"🎵 找到 {len(wav_files)} 个WAV音频文件")
    if len(wav_files) < 10:
        print("⚠️  警告：未找到全部10个数字音频文件")
        missing = [f"digit_{i}.wav" for i in range(10) if not (audio_dir / f"digit_{i}.wav").exists()]
        print(f"   缺失文件: {', '.join(missing)}")
else:
    print("❌ 错误：audio目录不存在！")
    print("   请确保音频文件位于 baba_js_version/audio/ 目录中")

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加CORS头部以允许跨域请求
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        # 只记录音频文件的访问日志
        if args[0].endswith('.wav'):
            print(f"🎵 加载音频: {args[0]}")
        elif args[0].endswith('.html'):
            print(f"📄 访问页面: {args[0]}")

try:
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        server_url = f"http://localhost:{PORT}"
        
        print(f"\n✅ 服务器已启动!")
        print(f"🔗 测试页面: {server_url}/test-digit-span.html")
        print(f"🔗 主实验: {server_url}/main.html")
        print("\n按 Ctrl+C 停止服务器")
        
        # 自动在浏览器中打开测试页面
        try:
            webbrowser.open(f"{server_url}/test-digit-span.html")
        except:
            pass
        
        # 启动服务器
        httpd.serve_forever()
        
except KeyboardInterrupt:
    print("\n\n🛑 服务器已停止")
except OSError as e:
    if e.errno == 48:  # Address already in use
        print(f"❌ 端口 {PORT} 已被占用")
        print(f"   请关闭其他使用该端口的程序，或修改脚本中的PORT变量")
    else:
        print(f"❌ 启动服务器时出错: {e}")
    sys.exit(1) 