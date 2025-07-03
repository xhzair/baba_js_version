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
               this.showInstructions(display_element);
            });
        }
        showInstructions(el){el.innerHTML=`<div class='aut-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;'><h1 style='color:white;'>Alternative Uses Test</h1><div style='color:white;max-width:800px;margin:0 auto;font-size:18px;line-height:1.6;text-align:left;'><p>This is a classic creativity test to measure <strong>flexibility of thinking</strong>. You will be provided with a random object and have <strong>2&nbsp;minutes</strong> to come up with as many alternative uses for it as you can.</p><p>For example, if "coffee cup" is provided, you might think of uses like: a small soup bowl, a plant pot for some basil.</p><p>Please enter your answers in the input box below, separated by commas.</p><p>When you are ready, click the button below to start the first round.</p></div><button id='aut-start' class='baba-button' style='margin-top:40px;'>Start</button></div>`;
            document.getElementById('aut-start').onclick=()=>{this.showObject(el);};}
        showObject(el){
            const obj=this.objects[this.idx];
            el.innerHTML=`<div class='aut-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;'><h2 style='color:white;'>Object: ${obj}</h2><div id='aut-timer' style='color:#ffcc00;font-size:20px;margin-top:10px;'></div><textarea id='aut-input' placeholder='Please type your ideas here. Separate them by commas.' autofocus style='width:80vw;max-width:1000px;min-width:400px;height:250px;margin-top:40px;font-size:18px;'></textarea><br><button id='aut-submit' class='baba-button' style='margin-top:20px;'>Submit</button></div>`;
            const textarea=document.getElementById('aut-input');
            // start timer immediately
            this.startTime=performance.now();
            this.timer=setInterval(()=>this.updateTimer(),100);
            
            // add detailed creative time recording
            this.ideaTimestamps = [];
            let previousText = '';
            let lastCommaCount = 0;
            
            // detect new creative input
            textarea.addEventListener('input', () => {
                const currentTime = performance.now();
                const elapsedTime = (currentTime - this.startTime)/1000;
                const currentText = textarea.value;
                
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
            document.getElementById('aut-submit').onclick=()=>{this.saveAnswer(textarea.value);};
            this.updateTimer();
        }
        updateTimer(){const remain=this.timeLimit- (performance.now()-this.startTime)/1000;const t=document.getElementById('aut-timer');if(t) t.textContent=`Time left: ${Math.max(0,remain).toFixed(1)} s`;if(remain<=0){clearInterval(this.timer);this.finish();}}
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

            // 重置时间戳记录
            this.ideaTimestamps = [];

            // 判断是否还有下一物体
            if(this.idx < this.objects.length - 1){
                this.idx++;
                // 先显示过渡页
                this.showTransition(this.displayEl);
            } else {
                // 全部完成
                this.finish();
            }
        }
        finish(){this.jsPsych.finishTrial({participant_id:this.participant,responses:this.responses});
            if(this._resolve) this._resolve();
        }
        // 过渡页：提示即将呈现下一物体
        showTransition(el){
            el.innerHTML=`<div class='aut-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;'><h2 style='color:white;'>Next Object</h2><p style='color:white;font-size:18px;margin-top:20px;'>Click the button below to continue.</p><button id='aut-next' class='baba-button' style='margin-top:40px;'>Continue</button></div>`;

            document.getElementById('aut-next').onclick=()=>{
                this.showObject(el);
            };
        }
    }
    AUTPlugin.info=info;return AUTPlugin;})(); 
