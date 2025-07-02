# Baba is You - Psychology Experiment

## 项目概述

这是一个基于Baba is You游戏的心理学实验，使用jsPsych框架构建，旨在研究问题解决能力和认知过程。实验通过操纵游戏元素与玩家日常生活经验的匹配程度，探究先验知识对学习新规则的影响。

## 实验设计

### 实验条件
实验采用2×6的混合设计：
- **被试间变量**: 先验经验匹配度
  - `high-prior`: 游戏元素与现实生活经验高度相关
  - `low-prior`: 游戏元素与现实生活经验相关度较低
- **被试内变量**: 6个journey关卡，每个关卡测试不同的认知技能

### Journey关卡设计

1. **journey_environment** - 环境理解
   - 核心互动: 理解环境中障碍物的阻挡作用
   - 操纵变量: 边界对象 (POOL vs BALLOON)

2. **journey_understandproperty** - 属性理解
   - 核心互动: 理解DESTRUCT/IMPACT属性的交互
   - 操纵变量: 破坏属性 (DESTRUCT vs IMPACT)

3. **journey_switchidentity** - 身份转换
   - 核心互动: 需要变换物体身份
   - 操纵变量: 关联对象 (CHAIN+ANCHOR vs CHAIN+FAN)

4. **journey_combination** - 组合使用
   - 核心互动: 理解SHUT和OPEN属性的组合使用
   - 操纵变量: 锁住和开启对象 (DOOR+KEY vs TREE+ROSE)

5. **journey_break** - 规则破坏
   - 核心互动: 理解如何通过操作规则文本来改变游戏规则
   - 操纵变量: 击败对象 (BOMB vs CANDLE)

6. **journey_grammar** - 语法规则
   - 核心互动: 理解游戏的语法规则，组合不同的语句
   - 操纵变量: 条件语句 (IF vs FEELING)

## 功能特点

- ✅ **完整的游戏引擎**: JavaScript实现的Baba is You核心游戏逻辑
- ✅ **实验条件系统**: 支持high-prior和low-prior条件的随机分配
- ✅ **认知测试集成**: 数字广度测试、DSST、口语流畅性测试、AUT
- ✅ **问卷系统**: 创造力、主观年龄、人口统计学问卷
- ✅ **玩家反馈收集**: 每个关卡后的建议收集系统
- ✅ **数据收集**: 完整的游戏数据记录和评分系统
- ✅ **实验流程控制**: 章节选择、关卡解锁、进度追踪
- ✅ **易于部署**: 纯HTML/CSS/JavaScript，兼容Pavlovia等平台

## 文件结构

```
baba_js_version/
├── main.html                    # 本地开发入口文件
├── css/
│   ├── baba-game.css           # 游戏样式
│   └── cognitive-tasks.css     # 认知任务样式
├── js/
│   ├── experiment.js           # 主实验控制器
│   ├── game-engine.js          # 游戏引擎
│   ├── level-data.js           # 关卡数据定义
│   ├── experimental-conditions.js  # 实验条件配置
│   ├── jspsych-baba-game.js    # 主游戏插件
│   ├── jspsych-baba-instructions.js  # 游戏说明插件
│   ├── jspsych-chapter-select.js     # 章节选择插件
│   ├── jspsych-rating-scale.js       # 评分插件
│   ├── jspsych-feedback-input.js     # 反馈收集插件
│   ├── jspsych-digit-span.js         # 数字广度测试插件
│   ├── jspsych-dsst.js               # DSST插件
│   ├── jspsych-aut.js                # AUT插件
│   ├── jspsych-verbal-fluency.js     # 口语流畅性插件
│   └── questionnaire-data.js         # 问卷数据
├── images/                     # 游戏图片资源
├── images_red/                 # 红色版本图片
├── text_images/                # 文字图片
├── audio/                      # 音频文件
├── fonts/                      # 字体文件
├── jspsych/                    # jsPsych库文件
└── data/                       # 数据存储目录
```

## 实验流程

1. **实验介绍** - 总体说明和知情同意
2. **游戏介绍** - Baba is You游戏说明
3. **Tutorial关卡** - 2个教学关卡
4. **Journey关卡** - 6个实验关卡（根据条件显示不同内容）
5. **整体表现评分** - 游戏整体表现评价
6. **数字广度测试** - 正序和倒序
7. **DSST测试** - 数字符号替换测试
8. **AUT测试** - 替代用途测试
9. **口语流畅性测试** - 动物类别流畅性
10. **问卷** - 创造力、主观年龄、人口统计学
11. **数据保存** - 自动保存所有实验数据

## 数据收集

### 游戏数据
- 关卡完成情况（成功/失败）
- 完成时间和剩余时间
- 移动次数、撤销次数、暂停次数
- 难度评分（1-10分）
- 创意评分（1-10分）
- 玩家反馈文本

### 认知测试数据
- 数字广度测试：正序和倒序成绩
- DSST：正确反应数和反应时间
- AUT：创意数量、创意时间戳、响应间隔
- 口语流畅性：词汇数量、词汇时间戳、响应间隔

### 问卷数据
- 创造力问卷（CPI, CSE, CMS）
- 主观年龄问卷（AARC）
- 人口统计学问卷（DEM）

### 实验元数据
- 参与者ID
- 实验条件分配
- 完成状态
- 设备信息
- 时间戳

## 快速开始

### 本地测试
1. 直接在浏览器中打开 `main.html`
2. 开始实验，测试所有功能

### Pavlovia部署
1. 在GitHub上创建仓库并上传代码
2. 在Pavlovia.org上创建新项目
3. 选择"Import from Git"
4. 输入GitHub仓库URL
5. 设置入口点为 `main.html`

## 核心组件说明

### 实验控制器 (experiment.js)
- `ExperimentController`: 主实验控制类
- 随机分配实验条件
- 管理实验流程和时间线
- 数据收集和保存

### 游戏引擎 (game-engine.js)
- `BabaGameEngine`: 主游戏引擎类
- `GameObject`: 游戏对象类
- `Rule`: 规则系统类
- 支持IF/FEELING语法规则

### 实验条件系统 (experimental-conditions.js)
- 定义high-prior和low-prior条件
- 支持动态对象和属性替换
- 确保实验条件的一致性

### jsPsych插件
- **baba-game**: 核心游戏插件
- **rating-scale**: 评分收集插件
- **feedback-input**: 玩家反馈收集插件
- **digit-span**: 数字广度测试插件
- **dsst**: DSST测试插件
- **aut**: AUT测试插件
- **verbal-fluency**: 口语流畅性测试插件

## 游戏操作

- **方向键**: 移动YOU对象
- **Z键**: 撤销上一步操作
- **P键**: 暂停/继续游戏
- **R键**: 重新开始当前关卡

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
- 元数据（参与者ID、关卡信息、实验条件等）

## 许可证

本项目基于原版Baba is You游戏概念，仅用于学术研究目的。 