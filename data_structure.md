# 实验数据结构说明文档

本文档描述了认知实验收集的数据结构，包括各个任务的数据格式和字段含义。

## 1. Baba游戏数据结构

### 游戏基本信息
- `level_id`: 关卡ID
- `result`: 游戏结果 ("won", "dead", "timeout", "skipped")
- `total_duration_ms`: 游戏总持续时间（毫秒）
- `moves_count`: 总移动次数
- `average_time_between_moves_ms`: 移动间平均时间（毫秒）

### 详细操作记录
- `move_timestamps`: 操作时间戳数组，每一项包含：
  - `move_number`: 操作序号
  - `time_since_start_ms`: 从游戏开始至今的时间（毫秒）
  - `time_since_last_move_ms`: 与上一次操作的间隔时间（毫秒）
  - `is_meta_operation`: 是否为元操作（布尔值），元操作是指与游戏系统而非游戏内容交互的操作
  - `meta_type`: 元操作类型 ("undo", "reset", "pause" 或 null)
  - `direction`: 移动方向，如 [0, 1] 表示向下，[1, 0] 表示向右
  - `was_successful`: 操作是否成功（布尔值）

### 操作分析
- `operation_analyses`: 操作分析数组，每一项包含：
  - `content_type`: 操作类型 ("move_only", "push_text", "push_object")
  - `text_count`: 被操作的文本元素数量
  - `text_types`: 被操作的文本类型数组
  - `object_count`: 被操作的对象数量
  - `object_types`: 被操作的对象类型数组
  - `objects_involved`: 参与操作的对象完整信息数组，每个对象包含：
    - `type`: 对象类型
    - `position`: 对象位置 [x, y]
    - `is_text`: 是否为文本元素（布尔值）
    - `properties`: 对象属性数组，如 ["YOU", "PUSH"]
  - `rules_affected`: 规则变化信息
    - `effect`: 规则变化效果 ("none", "created", "destroyed", "modified")
    - `rules_added`: 新增规则数组
    - `rules_removed`: 移除规则数组
  - `move_number`: 对应的操作序号
  - `timestamp`: 操作时间戳

### 规则操作统计
- `rule_operation_stats`: 规则操作统计
  - `total_rule_operations`: 规则操作总数
  - `rule_creation_count`: 规则创建次数
  - `rule_destruction_count`: 规则销毁次数
  - `rule_modification_count`: 规则修改次数
  - `rule_types`: 规则类型统计
    - `movement_rules`: 移动规则次数（如 "BABA IS YOU"）
    - `transformation_rules`: 转换规则次数（如 "WALL IS ROCK"）
    - `property_rules`: 属性规则次数（如 "WALL IS PUSH"）
    - `win_condition_rules`: 获胜条件规则次数（如 "FLAG IS WIN"）

### 游戏状态快照
- `final_state`: 游戏最终状态
  - `objects`: 对象状态数组
  - `current_rules`: 当前规则数组
  - `is_win`: 是否获胜（布尔值）
  - `is_dead`: 是否死亡（布尔值）
  - `has_control`: 玩家是否有控制权（布尔值）
  - `has_overlap`: 是否有对象重叠（布尔值）
  - `grid_size`: 网格尺寸 [width, height]
  - `level_id`: 关卡ID

## 2. 数字广度测试数据结构

### 基本信息
- `participant_id`: 参与者ID
- `task_version`: 任务版本（"forward", "backward"）
- `max_span`: 达到的最大广度
- `total_correct`: 正确回答总数
- `total_trials`: 测试总次数

### 详细试次记录
- `trials`: 试次记录数组，每一项包含：
  - `span_length`: 广度长度
  - `presented_digits`: 呈现的数字序列数组
  - `response_digits`: 回答的数字序列数组
  - `is_correct`: 是否正确（布尔值）
  - `reaction_time_ms`: 反应时间（毫秒）

## 3. 数字符号替代测试(DSST)数据结构

### 基本信息
- `participant_id`: 参与者ID
- `duration_sec`: 测试持续时间（秒）
- `total_correct`: 正确回答总数
- `total_attempted`: 尝试回答总数
- `accuracy`: 正确率（正确数/尝试数）
- `processing_speed`: 处理速度（尝试数/时间）

