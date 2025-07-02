/**
 * Baba is You - jsPsych Experiment
 * 主实验控制文件
 */

// 初始化jsPsych
const jsPsych = initJsPsych({
    display_element: 'jspsych-target',
    default_iti: 250,
    override_safe_mode: true, // 允许在file://协议下运行
    on_finish: function() {
        // 实验结束时的处理
        console.log('Experiment completed');
        jsPsych.data.displayData('json');
    }
});

// 实验状态管理
class ExperimentController {
    constructor() {
        this.currentChapter = null;
        this.currentChapterIndex = 0;
        this.currentLevelIndex = 0;
        this.unlockedLevels = { tutorial: 1, journey: 0 };
        this.completedLevels = { tutorial: [], journey: [] };
        this.experimentData = [];
        this.participantId = this.generateParticipantId();
        
        // 随机分配实验条件 (prior-congruent 或 prior-incongruent)
        this.conditionType = this.randomAssignCondition();
        console.log(`Participant ${this.participantId} assigned to condition: ${this.conditionType}`);
        
        // 获取所有关卡数据
        this.allLevels = getAllLevels();
        this.chapters = getChapters();
    }
    
    // 随机分配实验条件
    randomAssignCondition() {
        const conditions = window.getConditionTypes ? 
                          window.getConditionTypes() : 
                          ['high-prior', 'low-prior'];
        
        // 随机选择一种条件
        const randomIndex = Math.floor(Math.random() * conditions.length);
        return conditions[randomIndex];
    }
    
    generateParticipantId() {
        return 'P_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 创建实验时间线
    createTimeline() {
        const timeline = [];
        
        // 1a. 实验总体介绍
        timeline.push(this.createExperimentIntroTrial());
        
        // 1b. Puzzle Game 介绍
        timeline.push(this.createPuzzleIntroTrial());
        
        // 2. 主游戏循环
        timeline.push(this.createMainGameLoop());
        
        // 3. 解谜任务总体表现评分
        timeline.push(this.createCompletionTrial());
        
        // 4. 数字广度测试介绍
        timeline.push(this.createDigitSpanIntroTrial());
        
        // 5. 数字广度测试 - 正序
        timeline.push(this.createDigitSpanForwardTrial());
        
        // 6. 数字广度测试 - 倒序
        timeline.push(this.createDigitSpanBackwardTrial());
        
        // 7. DSST 介绍
        timeline.push(this.createDSSTIntroTrial());
        
        // 8. DSST 任务
        timeline.push(this.createDSSTTaskTrial());
        
        // 9. Alternative Uses Test (AUT)
        timeline.push(this.createAUTTrial());
        
        // 9b. Transition to Verbal Fluency
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: `<h2 style="color:white;">Next Task: Verbal Fluency Test</h2>`,
            choices: ['Continue'],
            data: { trial_type: 'transition_aut_vf', participant_id: this.participantId }
        });
        
        // 10. Verbal Fluency Test
        timeline.push(this.createVerbalFluencyTrial());
        
