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

        async trial(display_element, trial){
            this.participant = trial.participant_id;
            this.jsonPath = trial.json_path;
            this.items = trial.items;
            this.responses = [];
            this.idx = 0;
            this._resolveFinish = null;

            // load items if not provided
            if(!this.items){
                // 先尝试从内嵌 <script id="questionnaire-data" type="application/json"> 标签读取
                const embedTag = document.getElementById('questionnaire-data');
                if(embedTag){
                    try{
                        this.items = JSON.parse(embedTag.textContent.trim());
                    }catch(err){
                        console.warn('Failed to parse embedded questionnaire JSON, fallback to fetch.', err);
                    }
                }

                // 如果仍未获取，尝�?fetch
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
        }

        showQuestion(el){
            const q = this.items[this.idx];
            // base container
            el.innerHTML = `<div class='q-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:40px 20px;'>
                <h2 style='color:white;margin-bottom:10px;'>Question ${this.idx + 1} / ${this.items.length}</h2>
                <h3 style='color:white;text-align:center;margin-bottom:20px;'>${q.question}</h3>
                ${q.prompt ? `<p style='color:#cccccc;max-width:800px;text-align:center;margin-bottom:10px;'>${q.prompt}</p>` : ''}
                <div id='q-options' style='margin-top:10px;'></div>
                <button id='q-next' class='baba-button' style='margin-top:30px;' disabled>Next</button>
            </div>`;

            const optionsDiv = el.querySelector('#q-options');
            const nextBtn = el.querySelector('#q-next');
            let answerValue = null;
            let answerText = '';

            if(q.type === 'likert' || q.type === 'option'){
                // radio list
                q.options.forEach((opt,i)=>{
                    const optId = `opt_${i}`;
                    const wrapper = document.createElement('div');
                    wrapper.style.margin = '6px 0';
                    wrapper.style.color = 'white';
                    wrapper.innerHTML = `<label style='cursor:pointer;'><input type='radio' name='opt' id='${optId}' value='${opt.value}' style='margin-right:8px;'>${opt.text}</label>`;
                    optionsDiv.appendChild(wrapper);
                });
                optionsDiv.addEventListener('change', (ev)=>{
                    if(ev.target && ev.target.name === 'opt'){
                        answerValue = ev.target.value;
                        answerText = q.options.find(o=>o.value == answerValue).text;
                        nextBtn.disabled = false;
                    }
                });
            } else if(q.type === 'text'){
                const input = document.createElement('textarea');
                input.style.width = '80vw';
                input.style.maxWidth = '600px';
                input.style.minWidth = '300px';
                input.style.height = '100px';
                input.style.fontSize = '18px';
                input.placeholder = 'Please enter here';
                optionsDiv.appendChild(input);
                input.addEventListener('input', ()=>{
                    answerText = input.value.trim();
                    nextBtn.disabled = answerText.length === 0;
                });
            }

            nextBtn.addEventListener('click', ()=>{
                // store answer
                this.responses.push({
                    id: q.id,
                    source: q.source,
                    type: q.type,
                    question: q.question,
                    answer_value: answerValue !== null ? Number(answerValue) : null,
                    answer_text: answerText,
                });

                if (q.is_attention_check && answerValue !== q.correct_answer) {
                    this.showAttentionWarning();
                    // 阻止进入下一题，直到被试重新选择
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
            
            // 添加注意力检查警告弹�?
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
            title.textContent = '注意力检查未通过';
            title.style.cssText = `
                color: #f44336;
                margin-bottom: 20px;
                font-size: 24px;
            `;
            
            const message = document.createElement('p');
            message.textContent = '我们检测到您可能没有仔细阅读问题。请重新回答此问题，并仔细阅读所有选项�?;
            message.style.cssText = `
                color: #333;
                font-size: 16px;
                margin-bottom: 20px;
                line-height: 1.5;
            `;
            
            const button = document.createElement('button');
            button.textContent = '我明白了';
            button.className = 'baba-button';
            button.style.cssText = `
                background-color: #4CAF50;
                border: none;
                color: white;
                padding: 10px 20px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 10px 2px;
                cursor: pointer;
                border-radius: 5px;
            `;
            
            messageBox.appendChild(title);
            messageBox.appendChild(message);
            messageBox.appendChild(button);
            warningOverlay.appendChild(messageBox);
            document.body.appendChild(warningOverlay);
            
            // 点击按钮关闭警告
            button.addEventListener('click', () => {
                warningOverlay.remove();
            });
            
            // 记录注意力检查失�?
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
            // 添加注意力检查结果到数据
            const attentionCheckData = {
                attention_checks_count: this.items.filter(item => item.is_attention_check).length,
                attention_check_failures: this.attentionCheckFailures || []
            };
            
            this.jsPsych.finishTrial({
                participant_id: this.participant,
                responses: this.responses,
                attention_check_data: attentionCheckData,
                completion_time: new Date().toISOString()
            });
        }
    }

    QPlugin.info = info;
    return QPlugin;
})(); 
