// jspsych-screening-questionnaire.js
// Plugin to present screening questionnaire for Baba Is You experiment
var jsPsychScreeningQuestionnaire = (function(){
    'use strict';

    const info = {
        name: 'screening-questionnaire',
        version: '1.0.0',
        parameters: {
            participant_id: { type: 'string', default: '' }
        },
        data: {
            trial_type: 'screening_questionnaire'
        }
    };

    class ScreeningPlugin {
        constructor(jsPsych){ this.jsPsych = jsPsych; }

        static {
            this.info = info;
        }

        trial(display_element, trial){
            this.participant = trial.participant_id;
            console.log('Screening questionnaire trial started');
            this.showScreeningQuestion(display_element);
        }

        showScreeningQuestion(el){
            console.log('Showing screening question');
            el.innerHTML = `
                <div class='screening-container' style='width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:40px 20px;'>
                    <h2 style='color:white;margin-bottom:15px;font-size:28px;'>Screening Question</h2>
                    <h3 style='color:white;text-align:center;margin-bottom:25px;font-size:24px;line-height:1.4;max-width:900px;'>
                        Have you ever played any of the video games below? Select more than one choice, if necessary.
                    </h3>
                    <div id='screening-options' style='margin-top:15px;'></div>
                    <button id='screening-next' class='baba-button' style='margin-top:30px;font-size:20px;padding:12px 24px;' disabled>Continue</button>
                </div>`;
            console.log('Screening question HTML set');

            const optionsDiv = el.querySelector('#screening-options');
            const nextBtn = el.querySelector('#screening-next');
            let selectedGames = [];
            
            const games = [
                { text: "It Takes Two", value: "it_takes_two" },
                { text: "Tomb Raider", value: "tomb_raider" },
                { text: "Portal", value: "portal" },
                { text: "Plants vs. Zombies", value: "plants_vs_zombies" },
                { text: "Human Fall Flat", value: "human_fall_flat" },
                { text: "Baba Is You", value: "baba_is_you" },
                { text: "INSIDE", value: "inside" },
                { text: "Unheard", value: "unheard" },
                { text: "None of the above", value: "none_of_above" }
            ];

            games.forEach((game, i) => {
                const wrapper = document.createElement('div');
                wrapper.style.margin = '12px 0';
                wrapper.style.color = 'white';
                wrapper.innerHTML = `
                    <label style='cursor:pointer;font-size:20px;line-height:1.4;display:flex;align-items:center;'>
                        <input type='checkbox' name='game' id='game_${i}' value='${game.value}' style='margin-right:12px;transform:scale(1.3);'>
                        ${game.text}
                    </label>`;
                optionsDiv.appendChild(wrapper);
            });

            optionsDiv.addEventListener('change', (ev) => {
                if (ev.target && ev.target.name === 'game') {
                    if (ev.target.checked) {
                        if (ev.target.value === 'none_of_above') {
                            // if "None of the above" is selected, cancel all other options
                            selectedGames = ['none_of_above'];
                            games.forEach((game, i) => {
                                if (game.value !== 'none_of_above') {
                                    const checkbox = document.getElementById(`game_${i}`);
                                    if (checkbox) checkbox.checked = false;
                                }
                            });
                        } else {
                            // if other games are selected, cancel "None of the above" option
                            selectedGames = selectedGames.filter(game => game !== 'none_of_above');
                            const noneCheckbox = document.getElementById(`game_${games.length - 1}`);
                            if (noneCheckbox) noneCheckbox.checked = false;
                        selectedGames.push(ev.target.value);
                        }
                    } else {
                        selectedGames = selectedGames.filter(game => game !== ev.target.value);
                    }
                    nextBtn.disabled = selectedGames.length === 0;
                }
            });

            nextBtn.addEventListener('click', () => {
                const hasPlayedBabaIsYou = selectedGames.includes('baba_is_you');
                const hasPlayedNone = selectedGames.includes('none_of_above');
                
                if (hasPlayedBabaIsYou) {
                    this.showExclusionMessage();
                } else {
                    this.jsPsych.finishTrial({
                        participant_id: this.participant,
                        selected_games: selectedGames,
                        has_played_baba_is_you: false,
                        has_played_none: hasPlayedNone,
                        screening_passed: true
                    });
                }
            });
        }

        showExclusionMessage() {
            const exclusionOverlay = document.createElement('div');
            exclusionOverlay.id = 'exclusion-overlay';
            exclusionOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            `;
            
            const messageBox = document.createElement('div');
            messageBox.style.cssText = `
                background-color: white;
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                max-width: 600px;
                margin: 20px;
            `;
            
            const title = document.createElement('h2');
            title.textContent = 'Sorry, you do not meet the requirements for this experiment. Thank you for your attention!';
            title.style.cssText = `
                color: #d32f2f;
                margin-bottom: 25px;
                font-size: 28px;
                line-height: 1.4;
            `;
            
            const message = document.createElement('p');
            message.textContent = 'Since you have played the game "Baba Is You", we cannot invite you to participate in this experiment. Thank you for your understanding and cooperation!';
            message.style.cssText = `
                color: #333;
                font-size: 20px;
                margin-bottom: 30px;
                line-height: 1.6;
            `;
            
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close Page';
            closeButton.style.cssText = `
                background-color: #d32f2f;
                border: none;
                color: white;
                padding: 15px 30px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 20px;
                margin: 10px 2px;
                cursor: pointer;
                border-radius: 8px;
                transition: background-color 0.3s;
            `;
            
            closeButton.addEventListener('mouseover', () => {
                closeButton.style.backgroundColor = '#b71c1c';
            });
            
            closeButton.addEventListener('mouseout', () => {
                closeButton.style.backgroundColor = '#d32f2f';
            });
            
            messageBox.appendChild(title);
            messageBox.appendChild(message);
            messageBox.appendChild(closeButton);
            exclusionOverlay.appendChild(messageBox);
            document.body.appendChild(exclusionOverlay);
            
            closeButton.addEventListener('click', () => {
                try {
                    window.close();
                    setTimeout(() => {
                        window.location.href = 'about:blank';
                    }, 100);
                } catch (e) {
                    window.location.href = 'about:blank';
                }
            });
            
            this.jsPsych.finishTrial({
                participant_id: this.participant,
                selected_games: [],
                has_played_baba_is_you: true,
                screening_passed: false,
                excluded: true
            });
        }
    }

    return ScreeningPlugin;
})(); 