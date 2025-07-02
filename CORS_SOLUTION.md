# 解决CORS问题和音频文件加载

## 问题描述

当通过`file://`协议（直接双击HTML文件）运行实验时，浏览器的CORS（跨域资源共享）策略会阻止音频文件的加载，导致出现以下错误：

```
Access to fetch at 'file:///...' from origin 'null' has been blocked by CORS policy
```

## 解决方案

### 🎯 方案一：使用本地Web服务器（推荐）

本地Web服务器可以完全解决CORS问题，确保所有WAV音频文件正常加载。

#### Windows用户：
1. 确保已安装Python 3.x
2. 双击运行 `start_server.bat`
3. 浏览器会自动打开测试页面

#### 手动启动（所有系统）：
```bash
cd baba_js_version
python start_server.py
```

然后在浏览器中访问：
- 测试页面：http://localhost:8000/test-digit-span.html
- 主实验：http://localhost:8000/main.html

### 🔧 方案二：浏览器设置（不推荐）

如果必须直接打开HTML文件，可以启动浏览器时禁用安全特性：

#### Chrome/Edge：
```bash
chrome.exe --disable-web-security --allow-file-access-from-files --user-data-dir="C:\temp\chrome_dev"
```

#### Firefox：
1. 在地址栏输入 `about:config`
2. 设置 `security.fileuri.strict_origin_policy` 为 `false`

⚠️ **警告**：这种方法会降低浏览器安全性，仅用于开发测试。

## 音频文件检查

确保以下音频文件存在于 `baba_js_version/audio/` 目录中：
- digit_0.wav
- digit_1.wav
- digit_2.wav
- digit_3.wav
- digit_4.wav
- digit_5.wav
- digit_6.wav
- digit_7.wav
- digit_8.wav
- digit_9.wav

## 技术说明

### 已实现的改进：
1. ✅ 启用了jsPsych的`override_safe_mode`
2. ✅ 使用HTML Audio元素替代Fetch API
3. ✅ 移除了合成音频功能（确保只使用WAV文件）
4. ✅ 增强了错误处理和调试信息

### 音频加载流程：
1. 使用HTML Audio元素加载WAV文件
2. 等待音频加载完成（canplaythrough事件）
3. 如果所有音频文件都无法加载，实验会抛出错误
4. 控制台会显示详细的加载状态信息

### 调试信息：
- `✓ Loaded digit X audio from WAV file` - 成功加载
- `✅ Audio loading complete. All 10 WAV files loaded successfully.` - 全部加载成功
- `❌ No WAV files could be loaded.` - 加载失败，需要使用Web服务器

## 常见问题

**Q: 为什么不能直接双击HTML文件运行？**
A: 现代浏览器的安全策略阻止`file://`协议访问本地文件，这是为了防止恶意网站访问用户的文件系统。

**Q: 本地服务器安全吗？**
A: 是的，本地服务器只在您的计算机上运行，只有您的浏览器可以访问，不会暴露到互联网。

**Q: 可以使用其他端口吗？**
A: 可以，编辑`start_server.py`中的`PORT = 8000`行，改为其他可用端口号。

**Q: 如何确认音频文件格式正确？**
A: 确保音频文件是WAV格式，44.1kHz采样率，16位深度。可以使用Audacity等软件转换格式。 