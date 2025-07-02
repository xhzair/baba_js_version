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
                <p id='vf-practice-hint' style='color:#cccccc;margin-top:8px;'>Please enter ${this.practiceCategory.toLowerCase()} names separated by commas.</p>
                <button id='vf-practice-next' class='baba-button' style='margin-top:30px;' disabled>Proceed to Formal Test</button>
            </div>`;

            const textarea = el.querySelector('#vf-practice-input');
            const nextBtn = el.querySelector('#vf-practice-next');
            textarea.addEventListener('input', ()=>{
                this.practiceInput = textarea.value;
                this.practiceNames = this.practiceInput.split(',').map(s=>s.trim()).filter(s=>s);
                nextBtn.disabled = this.practiceNames.length < 3;
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
                <p style='color:#cccccc;margin-top:8px;'>Please enter ${this.testCategory.toLowerCase()} names separated by commas. You can submit early, or it will submit automatically when time is up.</p>
                <button id='vf-submit' class='baba-button' style='margin-top:20px;'>Submit</button>
            </div>`;

            // prepare state
            const textarea = el.querySelector('#vf-test-input');
            const submitBtn  = el.querySelector('#vf-submit');
            this.startTime = performance.now();
            
            // 添加词语输入时间记录
            this.wordTimestamps = [];
            let previousText = '';
            let lastCommaCount = 0;
            
            // 检测新单词输入
            textarea.addEventListener('input', () => {
                const currentTime = performance.now();
                const elapsedTime = (currentTime - this.startTime) / 1000;
                const currentText = textarea.value;
                
                // 检查是否有新的逗号出现
                const currentCommas = (currentText.match(/,/g) || []).length;
                
                if (currentCommas > lastCommaCount) {
                    // 提取最新输入的单词
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
                    submitBtn.click();
                }
            }, 100);

            submitBtn.addEventListener('click', ()=>{
                clearInterval(this.timer);
                this.testInput = textarea.value;
                this.testNames = this.testInput.split(',').map(s=>s.trim()).filter(s=>s);
                this.usedTime = Math.min(this.timeLimit, (performance.now() - this.startTime)/1000);
                this.phase = 'result';
                this.showResult(el);
            });
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
        finish(){
            // 检查是否有尚未记录时间戳的最后一个单�?
            const finalWords = this.testInput.split(',').map(w => w.trim()).filter(w => w);
            if (finalWords.length > 0 && (this.wordTimestamps.length === 0 || 
                finalWords[finalWords.length - 1] !== this.wordTimestamps[this.wordTimestamps.length - 1]?.word)) {
                
                // 添加最后一个单词的时间�?
                const lastWordTime = this.usedTime || this.timeLimit;
                this.wordTimestamps.push({
                    word: finalWords[finalWords.length - 1],
                    time: lastWordTime.toFixed(3),
                    index: finalWords.length - 1
                });
            }
            
            // 计算响应时间间隔
            const responseIntervals = [];
            if (this.wordTimestamps.length > 1) {
                for (let i = 1; i < this.wordTimestamps.length; i++) {
                    responseIntervals.push(
                        parseFloat(this.wordTimestamps[i].time) - parseFloat(this.wordTimestamps[i-1].time)
                    );
                }
            }
            
            // 分析响应模式
            const averageInterval = responseIntervals.length > 0 ? 
                responseIntervals.reduce((sum, val) => sum + val, 0) / responseIntervals.length : 0;
                
            const maxInterval = responseIntervals.length > 0 ? 
                Math.max(...responseIntervals) : 0;
                
            // 标准差计�?
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
                last_third_count: this.testNames.length - 2 * Math.floor(this.testNames.length / 3)
            };
            this.jsPsych.finishTrial(data);
            if(this._resolve) this._resolve();
        }
    }

    VFPlugin.info = info;
    return VFPlugin;
})(); 
