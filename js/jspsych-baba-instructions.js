/**
 * jsPsych Baba Instructions Plugin
 * display game instructions and tutorial
 */

var jsPsychBabaInstructions = (function () {
    'use strict';

    const info = {
        name: 'baba-instructions',
        version: '1.0.0',
        parameters: {
            instructions: {
                type: jsPsychModule.ParameterType.HTML_STRING,
                pretty_name: 'Instructions',
                default: '',
                description: 'The instructions to be displayed'
            },
            title: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Title',
                default: 'Game Instructions',
                description: 'Title for the instructions page'
            },
            button_text: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Button text',
                default: 'Start Game',
                description: 'Text for the continue button'
            },
            show_controls: {
                type: jsPsychModule.ParameterType.BOOL,
                pretty_name: 'Show controls',
                default: true,
                description: 'Whether to show the control instructions'
            }
        },
        data: {
            instruction_time: {
                type: jsPsychModule.ParameterType.FLOAT,
                description: 'Time spent reading instructions in seconds'
            }
        }
    };

    class BabaInstructionsPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            const startTime = Date.now();
            
            // create instructions page
            const html = `
                <div class="instructions-container">
                    <h1 class="instructions-title">${trial.title}</h1>
                    
                    <div class="instructions-content">
                        ${this.getDefaultInstructions()}
                        
                        ${trial.instructions ? `<div class="instructions-text">${trial.instructions}</div>` : ''}
                        
                        ${trial.show_controls ? this.getControlsSection() : ''}
                    </div>
                    
                    <button id="continue-btn" class="baba-button">${trial.button_text}</button>
                </div>
            `;
            
            display_element.innerHTML = html;
            
            // set continue button event
            document.getElementById('continue-btn').addEventListener('click', () => {
                const endTime = Date.now();
                const data = {
                    instruction_time: (endTime - startTime) / 1000
                };
                this.jsPsych.finishTrial(data);
            });
            
            // also allow key press to continue
            const keyHandler = (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    document.getElementById('continue-btn').click();
                    event.preventDefault();
                }
            };
            
            document.addEventListener('keydown', keyHandler);
            
            // cleanup function
            this.jsPsych.pluginAPI.setTimeout(() => {
                document.removeEventListener('keydown', keyHandler);
            }, 0);
        }

        getDefaultInstructions() {
            return `
                <div class="instructions-text">
                    <p>Complete levels by interacting with objects and text.</p>
                    
                    <h3>Game Instructions:</h3>
                    <ul>
                        <li>Two chapters, each with several levels</li>
                        <li>Use Arrow keys (UP DOWN LEFT RIGHT) to move objects</li>
                        <li>Complete current level to unlock next level/chapter</li>
                        <li>Each level has 8 minutes time limit</li>
                        <li>Time remaining shown in upper area</li>
                    </ul>
                    
                    <p><em>Good luck and enjoy the challenge!</em></p>
                </div>
            `;
        }

        getControlsSection() {
            return `
                <div class="instructions-controls">
                    <h3>Controls:</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
                        <div>
                            <strong>Movement:</strong><br>
                            ↑ ↓ ← → Arrow keys
                        </div>
                        <div>
                            <strong>Game Controls:</strong><br>
                            Z: Undo last move<br>
                            P: Pause<br>
                            R: Restart level
                        </div>
                    </div>
                </div>
            `;
        }
    }

    BabaInstructionsPlugin.info = info;

    return BabaInstructionsPlugin;

})(); 
