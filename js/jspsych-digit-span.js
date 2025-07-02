/**
 * jsPsych Digit Span Test Plugin
 * 数字广度测试插件，包括正序和倒序记忆测试
 */

var jsPsychDigitSpan = (function () {
    'use strict';

    const info = {
        name: 'digit-span',
        version: '1.0.0',
        parameters: {
            mode: {
                type: 'string',
                pretty_name: 'Test mode',
                default: 'forward',
                description: 'Test mode: forward or backward'
            },
            starting_length: {
                type: 'int',
                pretty_name: 'Starting length',
                default: 3,
                description: 'Starting sequence length'
            },
            max_length: {
                type: 'int',
                pretty_name: 'Maximum length',
                default: 9,
                description: 'Maximum sequence length'
            },

            max_total_trials: {
                type: 'int',
                pretty_name: 'Maximum total trials',
                default: 14,
                description: 'Maximum total number of trials'
            },
            digit_duration: {
                type: 'float',
                pretty_name: 'Digit duration',
                default: 0.5,
                description: 'Duration of each digit playback in seconds'
            },
            digit_interval: {
                type: 'float',
                pretty_name: 'Digit interval',
                default: 1.0,
                description: 'Interval between digits in seconds'
            },
            participant_id: {
                type: 'string',
                pretty_name: 'Participant ID',
                default: '',
                description: 'Participant identifier'
            }
        },
        data: {
            mode: {
                type: 'string',
                description: 'Test mode (forward or backward)'
            },
            sequence: {
                type: 'object',
                description: 'The digit sequence that was played'
            },
            response: {
                type: 'object',
                description: 'The user response sequence'
            },
            correct: {
                type: 'bool',
                description: 'Whether the response was correct'
            },
            sequence_length: {
                type: 'int',
                description: 'Length of the sequence'
            },
            trial_number: {
                type: 'int',
                description: 'Trial number within current mode'
            },
            total_trials: {
                type: 'int',
                description: 'Total number of trials completed'
            },
            reaction_time: {
                type: 'float',
                description: 'Time taken to complete the response in seconds'
            },
            max_length_achieved: {
                type: 'int',
                description: 'Maximum sequence length correctly recalled'
            },
            mean_span: {
                type: 'float',
                description: 'Calculated mean span score'
            }
        }
    };

    // 全局状态变�?
    let audioCache = {};
    let isAudioLoaded = false;
    let audioLoadingInProgress = false;

    // 试验状态变�?
    let trialParams;
    let currentLength;
    let currentTrial;
    let totalTrialsCompleted;
    let consecutiveErrors; // 连续错误次数（用�?�?上机制）
    let results;
    let currentSequence;
    let userInput;
    let inputMode;
    let sequencePlayed;
    let showInstructions;
    let startTime;
    let responseStartTime;
    let keyHandler;

    async function loadAudio() {
        if (isAudioLoaded) return;
        
        // 防止重复加载
        if (audioLoadingInProgress) {
            console.log('Audio loading already in progress, waiting...');
            while (audioLoadingInProgress) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }
        
        audioLoadingInProgress = true;
        
        let loadedCount = 0;
        
        // 使用HTML Audio元素加载音频文件，避免CORS问题
        for (let i = 0; i <= 9; i++) {
            try {
                const audio = new Audio();
                
                // 创建Promise来处理音频加�?
                const loadPromise = new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Audio loading timeout'));
                    }, 5000); // 5秒超�?
                    
                    audio.addEventListener('canplaythrough', () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                    
                    audio.addEventListener('error', () => {
                        clearTimeout(timeout);
                        reject(new Error(`Audio loading error: ${audio.error?.message || 'Unknown error'}`));
                    }, { once: true });
                });
                
                // 设置音频�?
                audio.src = `audio/digit_${i}.wav`;
                audio.preload = 'auto';
                
                // 等待加载完成
                await loadPromise;
                
                // 存储音频元素
                audioCache[i] = audio;
                loadedCount++;
                console.log(`�?Loaded digit ${i} audio from WAV file`);
                
            } catch (error) {
                console.warn(`Cannot load audio file for digit ${i}:`, error.message);
                // 继续尝试加载其他文件
                continue;
            }
        }
        
        isAudioLoaded = true;
        audioLoadingInProgress = false;
        
        if (loadedCount === 10) {
            console.log(`�?Audio loading complete. All 10 WAV files loaded successfully.`);
        } else if (loadedCount > 0) {
            console.log(`�?Audio loading complete. ${loadedCount}/10 WAV files loaded, ${10 - loadedCount} missing.`);
        } else {
            console.log(`�?No WAV files could be loaded. Please check audio file paths.`);
            throw new Error('No audio files could be loaded. Please ensure WAV files are in the audio/ directory.');
        }
    }

    function initializeTest(params) {
        // 清理任何存在的事件监听器
        if (keyHandler) {
            document.removeEventListener('keydown', keyHandler);
            keyHandler = null;
        }
        
        trialParams = params;
        currentLength = trialParams.starting_length;
        currentTrial = 0;
        totalTrialsCompleted = 0;
        consecutiveErrors = 0; // 初始化连续错误次�?
        results = {
            lengths: [],
            responses: [],
            correct: [],
            reaction_times: []
        };
        
        currentSequence = [];
        userInput = [];
        inputMode = false;
        sequencePlayed = false;
        showInstructions = true;
        startTime = null;
        responseStartTime = null;
    }

    function showInstructionsScreen(display_element, trialParams) {
        // 清理可能存在的键盘监听器
        if (keyHandler) {
            document.removeEventListener('keydown', keyHandler);
            keyHandler = null;
        }
        
        const html = `
            <div class="digit-span-container">
                <h1 style="color: white; text-align: center; margin-bottom: 30px;">
                    Digit Span Test - ${trialParams.mode === 'forward' ? 'Part 1' : 'Part 2'}
                </h1>
                
                <div class="instructions-content" style="color: white; max-width: 800px; margin: 0 auto; font-size: 18px; line-height: 1.6;">
                    ${getInstructionsText(trialParams.mode)}
                </div>
                
                <div style="text-align: center; margin-top: 40px;">
                    <button id="start-test-btn" class="baba-button" style="font-size: 20px; padding: 15px 30px;">
                        Start Test
                    </button>
                </div>
            </div>
        `;
        
        display_element.innerHTML = html;
        
        document.getElementById('start-test-btn').addEventListener('click', () => {
            showInstructions = false;
            generateNewSequence();
            showTestScreen(display_element);
        });
    }

    function getInstructionsText(mode) {
        if (mode === 'forward') {
            return `
                <p><strong>Part 1: Forward Digit Span</strong></p>
                <p>You will hear a series of digits played one by one.</p>
                <p>After all digits are played, please enter the digits in the <strong>same order</strong> you heard them.</p>
                <br>
                <p><strong>Example:</strong> If you hear "3-7-1", you should enter "3-7-1".</p>
                <br>
                <p>When you are ready, please click "Start Test".</p>
            `;
        } else {
            return `
                <p><strong>Part 2: Backward Digit Span</strong></p>
                <p>You will hear a series of digits played one by one.</p>
                <p>This time, please enter the digits in the <strong>reverse order</strong>.</p>
                <br>
                <p><strong>Example:</strong> If you hear "3-7-1", you should enter "1-7-3".</p>
                <br>
                <p>When you are ready, please click "Start Test".</p>
            `;
        }
    }

    function generateNewSequence() {
        currentSequence = [];
        for (let i = 0; i < currentLength; i++) {
            currentSequence.push(Math.floor(Math.random() * 10));
        }
        userInput = [];
        inputMode = false;
        sequencePlayed = false;
    }

    function showTestScreen(display_element) {
        const html = `
            <div class="digit-span-container">
                <h2 style="color: white; text-align: center; margin-bottom: 20px;">
                    Digit Span Test - ${trialParams.mode === 'forward' ? 'Part 1' : 'Part 2'}
                </h2>
                
                <div style="color: white; text-align: center; margin-bottom: 30px; font-size: 18px;">
                    Length: ${currentLength}
                </div>
                
                <div style="color: white; text-align: center; margin-bottom: 30px; font-size: 16px;">
                    ${trialParams.mode === 'forward' ? 'Please enter the numbers in the order they were played' : 'Please enter the numbers in reverse order'}
                </div>
                
                <div id="test-content" style="text-align: center;">
                    ${getTestContentHTML()}
                </div>
            </div>
        `;
        
        display_element.innerHTML = html;
        setupTestEventListeners();
    }

    function getTestContentHTML() {
        if (!sequencePlayed) {
            return `
                <div style="margin-bottom: 40px;">
                    <p style="color: white; font-size: 18px; margin-bottom: 30px;">
                        Please listen carefully to the number sequence. When playback is complete, you can enter your response.
                    </p>
                    
                    <div style="margin-bottom: 30px;">
                        <img src="../images/speaker.png" alt="Speaker" style="width: 100px; height: 100px;" onerror="this.style.display='none'">
                    </div>
                    
                    <button id="play-sequence-btn" class="baba-button" style="font-size: 18px; padding: 12px 24px;">
                        Start Playback
                    </button>
                </div>
            `;
        } else if (inputMode) {
            return `
                <div style="margin-bottom: 40px;">
                    <p style="color: white; font-size: 18px; margin-bottom: 30px;">
                        Please enter the numbers you heard ${trialParams.mode === 'forward' ? '(in order)' : '(in reverse order)'}
                    </p>
                    
                    <div id="input-display" style="background: #333; border: 2px solid #666; border-radius: 10px; padding: 20px; margin: 20px auto; width: 400px; min-height: 60px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white;">
                        ${userInput.join(' ') || 'Press number keys to input'}
                    </div>
                    
                    <div style="margin-top: 30px;">
                        <p style="color: #ccc; font-size: 14px;">
                            Press number keys to input, Enter to confirm, Backspace to delete
                        </p>
                    </div>
                    
                    <button id="submit-response-btn" class="baba-button" style="font-size: 18px; padding: 12px 24px; margin-top: 20px;" ${userInput.length === currentSequence.length ? '' : 'disabled'}>
                        Submit Response
                    </button>
                </div>
            `;
        }
    }

    function setupTestEventListeners() {
        // 播放序列按钮
        const playBtn = document.getElementById('play-sequence-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                playSequence();
            });
        }

        // 提交响应按钮
        const submitBtn = document.getElementById('submit-response-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                if (userInput.length === currentSequence.length) {
                    recordTrial();
                }
            });
        }

        // 清理之前的键盘事件监听器
        if (keyHandler) {
            document.removeEventListener('keydown', keyHandler);
        }

        // 键盘事件
        keyHandler = (event) => {
            // 防止事件冒泡和默认行�?
            event.preventDefault();
            event.stopPropagation();
            
            if (inputMode) {
                if (event.key >= '0' && event.key <= '9') {
                    if (userInput.length < currentSequence.length) {
                        userInput.push(parseInt(event.key));
                        updateInputDisplay();
                        
                        // 记录第一次输入的时间
                        if (userInput.length === 1 && !responseStartTime) {
                            responseStartTime = Date.now();
                        }
                    }
                } else if (event.key === 'Backspace') {
                    if (userInput.length > 0) {
                        userInput.pop();
                        updateInputDisplay();
                    }
                } else if (event.key === 'Enter') {
                    if (userInput.length === currentSequence.length) {
                        recordTrial();
                    }
                }
            }
        };
        
        document.addEventListener('keydown', keyHandler);
    }

    function updateInputDisplay() {
        const inputDisplay = document.getElementById('input-display');
        const submitBtn = document.getElementById('submit-response-btn');
        
        if (inputDisplay) {
            inputDisplay.textContent = userInput.join(' ') || 'Press number keys to input';
        }
        
        if (submitBtn) {
            submitBtn.disabled = userInput.length !== currentSequence.length;
        }
    }

    async function playSequence() {
        console.log('Starting sequence playback:', currentSequence);
        
        // 禁用播放按钮
        const playBtn = document.getElementById('play-sequence-btn');
        if (playBtn) {
            playBtn.disabled = true;
            playBtn.textContent = 'Playing...';
        }
        
        // 播放序列中的每个数字
        for (let i = 0; i < currentSequence.length; i++) {
            const digit = currentSequence[i];
            await playDigit(digit);
            
            // 如果不是最后一个数字，等待间隔
            if (i < currentSequence.length - 1) {
                await wait(trialParams.digit_interval * 1000);
            }
        }
        
        // 序列播放完成后等待一小段时间
        await wait(500);
        
        console.log('Sequence playback completed');
        
        sequencePlayed = true;
        inputMode = true;
        startTime = Date.now();
        
        // 更新显示
        const testContent = document.getElementById('test-content');
        if (testContent) {
            testContent.innerHTML = getTestContentHTML();
            setupTestEventListeners();
        }
    }

    async function playDigit(digit) {
        return new Promise((resolve, reject) => {
            const audio = audioCache[digit];
            if (!audio) {
                reject(new Error(`No audio found for digit ${digit}`));
                return;
            }
            
            // 重置音频到开始位�?
            audio.currentTime = 0;
            
            // 播放音频
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`Playing digit ${digit}`);
                    setTimeout(resolve, trialParams.digit_duration * 1000);
                }).catch(error => {
                    console.error(`Error playing digit ${digit}:`, error);
                    reject(error);
                });
            } else {
                // 旧浏览器不返回Promise
                setTimeout(resolve, trialParams.digit_duration * 1000);
            }
        });
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function checkResponse() {
        let expected;
        if (trialParams.mode === 'forward') {
            expected = currentSequence;
        } else {
            expected = [...currentSequence].reverse();
        }
        
        return JSON.stringify(userInput) === JSON.stringify(expected);
    }

    function recordTrial() {
        const correct = checkResponse();
        const reactionTime = responseStartTime ? (Date.now() - responseStartTime) / 1000 : null;
        
        // 记录试次结果
        results.lengths.push(currentLength);
        results.responses.push([...userInput]);
        results.correct.push(correct);
        results.reaction_times.push(reactionTime);
        
        totalTrialsCompleted++;
        
        console.log(`Trial ${totalTrialsCompleted}: Length ${currentLength}, Correct: ${correct}, Consecutive Errors: ${consecutiveErrors}`);
        
        // 检查是否应该结束测试（在调整长度之前检查）
        if (shouldEndTask(correct)) {
            finishTest();
            return;
        }
        
        // 实现2�?上机制（只有在不结束的情况下才调整长度）
        if (correct) {
            // 正确：重置连续错误次数，长度+1
            consecutiveErrors = 0;
            if (currentLength < trialParams.max_length) {
                currentLength++;
                console.log(`Correct! Length increased to ${currentLength}`);
            }
        } else {
            // 错误：连续错误次�?1
            consecutiveErrors++;
            console.log(`Incorrect! Consecutive errors: ${consecutiveErrors}`);
            
            // 如果连续两次错误，长�?1
            if (consecutiveErrors >= 2) {
                const minLength = trialParams.mode === 'forward' ? 3 : 2;
                if (currentLength > minLength) {
                    currentLength--;
                    console.log(`Two consecutive errors! Length decreased to ${currentLength}`);
                }
                consecutiveErrors = 0; // 重置连续错误次数
            }
        }
        
        // 生成新序列并继续
        generateNewSequence();
        showTestScreen(document.getElementById('jspsych-target'));
    }

    function shouldEndTask(correct) {
        // 在长�?且正�?
        if (currentLength === trialParams.max_length && correct) {
            console.log(`Test ended: Reached max length ${trialParams.max_length} with correct response`);
            return true;
        }
        
        // 达到最大试验次�?
        if (totalTrialsCompleted >= trialParams.max_total_trials) {
            console.log(`Test ended: Reached max trials (${trialParams.max_total_trials})`);
            return true;
        }
        
        return false;
    }

    function finishTest() {
        // 清理事件监听�?
        if (keyHandler) {
            document.removeEventListener('keydown', keyHandler);
        }
        
        // 计算结果
        const maxLength = calculateMaxLength();
        const meanSpan = calculateMeanSpan();
        
        // 准备最终数�?
        const trialData = {
            mode: trialParams.mode,
            sequence: currentSequence,
            response: userInput,
            correct: checkResponse(),
            sequence_length: currentLength,
            total_trials: totalTrialsCompleted,
            consecutive_errors: consecutiveErrors,
            reaction_time: results.reaction_times[results.reaction_times.length - 1],
            max_length_achieved: maxLength,
            mean_span: meanSpan,
            participant_id: trialParams.participant_id,
            all_results: results,
            adaptive_mechanism: '2down1up' // 标记使用的自适应机制
        };
        
        // 使用Promise resolver结束试验
        if (trialResolver) {
            trialResolver(trialData);
        }
    }

    function calculateMaxLength() {
        let maxLength = 0;
        for (let i = 0; i < results.correct.length; i++) {
            if (results.correct[i]) {
                maxLength = Math.max(maxLength, results.lengths[i]);
            }
        }
        return maxLength;
    }

    function calculateMeanSpan() {
        if (results.lengths.length === 0) return 0;
        
        // 按长度分组并计算正确�?
        const lengthStats = {};
        for (let i = 0; i < results.lengths.length; i++) {
            const length = results.lengths[i];
            if (!lengthStats[length]) {
                lengthStats[length] = { correct: 0, total: 0 };
            }
            lengthStats[length].total++;
            if (results.correct[i]) {
                lengthStats[length].correct++;
            }
        }
        
        // 找到50%正确率对应的长度
        const baselineLength = trialParams.mode === 'forward' ? 2.5 : 1.5;
        let targetLength = baselineLength;
        
        const sortedLengths = Object.keys(lengthStats).map(Number).sort((a, b) => a - b);
        for (const length of sortedLengths) {
            const accuracy = lengthStats[length].correct / lengthStats[length].total;
            if (accuracy >= 0.5) {
                targetLength = length;
                break;
            }
        }
        
        // 如果所有长度都低于50%，使用最后一个长�?
        if (targetLength === baselineLength && sortedLengths.length > 0) {
            targetLength = sortedLengths[sortedLengths.length - 1];
        }
        
        return targetLength;
    }

    // 全局Promise resolver，用于控制试验完�?
    let trialResolver = null;

    // 主要的试验函�?
    async function trialFunction(display_element, trial) {
        console.log('Starting digit span trial with parameters:', trial);
        
        // 创建一个Promise，只有在试验真正完成时才resolve
        return new Promise(async (resolve, reject) => {
            trialResolver = resolve;
            
            try {
                // 初始化测试状�?
                initializeTest(trial);
                
                // 加载音频
                await loadAudio();
                
                // 显示说明页面
                showInstructionsScreen(display_element, trial);
            } catch (error) {
                reject(error);
            }
        });
    }

    // jsPsych v7 插件�?
    class DigitSpanPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        static get info() {
            return info;
        }

        async trial(display_element, trial) {
            return await trialFunction(display_element, trial);
        }
    }

    // 调试信息
    console.log('jsPsychDigitSpan plugin loaded:', DigitSpanPlugin);
    console.log('Plugin info:', DigitSpanPlugin.info);

    return DigitSpanPlugin;

})(); 
