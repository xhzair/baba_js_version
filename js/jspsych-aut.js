var jsPsychAUT = (function(){
    'use strict';

    const info={
        name:'aut',
        version:'1.0.0',
        parameters:{
            objects:{
                type:'object',
                default:['Brick','Bedsheet']
            },
            time_limit:{
                type:'int',
                default:120
            },
            participant_id:{
                type:'string',
                default:''
            }
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
                description: 'List of practice ideas'
            },
            responses: {
                type: 'array',
                description: 'Array of responses for each object'
            },
            task: {
                type: 'string',
                description: 'Task identifier',
                default: 'aut'
            }
        }
    };

    class AUTPlugin{constructor(jsPsych){this.jsPsych=jsPsych;}
        async trial(display_element,trial){
            return new Promise(async (resolve)=>{
               this._resolve=resolve;
               this.objects=[...trial.objects];
               this.idx=0;
               this.timeLimit=trial.time_limit;
               this.responses=[];
               this.participant=trial.participant_id;
               
               // practice data holders
               this.practiceInput = '';
               this.practiceIdeas = [];
               
               // phase control
               this.phase = 'instruction'; // instruction -> ready -> test
               
               this.showInstructions(display_element);
            });
        }
        showInstructions(el){
            el.innerHTML=`<div class='aut-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;'><h1 style='color:white;'>Alternative Uses Test</h1><div style='color:white;max-width:800px;margin:0 auto;font-size:18px;line-height:1.6;text-align:left;'><p>This is a classic creativity test to measure <strong>flexibility of thinking</strong>. You will be provided with a random object and have <strong>2&nbsp;minutes</strong> to come up with as many alternative uses for it as you can.</p><p>For example, if "coffee cup" is provided, you might think of uses like: a small soup bowl, a plant pot for some basil.</p><p>Please enter your answers in the input box below, separated by commas.</p><p>Let's practice first! Try to write <strong>2 alternative uses</strong> for a coffee cup below:</p></div><h2 style='color:#3ca5ff;'>Coffee Cup</h2><textarea id='aut-practice-input' placeholder='Please enter directly' style='width:80vw;max-width:1000px;min-width:400px;height:100px;margin-top:20px;font-size:18px;'></textarea><p id='aut-practice-hint' style='color:#cccccc;margin-top:8px;'>Please enter alternative uses separated by commas (e.g., small soup bowl, plant pot)</p><p id='aut-practice-warning' style='color:#ff6b6b;margin-top:8px;font-size:14px;display:none;'>⚠️ Please use commas to separate your ideas!</p><button id='aut-practice-next' class='baba-button' style='margin-top:30px;' disabled>Proceed to Formal Test</button></div>`;
            
            const textarea = el.querySelector('#aut-practice-input');
            const nextBtn = el.querySelector('#aut-practice-next');
            const hintEl = el.querySelector('#aut-practice-hint');
            const warningEl = el.querySelector('#aut-practice-warning');
            
            textarea.addEventListener('input', ()=>{
                this.practiceInput = textarea.value;
                this.practiceIdeas = this.practiceInput.split(',').map(s=>s.trim()).filter(s=>s);
                nextBtn.disabled = this.practiceIdeas.length < 2;
                
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
            <div class='aut-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;'>
                <h2 style='color:white;margin-bottom:30px;'>Formal Test Instructions</h2>
                <div style='color:white;max-width:800px;margin:0 auto;font-size:18px;line-height:1.6;text-align:left;'>
                    <p>Now you will be provided with random objects and have <strong>2 minutes</strong> to come up with as many alternative uses for each object as you can.</p>
                    <p>Please separate each idea with a comma.</p>
                    <p>When you are ready, click the button below to start the first object.</p>
                </div>
                <button id='aut-start-test' class='baba-button' style='margin-top:40px;'>Start Formal Test</button>
            </div>`;

            el.querySelector('#aut-start-test').addEventListener('click', ()=>{
                this.showObject(el);
            });
        }
        
        showObject(el){
            const obj=this.objects[this.idx];
            el.innerHTML=`<div class='aut-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;'><h2 style='color:white;'>Object: ${obj}</h2><div id='aut-timer' style='color:#ffcc00;font-size:20px;margin-top:10px;'></div><textarea id='aut-input' placeholder='Please type your ideas here. Separate them by commas.' autofocus style='width:80vw;max-width:1000px;min-width:400px;height:250px;margin-top:40px;font-size:18px;'></textarea><div id='aut-input-hint' style='color:#cccccc;margin-top:8px;font-size:14px;'>Please separate your ideas with commas (e.g., idea1, idea2, idea3)</div><div id='aut-input-warning' style='color:#ff6b6b;margin-top:8px;font-size:14px;display:none;'>⚠️ Please use commas to separate your ideas!</div><br><div style='color:#cccccc;margin-top:20px;font-size:14px;'>The test will automatically submit when time is up.</div></div>`;
            const textarea=document.getElementById('aut-input');
            const hintEl = document.getElementById('aut-input-hint');
            const warningEl = document.getElementById('aut-input-warning');
            
            // start timer immediately
            this.startTime=performance.now();
            this.timer=setInterval(()=>this.updateTimer(),100);
            
            // add detailed creative time recording
            this.ideaTimestamps = [];
            let previousText = '';
            let lastCommaCount = 0;
            
            // detect new creative input and validate format
            textarea.addEventListener('input', () => {
                const currentTime = performance.now();
                const elapsedTime = (currentTime - this.startTime)/1000;
                const currentText = textarea.value;
                
                // 检查输入格式是否正确
                this.validateInputFormat(currentText, hintEl, warningEl);
                
                // check if there are new commas
                const currentCommas = (currentText.match(/,/g) || []).length;
                
                if (currentCommas > lastCommaCount) {
                    // extract the latest creative input
                    const ideas = currentText.split(',').map(idea => idea.trim()).filter(idea => idea);
                    const newIdea = ideas[ideas.length - 1];
                    
                    if (newIdea) {
                        this.ideaTimestamps.push({
                            idea: newIdea,
                            time: elapsedTime.toFixed(3),
                            index: ideas.length - 1
                        });
                    }
                    
                    lastCommaCount = currentCommas;
                }
                
                previousText = currentText;
            });
            
            // save reference to display next object
            this.displayEl = el;
            // remove submit button - only auto-submit when time is up
            this.updateTimer();
        }
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
        saveAnswer(txt){
            // save current answer
            clearInterval(this.timer);
            const currentTime = performance.now();
            const totalTime = (currentTime - this.startTime)/1000;
            
            // check if there are any unrecorded timestamps for the last creative
            const ideas = txt.trim().split(',').map(idea => idea.trim()).filter(idea => idea);
            if (ideas.length > 0 && (this.ideaTimestamps.length === 0 || 
                ideas[ideas.length - 1] !== this.ideaTimestamps[this.ideaTimestamps.length - 1]?.idea)) {
                
                // add timestamp for the last creative
                this.ideaTimestamps.push({
                    idea: ideas[ideas.length - 1],
                    time: Math.min(totalTime, this.timeLimit).toFixed(3),
                    index: ideas.length - 1
                });
            }
            
            // calculate response time intervals
            const responseIntervals = [];
            if (this.ideaTimestamps.length > 1) {
                for (let i = 1; i < this.ideaTimestamps.length; i++) {
                    responseIntervals.push(
                        parseFloat(this.ideaTimestamps[i].time) - parseFloat(this.ideaTimestamps[i-1].time)
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
            
            // calculate the number of creative ideas in the first, middle, and last thirds
            const firstThird = Math.floor(ideas.length / 3);
            const middleThird = Math.floor(ideas.length / 3);
            const lastThird = ideas.length - firstThird - middleThird;
            
            this.responses.push({
                object: this.objects[this.idx],
                answer: txt,
                idea_count: ideas.length,
                rt: totalTime,
                idea_timestamps: this.ideaTimestamps,
                response_intervals: responseIntervals,
                response_analysis: {
                    average_interval: averageInterval,
                    max_interval: maxInterval,
                    std_deviation: stdDeviation,
                    first_third_count: firstThird,
                    middle_third_count: middleThird,
                    last_third_count: lastThird
                }
            });

            // reset timestamps
            this.ideaTimestamps = [];

            // check if there is another object
            if(this.idx < this.objects.length - 1){
                this.idx++;
                // show transition page
                this.showTransition(this.displayEl);
            } else {
                // all done
                this.finish();
            }
        }
        finish(){
            const trialData = {
                participant_id: this.participant,
                practice_raw: this.practiceInput.trim(),
                practice_list: this.practiceIdeas,
                responses: this.responses,
                task: 'aut'
            };
            this.jsPsych.finishTrial(trialData);
            if(this._resolve) this._resolve();
        }
        // transition page: prompt to show next object
        showTransition(el){
            el.innerHTML=`<div class='aut-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;'><h2 style='color:white;'>Next Object</h2><p style='color:white;font-size:18px;margin-top:20px;'>Click the button below to continue.</p><button id='aut-next' class='baba-button' style='margin-top:40px;'>Continue</button></div>`;

            document.getElementById('aut-next').onclick=()=>{
                this.showObject(el);
            };
        }
    }
    AUTPlugin.info=info;return AUTPlugin;})(); 