### 详细反应记录
- `responses`: 反应记录数组，每一项包含：
  - `symbol`: 符号ID
  - `digit`: 对应数字
  - `response`: 参与者回答
  - `correct`: 是否正确（布尔值）
  - `rt_ms`: 反应时间（毫秒）

## 4. 词语流畅性测试数据结构

### 基本信息
- `participant_id`: 参与者ID
- `practice_raw`: 练习阶段原始输入
- `practice_list`: 练习阶段词语列表
- `test_raw`: 正式测试原始输入
- `test_list`: 正式测试词语列表
- `test_count`: 正式测试词语数量
- `used_time`: 使用时间（秒）

### 详细时间记录
- `word_timestamps`: 单词输入时间记录数组，每一项包含：
  - `word`: 输入的单词
  - `time`: 输入时间（秒）
  - `index`: 单词索引

### 时间间隔分析
- `response_intervals`: 响应间隔数组（秒）
- `response_analysis`: 响应分析
  - `average_interval`: 平均响应间隔（秒）
  - `max_interval`: 最大响应间隔（秒）
  - `std_deviation`: 响应间隔标准差
- `first_third_count`: 第一个三分之一时间段输出词语数量
- `middle_third_count`: 中间三分之一时间段输出词语数量
- `last_third_count`: 最后三分之一时间段输出词语数量

## 5. 另类用途测试(AUT)数据结构

### 基本信息
- `participant_id`: 参与者ID
- `responses`: 每个物体的响应数组，每一项包含：
  - `object`: 测试物体名称
  - `answer`: 原始回答文本
  - `idea_count`: 创意数量
  - `rt`: 反应时间（秒）

### 详细时间记录
- `idea_timestamps`: 创意输入时间记录数组，每一项包含：
  - `idea`: 创意内容
  - `time`: 输入时间（秒）
  - `index`: 创意索引
- `response_intervals`: 创意间隔时间数组（秒）
- `response_analysis`: 响应分析
  - `average_interval`: 平均响应间隔（秒）
  - `max_interval`: 最大响应间隔（秒）
  - `std_deviation`: 响应间隔标准差
  - `first_third_count`: 第一个三分之一时间段输出创意数量
  - `middle_third_count`: 中间三分之一时间段输出创意数量
  - `last_third_count`: 最后三分之一时间段输出创意数量

## 6. 问卷调查数据结构

### 基本信息
- `participant_id`: 参与者ID
- `completion_time`: 完成时间（ISO8601格式）
- `responses`: 问题回答数组，每一项包含：
  - `id`: 问题ID
  - `source`: 问题来源（如量表名称）
  - `type`: 问题类型（"likert", "option", "text"）
  - `question`: 问题文本
  - `answer_value`: 选项值（数值）
  - `answer_text`: 选项文本或输入文本

### 注意力检查信息
- `attention_check_data`: 注意力检查数据
  - `attention_checks_count`: 注意力检查问题总数
  - `attention_check_failures`: 注意力检查失败记录数组，每一项包含：
    - `question_id`: 问题ID
    - `question_text`: 问题文本
    - `time`: 失败时间（ISO8601格式）

## 7. 实验整体数据结构

### 基本信息
- `participant_id`: 参与者ID
- `session_id`: 会话ID
- `experiment_version`: 实验版本
- `start_time`: 开始时间（ISO8601格式）
- `end_time`: 结束时间（ISO8601格式）
- `total_duration_sec`: 总持续时间（秒）
- `completion_status`: 完成状态（"completed", "partial", "abandoned"）
- `device_info`: 设备信息对象
  - `browser`: 浏览器信息
  - `os`: 操作系统信息
  - `screen_resolution`: 屏幕分辨率 [width, height]
  - `window_size`: 窗口大小 [width, height]

### 实验数据
- `tasks_completed`: 完成任务列表
- `baba_game_data`: Baba游戏数据（见第1节）
- `digit_span_data`: 数字广度测试数据（见第2节）
- `dsst_data`: 数字符号替代测试数据（见第3节）
- `verbal_fluency_data`: 词语流畅性测试数据（见第4节）
- `aut_data`: 另类用途测试数据（见第5节）
- `questionnaire_data`: 问卷调查数据（见第6节） 