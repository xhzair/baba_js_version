// jspsych-questionnaire.js
// Plugin to present questionnaire defined in questionaire.json sequentially
var jsPsychQuestionnaire = (function(){
    'use strict';

    const info = {
        name: 'questionnaire',
        version: '1.0.0',
        parameters: {
            participant_id: { type: 'string', default: '' },
            json_path: { type: 'string', default: 'questionaire.json' },
            items: { type: 'object', default: null }
        }
    };

    class QPlugin {
        constructor(jsPsych){ this.jsPsych = jsPsych; }

        static {
            this.info = info;
        }

        async trial(display_element, trial){
            this.participant = trial.participant_id;
            this.jsonPath = trial.json_path;
            this.items = trial.items;
            this.responses = [];
            this.idx = 0;
            this._resolveFinish = null;

            // load items if not provided
            if(!this.items){
                // try to read from embedded <script id="questionnaire-data" type="application/json"> tag
                const embedTag = document.getElementById('questionnaire-data');
                if(embedTag){
                    try{
                        this.items = JSON.parse(embedTag.textContent.trim());
                    }catch(err){
                        console.warn('Failed to parse embedded questionnaire JSON, fallback to fetch.', err);
                    }
                }

                // if still not obtained, try fetch
                if(!this.items){
                    try{
                        const resp = await fetch(this.jsonPath);
                        if(!resp.ok) throw new Error(resp.statusText);
                        this.items = await resp.json();
                    }catch(e){
                        console.error('Failed to load questionnaire JSON:', e);
                        display_element.innerHTML = `<p style='color:red;'>Failed to load questionnaire content.</p>`;
                        // finish immediately
                        this.jsPsych.finishTrial({error: true});
                        return;
                    }
                }
            }

            if(!Array.isArray(this.items) || this.items.length === 0){
                display_element.innerHTML = `<p style='color:red;'>Questionnaire is empty.</p>`;
                this.jsPsych.finishTrial({error: 'empty'});
                return;
            }

            // start showing first question
            this.showQuestion(display_element);

            // 返回一个 Promise，只有在 finish() 调用时 resolve，才能让 jsPsych 等待问卷完成
            return new Promise(resolve => {
                this._resolveFinish = resolve;
            });
        }

        showQuestion(el){
            const q = this.items[this.idx];
            // base container
            el.innerHTML = `<div class='q-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:40px 20px;'>
                <h2 style='color:white;margin-bottom:15px;font-size:28px;'>Question ${this.idx + 1} / ${this.items.length}</h2>
                <h3 style='color:white;text-align:center;margin-bottom:25px;font-size:26px;line-height:1.4;max-width:900px;'>${q.question}</h3>
                ${q.prompt ? `<p style='color:#cccccc;max-width:900px;text-align:center;margin-bottom:15px;font-size:24px;line-height:1.5;'>${q.prompt}</p>` : ''}
                <div id='q-options' style='margin-top:15px;'></div>
                <button id='q-next' class='baba-button' style='margin-top:30px;font-size:20px;padding:12px 24px;' disabled>Next</button>
            </div>`;

            const optionsDiv = el.querySelector('#q-options');
            const nextBtn = el.querySelector('#q-next');
            let answerValue = null;
            let answerText = '';
            
            // Store references for attention check reset
            this.currentAnswerValue = answerValue;
            this.currentAnswerText = answerText;
            this.currentOptionsDiv = optionsDiv;
            this.currentNextBtn = nextBtn;

            if(q.type === 'likert' || q.type === 'option'){
                // radio list
                q.options.forEach((opt,i)=>{
                    const optId = `opt_${i}`;
                    const wrapper = document.createElement('div');
                    wrapper.style.margin = '12px 0';
                    wrapper.style.color = 'white';
                    wrapper.innerHTML = `<label style='cursor:pointer;font-size:20px;line-height:1.4;display:flex;align-items:center;'><input type='radio' name='opt' id='${optId}' value='${opt.value}' style='margin-right:12px;transform:scale(1.3);'>${opt.text}</label>`;
                    optionsDiv.appendChild(wrapper);
                });
                optionsDiv.addEventListener('change', (ev)=>{
                    if(ev.target && ev.target.name === 'opt'){
                        this.currentAnswerValue = ev.target.value;
                        this.currentAnswerText = q.options.find(o=>o.value == ev.target.value).text;
                        this.currentNextBtn.disabled = false;
                    }
                });
            } else if(q.type === 'text'){
                const input = document.createElement('textarea');
                input.style.width = '80vw';
                input.style.maxWidth = '700px';
                input.style.minWidth = '400px';
                input.style.height = '120px';
                input.style.fontSize = '20px';
                input.style.padding = '15px';
                input.style.lineHeight = '1.5';
                input.placeholder = 'Please enter here';
                optionsDiv.appendChild(input);
                
                // Add validation message element
                const validationMsg = document.createElement('div');
                validationMsg.style.cssText = `
                    color: #ff6b6b;
                    font-size: 18px;
                    margin-top: 10px;
                    text-align: center;
                    display: none;
                `;
                optionsDiv.appendChild(validationMsg);
                
                input.addEventListener('input', ()=>{
                    this.currentAnswerText = input.value.trim();
                    const inputValue = input.value.trim();
                    
                    console.log('Input validation debug:', {
                        question_id: q.id,
                        input_value: inputValue,
                        question_type: q.type
                    });
                    
                    // Check if this is the age question (id: 29)
                    if(q.id === 29) {
                        // Check if input is a valid number (only digits)
                        const isValidNumber = /^\d+$/.test(inputValue);
                        const age = parseInt(inputValue);
                        
                        console.log('Age validation (ID 29):', {
                            input_value: inputValue,
                            is_valid_number: isValidNumber,
                            parsed_age: age,
                            is_nan: isNaN(age),
                            in_range: age >= 18 && age <= 100
                        });
                        
                        if(inputValue.length === 0) {
                            this.currentAnswerValue = null;
                            this.currentNextBtn.disabled = true;
                            validationMsg.style.display = 'none';
                        } else if(!isValidNumber || isNaN(age) || age < 18 || age > 100) {
                            this.currentAnswerValue = null;
                            this.currentNextBtn.disabled = true;
                            validationMsg.textContent = 'Please enter a valid age between 18 and 100 (numbers only).';
                            validationMsg.style.display = 'block';
                        } else {
                            this.currentAnswerValue = age;
                            this.currentNextBtn.disabled = false;
                            validationMsg.style.display = 'none';
                        }
                    } else if(q.id === 32) {
                        // Check if this is the subjective age question (id: 32)
                        // Check if input is a valid number (only digits)
                        const isValidNumber = /^\d+$/.test(inputValue);
                        const subjectiveAge = parseInt(inputValue);
                        
                        console.log('Subjective age validation (ID 32):', {
                            input_value: inputValue,
                            is_valid_number: isValidNumber,
                            parsed_age: subjectiveAge,
                            is_nan: isNaN(subjectiveAge)
                        });
                        
                        if(inputValue.length === 0) {
                            this.currentAnswerValue = null;
                            this.currentNextBtn.disabled = true;
                            validationMsg.style.display = 'none';
                        } else if(!isValidNumber || isNaN(subjectiveAge)) {
                            this.currentAnswerValue = null;
                            this.currentNextBtn.disabled = true;
                            validationMsg.textContent = 'Please enter a number for your subjective age (numbers only).';
                            validationMsg.style.display = 'block';
                        } else {
                            this.currentAnswerValue = subjectiveAge;
                            this.currentNextBtn.disabled = false;
                            validationMsg.style.display = 'none';
                        }
                    } else {
                        // For other text questions, just check if not empty
                        this.currentAnswerValue = inputValue.length > 0 ? inputValue : null;
                        this.currentNextBtn.disabled = inputValue.length === 0;
                        validationMsg.style.display = 'none';
                    }
                });
            }

            nextBtn.addEventListener('click', ()=>{
                // Debug information for attention check
                console.log('Attention check debug:', {
                    question_id: q.id,
                    is_attention_check: q.is_attention_check,
                    currentAnswerValue: this.currentAnswerValue,
                    correct_answer: q.correct_answer,
                    comparison: Number(this.currentAnswerValue) !== q.correct_answer
                });
                
                // store answer
                this.responses.push({
                    id: q.id,
                    source: q.source,
                    type: q.type,
                    question: q.question,
                    answer_value: this.currentAnswerValue !== null ? Number(this.currentAnswerValue) : null,
                    answer_text: this.currentAnswerText,
                });

                if (q.is_attention_check && Number(this.currentAnswerValue) !== q.correct_answer) {
                    console.log('Attention check failed - showing warning');
                    this.showAttentionWarning();
                    // prevent entering next question, until the participant re-selects
                    return;
                }

                if(this.idx < this.items.length -1){
                    this.idx++;
                    this.showQuestion(el);
                } else {
                    this.finish();
                }
            });
        }

        showAttentionWarning() {
            // Implementation of showAttentionWarning method
            console.warn('Attention check failed. Please re-answer the question.');
            
            // add attention check warning popup
            const warningOverlay = document.createElement('div');
            warningOverlay.id = 'attention-warning-overlay';
            warningOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            `;
            
            const messageBox = document.createElement('div');
            messageBox.style.cssText = `
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                max-width: 500px;
            `;
            
            const title = document.createElement('h2');
            title.textContent = 'Attention Check Failed';
            title.style.cssText = `
                color: #f44336;
                margin-bottom: 20px;
                font-size: 28px;
            `;
            
            const message = document.createElement('p');
            message.textContent = 'We detected that you may not have read the question carefully. Please re-answer this question and read all options carefully.';
            message.style.cssText = `
                color: #333;
                font-size: 20px;
                margin-bottom: 20px;
                line-height: 1.5;
            `;
            
            const button = document.createElement('button');
            button.textContent = 'I Understand';
            button.className = 'baba-button';
            button.style.cssText = `
                background-color: #4CAF50;
                border: none;
                color: white;
                padding: 15px 30px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 20px;
                margin: 10px 2px;
                cursor: pointer;
                border-radius: 5px;
            `;
            
            messageBox.appendChild(title);
            messageBox.appendChild(message);
            messageBox.appendChild(button);
            warningOverlay.appendChild(messageBox);
            document.body.appendChild(warningOverlay);
            
            // click button to close warning
            button.addEventListener('click', () => {
                warningOverlay.remove();
                // Reset the answer state so user can re-select
                this.currentAnswerValue = null;
                this.currentAnswerText = '';
                this.currentNextBtn.disabled = true;
                
                // Clear any selected radio buttons
                const radioButtons = this.currentOptionsDiv.querySelectorAll('input[type="radio"]');
                radioButtons.forEach(radio => {
                    radio.checked = false;
                });
            });
            
            // record attention check failure
            if (!this.attentionCheckFailures) {
                this.attentionCheckFailures = [];
            }
            
            const q = this.items[this.idx];
            this.attentionCheckFailures.push({
                question_id: q.id,
                question_text: q.question,
                time: new Date().toISOString()
            });
        }

        finish(){
            // add attention check results to data
            const attentionCheckData = {
                attention_checks_count: this.items.filter(item => item.is_attention_check).length,
                attention_check_failures: this.attentionCheckFailures || []
            };
            
            this.jsPsych.finishTrial({
                trial_type: 'questionnaire',
                participant_id: this.participant,
                responses: this.responses,
                attention_check_data: attentionCheckData,
                completion_time: new Date().toISOString()
            });

            // 触发 trial 返回的 Promise 完成
            if (this._resolveFinish) {
                this._resolveFinish();
            }
        }
    }

    return QPlugin;
})();

// Register questionnaire plugin with jsPsych
(function () {
    if (typeof jsPsych !== 'undefined' && jsPsych.plugins) {
        jsPsych.plugins['questionnaire'] = jsPsychQuestionnaire;
    }
    if (typeof window !== 'undefined') {
        window.jsPsychQuestionnaire = jsPsychQuestionnaire;
    }
})();