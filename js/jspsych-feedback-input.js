/**
 * jsPsych Feedback Input Plugin
 * For collecting player feedback and advice for future players
 */

var jsPsychFeedbackInput = (function () {
    'use strict';

    const info = {
        name: 'feedback-input',
        version: '1.0.0',
        parameters: {
            level_name: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Level name',
                default: '',
                description: 'Name of the completed level'
            },
            prompt: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Prompt',
                default: 'Based on your game experience in last level, what advice would you give to future players similar to you in age and experience?',
                description: 'The prompt shown to the participant'
            },
            placeholder: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Placeholder',
                default: 'Enter your suggestions here...',
                description: 'Placeholder text for the input field'
            },
            rows: {
                type: jsPsychModule.ParameterType.INT,
                pretty_name: 'Rows',
                default: 5,
                description: 'Number of rows in the text area'
            },
            columns: {
                type: jsPsychModule.ParameterType.INT,
                pretty_name: 'Columns',
                default: 50,
                description: 'Number of columns in the text area'
            },
            required: {
                type: jsPsychModule.ParameterType.BOOL,
                pretty_name: 'Required',
                default: false,
                description: 'Whether input is required'
            },
            button_label: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Button label',
                default: 'Continue',
                description: 'Label for the submit button'
            }
        },
        data: {
            feedback: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'The feedback text provided by the participant'
            },
            level_name: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'Name of the level being rated'
            },
            response_time: {
                type: jsPsychModule.ParameterType.FLOAT,
                description: 'Time taken to provide feedback in seconds'
            }
        }
    };

    class FeedbackInputPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            const startTime = Date.now();
            
            // Create feedback input interface
            this.createFeedbackDisplay(display_element, trial);
            
            // Set up event listeners
            this.setupEventListeners(trial, display_element, startTime);
        }

        createFeedbackDisplay(display_element, trial) {
            const html = `
                <div class="feedback-container" style="max-width: 800px; margin: 0 auto; text-align: center;">
                    <h2 style="color: white; margin-bottom: 30px;">Player Feedback</h2>
                    
                    <div style="margin-bottom: 30px;">
                        <p style="color: white; font-size: 18px; text-align: left;">
                            ${trial.prompt}
                        </p>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <textarea id="feedback-input" 
                            rows="${trial.rows}" 
                            cols="${trial.columns}" 
                            placeholder="${trial.placeholder}"
                            style="width: 100%; padding: 12px; background-color: #333; color: white; border: 1px solid #666; border-radius: 5px; font-family: inherit; font-size: 16px;"
                            ${trial.required ? 'required' : ''}></textarea>
                    </div>
                    
                    <button id="feedback-submit-btn" class="baba-button">
                        ${trial.button_label}
                    </button>
                    
                    ${trial.required ? 
                        '<p style="color: #ccc; margin-top: 20px; font-size: 14px;">Please fill out the feedback before continuing.</p>' : 
                        '<p style="color: #ccc; margin-top: 20px; font-size: 14px;">Feedback is optional, you can continue without providing feedback.</p>'}
                </div>
            `;
            
            display_element.innerHTML = html;
        }

        setupEventListeners(trial, display_element, startTime) {
            const feedbackInput = document.getElementById('feedback-input');
            const submitButton = document.getElementById('feedback-submit-btn');
            
            // If required, disable submit button by default
            if (trial.required) {
                submitButton.disabled = true;
            }
            
            // Check when input content changes
            feedbackInput.addEventListener('input', () => {
                if (trial.required) {
                    submitButton.disabled = feedbackInput.value.trim() === '';
                }
            });
            
            // Submit button click handler
            submitButton.addEventListener('click', () => {
                const feedbackText = feedbackInput.value;
                
                // Check if input is required
                if (trial.required && !feedbackText.trim()) {
                    alert('Please fill out the feedback before continuing');
                    return;
                }
                
                const endTime = Date.now();
                const data = {
                    feedback: feedbackText,
                    level_name: trial.level_name,
                    response_time: (endTime - startTime) / 1000
                };
                
                // Finish trial and submit data
                this.jsPsych.finishTrial(data);
            });

            // Auto focus on text area
            feedbackInput.focus();

            // Keyboard shortcut - Ctrl+Enter to submit
            feedbackInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    if (!submitButton.disabled) {
                        submitButton.click();
                    }
                }
            });
        }
    }

    return FeedbackInputPlugin;
})();

// Export plugin (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = jsPsychFeedbackInput;
} else {
    // Register plugin in browser environment
    if (typeof jsPsychModule !== 'undefined') {
        jsPsychModule.registerPlugin('feedback-input', jsPsychFeedbackInput);
    }
} 