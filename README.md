# Baba is You - jsPsych版本

## 项目概述

这是基于原版Baba is You游戏的jsPsych在线心理学实验版本。该版本将复杂的Python pygame游戏成功转换为可在浏览器中运行的JavaScript实验，完全兼容jsPsych框架，易于部署到在线平台如Pavlovia、JATOS等。

## 功能特点

- ✅ **完整的游戏引擎**: JavaScript实现的Baba is You核心游戏逻辑
- ✅ **jsPsych集成**: 标准的jsPsych插件架构，易于扩展
- ✅ **响应式设计**: 适配不同屏幕尺寸
- ✅ **数据收集**: 完整的游戏数据记录和评分系统
- ✅ **实验流程控制**: 章节选择、关卡解锁、进度追踪
- ✅ **易于部署**: 纯HTML/CSS/JavaScript，无需服务器端支持

## 文件结构

```
baba_js_version/
├── index.html                 # 主页面
├── css/
│   └── baba-game.css         # 游戏样式
├── js/
│   ├── game-engine.js        # 游戏引擎
│   ├── level-data.js         # 关卡数据
│   ├── jspsych-baba-game.js  # 主游戏插件
│   ├── jspsych-baba-instructions.js  # 说明插件
│   ├── jspsych-chapter-select.js     # 选择插件
│   ├── jspsych-rating-scale.js       # 评分插件
│   └── experiment.js         # 主实验控制器
└── README.md                 # 本文档
```

## 快速开始

### 1. 本地测试

1. 直接在浏览器中打开 `index.html`
2. 开始实验，测试所有功能

### 2. 部署到在线平台

#### Pavlovia部署：
1. 将整个文件夹上传到GitLab仓库
2. 在Pavlovia中导入项目
3. 设置实验为"Running"状态

#### JATOS部署：
1. 将文件夹压缩为ZIP文件
2. 在JATOS中创建新研究
3. 上传ZIP文件作为组件

#### 其他平台：
- 可部署到任何支持静态HTML的平台
- 包括Netlify、GitHub Pages、Vercel等

## 核心组件说明

### 游戏引擎 (game-engine.js)
- `BabaGameEngine`: 主游戏引擎类
- `GameObject`: 游戏对象类
- `Rule`: 规则系统类
- 完整实现了原版游戏的核心机制

### 关卡数据 (level-data.js)
- 包含tutorial和journey关卡
- 支持实验条件变量替换
- 易于添加新关卡

### jsPsych插件
- **baba-game**: 核心游戏插件，处理游戏逻辑和交互
- **baba-instructions**: 游戏说明和教程
- **chapter-select**: 章节和关卡选择界面
- **rating-scale**: 关卡完成后的评分收集

## 游戏操作

- **方向键**: 移动YOU对象
- **Z键**: 撤销上一步操作
- **P键**: 暂停/继续游戏
- **R键**: 重新开始当前关卡

## 数据收集

实验会收集以下数据：
- 关卡完成情况（成功/失败）
- 完成时间和剩余时间
- 移动次数、撤销次数、暂停次数
- 难度评分（1-7分）
- 创意评分（1-7分）
- 整体表现评分（1-7分）

数据自动保存到浏览器本地存储，也可修改为发送到服务器。

## 自定义和扩展

### 添加新关卡
在 `level-data.js` 中的 `LEVEL_DATA` 对象中添加新关卡：

```javascript
{
    level_id: "new_level",
    name: "Level Name",
    grid_size: [width, height],
    elements: [
        // 对象列表
    ]
}
```

### 修改实验流程
在 `experiment.js` 中的 `ExperimentController` 类中修改时间线。

### 添加新的评分维度
扩展 `jspsych-rating-scale.js` 插件，添加新的 `rating_type`。

## 技术细节

### 兼容性
- 现代浏览器（Chrome、Firefox、Safari、Edge）
- 移动设备浏览器
- 需要JavaScript支持

### 性能优化
- 高效的网格渲染系统
- 最小化DOM操作
- 响应式布局适配

### 数据格式
实验数据采用jsPsych标准格式，包含：
- 试验类型标识
- 反应时间
- 参与者响应
- 元数据（参与者ID、关卡信息等）

## 与原版对比

| 特性 | 原版Python | jsPsych版本 |
|------|------------|-------------|
| 运行环境 | 需要Python环境 | 浏览器直接运行 |
| 部署方式 | 本地安装 | 在线部署 |
| 数据收集 | 本地文件 | 灵活配置 |
| 兼容性 | Windows/Mac/Linux | 跨平台浏览器 |
| 扩展性 | Python生态 | Web生态 |
| 性能 | 原生性能 | 优化后接近原生 |

## 未来改进

- [ ] 添加音效支持
- [ ] 实现更多Baba is You关卡
- [ ] 集成眼动追踪支持
- [ ] 添加实时数据上传功能
- [ ] 支持更多实验条件变量

## 支持与反馈

如有问题或建议，请通过以下方式联系：
- 在项目仓库中创建Issue
- 发送邮件到研究团队

## 许可证

本项目基于原版Baba is You游戏概念，仅用于学术研究目的。 