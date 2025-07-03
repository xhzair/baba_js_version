/**
 * jsPsych Baba is You Game Plugin
 * Core game plugin, handling interactions and rendering of Baba is You game
 */

var jsPsychBabaGame = (function () {
    'use strict';

    const info = {
        name: 'baba-game',
        version: '1.0.0',
        parameters: {
            level_data: {
                type: jsPsychModule.ParameterType.OBJECT,
                pretty_name: 'Level data',
                description: 'The level data object containing grid size and elements'
            },
            time_limit: {
                type: jsPsychModule.ParameterType.INT,
                pretty_name: 'Time limit',
                default: 480,
                description: 'Time limit for the level in seconds'
            },
            level_name: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Level name',
                default: '',
                description: 'Name of the current level'
            },
            chapter_name: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Chapter name',
                default: '',
                description: 'Name of the current chapter'
            }
        },
        data: {
            level_id: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'Identifier for the level played'
            },
            level_name: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'Name of the level played'
            },
            chapter_name: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'Name of the chapter'
            },
            success: {
                type: jsPsychModule.ParameterType.BOOL,
                description: 'Whether the level was completed successfully'
            },
            completion_reason: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'Reason for level completion (completed, timeout, defeated)'
            },
            total_time: {
                type: jsPsychModule.ParameterType.FLOAT,
                description: 'Total time spent playing the level in seconds'
            },
            move_count: {
                type: jsPsychModule.ParameterType.INT,
                description: 'Number of moves made'
            },
            undo_count: {
                type: jsPsychModule.ParameterType.INT,
                description: 'Number of undo operations used'
            },
            pause_count: {
                type: jsPsychModule.ParameterType.INT,
                description: 'Number of times the game was paused'
            },
            remaining_time: {
                type: jsPsychModule.ParameterType.FLOAT,
                description: 'Time remaining when level ended'
            },
            operation_count: {
                type: jsPsychModule.ParameterType.INT,
                description: 'Total number of game operations performed'
            },
            average_time_between_moves_ms: {
                type: jsPsychModule.ParameterType.FLOAT,
                description: 'Average time between moves in milliseconds'
            },
            move_timestamps: {
                type: jsPsychModule.ParameterType.OBJECT,
                description: 'Array of move timestamps with detailed timing information'
            },
            operation_analyses: {
                type: jsPsychModule.ParameterType.OBJECT,
                description: 'Array of detailed operation analyses'
            },
            rule_operation_stats: {
                type: jsPsychModule.ParameterType.OBJECT,
                description: 'Statistics of rule operations during the game'
            },
            final_state: {
                type: jsPsychModule.ParameterType.OBJECT,
                description: 'Final state of the game including objects and rules'
            }
        }
    };

    class BabaGamePlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
            this.gameEngine = null;
            this.gridCells = [];
            this.gameCompleted = false;
            this.gameWon = false;
            this.startTime = null;
            this.endTime = null;
            this.moveCount = 0;
            this.undoCount = 0;
            this.pauseCount = 0;
            this.currentTrial = null;
            this.keyHandler = null;
            }
        


        trial(display_element, trial) {
            // save trial parameters
            this.currentTrial = trial;

            // disable page scrolling when game starts
            document.body.classList.add('baba-game-active');

            // initialize game engine
            this.gameEngine = new BabaGameEngine(trial.level_data, trial.time_limit);
            this.gameCompleted = false;
            this.gameWon = false;
            this.startTime = Date.now();
            this.moveCount = 0;
            this.undoCount = 0;
            this.pauseCount = 0;
            
            // create game interface
            this.createGameDisplay(display_element, trial);
            
            // set keyboard listeners
            this.setupKeyboardListeners();
            
            // start game loop
            this.gameLoop();
        }

        createGameDisplay(display_element, trial) {
            const html = `
                <div class="baba-game-container">
                    <div class="level-info">
                        <h2>${trial.chapter_name} - ${trial.level_name}</h2>
                    </div>
                    
                    <div class="game-ui">
                        <div class="game-info">
                            <div id="time-remaining">Remaining Time: <span id="time-value">8:00</span></div>
                        </div>
                        <div class="game-controls">
                            <div>Controls: Arrow keys to move</div>
                            <div>Z: Undo | P: Pause | R: Restart</div>
                        </div>
                    </div>
                    
                    <div id="game-grid-container">
                        <!-- game grid will be generated here -->
                    </div>
                    
                    <div id="game-status" style="color: white; font-size: 18px; margin-top: 20px;">
                        <!-- game status information -->
                    </div>
                </div>
                
                <div id="pause-overlay" class="pause-overlay" style="display: none;">
                    <div class="pause-message">
                        <h2>Game Paused</h2>
                        <p>Press P to resume</p>
                    </div>
                </div>
            `;
            
            display_element.innerHTML = html;
            
            // 创建游戏网格
            this.createGameGrid();
        }

        createGameGrid() {
            const container = document.getElementById('game-grid-container');
            const gridSize = this.gameEngine.gridSize;
            
            // calculate optimal cell size to fit screen
            const cellSize = this.calculateOptimalCellSize(gridSize);
            
            // create grid elements
            const gridElement = document.createElement('div');
            gridElement.className = 'game-grid';
            gridElement.style.gridTemplateColumns = `repeat(${gridSize[0]}, ${cellSize}px)`;
            gridElement.style.gridTemplateRows = `repeat(${gridSize[1]}, ${cellSize}px)`;
            
            // update CSS variables for other places
            document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
            
            // create all grid cells
            this.gridCells = [];
            for (let y = 0; y < gridSize[1]; y++) {
                this.gridCells[y] = [];
                for (let x = 0; x < gridSize[0]; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.dataset.x = x;
                    cell.dataset.y = y;
                    cell.style.width = `${cellSize}px`;
                    cell.style.height = `${cellSize}px`;
                    gridElement.appendChild(cell);
                    this.gridCells[y][x] = cell;
                }
            }
            
            container.appendChild(gridElement);
            this.updateDisplay();
        }
        
        calculateOptimalCellSize(gridSize) {
            // get available space
            const availableWidth = window.innerWidth - 40; // minus margin
            const availableHeight = window.innerHeight - 160; // minus UI elements height
            
            // calculate max cell size based on width and height
            const maxCellSizeByWidth = Math.floor(availableWidth / gridSize[0]);
            const maxCellSizeByHeight = Math.floor(availableHeight / gridSize[1]);
            
            // choose the smaller one, ensure the whole grid can be displayed
            const optimalSize = Math.min(maxCellSizeByWidth, maxCellSizeByHeight);
            
            // set min and max limits
            const minCellSize = 30; // min 30px, ensure readable
            const maxCellSize = 80; // max 80px, avoid too large
            return Math.max(minCellSize, Math.min(maxCellSize, optimalSize));
        }

        updateDisplay() {
            // clear all cells
            for (let y = 0; y < this.gameEngine.gridSize[1]; y++) {
                for (let x = 0; x < this.gameEngine.gridSize[0]; x++) {
                    this.gridCells[y][x].innerHTML = '';
                }
            }
            
            // render objects in the correct order
            // 1. first render all non-text objects (entity objects)
            const nonTextObjects = this.gameEngine.objects.filter(obj => !obj.isText);
            for (const obj of nonTextObjects) {
                this.renderObject(obj);
            }
            
            // 2. then render all text objects (ensure text is on top)
            const textObjects = this.gameEngine.objects.filter(obj => obj.isText);
            for (const obj of textObjects) {
                this.renderObject(obj);
            }
            
            // 3. finally render recently moved objects, ensure they are on top
            for (const obj of this.gameEngine.recentlyMovedObjects) {
                // first remove existing elements (avoid duplicates)
                const [x, y] = obj.position;
                if (y >= 0 && y < this.gridCells.length && 
                    x >= 0 && x < this.gridCells[y].length) {
                    const cell = this.gridCells[y][x];
                    // find and remove existing elements of this object
                    const existingElements = Array.from(cell.children);
                    for (const elem of existingElements) {
                        const objectType = obj.type.toLowerCase().replace('text_', '');
                        if (elem.classList.contains(`object-${objectType}`)) {
                            elem.remove();
                            break;
                        }
                    }
                    // re-render to top layer
                    this.renderObject(obj);
                }
            }
            
            // update time and move count
            this.updateUI();
        }

        renderObject(obj) {
            const [x, y] = obj.position;
            if (y >= 0 && y < this.gridCells.length && 
                x >= 0 && x < this.gridCells[y].length) {
                
                const cell = this.gridCells[y][x];
                const objectElement = document.createElement('div');
                objectElement.className = 'game-object';
                
                // add object type
                const objectType = obj.type.toLowerCase().replace('text_', '');
                objectElement.classList.add(`object-${objectType}`);
                
                // distinguish text objects and image objects
                if (obj.isText) {
                    // text object: use pre-generated text images
                    objectElement.classList.add('text-object');
                    objectElement.classList.add('text-image');
                    const textContent = obj.type.replace('TEXT_', '');
                    
                    // use pre-generated text images
                    const imagePath = `text_images/${textContent.toLowerCase()}.png`;
                    
                    objectElement.style.backgroundImage = `url('${imagePath}')`;
                    objectElement.style.backgroundSize = 'contain';
                    objectElement.style.backgroundRepeat = 'no-repeat';
                    objectElement.style.backgroundPosition = 'center';
                    objectElement.style.backgroundColor = 'transparent';
                    objectElement.textContent = ''; // hide text, only show image
                    
                    // add error handling, if image loading fails, show text
                    const img = new Image();
                    img.onload = () => {
                        // image loaded successfully, keep image displayed
                    };
                    img.onerror = () => {
                        // image loading failed, revert to text display
                        console.warn(`Text image loading failed: ${imagePath}`);
                        objectElement.style.backgroundImage = 'none';
                        objectElement.textContent = textContent;
                        objectElement.style.color = 'white';
                        objectElement.style.fontSize = '12px';
                        objectElement.style.fontWeight = 'bold';
                    };
                    img.src = imagePath;
                } else {
                    // entity object: use image to display
                    objectElement.classList.add('image-object');
                    // do not add text content, let image display through CSS background
                }
                
                // add property effects
                if (obj.isYou) objectElement.classList.add('property-you');
                if (obj.isWin) objectElement.classList.add('property-win');
                if (obj.isStop) objectElement.classList.add('property-stop');
                if (obj.isPush) objectElement.classList.add('property-push');
                if (obj.isDefeat) objectElement.classList.add('property-defeat');
                if (obj.isRed) objectElement.classList.add('property-red');
                
                // add identifier for recently moved objects
                if (this.gameEngine.recentlyMovedObjects.has(obj)) {
                    objectElement.classList.add('recently-moved');
                }
                
                cell.appendChild(objectElement);
            }
        }
        
        // removed applyTextColor function, because now using pre-generated colored text images
        updateUI() {
            // update time
            const timeRemaining = this.gameEngine.getRemainingTime();
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = Math.floor(timeRemaining % 60);
            const timeElement = document.getElementById('time-value');
            if (timeElement) {
                timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // move count is not displayed for now, because there is no corresponding element in the HTML template
            // if you need to display move count, you can add the corresponding element in the HTML template
            
            // check if time is up
            if (timeRemaining <= 0 && !this.gameCompleted) {
                this.endGame(false, 'timeout');
            }
        }

        setupKeyboardListeners() {
            this.keyHandler = (event) => {
                if (this.gameCompleted) return;
                
                const key = event.key;
                let direction = null;
                
                // arrow keys move
                switch (key) {
                    case 'ArrowUp':
                        direction = [0, -1];
                        event.preventDefault();
                        break;
                    case 'ArrowDown':
                        direction = [0, 1];
                        event.preventDefault();
                        break;
                    case 'ArrowLeft':
                        direction = [-1, 0];
                        event.preventDefault();
                        break;
                    case 'ArrowRight':
                        direction = [1, 0];
                        event.preventDefault();
                        break;
                    case 'z':
                    case 'Z':
                        this.gameEngine.undo();
                        this.undoCount++;
                        this.updateDisplay();
                        event.preventDefault();
                        break;
                    case 'p':
                    case 'P':
                        this.togglePause();
                        event.preventDefault();
                        break;
                    case 'r':
                    case 'R':
                        this.restartLevel();
                        event.preventDefault();
                        break;
                }
                
                if (direction && !this.gameEngine.paused) {
                    const result = this.gameEngine.processMove(direction);
                    if (result) {
                        this.moveCount++;
                        
                        if (result === 'win') {
                            this.endGame(true, 'completed');
                        } else if (this.gameEngine.dead) {
                            this.endGame(false, 'defeated');
                        }
                        
                        this.updateDisplay();
                    }
                }
            };
            
            document.addEventListener('keydown', this.keyHandler);
        }

        togglePause() {
            if (this.gameEngine.paused) {
                this.gameEngine.resume();
                document.getElementById('pause-overlay').style.display = 'none';
            } else {
                this.gameEngine.pause();
                this.pauseCount++;
                document.getElementById('pause-overlay').style.display = 'flex';
            }
        }

        restartLevel() {
            this.gameEngine.restart();
            this.moveCount = 0;
            this.undoCount = 0;
            this.updateDisplay();
            
            // ensure scrolling is disabled when restarting
            if (!document.body.classList.contains('baba-game-active')) {
                document.body.classList.add('baba-game-active');
            }
        }

        gameLoop() {
            if (!this.gameCompleted) {
                this.updateUI();
                
                // check game state
                if (this.gameEngine.dead) {
                    this.showDefeatMessage();
                } else if (this.gameEngine.checkWinCondition()) {
                    this.endGame(true, 'completed');
                } else {
                    requestAnimationFrame(() => this.gameLoop());
                }
            }
        }

        showDefeatMessage() {
            // create defeat message overlay
            if (!document.getElementById('defeat-overlay')) {
                const overlay = document.createElement('div');
                overlay.id = 'defeat-overlay';
                overlay.style.cssText = `
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
                `;
                
                const title = document.createElement('h2');
                title.textContent = 'You Failed!';
                title.style.cssText = `
                    color: #f44336;
                    margin-bottom: 20px;
                    font-size: 24px;
                `;
                
                const instruction = document.createElement('p');
                instruction.textContent = 'Press Z to undo or R to restart the level';
                instruction.style.cssText = `
                    color: #666;
                    font-size: 16px;
                    margin-bottom: 20px;
                `;
                
                const keyHint = document.createElement('div');
                keyHint.innerHTML = `
                    <span style="background: #333; color: white; padding: 5px 10px; border-radius: 5px; margin: 0 5px;">Z</span>
                    Undo &nbsp;&nbsp;&nbsp;
                    <span style="background: #333; color: white; padding: 5px 10px; border-radius: 5px; margin: 0 5px;">R</span>
                    Restart
                `;
                keyHint.style.cssText = `
                    color: #333;
                    font-size: 14px;
                `;
                
                messageBox.appendChild(title);
                messageBox.appendChild(instruction);
                messageBox.appendChild(keyHint);
                overlay.appendChild(messageBox);
                document.body.appendChild(overlay);
                
                // add key event listener
                this.defeatKeyHandler = (event) => {
                    if (event.key === 'z' || event.key === 'Z') {
                        this.hideDefeatMessage();
                        this.gameEngine.undo();
                        this.gameEngine.dead = false;
                        requestAnimationFrame(() => this.gameLoop());
                    } else if (event.key === 'r' || event.key === 'R') {
                        this.hideDefeatMessage();
                        this.gameEngine.restart();
                        this.gameEngine.dead = false;
                        requestAnimationFrame(() => this.gameLoop());
                    }
                };
                
                document.addEventListener('keydown', this.defeatKeyHandler);
            }
        }

        hideDefeatMessage() {
            const overlay = document.getElementById('defeat-overlay');
            if (overlay) {
                overlay.remove();
                if (this.defeatKeyHandler) {
                    document.removeEventListener('keydown', this.defeatKeyHandler);
                    this.defeatKeyHandler = null;
                }
            }
        }

        endGame(won, reason) {
            this.gameCompleted = true;
            this.gameWon = won;
            this.endTime = Date.now();
            
            // restore page scrolling when game ends
            document.body.classList.remove('baba-game-active');
            
            // clean up event listeners
            document.removeEventListener('keydown', this.keyHandler);
            
            // collect detailed data from game engine
            const detailedData = this.gameEngine.getDetailedData();
            
            // Calculate average time between moves
            let averageTimeBetweenMoves = 0;
            if (detailedData.move_timestamps.length > 1) {
                const moveIntervals = detailedData.move_timestamps
                    .filter(timestamp => !timestamp.is_meta_operation)
                    .map(timestamp => timestamp.time_since_last_move_ms);
                if (moveIntervals.length > 0) {
                    averageTimeBetweenMoves = moveIntervals.reduce((sum, interval) => sum + interval, 0) / moveIntervals.length;
                }
            }
            
            // collect data
            const trial_data = {
                level_id: this.currentTrial?.level_data?.level_id || 'unknown',
                level_name: this.currentTrial?.level_name || 'Unknown Level',
                chapter_name: this.currentTrial?.chapter_name || 'Unknown Chapter',
                success: won,
                completion_reason: reason,
                total_time: (this.endTime - this.startTime) / 1000,
                move_count: this.moveCount,
                undo_count: this.undoCount,
                pause_count: this.pauseCount,
                remaining_time: this.gameEngine.getRemainingTime(),
                operation_count: this.gameEngine.operationCount || 0,
                average_time_between_moves_ms: averageTimeBetweenMoves,
                // Detailed process data
                move_timestamps: detailedData.move_timestamps,
                operation_analyses: detailedData.operation_analyses,
                rule_operation_stats: detailedData.rule_operation_stats,
                final_state: detailedData.final_state
            };
            
            // show completion message
            setTimeout(() => {
                this.showCompletionMessage(won, reason);
                
                // extend victory message display time by 0.5s
                setTimeout(() => {
                    this.jsPsych.finishTrial(trial_data);
                }, 1500); // extend by 0.5s
            }, 200);
        }

        showCompletionMessage(won, reason) {
            // immediately hide game interface to avoid flickering
            const gameContainer = document.querySelector('.baba-game-container');
            if (gameContainer) {
                gameContainer.style.opacity = '0';
            }
            
            // create an overlay to display completion message
            const overlay = document.createElement('div');
            overlay.id = 'completion-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                animation: fadeIn 0.3s ease-in-out;
            `;
            
            const messageBox = document.createElement('div');
            messageBox.style.cssText = `
                background-color: #333;
                color: white;
                padding: 40px 60px;
                border-radius: 16px;
                text-align: center;
                font-size: 32px;
                font-weight: bold;
                border: 3px solid ${won ? '#4caf50' : '#f44336'};
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                animation: slideIn 0.4s ease-out;
            `;
            
            if (won) {
                messageBox.innerHTML = `
                    <div style="color: #4caf50; font-size: 48px; margin-bottom: 20px;">🎉</div>
                    <div style="color: #4caf50;">Level Completed!</div>
                    <div style="font-size: 18px; color: #ccc; margin-top: 10px;">Great job! Proceeding to rating...</div>
                `;
            } else {
                let message = '';
                let emoji = '';
                switch (reason) {
                    case 'timeout':
                        message = 'Time\'s Up!';
                        emoji = '🕒';
                        break;
                    case 'defeated':
                        message = 'Game Over!';
                        emoji = '💥';
                        break;
                    default:
                        message = 'Level Failed!';
                        emoji = '💥';
                }
                messageBox.innerHTML = `
                    <div style="color: #f44336; font-size: 48px; margin-bottom: 20px;">${emoji}</div>
                    <div style="color: #f44336;">${message}</div>
                    <div style="font-size: 18px; color: #ccc; margin-top: 10px;">Proceeding to rating...</div>
                `;
            }
            
            overlay.appendChild(messageBox);
            document.body.appendChild(overlay);
            
            // add style animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                @keyframes slideIn {
                    0% { transform: translateY(-50px) scale(0.8); opacity: 0; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            // automatically clean up (after entering rating, to avoid flickering)
            setTimeout(() => {
                if (overlay && overlay.parentNode) {
                    overlay.remove();
                }
                if (style && style.parentNode) {
                    style.remove();
                }
            }, 1600); // clean up after transition, to avoid flickering
        }

    }

    BabaGamePlugin.info = info;

    return BabaGamePlugin;

})(); 
