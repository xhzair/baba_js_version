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
                
                // RSVP states
                this.displayedSymbols = []; // current displayed symbols
                this.symbolAnswers = []; // answers for corresponding symbols
                this.symbolCorrectFlags = []; // correctness for corresponding symbols
                this.maxDisplayed = 9; // max displayed symbols

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
                out.push(SYMBOL_LIST[Math.floor(Math.random() * SYMBOL_LIST.length)]);
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
                            this.displayedSymbols = [];
                            this.symbolAnswers = [];
                            this.symbolCorrectFlags = [];
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
                            this.displayedSymbols = [];
                            this.symbolAnswers = [];
                            this.symbolCorrectFlags = [];
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

        // add new symbol to display sequence
        addSymbolToDisplay(symbol) {
            this.displayedSymbols.push(symbol);
            this.symbolAnswers.push(null);
            this.symbolCorrectFlags.push(null);
            
            // if exceeds max displayed, remove the leftmost symbol
            if (this.displayedSymbols.length > this.maxDisplayed) {
                this.displayedSymbols.shift();
                this.symbolAnswers.shift();
                this.symbolCorrectFlags.shift();
            }
        }

        // render RSVP display area
        renderRSVPDisplay() {
            let html = '<div class="dsst-rsvp-container">';
            
            for (let i = 0; i < this.displayedSymbols.length; i++) {
                const symbol = this.displayedSymbols[i];
                const answer = this.symbolAnswers[i];
                const correct = this.symbolCorrectFlags[i];
                const isCurrent = i === 0 && answer === null; // leftmost and unanswered symbol
                
                html += `<div class="dsst-symbol-item${isCurrent ? ' current' : ''}">`;
                
                // symbol image
                html += `<img src="dsst symbol/${symbol}" class="dsst-symbol-image">`;
                
                // answer display area
                if (answer !== null) {
                    const answerClass = correct ? 'dsst-answer-correct' : 'dsst-answer-incorrect';
                    html += `<div class="dsst-answer-display ${answerClass}">${answer}</div>`;
                } else {
                    html += `<div class="dsst-answer-display dsst-answer-pending">?</div>`;
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
            
            // add new symbol to display sequence
            const symbol = this.practiceSeq[this.currentIdx];
            this.addSymbolToDisplay(symbol);
            
            const html = `
                <div class="dsst-container">
                    ${this.showPairTable()}
                    ${this.renderRSVPDisplay()}
                    <div style="text-align:center; margin-top:20px;">
                        <p style="color:white; font-size:18px;">Press the corresponding digit (1-9) for the leftmost symbol</p>
                    </div>
                    <p style="color:white; margin-top:30px;">Practice ${this.currentIdx + 1} / ${this.practiceCount}</p>
                </div>`;
            display_element.innerHTML = html;
            
            const start = performance.now();
            const handler = (e) => {
                if (e.key >= '1' && e.key <= '9') {
                    const rt = performance.now() - start;
                    const ansDigit = parseInt(e.key);
                    
                    // 记录答案
                    this.answers[this.currentIdx] = ansDigit;
                    const correct = DIGIT_SYMBOL_MAP[ansDigit] === symbol;
                    this.correctFlags[this.currentIdx] = correct;
                    this.reactionTimes[this.currentIdx] = rt;
                    
                    // update answers in display sequence
                    if (this.symbolAnswers.length > 0) {
                        this.symbolAnswers[0] = ansDigit;
                        this.symbolCorrectFlags[0] = correct;
                    }
                    
                    // re-render display
                    this.showPracticeTrial(display_element);
                    
                    // enter next trial after short delay
                    setTimeout(() => {
                        document.removeEventListener('keydown', handler);
                        this.currentIdx++;
                        this.showPracticeTrial(display_element);
                    }, 500); // reduce delay time
                }
            };
            document.addEventListener('keydown', handler);
        }

        startTimer(display_element) {
            const timerEl = document.createElement('div');
            timerEl.id = 'dsst-timer';
            timerEl.style.cssText = 'position:fixed; top:10px; right:20px; font-size:20px; color:white;';
            document.body.appendChild(timerEl);
            const update = () => {
                const elapsed = (performance.now() - this.startTime) / 1000;
                const remain = Math.max(0, this.timeLimit - elapsed);
                timerEl.textContent = `Time: ${remain.toFixed(1)} s`;
                if (remain <= 0) {
                    clearInterval(this.timerInterval);
                    document.removeEventListener('keydown', this.keyHandler);
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
                clearInterval(this.timerInterval);
                this.showNext(display_element);
                return;
            }
            
            // add new symbol to display sequence
            const symbol = this.testSeq[this.currentIdx];
            this.addSymbolToDisplay(symbol);
            
            const html = `
                <div class="dsst-container">
                    ${this.showPairTable()}
                    ${this.renderRSVPDisplay()}
                    <div style="text-align:center; margin-top:20px;">
                        <p style="color:white; font-size:20px;">Press the corresponding digit (1-9) for the leftmost symbol</p>
                    </div>
                </div>`;
            display_element.innerHTML = html;
            
            const start = performance.now();
            this.keyHandler = (e) => {
                if (e.key >= '1' && e.key <= '9') {
                    const rt = performance.now() - start;
                    const ansDigit = parseInt(e.key);
                    
                    // record answer
                    this.answers[this.currentIdx] = ansDigit;
                    const correct = DIGIT_SYMBOL_MAP[ansDigit] === symbol;
                    this.correctFlags[this.currentIdx] = correct;
                    this.reactionTimes[this.currentIdx] = rt;
                    
                    // update answers in display sequence
                    if (this.symbolAnswers.length > 0) {
                        this.symbolAnswers[0] = ansDigit;
                        this.symbolCorrectFlags[0] = correct;
                    }
                    
                    // re-render display
                    this.showTestTrial(display_element);
                    
                    // enter next trial after short delay
                    setTimeout(() => {
                        document.removeEventListener('keydown', this.keyHandler);
                        this.currentIdx++;
                        this.showTestTrial(display_element);
                    }, 500); // reduce delay time
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
            const html = `
                <div class="dsst-container">
                    <h1 style="color:white;">Task Completed</h1>
                    <div style="color:white; font-size:20px; line-height:1.8;">
                        <p>Total attempted: ${totalAnswered}</p>
                        <p>Correct: ${correct}</p>
                        <p>Wrong: ${wrong}</p>
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
