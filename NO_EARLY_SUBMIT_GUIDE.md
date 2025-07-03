# 不允许提前提交功能说明

## 概述

修改了 jspsych-aut 和 jspsych-verbal-fluency 任务，移除了提前提交按钮，被试必须等到倒计时结束才能自动提交。

## 修改内容

### jspsych-aut.js

1. **界面修改**：
   - 移除了 "Submit" 按钮
   - 添加了提示文字："The test will automatically submit when time is up."
   - 保持其他界面元素不变

2. **功能修改**：
   - 移除了提交按钮的事件监听器
   - 修改 `updateTimer()` 函数，倒计时结束时自动调用 `saveAnswer()`
   - 确保倒计时结束时正确保存数据

### jspsych-verbal-fluency.js

1. **界面修改**：
   - 移除了 "Submit" 按钮
   - 添加了提示文字："The test will automatically submit when time is up."
   - 保持其他界面元素不变

2. **功能修改**：
   - 移除了提交按钮的事件监听器
   - 修改倒计时逻辑，倒计时结束时直接执行提交逻辑
   - 确保倒计时结束时正确保存数据

## 技术实现

### AUT 倒计时逻辑

```javascript
updateTimer(){
    const remain = this.timeLimit - (performance.now() - this.startTime)/1000;
    const t = document.getElementById('aut-timer');
    if(t) t.textContent = `Time left: ${Math.max(0,remain).toFixed(1)} s`;
    if(remain <= 0){
        clearInterval(this.timer);
        // auto-submit when time is up
        const textarea = document.getElementById('aut-input');
        if(textarea) {
            this.saveAnswer(textarea.value);
        } else {
            this.finish();
        }
    }
}
```

### Verbal Fluency 倒计时逻辑

```javascript
this.timer = setInterval(()=>{
    const remain = this.timeLimit - (performance.now() - this.startTime)/1000;
    const tEl = el.querySelector('#vf-timer');
    if(tEl){ tEl.textContent = `Time left: ${Math.max(0,remain).toFixed(1)} s`; }
    if(remain <= 0){
        clearInterval(this.timer);
        // auto-submit when time is up
        this.testInput = textarea.value;
        this.testNames = this.testInput.split(',').map(s=>s.trim()).filter(s=>s);
        this.usedTime = Math.min(this.timeLimit, (performance.now() - this.startTime)/1000);
        this.phase = 'result';
        this.showResult(el);
    }
}, 100);
```

## 用户体验

### 优势

1. **标准化时间**：确保所有被试都有相同的时间限制
2. **防止提前结束**：避免被试因为紧张或其他原因提前提交
3. **数据一致性**：所有数据都在相同的时间条件下收集
4. **简化界面**：减少界面元素，降低认知负荷

### 界面提示

- 添加了明确的提示文字，告知被试测试将自动提交
- 保持倒计时显示，让被试了解剩余时间
- 保持输入格式验证功能

## 测试

可以使用 `test_no_early_submit.html` 文件来测试功能：

1. 打开测试页面
2. 观察界面是否没有提交按钮
3. 输入一些内容
4. 等待倒计时结束，观察是否自动提交

### 测试要点

- ✅ 界面无提交按钮
- ✅ 显示自动提交提示
- ✅ 倒计时正常工作
- ✅ 倒计时结束时自动提交
- ✅ 数据正确保存

## 兼容性

- 保持与原有数据格式的完全兼容
- 不影响时间戳记录功能
- 不影响输入格式验证功能
- 不影响练习阶段功能

## 配置选项

时间限制可以通过参数配置：

```javascript
// AUT
{
    type: 'aut',
    objects: ['Brick', 'Bedsheet'],
    time_limit: 120, // 2分钟
    participant_id: 'test_participant'
}

// Verbal Fluency
{
    type: 'verbal-fluency',
    participant_id: 'test_participant',
    practice_category: 'Tools',
    test_category: 'Animals',
    time_limit: 60 // 1分钟
}
```

## 注意事项

1. **被试体验**：确保被试了解测试将自动提交
2. **时间设置**：合理设置时间限制，避免被试感到压力
3. **数据备份**：确保倒计时结束时的数据保存逻辑正确
4. **错误处理**：添加适当的错误处理机制

## 未来改进

1. **进度提示**：可以添加进度条或百分比显示
2. **声音提醒**：倒计时结束前的声音提醒
3. **视觉反馈**：倒计时结束时的视觉反馈
4. **数据验证**：提交前的数据完整性检查 