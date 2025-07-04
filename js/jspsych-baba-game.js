/**
 * jsPsych Baba is You Game Plugin
 * Core game plugin, handling interactions and rendering of Baba is You game
 */

var jsPsychBabaGame = (function (jsPsychModule) {
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
            this.imageCache = {};
            this.imagesLoaded = false;
        }
        
        static {
            this.info = info;
        }
        
        async preloadImages() {
            // base images - all levels need these
            const baseImagePaths = [
                // text images
                'text_images/you.png', 'text_images/is.png', 'text_images/win.png', 'text_images/stop.png', 'text_images/if.png',
                'text_images/push.png', 'text_images/defeat.png', 'text_images/red.png', 'text_images/destruct.png',
                'text_images/impact.png', 'text_images/shut.png', 'text_images/open.png',
                'text_images/pumpkin.png', 'text_images/cloud.png', 'text_images/dice.png', 'text_images/sun.png',
                'text_images/bomb.png', 'text_images/chain.png', 'text_images/anchor.png', 'text_images/fan.png',
                'text_images/door.png', 'text_images/key.png', 'text_images/tree.png', 'text_images/rose.png',
                'text_images/candle.png', 'text_images/pool.png', 'text_images/balloon.png', 'text_images/feeling.png',
                
                // core object images
                'images/pumpkin.png', 'images/sun.png', 'images/cloud.png', 'images/dice.png'
            ];
            
            // determine additional images needed for current level
            const additionalImagePaths = this.getRequiredImagesForLevel();
            
            const allImagePaths = [...baseImagePaths, ...additionalImagePaths];
            
            const loadPromises = allImagePaths.map(path => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        this.imageCache[path] = img;
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn(`Failed to load image: ${path}`);
                        resolve(); // continue loading other images
                    };
                    img.src = path;
                });
            });
            
            await Promise.all(loadPromises);
            this.imagesLoaded = true;
        }
        
        getRequiredImagesForLevel() {
            if (!this.currentTrial?.level_data?.level_id) {
                return [];
            }
            
            const levelId = this.currentTrial.level_data.level_id;
            const requiredImages = [];
            
            // determine additional images needed for current level
            switch (levelId) {
                case 'tutorial_1':
                case 'tutorial_2':
                    // Tutorial levels only need base images, no additional objects
                    break;
                    
                case 'journey_environment':
                    // need POOL or BALLOON as boundary objects
                    requiredImages.push('images/pool.png', 'images/balloon.png');
                    break;
                    
                case 'journey_understandproperty':
                    // need BOMB as destruct object
                    requiredImages.push('images/bomb.png');
                    break;
                    
                case 'journey_switchidentity':
                    // need CHAIN and ANCHOR/FAN
                    requiredImages.push('images/chain.png', 'images/anchor.png', 'images/fan.png');
                    break;
                    
                case 'journey_combination':
                    // need DOOR/KEY or TREE/ROSE
                    requiredImages.push('images/door.png', 'images/key.png', 'images/tree.png', 'images/rose.png');
                    break;
                    
                case 'journey_break':
                    // need BOMB or CANDLE
                    requiredImages.push('images/bomb.png', 'images/candle.png');
                    break;
                    
                case 'journey_grammar':
                    // only need base images, no additional objects
                    break;
                    
                default:
                    // for unknown levels, load all possible images
                    requiredImages.push('images/bomb.png', 'images/chain.png', 'images/anchor.png', 
                                     'images/door.png', 'images/key.png', 'images/tree.png', 'images/rose.png',
                                     'images/fan.png', 'images/candle.png', 'images/pool.png', 'images/balloon.png');
            }
            
            return requiredImages;
        }

        async trial(display_element, trial) {
            try {
                
                // save trial parameters
                this.currentTrial = trial;

                // disable page scrolling when game starts
                document.body.classList.add('baba-game-active');

                // preload images before starting the game (silently)
                await this.preloadImages();

                // initialize game engine
                if (!trial.level_data) {
                    throw new Error('level_data is missing from trial');
                }
                
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
                
                // Wait for game completion
                return new Promise((resolve) => {
                    this.onGameComplete = (won, reason) => {
                        resolve();
                    };
                });
                
            } catch (error) {
                console.error('Error in Baba game trial:', error);
                
                // Show error message to user
                display_element.innerHTML = `
                    <div style="text-align: center; color: white; padding: 20px;">
                        <h2>Game Loading Error</h2>
                        <p>Sorry, there was an error loading the game. Please refresh the page and try again.</p>
                        <p>Error details: ${error.message}</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Refresh Page
                        </button>
                    </div>
                `;
                
                // End the trial after a delay
                setTimeout(() => {
                    this.jsPsych.finishTrial({
                        success: false,
                        error: error.message
                    });
                }, 5000);
            }
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
            
            // create game grid
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
            
            // Debug styles are now handled by CSS
            
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
                    // Debug styles are now handled by CSS
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
            const availableHeight = window.innerHeight - 200; // increase reserved space for UI elements
            
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
            // use DocumentFragment to batch update DOM, improve performance
            const fragment = document.createDocumentFragment();
            
            // clear all cells efficiently
            for (let y = 0; y < this.gameEngine.gridSize[1]; y++) {
                for (let x = 0; x < this.gameEngine.gridSize[0]; x++) {
                    this.gridCells[y][x].innerHTML = '';
                }
            }
            
            // render objects in the correct order
            // 1. first render all non-text objects (entity objects) - non-text objects
            const nonTextObjects = this.gameEngine.objects.filter(obj => !obj.isText);
            for (const obj of nonTextObjects) {
                this.renderObject(obj);
            }
            
            // 2. then render all text objects (ensure text is on top) - text objects
            const textObjects = this.gameEngine.objects.filter(obj => obj.isText);
            for (const obj of textObjects) {
                this.renderObject(obj);
            }
            
            // 3. finally render recently moved objects, ensure they are on top - recently moved objects
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
                    
                    // use cached image if available
                    if (this.imageCache[imagePath]) {
                        objectElement.style.backgroundImage = `url('${imagePath}')`;
                        objectElement.style.backgroundSize = 'contain';
                        objectElement.style.backgroundRepeat = 'no-repeat';
                        objectElement.style.backgroundPosition = 'center';
                        objectElement.style.backgroundColor = 'transparent';
                        objectElement.textContent = ''; // hide text, only show image
                    } else {
                        // fallback to text display if image not cached
                        objectElement.style.backgroundImage = 'none';
                        objectElement.textContent = textContent;
                        objectElement.style.color = 'white';
                        objectElement.style.fontSize = '12px';
                        objectElement.style.fontWeight = 'bold';
                    }
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
                
                // If game is dead, allow pause, restart, and undo through normal handler
                if (this.gameEngine.dead) {
                    switch (key) {
                        case 'z':
                        case 'Z':
                            this.gameEngine.undo();
                            this.gameEngine.dead = false;
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
                    return;
                }
                
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
                if (this.gameEngine.dead && !document.getElementById('defeat-overlay')) {
                    this.showDefeatMessage();
                } else if (this.gameEngine.checkWinCondition()) {
                    // Set game completed flag to prevent infinite recursion
                    this.gameCompleted = true;
                    this.endGame(true, 'completed');
                } else {
                    // use setTimeout to limit frame rate, improve performance
                    setTimeout(() => requestAnimationFrame(() => this.gameLoop()), 16); // ~60 FPS
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
                instruction.textContent = 'Press Z to undo or R to restart the level (this will close this message)';
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
                
                // Remove auto-hide timer - let user control when to close with Z or R
                // this.defeatAutoHideTimer = setTimeout(() => {
                //     this.hideDefeatMessage();
                // }, 5000);
                
                // add key event listener
                this.defeatKeyHandler = (event) => {
                    if (event.key === 'z' || event.key === 'Z') {
                        this.hideDefeatMessage();
                        this.gameEngine.undo();
                        this.gameEngine.dead = false;
                        this.undoCount++;
                        this.updateDisplay();
                        requestAnimationFrame(() => this.gameLoop());
                    } else if (event.key === 'r' || event.key === 'R') {
                        this.hideDefeatMessage();
                        this.gameEngine.restart();
                        this.gameEngine.dead = false;
                        this.moveCount = 0;
                        this.undoCount = 0;
                        this.updateDisplay();
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
                // Reset game state to allow normal keyboard input
                if (this.gameEngine.dead) {
                    this.gameEngine.dead = false;
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
            
            // calculate average time between moves
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
                // detailed process data
                move_timestamps: detailedData.move_timestamps,
                operation_analyses: detailedData.operation_analyses,
                rule_operation_stats: detailedData.rule_operation_stats,
                final_state: detailedData.final_state
            };
            
            // Call onGameComplete callback if it exists
            if (this.onGameComplete) {
                this.onGameComplete(won, reason);
            }
            
            // show completion message
            setTimeout(() => {
                this.showCompletionMessage(won, reason);
                
                // Wait for completion message to be shown, then finish trial
                setTimeout(() => {
                    // Clean up completion overlay before finishing trial
                    const overlay = document.getElementById('completion-overlay');
                    if (overlay && overlay.parentNode) {
                        overlay.remove();
                    }
                    
                    // Clean up any animation styles
                    const styles = document.querySelectorAll('style');
                    styles.forEach(style => {
                        if (style.textContent.includes('fadeIn') || style.textContent.includes('slideIn')) {
                            style.remove();
                        }
                    });
                    
                    // Also clean up any remaining game container
                    const gameContainer = document.querySelector('.baba-game-container');
                    if (gameContainer && gameContainer.parentNode) {
                        gameContainer.remove();
                    }
                    
                    // Finish trial immediately after cleanup
                    this.jsPsych.finishTrial(trial_data);
                }, 1000); // Show message for 1s, then clean up and finish trial immediately
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
                z-index: 100;
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
            
            // Note: Cleanup is now handled in endGame function before finishing trial
        }

    }
    
    return BabaGamePlugin;

})(jsPsychModule); 
