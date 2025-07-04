var jsPsychDSST = (function () {
    'use strict';

    const DIGIT_SYMBOL_MAP = {
        1: 'symbol_1.svg',
        2: 'symbol_2.svg',
        3: 'symbol_3.svg',
        4: 'symbol_4.svg',
        5: 'symbol_5.svg',
        6: 'symbol_6.svg',
        7: 'symbol_7.svg',
        8: 'symbol_8.svg',
        9: 'symbol_9.svg'
    };
    const SYMBOL_LIST = Object.values(DIGIT_SYMBOL_MAP);

    const info = {
        name: 'dsst',
        version: '1.0.0',
        parameters: {
            practice_count: {
                type: 'int',
                default: 3
            },
            test_count: {
                type: 'int',
                default: 100
            },
            time_limit: {
                type: 'int',
                default: 90 // seconds
            },
            participant_id: {
                type: 'string',
                default: ''
            }
        },
        data: {
            practice_count: 3,
            test_count: 100,
            time_limit: 90,
            participant_id: ''
        }
    };

    class DSSTPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        async trial(display_element, trial) {
            // save jsPsych instance reference to class property
            this.jsPsychInstance = this.jsPsych;
            
            // Promise wrapper to signal completion
            return new Promise(async (resolve) => {
                this._resolver = resolve;

                this.practiceCount = Number(trial.practice_count) > 0 ? Number(trial.practice_count) : 3;
                this.testCount = Number(trial.test_count) > 0 ? Number(trial.test_count) : 100;
                this.timeLimit = Number(trial.time_limit) > 0 ? Number(trial.time_limit) : 90;
                this.participantId = trial.participant_id;

                // preload images
                await this.preloadSymbols();

                // generate sequences
                this.practiceSeq = this.sampleSymbols(this.practiceCount);
                this.testSeq = this.sampleSymbols(this.testCount);

                // state vars
                this.phase = 'inst1';
                this.currentIdx = 0;
                this.answers = [];
                this.correctFlags = [];
                this.reactionTimes = [];
                this.keyHandler = null;
                this.timerInterval = null;
                this.startTime = null;

                // begin
                this.showNext(display_element, trial);
            });
        }

        preloadSymbols() {
            const promises = [];
            this.symbolImgs = {};
            for (const svg of SYMBOL_LIST) {
                const img = new Image();
                img.src = `dsst symbol/${svg}`;
                this.symbolImgs[svg] = img;
                promises.push(new Promise((res) => {
                    img.onload = res;
                    img.onerror = res;
                }));
            }
            return Promise.all(promises);
        }

        sampleSymbols(n) {
            const out = [];
            for (let i = 0; i < n; i++) {
                let newSymbol;
                do {
                    newSymbol = SYMBOL_LIST[Math.floor(Math.random() * SYMBOL_LIST.length)];
                } while (i > 0 && newSymbol === out[i - 1]); // avoid consecutive same symbols
                out.push(newSymbol);
            }
            return out;
        }

        showNext(display_element, trial) {
            switch (this.phase) {
                case 'inst1':
                    this.renderInstructions(display_element, 'Digit–Symbol Substitution Task',
                        `<p>You will first complete <strong>${this.practiceCount}</strong> practice trials.</p><p>Symbols will appear from left to right. Press the corresponding digit key <strong>(1-9)</strong> for each symbol as fast and accurately as possible.</p><p>After answering, the symbol will show the correct digit and color feedback.</p>`,
                        () => {
                            this.phase = 'practice';
                            this.currentIdx = 0;
                            this.answers = new Array(this.practiceCount).fill(null);
                            this.correctFlags = new Array(this.practiceCount).fill(false);
                            this.reactionTimes = new Array(this.practiceCount).fill(null);
                            this.showPracticeTrial(display_element);
                        });
                    break;
                case 'inst2':
                    this.renderInstructions(display_element, 'Practice Complete',
                        `<p>Now the real test will begin.</p><p>You will have <strong>${this.timeLimit} seconds</strong> to answer as many as you can (up to ${this.testCount} symbols).</p>`,
                        () => {
                            this.phase = 'test';
                            this.currentIdx = 0;
                            this.answers = new Array(this.testCount).fill(null);
                            this.correctFlags = new Array(this.testCount).fill(false);
                            this.reactionTimes = new Array(this.testCount).fill(null);
                            this.startTime = performance.now();
                            this.startTimer(display_element);
                            this.showTestTrial(display_element);
                        });
                    break;
                case 'result':
                    this.showResult(display_element);
                    break;
            }
        }

        renderInstructions(display_element, title, bodyHtml, onContinue) {
            const html = `
                <div class="dsst-container">
                    <h1 style="color:white;">${title}</h1>
                    <div style="color:white; font-size:18px; max-width:800px; margin:0 auto; line-height:1.6; text-align:left;">${bodyHtml}</div>
                    <button id="dsst-continue" class="baba-button" style="margin-top:40px;">Continue</button>
                </div>`;
            display_element.innerHTML = html;
            document.getElementById('dsst-continue').addEventListener('click', onContinue);
        }

        showPairTable() {
            let table = '<div style="display:flex; justify-content:center; flex-wrap:wrap; gap:20px; margin-bottom:20px;">';
            for (let d = 1; d <= 9; d++) {
                const svg = DIGIT_SYMBOL_MAP[d];
                table += `<div style="text-align:center; width:80px;">` +
                    `<img src="dsst symbol/${svg}" style="width:60px; height:60px; background:#fff; border:2px solid #fff; box-sizing:border-box;"><br>` +
                    `<span style="font-size:22px; color:white;">${d}</span></div>`;
            }
            table += '</div>';
            return table;
        }

        // draw symbol sequence
        renderSymbolSequence(sequence, answers, correctFlags, currentIdx) {
            const totalLen = sequence.length;
            const showRange = Math.min(11, totalLen); // max 11 symbols
            const half = Math.floor(showRange / 2);
            let start = Math.max(0, currentIdx - half);
            let end = Math.min(totalLen, start + showRange);
            start = Math.max(0, end - showRange); // ensure always show showRange symbols

            let html = '<div class="dsst-sequence-container" style="display:flex; justify-content:center; gap:10px; margin:20px 0;">';
            
            for (let i = start; i < end; i++) {
                const symbol = sequence[i];
                const answer = answers[i];
                const correct = correctFlags[i];
                const isCurrent = i === currentIdx;
                
                html += `<div class="dsst-symbol-item${isCurrent ? ' current' : ''}" style="position:relative; width:80px; height:80px; border:${isCurrent ? '5px solid #FFC800' : '2px solid #fff'}; display:flex; align-items:center; justify-content:center; background:#fff;">`;
                
                if (answer !== null) {
                    // show answer
                    const answerClass = correct ? 'dsst-answer-correct' : 'dsst-answer-incorrect';
                    const color = correct ? '#28A745' : '#DC3545';
                    html += `<div style="font-size:32px; font-weight:bold; color:${color};">${answer}</div>`;
                } else {
                    // show symbol
                    html += `<img src="dsst symbol/${symbol}" style="width:60px; height:60px;">`;
                }
                
                html += '</div>';
            }
            
            html += '</div>';
            return html;
        }

        showPracticeTrial(display_element) {
            if (this.currentIdx >= this.practiceCount) {
                this.phase = 'inst2';
                this.showNext(display_element);
                return;
            }
            
            const html = `
                <div class="dsst-container">
                    ${this.showPairTable()}
                    ${this.renderSymbolSequence(this.practiceSeq, this.answers, this.correctFlags, this.currentIdx)}
                    <div style="text-align:center; margin-top:20px;">
                        <p style="color:white; font-size:18px;">Press the corresponding digit (1-9) for the highlighted symbol</p>
                    </div>
                    <p style="color:white; margin-top:30px;">Practice ${this.currentIdx + 1} / ${this.practiceCount}</p>
                </div>`;
            display_element.innerHTML = html;
            
            const start = performance.now();
            const handler = (e) => {
                if (e.key >= '1' && e.key <= '9') {
                    const rt = performance.now() - start;
                    const ansDigit = parseInt(e.key);
                    const symbol = this.practiceSeq[this.currentIdx];
                    
                    // record answer
                    this.answers[this.currentIdx] = ansDigit;
                    const correct = DIGIT_SYMBOL_MAP[ansDigit] === symbol;
                    this.correctFlags[this.currentIdx] = correct;
                    this.reactionTimes[this.currentIdx] = rt;
                    
                    // show feedback immediately without re-rendering
                    // Find the current symbol element (the one with 'current' class)
                    const currentElement = document.querySelector('.dsst-symbol-item.current');
                    if (currentElement) {
                        const color = correct ? '#28A745' : '#DC3545';
                        currentElement.innerHTML = `<div style="font-size:32px; font-weight:bold; color:${color};">${ansDigit}</div>`;
                    }
                    
                    // short delay before entering next question
                    setTimeout(() => {
                        document.removeEventListener('keydown', handler);
                        this.currentIdx++;
                        this.showPracticeTrial(display_element);
                    }, 150); // practice phase very short feedback time
                }
            };
            document.addEventListener('keydown', handler);
        }

        startTimer(display_element) {
            // Remove existing timer if any
            const existingTimer = document.getElementById('dsst-timer');
            if (existingTimer) {
                existingTimer.remove();
            }
            
            const timerEl = document.createElement('div');
            timerEl.id = 'dsst-timer';
            timerEl.style.cssText = 'position:fixed; top:10px; right:20px; font-size:20px; color:white; z-index:1000; background:rgba(0,0,0,0.7); padding:5px 10px; border-radius:5px;';
            document.body.appendChild(timerEl);
            
            const update = () => {
                const elapsed = (performance.now() - this.startTime) / 1000;
                const remain = Math.max(0, this.timeLimit - elapsed);
                timerEl.textContent = `Time: ${remain.toFixed(1)} s`;
                if (remain <= 0) {
                    clearInterval(this.timerInterval);
                    if (this.keyHandler) {
                        document.removeEventListener('keydown', this.keyHandler);
                    }
                    this.phase = 'result';
                    this.showNext(this.displayElementRef);
                }
            };
            this.timerInterval = setInterval(update, 100);
        }

        showTestTrial(display_element) {
            this.displayElementRef = display_element;
            if (this.currentIdx >= this.testCount) {
                this.phase = 'result';
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                }
                this.showNext(display_element);
                return;
            }
            
            const html = `
                <div class="dsst-container">
                    ${this.showPairTable()}
                    ${this.renderSymbolSequence(this.testSeq, this.answers, this.correctFlags, this.currentIdx)}
                    <div style="text-align:center; margin-top:20px;">
                        <p style="color:white; font-size:20px;">Press the corresponding digit (1-9) for the highlighted symbol</p>
                    </div>
                </div>`;
            display_element.innerHTML = html;
            
            const start = performance.now();
            this.keyHandler = (e) => {
                if (e.key >= '1' && e.key <= '9') {
                    const rt = performance.now() - start;
                    const ansDigit = parseInt(e.key);
                    const symbol = this.testSeq[this.currentIdx];
                    
                    // record answer
                    this.answers[this.currentIdx] = ansDigit;
                    const correct = DIGIT_SYMBOL_MAP[ansDigit] === symbol;
                    this.correctFlags[this.currentIdx] = correct;
                    this.reactionTimes[this.currentIdx] = rt;
                    
                    // show feedback immediately without re-rendering
                    // Find the current symbol element (the one with 'current' class)
                    const currentElement = document.querySelector('.dsst-symbol-item.current');
                    if (currentElement) {
                        const color = correct ? '#28A745' : '#DC3545';
                        currentElement.innerHTML = `<div style="font-size:32px; font-weight:bold; color:${color};">${ansDigit}</div>`;
                    }
                    
                    // short delay before entering next question
                    setTimeout(() => {
                        document.removeEventListener('keydown', this.keyHandler);
                        this.currentIdx++;
                        this.showTestTrial(display_element);
                    }, 100); // test phase very short feedback time
                }
            };
            document.addEventListener('keydown', this.keyHandler);
        }

        showResult(display_element) {
            if (document.getElementById('dsst-timer')) {
                document.getElementById('dsst-timer').remove();
            }
            const totalAnswered = this.answers.filter(a => a !== null).length;
            const correct = this.correctFlags.filter(Boolean).length;
            const wrong = totalAnswered - correct;
            const usedTime = Math.min(this.timeLimit, (performance.now() - this.startTime) / 1000);
            
            const html = `
                <div class="dsst-container">
                    <h1 style="color:white;">Task Completed</h1>
                    <div style="color:white; font-size:20px; line-height:1.8;">
                        <p>Total attempted: ${totalAnswered}</p>
                        <p>Correct: ${correct}</p>
                        <p>Wrong: ${wrong}</p>
                        <p>Time used: ${usedTime.toFixed(1)} seconds</p>
                    </div>
                    <button id="dsst-finish-btn" class="baba-button" style="margin-top:40px;">Continue</button>
                </div>`;
            display_element.innerHTML = html;
            document.getElementById('dsst-finish-btn').addEventListener('click', () => {
                const data = {
                    participant_id: this.participantId,
                    total_attempted: totalAnswered,
                    correct: correct,
                    wrong: wrong,
                    used_time: usedTime,
                    answers: this.answers,
                    correct_flags: this.correctFlags,
                    reaction_times: this.reactionTimes
                };
                this.jsPsychInstance.finishTrial(data);
                if (this._resolver) this._resolver();
            });
        }
    }

    DSSTPlugin.info = info;
    return DSSTPlugin;
})(); 
