// jspsych-verbal-fluency.js
// Verbal Fluency Test plugin for jsPsych
var jsPsychVerbalFluency = (function(){
    'use strict';

    const info = {
        name: 'verbal-fluency',
        version: '1.0.0',
        parameters: {
            participant_id: { type: 'string', default: '' },
            practice_category: { type: 'string', default: 'Tools' },
            test_category: { type: 'string', default: 'Animals' },
            time_limit: { type: 'int', default: 60 } // seconds
        },
        data: {
            participant_id: {
                type: 'string',
                description: 'Participant identifier'
            },
            practice_raw: {
                type: 'string',
                description: 'Raw practice input text'
            },
            practice_list: {
                type: 'array',
                description: 'List of practice words'
            },
            test_raw: {
                type: 'string',
                description: 'Raw test input text'
            },
            test_list: {
                type: 'array',
                description: 'List of test words'
            },
            test_count: {
                type: 'int',
                description: 'Number of test words generated'
            },
            used_time: {
                type: 'float',
                description: 'Time used for the test'
            },
            word_timestamps: {
                type: 'array',
                description: 'Timestamps for each word input'
            },
            response_intervals: {
                type: 'array',
                description: 'Intervals between word inputs'
            },
            response_analysis: {
                type: 'object',
                description: 'Analysis of response patterns'
            },
            task: {
                type: 'string',
                description: 'Task identifier',
                default: 'verbal_fluency'
            }
        }
    };

    class VFPlugin {
        constructor(jsPsych){
            this.jsPsych = jsPsych;
        }

        async trial(display_element, trial){
            return new Promise((resolve)=>{
                this._resolve = resolve;

                // parameters
                this.participant = trial.participant_id;
                this.practiceCategory = trial.practice_category;
                this.testCategory = trial.test_category;
                this.timeLimit = trial.time_limit;

                // data holders
                this.practiceInput = '';
                this.practiceNames = [];
                this.testInput = '';
                this.testNames = [];

                // phase control
                this.phase = 'instruction'; // instruction -> ready -> test -> result

                // render first phase
                this.showInstruction(display_element);
            });
        }

        /* ---------- Phase renderers ---------- */
        showInstruction(el){
            el.innerHTML = `
            <div class='vf-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;'>
                <h1 style='color:white;'>Verbal Fluency Test</h1>
                <div style='color:white;max-width:900px;margin:20px auto;font-size:18px;line-height:1.6;text-align:left;'>
                    <p>In this test, we want you to write down the names of things that belong to the same category.</p>
                    <p>For example, if '<strong>${this.practiceCategory}</strong>' is displayed on the screen, you should write down names of ${this.practiceCategory.toLowerCase()}, such as hammer, scissors, ruler, etc.</p>
                    <p>What other ${this.practiceCategory.toLowerCase()} names can you think of? Please try to write <strong>3 of them</strong>!</p>
                    <p>(Please separate each name with a comma, and click the button to proceed after entering at least 3 names.)</p>
                </div>
                <h2 style='color:#3ca5ff;'>${this.practiceCategory}</h2>
                <textarea id='vf-practice-input' placeholder='Please enter directly' style='width:80vw;max-width:1000px;min-width:400px;height:100px;margin-top:20px;font-size:18px;'></textarea>
                <p id='vf-practice-hint' style='color:#cccccc;margin-top:8px;'>Please enter ${this.practiceCategory.toLowerCase()} names separated by commas (e.g., hammer, scissors, ruler)</p>
                <p id='vf-practice-warning' style='color:#ff6b6b;margin-top:8px;font-size:14px;display:none;'>⚠️ Please use commas to separate the names!</p>
                <button id='vf-practice-next' class='baba-button' style='margin-top:30px;' disabled>Proceed to Formal Test</button>
            </div>`;

            const textarea = el.querySelector('#vf-practice-input');
            const nextBtn = el.querySelector('#vf-practice-next');
            const hintEl = el.querySelector('#vf-practice-hint');
            const warningEl = el.querySelector('#vf-practice-warning');
            
            textarea.addEventListener('input', ()=>{
                this.practiceInput = textarea.value;
                this.practiceNames = this.practiceInput.split(',').map(s=>s.trim()).filter(s=>s);
                nextBtn.disabled = this.practiceNames.length < 3;
                
                // check input format
                this.validateInputFormat(this.practiceInput, hintEl, warningEl);
            });

            nextBtn.addEventListener('click', ()=>{
                this.phase = 'ready';
                this.showReady(el);
            });
        }

        showReady(el){
            el.innerHTML = `
            <div class='vf-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;'>
                <h2 style='color:white;margin-bottom:30px;'>Formal Test Instructions</h2>
                <div style='color:white;max-width:800px;margin:0 auto;font-size:18px;line-height:1.6;text-align:left;'>
                    <p>Please write down as many <strong>${this.testCategory.toLowerCase()}</strong> names as you can in <strong>1 minute</strong>, separating each name with a comma.</p>
                    <p>When you are ready, click the button below to start the timer.</p>
                </div>
                <button id='vf-start-test' class='baba-button' style='margin-top:40px;'>Start Formal Test</button>
            </div>`;

            el.querySelector('#vf-start-test').addEventListener('click', ()=>{
                this.phase = 'test';
                this.showTest(el);
            });
        }

        showTest(el){
            // create structure
            el.innerHTML = `
            <div class='vf-container' style='width:100%;display:flex;flex-direction:column;align-items:center;min-height:100vh;padding-top:40px;'>
                <h2 style='color:#3ca5ff;'>${this.testCategory}</h2>
                <div id='vf-timer' style='color:#ff4444;font-size:24px;margin-top:10px;'>Time left: ${this.timeLimit.toFixed(1)} s</div>
                <textarea id='vf-test-input' placeholder='Please enter directly' style='width:80vw;max-width:1000px;min-width:400px;height:220px;margin-top:30px;font-size:18px;'></textarea>
                <p id='vf-test-hint' style='color:#cccccc;margin-top:8px;'>Please enter ${this.testCategory.toLowerCase()} names separated by commas (e.g., cat, dog, bird)</p>
                <p id='vf-test-warning' style='color:#ff6b6b;margin-top:8px;font-size:14px;display:none;'>⚠️ Please use commas to separate the names!</p>
                <div style='color:#cccccc;margin-top:20px;font-size:14px;'>The test will automatically submit when time is up.</div>
            </div>`;

            // prepare state
            const textarea = el.querySelector('#vf-test-input');
            const hintEl = el.querySelector('#vf-test-hint');
            const warningEl = el.querySelector('#vf-test-warning');
            this.startTime = performance.now();
            
            // add word input time recording
            this.wordTimestamps = [];
            let previousText = '';
            let lastCommaCount = 0;
            
            // detect new word input and validate format
            textarea.addEventListener('input', () => {
                const currentTime = performance.now();
                const elapsedTime = (currentTime - this.startTime) / 1000;
                const currentText = textarea.value;
                
                // check input format
                this.validateInputFormat(currentText, hintEl, warningEl);
                
                // check if there is a new comma
                const currentCommas = (currentText.match(/,/g) || []).length;
                
                if (currentCommas > lastCommaCount) {
                    // extract the latest input word
                    const words = currentText.split(',').map(w => w.trim()).filter(w => w);
                    const newWord = words[words.length - 1];
                    
                    if (newWord) {
                        this.wordTimestamps.push({
                            word: newWord,
                            time: elapsedTime.toFixed(3),
                            index: words.length - 1
                        });
                    }
                    
                    lastCommaCount = currentCommas;
                }
                
                previousText = currentText;
            });

            // timer interval
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
        }

        showResult(el){
            el.innerHTML = `
            <div class='vf-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;'>
                <h1 style='color:white;'>Test Completed!</h1>
                <h2 style='color:white;margin-top:20px;'>You have written ${this.testNames.length} ${this.testCategory.toLowerCase()} names.</h2>
                <p style='color:white;margin-top:10px;'>All entries have been saved automatically.</p>
                <button id='vf-finish' class='baba-button' style='margin-top:40px;'>Continue</button>
            </div>`;

            el.querySelector('#vf-finish').addEventListener('click', ()=>{
                this.finish();
            });
        }

        /* ---------- Utility ---------- */
        validateInputFormat(text, hintEl, warningEl) {
            // check if there is content but no comma separation
            const trimmedText = text.trim();
            if (trimmedText.length > 0) {
                // check if there is a comma
                const hasComma = trimmedText.includes(',');
                
                // check if there are multiple words but no comma separation
                const words = trimmedText.split(/\s+/);
                const hasMultipleWords = words.length > 1;
                
                if (hasMultipleWords && !hasComma) {
                    // show warning
                    warningEl.style.display = 'block';
                    hintEl.style.display = 'none';
                } else if (hasComma) {
                    // hide warning, show hint
                    warningEl.style.display = 'none';
                    hintEl.style.display = 'block';
                } else {
                    // single word, show hint
                    warningEl.style.display = 'none';
                    hintEl.style.display = 'block';
                }
            } else {
                // empty content, show hint
                warningEl.style.display = 'none';
                hintEl.style.display = 'block';
            }
        }
        
        finish(){
            // check if there is a last word that has not been recorded
            const finalWords = this.testInput.split(',').map(w => w.trim()).filter(w => w);
            if (finalWords.length > 0 && (this.wordTimestamps.length === 0 || 
                finalWords[finalWords.length - 1] !== this.wordTimestamps[this.wordTimestamps.length - 1]?.word)) {
                
                // add the last word time
                const lastWordTime = this.usedTime || this.timeLimit;
                this.wordTimestamps.push({
                    word: finalWords[finalWords.length - 1],
                    time: lastWordTime.toFixed(3),
                    index: finalWords.length - 1
                });
            }
            
            // calculate response time intervals
            const responseIntervals = [];
            if (this.wordTimestamps.length > 1) {
                for (let i = 1; i < this.wordTimestamps.length; i++) {
                    responseIntervals.push(
                        parseFloat(this.wordTimestamps[i].time) - parseFloat(this.wordTimestamps[i-1].time)
                    );
                }
            }
            
            // analyze response patterns
            const averageInterval = responseIntervals.length > 0 ? 
                responseIntervals.reduce((sum, val) => sum + val, 0) / responseIntervals.length : 0;
                
            const maxInterval = responseIntervals.length > 0 ? 
                Math.max(...responseIntervals) : 0;
                
            // calculate standard deviation
            let stdDeviation = 0;
            if (responseIntervals.length > 1) {
                const squaredDiffs = responseIntervals.map(val => Math.pow(val - averageInterval, 2));
                const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / responseIntervals.length;
                stdDeviation = Math.sqrt(variance);
            }
            
            // Save data via jsPsych
            const data = {
                participant_id: this.participant,
                practice_raw: this.practiceInput.trim(),
                practice_list: this.practiceNames,
                test_raw: this.testInput.trim(),
                test_list: this.testNames,
                test_count: this.testNames.length,
                used_time: this.usedTime || null,
                word_timestamps: this.wordTimestamps,
                response_intervals: responseIntervals,
                response_analysis: {
                    average_interval: averageInterval,
                    max_interval: maxInterval,
                    std_deviation: stdDeviation
                },
                first_third_count: Math.floor(this.testNames.length / 3),
                middle_third_count: Math.floor(this.testNames.length / 3),
                last_third_count: this.testNames.length - 2 * Math.floor(this.testNames.length / 3),
                task: 'verbal_fluency'
            };
            this.jsPsych.finishTrial(data);
            if(this._resolve) this._resolve();
        }
    }

    VFPlugin.info = info;
    return VFPlugin;
})(); 
