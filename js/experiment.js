/**
 * Baba is You - jsPsych Experiment
 * Main experiment control file
 */

// ---------- jsPsych initialization and Prolific integration ----------
const jsPsych = initJsPsych({
    display_element: 'jspsych-target',
    default_iti: 250,
    override_safe_mode: true, // Allow running under file:// protocol
    on_finish: function () {
        // Handle experiment finish
        // If from Prolific, automatically redirect to completion link
        // Please replace XXXXXXX with the Completion Code provided by Prolific
        const pid = jsPsych.data.getURLVariable('PROLIFIC_PID');
        if (pid) {
            // Please replace XXXXXXX with the Completion Code provided by Prolific
            // window.location.href = 'https://app.prolific.co/submissions/complete?cc=XXXXXXX'
            window.location.href = 'https://app.prolific.com/submissions/complete?cc=C142IN0V';
            return; // End
        }

        // Check if running on Pavlovia
        const isPavlovia = typeof Pavlovia !== 'undefined';
        
        if (isPavlovia) {
            // On Pavlovia, data is automatically saved, just show completion message
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: Verdana, Arial, sans-serif; background-color: #7d7d7d; color: white; min-height: 100vh;">
                    <h1>Experiment completed!</h1>
                    <h2>Thank you for participating!</h2>
                    <p>Your data has been automatically saved.</p>
                    <p>Thank you for your participation. The data from this experiment is valuable to our research.</p>
                    <p>You can now close this window.</p>
                </div>
            `;
            return;
        }

        // Otherwise, call the experiment controller's data saving function
        // Fallback: display JSON data
        if (window.experimentController) {
            window.experimentController.saveExperimentData();
        } else {
            // Fallback: display JSON data
            jsPsych.data.displayData('json');
        }
    }
});

// Capture Prolific URL parameters and write to global data
(function captureProlificIds() {
    const prolific_pid = jsPsych.data.getURLVariable('PROLIFIC_PID');
    const study_id     = jsPsych.data.getURLVariable('STUDY_ID');
    const session_id   = jsPsych.data.getURLVariable('SESSION_ID');

    jsPsych.data.addProperties({
        prolific_pid: prolific_pid || null,
        study_id: study_id || null,
        session_id: session_id || null
    });
})();

// Experiment state management
class ExperimentController {
    constructor() {
        this.currentChapter = null;
        this.currentChapterIndex = 0;
        this.currentLevelIndex = 0;
        this.unlockedLevels = { tutorial: 1, journey: 0 };
        this.completedLevels = { tutorial: [], journey: [] };
        this.experimentData = [];

        // If entered via Prolific, use PROLIFIC_PID as participantId; otherwise generate random ID
        const prolificPid = jsPsych.data.getURLVariable('PROLIFIC_PID');
        this.participantId = prolificPid || this.generateParticipantId();
        
        // Randomly assign experiment condition (prior-congruent or prior-incongruent)
        this.conditionType = this.randomAssignCondition();
        
        // Get all level data
        this.allLevels = getAllLevels();
        this.chapters = getChapters();

        // Set chapter lock status based on unlockedLevels
        this.chapters = this.chapters.map(ch => ({
            ...ch,
            locked: ch.key !== 'tutorial' && (this.unlockedLevels[ch.key] || 0) === 0
        }));
    }
    
    // Randomly assign experiment condition
    randomAssignCondition() {
        const conditions = window.getConditionTypes ? 
                          window.getConditionTypes() : 
                          ['high-prior', 'low-prior'];
        
        // Randomly select one condition
        const randomIndex = Math.floor(Math.random() * conditions.length);
        return conditions[randomIndex];
    }
    
    generateParticipantId() {
        return 'P_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Create experiment timeline
    createTimeline() {
        const timeline = [];
        
        // -1. preload all resources
        timeline.push(this.createPreloadTrial());
        
        // 0. 2 seconds countdown, give participants a psychological buffer
        timeline.push(this.createCountdownTrial());
        
        // 0. Screening questionnaire
        timeline.push(this.createScreeningTrial());
        
        // 1a. Informed consent
        timeline.push(this.createInformedConsentTrial());
        
        // 1b. Experiment introduction
        timeline.push(this.createExperimentIntroTrial());
        
        // 1b. Puzzle Game introduction
        timeline.push(this.createPuzzleIntroTrial());
        
        // 2. Main game loop
        timeline.push(this.createMainGameLoop());
        
        // 3. Puzzle solving overall performance scoring
        timeline.push(this.createCompletionTrial());
        
        // 3b. Transition to Cognitive Tests
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: `<h2 style="color:white;">Next: Cognitive Tests</h2>
                      <p style="color:white; font-size:18px;">You have completed the puzzle game. Now you will complete several cognitive tests.</p>`,
            choices: ['Continue'],
            data: { trial_type: 'transition_to_cognitive', participant_id: this.participantId }
        });
        
        // 4. Digit Span Test introduction
        timeline.push(this.createDigitSpanIntroTrial());
        
        // 5. Digit Span Test - Forward
        timeline.push(this.createDigitSpanForwardTrial());
        
        // 5b. Transition page: Prompting upcoming reverse
        timeline.push(this.createDigitSpanTransitionTrial());
        
        // 6. Digit Span Test - Reverse
        timeline.push(this.createDigitSpanBackwardTrial());
        
        // 6b. Transition to DSST
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: `<h2 style="color:white;">Next: Digit-Symbol Substitution Test</h2>
                      <p style="color:white; font-size:18px;">You will now complete a digit-symbol substitution task to test your processing speed.</p>`,
            choices: ['Continue'],
            data: { trial_type: 'transition_to_dsst', participant_id: this.participantId }
        });
        
        // 7. DSST introduction
        timeline.push(this.createDSSTIntroTrial());
        
        // 8. DSST task
        timeline.push(this.createDSSTTaskTrial());
        
        // 8b. Transition to AUT
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: `<h2 style="color:white;">Next: Alternative Uses Test</h2>
                      <p style="color:white; font-size:18px;">You will now complete a creativity test where you think of alternative uses for common objects.</p>`,
            choices: ['Continue'],
            data: { trial_type: 'transition_to_aut', participant_id: this.participantId }
        });
        
        // 9. Alternative Uses Test (AUT)
        timeline.push(this.createAUTTrial());
        
        // 9b. Transition to Verbal Fluency
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: `<h2 style="color:white;">Next: Verbal Fluency Test</h2>
                      <p style="color:white; font-size:18px;">You will now complete a verbal fluency test where you name as many items as possible from a category.</p>`,
            choices: ['Continue'],
            data: { trial_type: 'transition_aut_vf', participant_id: this.participantId }
        });
        
        // 10. Verbal Fluency Test
        timeline.push(this.createVerbalFluencyTrial());
        
        // 10b. Transition to Questionnaire
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: `<h2 style="color:white;">Next: Final Questionnaire</h2>
                      <p style="color:white; font-size:18px;">You have completed all cognitive tests. Now you will answer some final questions about your experience.</p>`,
            choices: ['Continue'],
            data: { trial_type: 'transition_vf_q', participant_id: this.participantId }
        });
        
        // 11. Questionnaire
        timeline.push(this.createQuestionnaireTrial());
        
        return timeline;
    }
    
    createScreeningTrial() {
        return {
            type: jsPsychScreeningQuestionnaire,
            participant_id: this.participantId,
            data: {
                trial_type: 'screening_questionnaire',
                participant_id: this.participantId
            }
        };
    }
    
    createInformedConsentTrial() {
        return {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                <h1 style="color: white; text-align: center; margin-bottom: 20px;">Informed Consent</h1>
                <div style="color: white; max-width: 800px; margin: 0 auto; font-size: 16px; line-height: 1.5; text-align: left; background-color: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px;">
                    <h2 style="color: white; margin-bottom: 15px;">Problem-Solving and Cognitive Abilities Study</h2>
                    
                    <p><strong>Purpose:</strong> This study investigates problem-solving abilities and cognitive functions in adults.</p>
                    
                    <p><strong>What you will do:</strong> Complete a puzzle game, some cognitive tests, and brief questionnaires. Duration: 45-60 minutes.</p>
                    
                    <p><strong>Confidentiality:</strong> Your responses are confidential and used only for research purposes.</p>
                    
                    <p><strong>Voluntary participation:</strong> You may withdraw at any time without penalty.</p>
                    
                    <p><strong>Contact:</strong> Questions? Email xuhuizhang@pku.edu.cn</p>
                    
                    <div style="background-color: rgba(255, 255, 255, 0.2); padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <p style="margin: 0; font-weight: bold;">By clicking "I Agree", you confirm that:</p>
                        <ul style="margin: 8px 0 0 20px;">
                            <li>You understand the information above</li>
                            <li>You are 18+ years old</li>
                            <li>You voluntarily agree to participate</li>
                        </ul>
                    </div>
                </div>
            `,
            choices: ['I Agree', 'I Do Not Agree'],
            data: {
                trial_type: 'informed_consent',
                participant_id: this.participantId
            },
            on_finish: function(data) {
                // If participant does not agree, exit the experiment
                if (data.response === 1) { // "I Do Not Agree" button
                    // Create exit message
                    const exitMessage = `
                        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10000; color: white; font-size: 24px; text-align: center;">
                            <h2>Thank you for your time</h2>
                            <p>You have chosen not to participate in this study.</p>
                            <p>The experiment will close automatically in <span id="exit-countdown">5</span> seconds.</p>
                        </div>
                    `;
                    document.body.innerHTML = exitMessage;
                    
                    // Countdown and close
                    let remaining = 5;
                    const timer = setInterval(() => {
                        remaining--;
                        const span = document.getElementById('exit-countdown');
                        if (span) span.textContent = remaining.toString();
                        if (remaining <= 0) {
                            clearInterval(timer);
                            try {
                                window.close();
                                setTimeout(() => location.href = 'about:blank', 100);
                            } catch (e) {
                                location.href = 'about:blank';
                            }
                        }
                    }, 1000);
                }
            }
        };
    }
    
    createExperimentIntroTrial() {
        return {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                <h1 style="color: white;">Welcome to the Psychology Experiment</h1>
                <div style="color: white; max-width: 800px; margin: 0 auto; font-size: 18px; line-height: 1.6; text-align: left;">
                    <p>Thank you for participating!</p>
                    <br>
                    <p>This study explores your <strong>problem-solving ability</strong> and <strong>some cognitive abilities</strong>.</p>
                    <br>
                    <p>You will complete <strong>three parts</strong>:</p>
                    <p>1. A short puzzle game</p>
                    <p>2. Several cognitive tests (e.g., digit span)</p>
                    <p>3. Some brief questionnaires</p>
                    <br>
                    <p>The experiment will take about <strong>45-60 minutes</strong>.</p>
                    <p>Please follow the instructions shown before each part.</p>
                </div>
            `,
            choices: ['Begin'],
            data: {
                trial_type: 'experiment_intro',
                participant_id: this.participantId
            }
        };
    }
    
    createPuzzleIntroTrial() {
        return {
            type: jsPsychBabaInstructions,
            title: 'Welcome to the Puzzle Game',
            instructions: '', // Use plugin default instructions
            button_text: 'Start Puzzle Game',
            show_controls: true,
            data: {
                trial_type: 'puzzle_intro',
                participant_id: this.participantId
            }
        };
    }
    
    createDigitSpanIntroTrial() {
        return {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                <div style="color: white; max-width: 700px; margin: 0 auto; font-size: 18px; line-height: 1.6; text-align: center;">
                    <h1 style="color: white; margin-bottom: 30px;">Digit Span Test</h1>
                    <p>Now we will test your <strong>working memory</strong> with a digit span task.</p>
                    <br>
                    <p>You will complete <strong>two parts</strong>:</p>
                    <p><strong>Part 1:</strong> Repeat numbers in the same order</p>
                    <p><strong>Part 2:</strong> Repeat numbers in reverse order</p>
                    <br>
                    <p>The difficulty will adjust automatically based on your performance.</p>
                </div>
            `,
            choices: ['Start Digit Span Test'],
            data: {
                trial_type: 'digit_span_intro',
                participant_id: this.participantId
            }
        };
    }
    
    createDigitSpanForwardTrial() {
        return {
            type: jsPsychDigitSpan,
            mode: 'forward',
            starting_length: 3,
            max_length: 9,
            max_total_trials: 14,
            digit_duration: 0.5,
            digit_interval: 1.0,
            participant_id: this.participantId,
            data: {
                trial_type: 'digit_span_forward',
                participant_id: this.participantId
            }
        };
    }
    
    createDigitSpanBackwardTrial() {
        return {
            type: jsPsychDigitSpan,
            mode: 'backward',
            starting_length: 2,
            max_length: 9,
            max_total_trials: 14,
            digit_duration: 0.5,
            digit_interval: 1.0,
            participant_id: this.participantId,
            data: {
                trial_type: 'digit_span_backward',
                participant_id: this.participantId
            }
        };
    }
    
    createMainGameLoop() {
        const gameLoop = {
            timeline: [
                // Chapter selection
                {
                    type: jsPsychChapterSelect,
                    selection_type: 'chapter',
                    chapters: this.chapters,
                    data: {
                        trial_type: 'chapter_selection',
                        participant_id: this.participantId
                    },
                    on_finish: (data) => {
                        // Save current selected chapter
                        this.currentChapter = data.chapter_key;
                    }
                },
                
                // Level selection and game loop
                {
                    timeline: [
                        // Level selection
                        {
                            type: jsPsychChapterSelect,
                            selection_type: 'level',
                            levels: () => {
                                return this.allLevels[this.currentChapter] || [];
                            },
                            current_chapter: () => {
                                const chapterData = this.chapters.find(c => c.key === this.currentChapter);
                                return chapterData ? chapterData.name : 'Unknown Chapter';
                            },
                            unlocked_levels: () => {
                                return this.unlockedLevels[this.currentChapter] || 1;
                            },
                            completed_levels: () => {
                                return this.completedLevels[this.currentChapter] || [];
                            },
                            data: {
                                trial_type: 'level_selection',
                                participant_id: this.participantId
                            },
                            on_finish: (data) => {
                                // Save current selected level index
                                this.currentLevelIndex = data.selected_level;
                            }
                        },
                        
                        // Game level and scoring condition timeline
                        {
                            timeline: [
                                // Game level
                                {
                                    type: jsPsychBabaGame,
                                    on_load: function() {
                                    },
                                    level_data: () => {
                                        try {
                                            const selectionDataArr = jsPsych.data.get().filterCustom(d => d.trial_type==='level_selection' && d.selection_type==='level').values();
                                            const selectionData = selectionDataArr.length > 0 ? selectionDataArr[selectionDataArr.length - 1] : null;
                                            if (!selectionData || !selectionData.level_data) {
                                                console.error('No level_data found in last level_selection trial');
                                                throw new Error('Level data not found');
                                            }
                                            const levelData = selectionData.level_data;
                                            const levelId = levelData.level_id;
                                            if (levelId) {
                                                return generateLevel(levelId, this.conditionType);
                                            }
                                            return levelData;
                                        } catch (error) {
                                            console.error('Error in level_data function:', error);
                                            throw error;
                                        }
                                    },
                                    level_name: () => {
                                        const selectionDataArr = jsPsych.data.get().filterCustom(d => d.trial_type==='level_selection' && d.selection_type==='level').values();
                                        const sel = selectionDataArr.length > 0 ? selectionDataArr[selectionDataArr.length - 1] : null;
                                        return sel ? sel.level_name : 'Unknown Level';
                                    },
                                    chapter_name: () => {
                                        return this.currentChapter;
                                    },
                                    time_limit: 480, // 8 minutes
                                    data: {
                                        trial_type: 'game_level',
                                        participant_id: this.participantId,
                                        condition_type: this.conditionType  // Record used experiment condition
                                    },
                                    on_finish: (data) => {
                                        this.markLevelCompleted(this.currentChapter, this.currentLevelIndex);
                                    }
                                },
                                
                                // Delay to allow completion message to disappear (shortened)
                                {
                                    type: jsPsychHtmlKeyboardResponse,
                                    stimulus: '',
                                    choices: 'NO_KEYS',
                                    trial_duration: 500, // 0.5 second delay
                                    data: {
                                        trial_type: 'completion_delay',
                                        participant_id: this.participantId
                                    }
                                },
                                
                                // Difficulty scoring
                                {
                                    type: jsPsychRatingScale,
                                    rating_type: 'difficulty',
                                    level_name: () => {
                                        try {
                                            const gameTrialData = jsPsych.data.getLastTimelineData().filter({trial_type: 'game_level'}).values()[0];
                                            return gameTrialData && gameTrialData.level_name ? gameTrialData.level_name : 'Unknown Level';
                                        } catch (error) {
                                            console.warn('Unable to retrieve level name:', error);
                                            return 'Unknown Level';
                                        }
                                    },
                                    data: {
                                        trial_type: 'difficulty_rating',
                                        participant_id: this.participantId
                                    }
                                },
                                
                                // Creativity scoring
                                {
                                    type: jsPsychRatingScale,
                                    rating_type: 'creativity',
                                    level_name: () => {
                                        try {
                                            const gameTrialData = jsPsych.data.getLastTimelineData().filter({trial_type: 'game_level'}).values()[0];
                                            return gameTrialData && gameTrialData.level_name ? gameTrialData.level_name : 'Unknown Level';
                                        } catch (error) {
                                            return 'Unknown Level';
                                        }
                                    },
                                    data: {
                                        trial_type: 'creativity_rating',
                                        participant_id: this.participantId
                                    }
                                },
                                
                                // Player feedback collection
                                {
                                    type: jsPsychFeedbackInput,
                                    level_name: () => {
                                        try {
                                            const gameTrialData = jsPsych.data.getLastTimelineData().filter({trial_type: 'game_level'}).values()[0];
                                            return gameTrialData && gameTrialData.level_name ? gameTrialData.level_name : 'Unknown Level';
                                        } catch (error) {
                                            console.warn('Unable to retrieve level name:', error);
                                            return 'Unknown Level';
                                        }
                                    },
                                    prompt: 'If a player is similar in age and experience to you, what advice would you give them based on your game experience?',
                                    placeholder: 'Please enter your suggestions or share your game experience here...',
                                    required: false,
                                    data: {
                                        trial_type: 'player_feedback',
                                        participant_id: this.participantId
                                    }
                                }
                            ],
                            conditional_function: () => {
                                const lastTrialData = jsPsych.data.getLastTrialData().values()[0];
                                return lastTrialData.selection_type === 'level';
                            }
                        }
                    ],
                    loop_function: () => {
                        // Check if there are remaining levels in the current chapter
                        return this.hasRemainingLevelsInChapter(this.currentChapter);
                    },
                    conditional_function: () => {
                        const lastTrialData = jsPsych.data.getLastTrialData().values()[0];
                        return lastTrialData.selection_type === 'chapter' || lastTrialData.selection_type === 'back_to_chapters';
                    }
                }
            ],
            loop_function: () => {
                // Check if there are other chapters to complete
                return this.hasRemainingLevels();
            }
        };
        
        return gameLoop;
    }
    
    createCompletionTrial() {
        return {
            type: jsPsychRatingScale,
            rating_type: 'overall_performance',
            question: 'How would you rate your overall performance in the puzzle game?',
            data: {
                trial_type: 'rating-scale',
                participant_id: this.participantId
            }
        };
    }
    
    markLevelCompleted(chapterKey, levelIndex) {
        
        if (!this.completedLevels[chapterKey].includes(levelIndex)) {
            this.completedLevels[chapterKey].push(levelIndex);
            
            // Unlock next level
            if (levelIndex + 1 < this.allLevels[chapterKey].length) {
                const newUnlockedLevels = Math.max(
                    this.unlockedLevels[chapterKey], 
                    levelIndex + 2
                );
                this.unlockedLevels[chapterKey] = newUnlockedLevels;
            }
            
            // If all levels in tutorial are completed, unlock journey
            if (chapterKey === 'tutorial' && 
                this.completedLevels[chapterKey].length >= this.allLevels[chapterKey].length) {
                this.unlockedLevels['journey'] = 1;

                // Unlock journey chapter's locked marker
                const journeyChapter = this.chapters.find(c => c.key === 'journey');
                if (journeyChapter) journeyChapter.locked = false;
            }
            
        } 
    }
    
    hasRemainingLevels() {
        // Check if there are remaining levels to complete
        for (const chapterKey of Object.keys(this.allLevels)) {
            const totalLevels = this.allLevels[chapterKey].length;
            const completedCount = this.completedLevels[chapterKey].length;
            
            if (completedCount < totalLevels && this.unlockedLevels[chapterKey] > 0) {
                return true;
            }
        }
        return false;
    }
    
    hasRemainingLevelsInChapter(chapterKey) {
        const totalLevels = this.allLevels[chapterKey].length;
        const completedCount = this.completedLevels[chapterKey].length;
        
        return completedCount < totalLevels && this.unlockedLevels[chapterKey] > 0;
    }
    
    saveExperimentData() {
        // Collect all experiment data
        const allData = jsPsych.data.get();
        
        // 判断实验是否正常完成：只要问卷 trial 至少出现一次即可认为完成
        const questionnaireTrialCount = allData.filterCustom(d => ('questionId' in d) || ('question_id' in d)).count();
        const isNormalCompletion = questionnaireTrialCount > 0;
        
        console.log('Experiment completion check:', {
            questionnaire_trial_count: questionnaireTrialCount,
            is_normal_completion: isNormalCompletion,
            total_trials: allData.count()
        });
        
        // If not normal completion (e.g., ESC pressed, fullscreen exit, or incomplete questionnaire), don't provide download
        if (!isNormalCompletion) {
            console.log('Experiment was not completed normally (questionnaire not finished), skipping data download');
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: Verdana, Arial, sans-serif; background-color: #7d7d7d; color: white; min-height: 100vh;">
                    <h1>Experiment Incomplete</h1>
                    <h2>Thank you for your participation!</h2>
                    <p>Your session was not completed. Please complete the final questionnaire to save your data.</p>
                    <p>If you'd like to participate again, please refresh the page.</p>
                    <button onclick="window.close()" style="
                        background-color: #4caf50; 
                        color: white; 
                        border: none; 
                        padding: 12px 24px; 
                        font-size: 16px; 
                        border-radius: 8px; 
                        cursor: pointer;
                        margin-top: 20px;
                    ">Close Window</button>
                </div>
            `;
            return;
        }
        
        // Get device information
        const deviceInfo = {
            browser: navigator.userAgent,
            os: navigator.platform,
            screen_resolution: [window.screen.width, window.screen.height],
            window_size: [window.innerWidth, window.innerHeight]
        };
        
        // Correctly get each task data - Use more specific filtering to avoid duplicates
        const babaGameData = allData.filter({trial_type: 'baba-game'}).values();
        
        // Digit span data - Extract from plugin return data
        const digitSpanTrials = allData.filter(data => data.trial_type === 'digit-span').values();
        const digitSpanData = {
            forward: digitSpanTrials.filter(data => data.mode === 'forward'),
            backward: digitSpanTrials.filter(data => data.mode === 'backward')
        };
        
        // DSST data - Extract from plugin return data
        const dsstData = allData.filter(data => data.trial_type === 'dsst').values();
        
        // Other cognitive task data
        const verbalFluencyData = allData.filter(data => data.trial_type === 'verbal-fluency').values();
        const autData = allData.filter(data => data.trial_type === 'aut').values();
        
        // Questionnaire data - Only include true questionnaire data
        const questionnaireData = allData.filterCustom(d => ('questionId' in d) || ('question_id' in d)).values();
        
        // Remove duplicates by trial_index and ensure only task-specific data
        const removeDuplicates = (dataArray, taskType) => {
            const seen = new Set();
            return dataArray.filter(item => {
                // Only include items that match the specific task type
                if (item.trial_type !== taskType) {
                    return false;
                }
                
                // Remove duplicates by trial_index
                if (item.trial_index !== undefined) {
                    if (seen.has(item.trial_index)) {
                        return false;
                    }
                    seen.add(item.trial_index);
                }
                return true;
            });
        };
        
        // Apply deduplication to all data arrays with task-specific filtering
        const deduplicatedBabaGameData = removeDuplicates(babaGameData, 'baba-game');
        const deduplicatedDigitSpanData = {
            forward: removeDuplicates(digitSpanData.forward, 'digit-span'),
            backward: removeDuplicates(digitSpanData.backward, 'digit-span')
        };
        const deduplicatedDsstData = removeDuplicates(dsstData, 'dsst');
        const deduplicatedVerbalFluencyData = removeDuplicates(verbalFluencyData, 'verbal-fluency');
        const deduplicatedAutData = removeDuplicates(autData, 'aut');
        const deduplicatedQuestionnaireData = questionnaireData; // 全部为问卷数据
        
        // Collect player feedback data
        const playerFeedbackData = allData.filter({trial_type: 'player_feedback'}).values();
        
        // Determine task completion status
        const tasksCompleted = [];
        if (deduplicatedBabaGameData.length > 0) tasksCompleted.push('baba_game');
        if (deduplicatedDigitSpanData.forward.length > 0) tasksCompleted.push('digit_span_forward');
        if (deduplicatedDigitSpanData.backward.length > 0) tasksCompleted.push('digit_span_backward');
        if (deduplicatedDsstData.length > 0) tasksCompleted.push('dsst');
        if (deduplicatedVerbalFluencyData.length > 0) tasksCompleted.push('verbal_fluency');
        if (deduplicatedAutData.length > 0) tasksCompleted.push('aut');
        if (deduplicatedQuestionnaireData.length > 0) tasksCompleted.push('questionnaire');
        
        // Determine completion status
        // Only consider fully completed if questionnaire is finished
        let completionStatus = 'completed';
        if (!(deduplicatedQuestionnaireData.length > 0)) {
            completionStatus = tasksCompleted.length > 3 ? 'partial' : 'abandoned';
        }
        
        // Record experiment start and end time
        const startTime = allData.values()[0] ? new Date(allData.values()[0].time_elapsed).toISOString() : new Date().toISOString();
        const endTime = new Date().toISOString();
        const totalDuration = allData.values()[allData.count() - 1] ? 
            allData.values()[allData.count() - 1].time_elapsed / 1000 : 0;
        
        // Create experiment report in accordance with data_structure.md format
        const experimentSummary = {
            participant_id: this.participantId,
            session_id: `session_${Date.now()}`,
            experiment_version: '1.0.0',
            start_time: startTime,
            end_time: endTime,
            total_duration_sec: totalDuration,
            completion_status: completionStatus,
            device_info: deviceInfo,
            
            // Experiment condition information
            experimental_condition: this.conditionType,
            
            // Completed tasks list
            tasks_completed: tasksCompleted,
            
            // Each task detailed data - Only include true task data (deduplicated)
            baba_game_data: deduplicatedBabaGameData,
            digit_span_data: deduplicatedDigitSpanData,
            dsst_data: deduplicatedDsstData,
            verbal_fluency_data: deduplicatedVerbalFluencyData,
            aut_data: deduplicatedAutData,
            questionnaire_data: deduplicatedQuestionnaireData,
            
            // Game progress data
            completed_levels: this.completedLevels,
            unlocked_levels: this.unlockedLevels,
            
            // Player feedback data
            player_feedback_data: playerFeedbackData
        };
        
        // Check if running on Pavlovia
        const isPavlovia = typeof Pavlovia !== 'undefined';
        
        if (!isPavlovia) {
            // Save to local storage only if not on Pavlovia
            localStorage.setItem(`baba_experiment_${this.participantId}`, JSON.stringify(experimentSummary));
            
            // Try to download data as JSON file only if not on Pavlovia
            try {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(experimentSummary, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", `experiment_data_${this.participantId}.json`);
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            } catch (e) {
                console.error("Failed to download data file:", e);
            }
        }
        
        // Display thank you information only when not on Pavlovia (to allow pavlovia.finish to run)
        if (!isPavlovia) {
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; font-family: Verdana, Arial, sans-serif; background-color: #7d7d7d; color: white; min-height: 100vh;">
                    <h1>Experiment completed!</h1>
                    <h2>Thank you for participating!</h2>
                    <p>Your data saved. Participant ID: ${this.participantId}</p>
                    <p>Thank you for your participation. The data from this experiment is valuable to our research.</p>
                    <button onclick="window.close()" style="
                        background-color: #4caf50; 
                        color: white; 
                        border: none; 
                        padding: 12px 24px; 
                        font-size: 16px; 
                        border-radius: 8px; 
                        cursor: pointer; 
                        margin-top: 20px;
                    ">Exit</button>
                </div>
            `;
        }
    }
    
    createDSSTIntroTrial() {
        return {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                <h1 style="color:white;">Digit–Symbol Substitution Task (DSST)</h1>
                <div style="color:white; max-width:800px; margin:0 auto; font-size:18px; line-height:1.6; text-align:left;">
                    <p>You have completed the digit span test. Now you will do the digit–symbol substitution task (DSST).</p>
                    <p>The DSST measures <strong>processing speed</strong> and <strong>associative learning</strong>.</p>
                    <p>You will see a table that pairs digits (1–9) with unique symbols.</p>
                    <p>Your task is to press the correct digit key that matches each symbol as quickly and accurately as possible.</p>
                    <p>You will have a short practice first, followed by a <strong>90-second</strong> timed test.</p>
                </div>
            `,
            choices: ['Start DSST'],
            data: {
                trial_type: 'dsst_intro',
                participant_id: this.participantId
            }
        };
    }
    
    createDSSTTaskTrial() {
        return {
            type: jsPsychDSST,
            practice_count: 3,
            test_count: 100,
            time_limit: 90,
            participant_id: this.participantId,
            data: {
                trial_type: 'dsst_task',
                participant_id: this.participantId
            }
        };
    }
    
    // ---------- AUT ----------
    createAUTTrial() {
        return {
            type: jsPsychAUT,
            objects: ['Brick', 'Bedsheet'],
            time_limit: 120,
            participant_id: this.participantId,
            data: {
                trial_type: 'aut_task',
                participant_id: this.participantId
            }
        };
    }
    
    // ---------- Verbal Fluency ----------
    createVerbalFluencyTrial() {
        return {
            type: jsPsychVerbalFluency,
            practice_category: 'Tools',
            test_category: 'Animals',
            time_limit: 60,
            participant_id: this.participantId,
            data: {
                trial_type: 'verbal_fluency',
                participant_id: this.participantId
            }
        };
    }

    // ---------- Questionnaire ----------
    createQuestionnaireTrial() {
        // Using the new questionnaire format with one question per page
        const timeline = [];
        
        if (window.embeddedQuestionnaire && Array.isArray(window.embeddedQuestionnaire)) {
            // Group questions by source
            const questionGroups = groupQuestionsBySource(window.embeddedQuestionnaire);
            
            // Add each group of questions to timeline
            const creativityTrials = createQuestionTrials(
                questionGroups.creativity, 
                'creativity', 
                this.participantId
            );
            
            const aarcTrials = createQuestionTrials(
                questionGroups.aarc, 
                'aarc', 
                this.participantId,
                questionGroups.creativity.length
            );
            
            const demographicsTrials = createQuestionTrials(
                questionGroups.demographics, 
                'demographics', 
                this.participantId,
                questionGroups.creativity.length + questionGroups.aarc.length
            );
            
            // Add all trials to the timeline
            timeline.push(...creativityTrials);
            timeline.push(...aarcTrials);
            timeline.push(...demographicsTrials);
        } else {
            // Error handling if no questionnaire data found
            timeline.push({
                type: jsPsychHtmlButtonResponse,
                stimulus: `<h2 style='color:red;'>Error: Questionnaire data not found</h2>
                          <p style='color:white;'>The questionnaire could not be loaded. Please check that questionnaire-data.js is properly loaded.</p>`,
                choices: ['Continue'],
                data: { trial_type: 'questionnaire_error', participant_id: this.participantId }
            });
        }
        
        return {
            timeline: timeline,
            on_timeline_finish: () => {
                // All cognitive tasks completed, save data
                this.saveExperimentData();
            }
        };
    }

    // New: Transition page after forward sequence ends to reverse sequence
    createDigitSpanTransitionTrial() {
        return {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                <div style="color: white; max-width: 700px; margin: 0 auto; font-size: 18px; line-height: 1.8; text-align: center;">
                    <h2 style="color: white; margin-bottom: 20px;">Part 2: Backward Digit Span</h2>
                    <p>You have completed the forward digit span.</p>
                    <p>Next, you will hear digit sequences again, but this time you need to enter them in <strong>reverse order</strong>.</p>
                    <p>Click Continue when you are ready.</p>
                </div>
            `,
            choices: ['Continue'],
            data: { trial_type: 'digit_span_transition', participant_id: this.participantId }
        };
    }

    // New: Preload trial —— automatically scan the subsequent timeline and preload all images/audio
    createPreloadTrial() {
        // stimulus manual resource list (if new files are added, please add them here)
        const images = [
            // Object images actually referenced
            'images/pumpkin.png','images/sun.png','images/cloud.png','images/dice.png', // tutorial objects
            'images/pool.png','images/balloon.png',                                  // journey_environment
            'images/bomb.png',                                                      // journey_understandproperty
            'images/chain.png','images/anchor.png','images/fan.png',                 // journey_switchidentity
            'images/door.png','images/key.png','images/tree.png','images/rose.png', // journey_combination

            // Text images referenced by BabaGamePlugin baseImagePaths
            'text_images/you.png','text_images/is.png','text_images/win.png','text_images/stop.png','text_images/if.png',
            'text_images/push.png','text_images/defeat.png','text_images/red.png','text_images/destruct.png','text_images/impact.png','text_images/shut.png','text_images/open.png',
            'text_images/pumpkin.png','text_images/cloud.png','text_images/dice.png','text_images/sun.png','text_images/bomb.png','text_images/chain.png','text_images/anchor.png','text_images/fan.png','text_images/door.png','text_images/key.png','text_images/tree.png','text_images/rose.png','text_images/candle.png','text_images/pool.png','text_images/balloon.png','text_images/feeling.png',

            // red variants for RED property levels
            'images_red/pumpkin.png','images_red/sun.png','images_red/cloud.png','images_red/dice.png','images_red/pool.png','images_red/balloon.png','images_red/bomb.png','images_red/chain.png','images_red/anchor.png','images_red/fan.png','images_red/door.png','images_red/key.png','images_red/tree.png','images_red/rose.png',
        ];

        const audio = [
            'audio/digit_0.wav','audio/digit_1.wav','audio/digit_2.wav','audio/digit_3.wav','audio/digit_4.wav','audio/digit_5.wav','audio/digit_6.wav','audio/digit_7.wav','audio/digit_8.wav','audio/digit_9.wav'
        ];

        return {
            type: jsPsychPreload,
            auto_preload: true,
            show_progress_bar: true,
            message: 'Loading resources, please wait…',
            images: images,
            audio: audio,
            data: { trial_type: 'preload', participant_id: this.participantId }
        };
    }

    // New: 2 seconds countdown Trial
    createCountdownTrial() {
        return {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `<div style="color:white;font-size:32px;text-align:center;">
                            Loading completed<br>The experiment will start in <span id="countdown">2</span> seconds…
                        </div>`,
            choices: "NO_KEYS",
            trial_duration: 2000,
            on_start: function(){
                let t = 2;
                const id = setInterval(() => {
                    t -= 1;
                    const el = document.getElementById('countdown');
                    if (el) el.textContent = t.toString();
                    if (t <= 0) clearInterval(id);
                }, 1000);
            },
            data: { trial_type: 'countdown', participant_id: this.participantId }
        };
    }
}

// Start experiment when page loads
document.addEventListener('DOMContentLoaded', function() {
    
    try {
        // Check if custom plugins are available
        if (typeof jsPsychBabaGame === 'undefined') {
            console.warn('jsPsychBabaGame plugin not found');
        }
        if (typeof jsPsychBabaInstructions === 'undefined') {
            console.warn('jsPsychBabaInstructions plugin not found');
        }
        
        // Check if required functions exist
        if (typeof getAllLevels === 'undefined') {
            throw new Error('getAllLevels function not defined, please check level-data.js file');
        }
        
        if (typeof getChapters === 'undefined') {
            throw new Error('getChapters function not defined, please check level-data.js file');
        }
        
        if (typeof jsPsychBabaInstructions === 'undefined') {
            throw new Error('jsPsychBabaInstructions plugin not defined');
        }
        
        // Initialize experiment controller
        const experimentController = new ExperimentController();
        window.experimentController = experimentController; // Save to global variable
        
        // Create and run experiment
        const timeline = experimentController.createTimeline();
        
        // Add Pavlovia support if available
        if (typeof Pavlovia !== 'undefined') {
            const pavlovia = new Pavlovia();
            timeline.unshift(pavlovia.init());
            timeline.push(pavlovia.finish());
        }
        
        // Run experiment
        jsPsych.run(timeline);
        window.experimentStarted = true
        
    } catch (error) {
        console.error('Experiment initialization failed:', error);
        
        // Display error information
        document.getElementById('jspsych-target').innerHTML = `
            <div style="padding: 50px; text-align: center; font-family: Arial, sans-serif;">
                <h1 style="color: red;">Failed to load experiment</h1>
                <p style="color: #666; margin: 20px 0;">Error details: ${error.message}</p>
                <p style="color: #666;">Please check the browser console for more information.</p>
                <button onclick="location.reload()" style="
                    background-color: #007cba; 
                    color: white; 
                    border: none; 
                    padding: 12px 24px; 
                    font-size: 16px; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    margin-top: 20px;
                ">Reload page</button>
            </div>
                 `;
     }
});

// Alternative start method (if DOM event listener fails)
setTimeout(function() {
    if (!window.experimentStarted) {
        
        // Display loading information
        const target = document.getElementById('jspsych-target');
        if (target && target.innerHTML.trim() === '') {
            target.innerHTML = `
                <div style="padding: 50px; text-align: center; font-family: Arial, sans-serif;">
                    <h2>Loading experiment...</h2>
                    <p>If this message persists, please check the browser console for error information.</p>
                </div>
            `;
        }
    }
}, 2000); 