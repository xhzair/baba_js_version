/**
 * jsPsych v8 Digit Span Plugin
 * Support forward/backward digit span test, compatible with jsPsych 8.x
 */

var jsPsychDigitSpan = (function() {
    'use strict';

    const info = {
        name: 'digit-span',
        version: '1.0.0',
        parameters: {
            mode: { type: 'string', default: 'forward' },
            starting_length: { type: 'int', default: 3 },
            max_length: { type: 'int', default: 9 },
            max_total_trials: { type: 'int', default: 14 },
            digit_duration: { type: 'float', default: 0.5 },
            digit_interval: { type: 'float', default: 1.0 },
            participant_id: { type: 'string', default: '' }
        },
        data: {
            mode: 'forward',
            starting_length: 3,
            max_length: 9,
            max_total_trials: 14,
            digit_duration: 0.5,
            digit_interval: 1.0,
            participant_id: ''
        }
    };

    class DigitSpanPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
            this.trials = []; // initialize trials array
        }

        async trial(display_element, trial) {
            // save jsPsych instance reference
            const jsPsychInstance = this.jsPsych;
            
            // return Promise to ensure task ends correctly
            return new Promise(async (resolve) => {
                // state variables
                let currentLength = trial.starting_length;
                let totalTrialsCompleted = 0;
                let consecutiveErrors = 0;
                let results = { lengths: [], responses: [], correct: [], reaction_times: [] };
                let currentSequence = [];
                let userInput = [];
                let inputMode = false;
                let sequencePlayed = false;
                let responseStartTime = null;
                let testFinished = false;
                let keyHandler = null;
                let audioCache = {};
                let trials = []; // move trials to function scope
                let startTime = Date.now(); // add startTime variable

            // load audio
            async function loadAudio() {
                for (let i = 0; i <= 9; i++) {
                    const audio = new Audio(`audio/digit_${i}.wav`);
                    audio.preload = 'auto';
                    await new Promise((resolve) => {
                        audio.addEventListener('canplaythrough', resolve, { once: true });
                        audio.addEventListener('error', (e) => {
                            console.warn(`Audio ${i} failed to load:`, e);
                            resolve();
                        });
                    });
                    audioCache[i] = audio;
                }
            }

            function generateNewSequence() {
                const pool = [0,1,2,3,4,5,6,7,8,9];
                let seq = [];
                let tempPool = [...pool];
                for (let i = 0; i < currentLength; i++) {
                    const idx = Math.floor(Math.random() * tempPool.length);
                    seq.push(tempPool.splice(idx, 1)[0]);
                }
                return seq;
            }

            function showInstructions() {
                display_element.innerHTML = `
                    <div style="color:white;text-align:center;max-width:800px;margin:0 auto;padding:40px 20px;">
                        <h1 style="font-size:36px;margin-bottom:30px;">${trial.mode === 'forward' ? 'Phase 1' : 'Phase 2'}: ${trial.mode === 'forward' ? 'Forward' : 'Backward'} Digit Span</h1>
                        <p style="font-size:24px;line-height:1.6;margin-bottom:20px;">
                            Enter the numbers in 
                            <span style="color:#ff6b6b;font-weight:bold;font-size:28px;">
                                ${trial.mode === 'forward' ? 'the same order' : 'reverse order'}
                            </span>
                        </p>
                        <div style="background:linear-gradient(135deg, #ff6b6b, #ffd93d); padding:20px; border-radius:15px; margin:30px 0; border:3px solid #fff;">
                            <p style="font-size:18px;color:#fff;margin:10px 0 0 0;font-weight:bold;">
                                🔊 Please make sure your speakers are on or headphones are connected!
                            </p>
                        </div>
                        <p style="font-size:20px;color:#ffd93d;margin-bottom:40px;">
                            🎧 Ready to listen carefully!
                        </p>
                        <button id="start-btn" class="baba-button" style="font-size:20px;padding:15px 30px;">Start ${trial.mode === 'forward' ? 'Forward' : 'Backward'} Test</button>
                    </div>
                `;
                document.getElementById('start-btn').onclick = () => {
                    currentSequence = generateNewSequence();
                    showTestScreen();
                };
            }

            function showTestScreen() {
                display_element.innerHTML = `
                    <div style="color:white;text-align:center;padding:40px 20px;">
                        <h2 style="font-size:32px;margin-bottom:20px;">Sequence Length: ${currentLength}</h2>
                        <p style="font-size:20px;color:#ffd93d;margin-bottom:30px;">
                            🎧 Please listen carefully to the audio sequence!
                        </p>
                        <p style="font-size:18px;margin-bottom:40px;color:#a8e6cf;">
                            Click the button below when you're ready to hear the numbers
                        </p>
                        <button id="play-btn" class="baba-button" style="font-size:20px;padding:15px 30px;">▶️ Play Sequence</button>
                    </div>
                `;
                document.getElementById('play-btn').onclick = () => playSequence();
            }

            async function playSequence() {
                document.getElementById('play-btn').disabled = true;
                for (let i = 0; i < currentSequence.length; i++) {
                    await playDigit(currentSequence[i]);
                    if (i < currentSequence.length - 1) {
                        await wait(trial.digit_interval * 1000);
                    }
                }
                sequencePlayed = true;
                showInputScreen();
            }

            async function playDigit(digit) {
                const audio = audioCache[digit];
                if (audio) {
                    try {
                        audio.currentTime = 0;
                        await audio.play();
                        await wait(trial.digit_duration * 1000);
                    } catch (error) {
                        console.warn(`Failed to play audio for digit ${digit}:`, error);
                        await wait(trial.digit_duration * 1000);
                    }
                } else {
                    await wait(trial.digit_duration * 1000);
                }
            }

            function wait(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            function showInputScreen() {
                inputMode = true;
                userInput = [];
                responseStartTime = null;
                display_element.innerHTML = `
                    <div style="color:white;text-align:center;padding:40px 20px;">
                        <h2 style="font-size:32px;margin-bottom:20px;">Enter the Numbers</h2>
                        <p style="font-size:20px;color:#ffd93d;margin-bottom:20px;">
                            📝 Remember to enter them in 
                            <span style="color:#ff6b6b;font-weight:bold;">
                                ${trial.mode === 'forward' ? 'the same order' : 'reverse order'}
                            </span>
                        </p>
                        <div id="input-display" style="background:#333;padding:30px;margin:30px auto;width:500px;min-height:80px;font-size:28px;border:3px solid #666;border-radius:10px;">
                            ${userInput.join(' ') || 'Press number keys (0-9) to input'}
                        </div>
                        <p style="font-size:16px;color:#a8e6cf;margin-bottom:30px;">
                            Use Backspace to delete • Press Enter or click Submit when done
                        </p>
                        <button id="submit-btn" class="baba-button" disabled style="font-size:20px;padding:15px 30px;">✅ Submit Answer</button>
                    </div>
                `;
                setupInputHandlers();
            }

            function setupInputHandlers() {
                const submitBtn = document.getElementById('submit-btn');
                keyHandler = (event) => {
                    if (!inputMode) return;
                    if (event.key >= '0' && event.key <= '9') {
                        if (userInput.length < currentSequence.length) {
                            userInput.push(parseInt(event.key));
                            updateInputDisplay();
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
                };
                document.addEventListener('keydown', keyHandler);
                submitBtn.onclick = () => {
                    if (userInput.length === currentSequence.length) {
                        recordTrial();
                    }
                };
            }

            function updateInputDisplay() {
                const inputDisplay = document.getElementById('input-display');
                const submitBtn = document.getElementById('submit-btn');
                if (inputDisplay) {
                    if (userInput.length === 0) {
                        inputDisplay.textContent = 'Press number keys (0-9) to input';
                        inputDisplay.style.color = '#888';
                    } else {
                        inputDisplay.textContent = userInput.join(' ');
                        inputDisplay.style.color = '#fff';
                    }
                }
                if (submitBtn) {
                    const isComplete = userInput.length === currentSequence.length;
                    submitBtn.disabled = !isComplete;
                    if (isComplete) {
                        submitBtn.style.backgroundColor = '#4CAF50';
                        submitBtn.textContent = '✅ Submit Answer (' + userInput.length + '/' + currentSequence.length + ')';
                    } else {
                        submitBtn.style.backgroundColor = '';
                        submitBtn.textContent = 'Submit Answer (' + userInput.length + '/' + currentSequence.length + ')';
                    }
                }
            }

            function checkResponse() {
                let expected = trial.mode === 'forward' ? currentSequence : [...currentSequence].reverse();
                return JSON.stringify(userInput) === JSON.stringify(expected);
            }

            function recordTrial() {
                inputMode = false;
                document.removeEventListener('keydown', keyHandler);
                const correct = checkResponse();
                const reactionTime = responseStartTime ? (Date.now() - responseStartTime) / 1000 : null;
                results.lengths.push(currentLength);
                results.responses.push([...userInput]);
                results.correct.push(correct);
                results.reaction_times.push(reactionTime);
                totalTrialsCompleted++;
                
                // record detailed trial data
                const trialDetail = {
                    trial_number: totalTrialsCompleted,
                    span_length: currentLength,
                    sequence: currentSequence,
                    user_response: userInput,
                    correct: correct,
                    reaction_time: reactionTime,
                    consecutive_errors_before: consecutiveErrors,
                    timestamp: Date.now()
                };
                trials.push(trialDetail); // use local variable trials
                
                if (shouldEndTask(correct)) {
                    finishTest();
                    return;
                }
                
                if (correct) {
                    consecutiveErrors = 0;
                    if (currentLength < trial.max_length) currentLength++;
                } else {
                    consecutiveErrors++;
                    if (consecutiveErrors >= 2) {
                        const minLen = trial.mode === 'forward' ? 3 : 2;
                        if (currentLength === minLen) {
                            finishTest();
                            return;
                        }
                        if (currentLength > minLen) currentLength--;
                        consecutiveErrors = 0;
                    }
                }
                currentSequence = generateNewSequence();
                showTestScreen();
            }

            function shouldEndTask(correct) {
                return (currentLength === trial.max_length && correct) || (totalTrialsCompleted >= trial.max_total_trials);
            }

            function finishTest() {
                testFinished = true;
                document.removeEventListener('keydown', keyHandler);
                const maxLength = Math.max(...results.correct.map((c, i) => c ? results.lengths[i] : 0));
                const correctCount = results.correct.filter(Boolean).length; // calculate correct count
                const trialData = {
                    participant_id: trial.participant_id,
                    task_version: '1.0.0',
                    mode: trial.mode, // 'forward' or 'backward'
                    max_span: maxLength, // use calculated max span
                    total_correct: correctCount,
                    total_trials: totalTrialsCompleted,
                    consecutive_errors: consecutiveErrors,
                    trials: trials, // use local variable trials
                    response_times: results.reaction_times,
                    consecutive_errors_count: consecutiveErrors,
                    task_completion_time: (Date.now() - startTime) / 1000, // use local variable startTime
                    audio_used: trial.use_audio || false,
                    digit_duration: trial.digit_duration || 1.0
                };
                
                jsPsychInstance.finishTrial(trialData);
                resolve(); // resolve Promise
            }

            // main flow
            try {
                await loadAudio();
            } catch (error) {
                console.warn('Audio loading failed, continuing without audio:', error);
            }
            showInstructions();
        });
        }
    }

    DigitSpanPlugin.info = info;
    return DigitSpanPlugin;
})(); 