        // 10b. Transition to Questionnaire
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: `<h2 style="color:white;">Next Task: Questionnaire</h2>`,
            choices: ['Continue'],
            data: { trial_type: 'transition_vf_q', participant_id: this.participantId }
        });
        
        // 11. Questionnaire
        timeline.push(this.createQuestionnaireTrial());
        
        return timeline;
    }
    
    createExperimentIntroTrial() {
        return {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                <h1 style="color: white;">Welcome to the Psychology Experiment</h1>
                <div style="color: white; max-width: 800px; margin: 0 auto; font-size: 18px; line-height: 1.6; text-align: left;">
                    <p>Thank you for participating!</p>
                    <br>
                    <p>This study explores your <strong>problem-solving ability</strong> and <strong>some cognitive abilities</strong>.</p>
                    <br>
                    <p>You will complete <strong>three parts</strong>:</p>
                    <p>1. A short puzzle game</p>
                    <p>2. Several cognitive tests (e.g., digit span)</p>
                    <p>3. Some brief questionnaires</p>
                    <br>
                    <p>The experiment will take about <strong>45-60 minutes</strong>.</p>
                    <p>Please follow the instructions shown before each part.</p>
                </div>
            `,
            choices: ['Begin'],
            data: {
                trial_type: 'experiment_intro',
                participant_id: this.participantId
            }
        };
    }
    
    createPuzzleIntroTrial() {
        return {
            type: jsPsychBabaInstructions,
            title: 'Welcome to the Puzzle Game',
            instructions: '', // 使用插件默认说明
            button_text: 'Start Puzzle Game',
            show_controls: true,
            data: {
                trial_type: 'puzzle_intro',
                participant_id: this.participantId
            }
        };
    }
    
    createDigitSpanIntroTrial() {
        return {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                <div style="color: white; max-width: 700px; margin: 0 auto; font-size: 18px; line-height: 1.6; text-align: center;">
                    <h1 style="color: white; margin-bottom: 30px;">Digit Span Test</h1>
                    <p>Now we will test your <strong>working memory</strong> with a digit span task.</p>
                    <br>
                    <p>You will complete <strong>two parts</strong>:</p>
                    <p><strong>Part 1:</strong> Repeat numbers in the same order</p>
                    <p><strong>Part 2:</strong> Repeat numbers in reverse order</p>
                    <br>
                    <p>The difficulty will adjust automatically based on your performance.</p>
                </div>
            `,
            choices: ['Start Digit Span Test'],
            data: {
                trial_type: 'digit_span_intro',
                participant_id: this.participantId
            }
        };
    }
    
    createDigitSpanForwardTrial() {
        return {
            type: jsPsychDigitSpan,
            mode: 'forward',
            starting_length: 3,
            max_length: 9,
            max_total_trials: 14,
            digit_duration: 0.5,
            digit_interval: 1.0,
            participant_id: this.participantId,
            data: {
                trial_type: 'digit_span_forward',
                participant_id: this.participantId
            }
        };
    }
    
    createDigitSpanBackwardTrial() {
        return {
            type: jsPsychDigitSpan,
            mode: 'backward',
            starting_length: 2,
            max_length: 9,
            max_total_trials: 14,
            digit_duration: 0.5,
            digit_interval: 1.0,
            participant_id: this.participantId,
            data: {
                trial_type: 'digit_span_backward',
                participant_id: this.participantId
            }
        };
    }
    
    createMainGameLoop() {
        const gameLoop = {
            timeline: [
                // 章节选择
                {
                    type: jsPsychChapterSelect,
                    selection_type: 'chapter',
                    chapters: this.chapters,
                    data: {
                        trial_type: 'chapter_selection',
                        participant_id: this.participantId
                    },
                    on_finish: (data) => {
                        // 保存当前选择的章节
                        this.currentChapter = data.chapter_key;
                    }
                },
                
                // 关卡选择和游戏循环
                {
                    timeline: [
                        // 关卡选择
                        {
                            type: jsPsychChapterSelect,
                            selection_type: 'level',
                            levels: () => {
                                return this.allLevels[this.currentChapter] || [];
                            },
                            current_chapter: () => {
                                const chapterData = this.chapters.find(c => c.key === this.currentChapter);
                                return chapterData ? chapterData.name : 'Unknown Chapter';
                            },
                            unlocked_levels: () => {
                                return this.unlockedLevels[this.currentChapter] || 1;
                            },
                            completed_levels: () => {
                                return this.completedLevels[this.currentChapter] || [];
                            },
                            data: {
                                trial_type: 'level_selection',
                                participant_id: this.participantId
                            },
                            on_finish: (data) => {
                                // 保存当前选择的关卡索引
                                this.currentLevelIndex = data.selected_level;
                            }
                        },
                        
                        // 游戏关卡和评分的条件时间轴
                        {
                            timeline: [
                                // 游戏关卡
                                {
                                    type: jsPsychBabaGame,
                                    level_data: () => {
                                        const lastTrialData = jsPsych.data.getLastTrialData().values()[0];
                                        const levelId = lastTrialData.level_data.level_id;
                                        
                                        // 只对journey章节的关卡使用实验条件
                                        if (levelId.startsWith('journey_')) {
                                            // 使用分配的实验条件生成关卡
                                            return generateLevel(levelId, this.conditionType);
                                        }
                                        
                                        return lastTrialData.level_data;
                                    },
                                    level_name: () => {
                                        const lastTrialData = jsPsych.data.getLastTrialData().values()[0];
                                        return lastTrialData.level_name;
                                    },
                                    chapter_name: () => {
                                        return this.currentChapter;
                                    },
                                    time_limit: 480, // 8 minutes
                                    data: {
                                        trial_type: 'game_level',
                                        participant_id: this.participantId,
                                        condition_type: this.conditionType  // 记录使用的实验条件
                                    },
                                    on_finish: (data) => {
                                        // 更新游戏状态
                                        if (data.success) {
                                            this.markLevelCompleted(this.currentChapter, this.currentLevelIndex);
                                        }
                                    }
                                },
                                
                                // 难度评分
                                {
                                    type: jsPsychRatingScale,
                                    rating_type: 'difficulty',
                                    level_name: () => {
                                        try {
                                            const gameTrialData = jsPsych.data.getLastTimelineData().filter({trial_type: 'game_level'}).values()[0];
                                            return gameTrialData && gameTrialData.level_name ? gameTrialData.level_name : 'Unknown Level';
                                        } catch (error) {
                                            console.warn('无法获取关卡名称:', error);
                                            return 'Unknown Level';
                                        }
                                    },
                                    data: {
                                        trial_type: 'difficulty_rating',
                                        participant_id: this.participantId
                                    }
                                },
                                
                                // 创意评分
                                {
                                    type: jsPsychRatingScale,
                                    rating_type: 'creativity',
                                    level_name: () => {
                                        try {
                                            const gameTrialData = jsPsych.data.getLastTimelineData().filter({trial_type: 'game_level'}).values()[0];
                                            return gameTrialData && gameTrialData.level_name ? gameTrialData.level_name : 'Unknown Level';
                                        } catch (error) {
                                            console.warn('无法获取关卡名称:', error);
                                            return 'Unknown Level';
                                        }
                                    },
                                    data: {
                                        trial_type: 'creativity_rating',
                                        participant_id: this.participantId
                                    }
                                },
                                
                                // 玩家反馈收集
                                {
                                    type: jsPsychFeedbackInput,
                                    level_name: () => {
                                        try {
                                            const gameTrialData = jsPsych.data.getLastTimelineData().filter({trial_type: 'game_level'}).values()[0];
                                            return gameTrialData && gameTrialData.level_name ? gameTrialData.level_name : 'Unknown Level';
                                        } catch (error) {
                                            console.warn('无法获取关卡名称:', error);
                                            return 'Unknown Level';
                                        }
                                    },
                                    prompt: 'If a player is similar in age and experience to you, what advice would you give them based on your game experience?',
                                    placeholder: 'Please enter your suggestions or share your game experience here...',
                                    required: false,
                                    data: {
                                        trial_type: 'player_feedback',
                                        participant_id: this.participantId
                                    }
                                }
                            ],
                            conditional_function: () => {
                                const lastTrialData = jsPsych.data.getLastTrialData().values()[0];
                                return lastTrialData.selection_type === 'level';
                            }
                        }
                    ],
                    loop_function: () => {
                        // 检查当前章节是否还有未完成的关卡
                        return this.hasRemainingLevelsInChapter(this.currentChapter);
                    },
                    conditional_function: () => {
                        const lastTrialData = jsPsych.data.getLastTrialData().values()[0];
                        return lastTrialData.selection_type === 'chapter' || lastTrialData.selection_type === 'back_to_chapters';
                    }
                }
            ],
            loop_function: () => {
                // 检查是否还有其他章节需要完成
                return this.hasRemainingLevels();
            }
        };
        
        return gameLoop;
    }
    
    createCompletionTrial() {
        return {
            type: jsPsychRatingScale,
            rating_type: 'overall_performance',
            question: 'How would you rate your overall performance in the puzzle game?',
            data: {
                trial_type: 'overall_performance_rating',
                participant_id: this.participantId
            }
        };
    }
    
    markLevelCompleted(chapterKey, levelIndex) {
        if (!this.completedLevels[chapterKey].includes(levelIndex)) {
            this.completedLevels[chapterKey].push(levelIndex);
            
            // 解锁下一关
            if (levelIndex + 1 < this.allLevels[chapterKey].length) {
                this.unlockedLevels[chapterKey] = Math.max(
                    this.unlockedLevels[chapterKey], 
                    levelIndex + 2
                );
            }
            
            // 如果完成了tutorial的所有关卡，解锁journey
            if (chapterKey === 'tutorial' && 
                this.completedLevels[chapterKey].length >= this.allLevels[chapterKey].length) {
                this.unlockedLevels['journey'] = 1;
            }
        }
    }
    
    hasRemainingLevels() {
        // 检查是否还有未完成的关卡
        for (const chapterKey of Object.keys(this.allLevels)) {
            const totalLevels = this.allLevels[chapterKey].length;
            const completedCount = this.completedLevels[chapterKey].length;
            
            if (completedCount < totalLevels && this.unlockedLevels[chapterKey] > 0) {
                return true;
            }
        }
        return false;
    }
    
    hasRemainingLevelsInChapter(chapterKey) {
        const totalLevels = this.allLevels[chapterKey].length;
        const completedCount = this.completedLevels[chapterKey].length;
        
        return completedCount < totalLevels && this.unlockedLevels[chapterKey] > 0;
    }
    
    saveExperimentData() {
        // 收集所有实验数据
        const allData = jsPsych.data.get();
        
        // 获取设备信息
        const deviceInfo = {
            browser: navigator.userAgent,
            os: navigator.platform,
            screen_resolution: [window.screen.width, window.screen.height],
            window_size: [window.innerWidth, window.innerHeight]
        };
        
        // 获取各任务数据
        const babaGameData = allData.filter({trial_type: 'baba-game'}).values();
        const digitSpanData = {
            forward: allData.filter({trial_type: 'digit_span_forward'}).values(),
            backward: allData.filter({trial_type: 'digit_span_backward'}).values()
        };
        const dsstData = allData.filter({trial_type: 'dsst_task'}).values();
        const verbalFluencyData = allData.filter({trial_type: 'verbal_fluency'}).values();
        const autData = allData.filter({trial_type: 'aut_task'}).values();
        const questionnaireData = allData.filter(data => data.trial_type && data.trial_type.includes('questionnaire')).values();
        
        // 收集玩家反馈数据
        const playerFeedbackData = allData.filter({trial_type: 'player_feedback'}).values();
        
        // 确定任务完成情况
        const tasksCompleted = [];
        if (babaGameData.length > 0) tasksCompleted.push('baba_game');
        if (digitSpanData.forward.length > 0) tasksCompleted.push('digit_span_forward');
        if (digitSpanData.backward.length > 0) tasksCompleted.push('digit_span_backward');
        if (dsstData.length > 0) tasksCompleted.push('dsst');
        if (verbalFluencyData.length > 0) tasksCompleted.push('verbal_fluency');
        if (autData.length > 0) tasksCompleted.push('aut');
        if (questionnaireData.length > 0) tasksCompleted.push('questionnaire');
        
        // 确定完成状态
        let completionStatus = 'completed';
        if (tasksCompleted.length < 7) {
            completionStatus = tasksCompleted.length > 3 ? 'partial' : 'abandoned';
        }
        
        // 记录实验开始和结束时间
        const startTime = allData.values()[0] ? new Date(allData.values()[0].time_elapsed).toISOString() : new Date().toISOString();
        const endTime = new Date().toISOString();
        const totalDuration = allData.values()[allData.count() - 1] ? 
            allData.values()[allData.count() - 1].time_elapsed / 1000 : 0;
        
        // 创建符合data_structure.md格式的实验报告
        const experimentSummary = {
            participant_id: this.participantId,
            session_id: `session_${Date.now()}`,
            experiment_version: '1.0.0',
            start_time: startTime,
            end_time: endTime,
            total_duration_sec: totalDuration,
            completion_status: completionStatus,
            device_info: deviceInfo,
            
            // 实验条件信息
            experimental_condition: this.conditionType,
            
            // 完成任务列表
            tasks_completed: tasksCompleted,
            
            // 各任务详细数据
            baba_game_data: babaGameData,
            digit_span_data: {
                forward: digitSpanData.forward,
                backward: digitSpanData.backward
            },
            dsst_data: dsstData,
            verbal_fluency_data: verbalFluencyData,
            aut_data: autData,
            questionnaire_data: questionnaireData,
            
            // 游戏进度数据
            completed_levels: this.completedLevels,
            unlocked_levels: this.unlockedLevels,
            
            // 原始试次数据
            raw_trial_data: allData.values(),
            
            // 玩家反馈数据
            player_feedback_data: playerFeedbackData
        };
        
        // 保存到本地存储
        localStorage.setItem(`baba_experiment_${this.participantId}`, JSON.stringify(experimentSummary));
        
        // 尝试将数据下载为JSON文件
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(experimentSummary, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `experiment_data_${this.participantId}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (e) {
            console.error("下载数据文件失败:", e);
        }
        
        console.log('Experiment data saved:', experimentSummary);
        
        // 显示感谢信息
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: Verdana, Arial, sans-serif; background-color: #7d7d7d; color: white; min-height: 100vh;">
                <h1>实验完成！</h1>
                <h2>Thank you for participating!</h2>
                <p>您的数据已保存。参与者ID: ${this.participantId}</p>
                <p>感谢您的参与，实验数据对我们的研究非常有价值。</p>
                <p style="margin-top: 15px;">如果您看到下载对话框，请保存数据文件并将其发送给实验者。</p>
                <button onclick="location.reload()" style="
                    background-color: #4caf50; 
                    color: white; 
                    border: none; 
                    padding: 12px 24px; 
                    font-size: 16px; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    margin-top: 20px;
                ">开始新的实验</button>
            </div>
        `;
    }
    
    createDSSTIntroTrial() {
        return {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                <h1 style="color:white;">Digit–Symbol Substitution Task (DSST)</h1>
                <div style="color:white; max-width:800px; margin:0 auto; font-size:18px; line-height:1.6; text-align:left;">
                    <p>The DSST measures <strong>processing speed</strong> and <strong>associative learning</strong>.</p>
                    <p>You will see a table that pairs digits (1–9) with unique symbols.</p>
                    <p>Your task is to press the correct digit key that matches each symbol as quickly and accurately as possible.</p>
                    <p>You will have a short practice first, followed by a <strong>90-second</strong> timed test.</p>
                </div>
            `,
            choices: ['Start DSST'],
            data: {
                trial_type: 'dsst_intro',
                participant_id: this.participantId
            }
        };
    }
    
    createDSSTTaskTrial() {
        return {
            type: jsPsychDSST,
            practice_count: 3,
            test_count: 100,
            time_limit: 90,
            participant_id: this.participantId,
            data: {
                trial_type: 'dsst_task',
                participant_id: this.participantId
            }
        };
    }
    
    // ---------- AUT ----------
    createAUTTrial() {
        return {
            type: jsPsychAUT,
            objects: ['Brick', 'Bedsheet'],
            time_limit: 120,
            participant_id: this.participantId,
            data: {
                trial_type: 'aut_task',
                participant_id: this.participantId
            }
        };
    }
    
    // ---------- Verbal Fluency ----------
    createVerbalFluencyTrial() {
        return {
            type: jsPsychVerbalFluency,
            practice_category: 'Tools',
            test_category: 'Animals',
            time_limit: 60,
            participant_id: this.participantId,
            data: {
                trial_type: 'verbal_fluency',
                participant_id: this.participantId
            }
        };
    }

    // ---------- Questionnaire ----------
    createQuestionnaireTrial() {
        // Using the new questionnaire format with one question per page
        const timeline = [];
        
        if (window.embeddedQuestionnaire && Array.isArray(window.embeddedQuestionnaire)) {
            // Group questions by source
            const questionGroups = groupQuestionsBySource(window.embeddedQuestionnaire);
            
            // Add each group of questions to timeline
            const creativityTrials = createQuestionTrials(
                questionGroups.creativity, 
                'creativity', 
                this.participantId
            );
            
            const aarcTrials = createQuestionTrials(
                questionGroups.aarc, 
                'aarc', 
                this.participantId,
                questionGroups.creativity.length
            );
            
            const demographicsTrials = createQuestionTrials(
                questionGroups.demographics, 
                'demographics', 
                this.participantId,
                questionGroups.creativity.length + questionGroups.aarc.length
            );
            
            // Add all trials to the timeline
            timeline.push(...creativityTrials);
            timeline.push(...aarcTrials);
            timeline.push(...demographicsTrials);
        } else {
            // Error handling if no questionnaire data found
            timeline.push({
                type: jsPsychHtmlButtonResponse,
                stimulus: `<h2 style='color:red;'>Error: Questionnaire data not found</h2>
                          <p style='color:white;'>The questionnaire could not be loaded. Please check that questionnaire-data.js is properly loaded.</p>`,
                choices: ['Continue'],
                data: { trial_type: 'questionnaire_error', participant_id: this.participantId }
            });
        }
        
        return {
            timeline: timeline,
            on_timeline_finish: () => {
                // All cognitive tasks completed, save data
                this.saveExperimentData();
            }
        };
    }
}

// 页面加载完成后启动实验
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化实验...');
    
    try {
        // 检查必需的函数是否存在
        if (typeof getAllLevels === 'undefined') {
            throw new Error('getAllLevels函数未定义，请检查level-data.js文件');
        }
        
        if (typeof getChapters === 'undefined') {
            throw new Error('getChapters函数未定义，请检查level-data.js文件');
        }
        
        if (typeof jsPsychBabaInstructions === 'undefined') {
            throw new Error('jsPsychBabaInstructions插件未定义');
        }
        
        console.log('必需的函数和插件检查通过');
        
        // 初始化实验控制器
        const experimentController = new ExperimentController();
        console.log('实验控制器初始化成功');
        
        // 创建并运行实验
        const timeline = experimentController.createTimeline();
        console.log('实验时间线创建成功，包含', timeline.length, '个试验');
        
        // 运行实验
        jsPsych.run(timeline);
        console.log('实验启动成功');
        window.experimentStarted = true;
        
    } catch (error) {
        console.error('实验初始化失败:', error);
        
        // 显示错误信息
        document.getElementById('jspsych-target').innerHTML = `
            <div style="padding: 50px; text-align: center; font-family: Arial, sans-serif;">
                <h1 style="color: red;">实验加载失败</h1>
                <p style="color: #666; margin: 20px 0;">错误详情: ${error.message}</p>
                <p style="color: #666;">请检查浏览器控制台获取更多信息。</p>
                <button onclick="location.reload()" style="
                    background-color: #007cba; 
                    color: white; 
                    border: none; 
                    padding: 12px 24px; 
                    font-size: 16px; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    margin-top: 20px;
                ">重新加载页面</button>
            </div>
                 `;
     }
});

// 备用启动方法（如果DOM事件监听器失败）
setTimeout(function() {
    if (!window.experimentStarted) {
        console.log('使用备用启动方法...');
        
        // 显示加载信息
        const target = document.getElementById('jspsych-target');
        if (target && target.innerHTML.trim() === '') {
            target.innerHTML = `
                <div style="padding: 50px; text-align: center; font-family: Arial, sans-serif;">
                    <h2>正在加载实验...</h2>
                    <p>如果此消息持续显示，请检查浏览器控制台获取错误信息。</p>
                </div>
            `;
        }
    }
}, 2000); 