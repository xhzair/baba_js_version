/**
 * jsPsych Baba is You Game Plugin
 * 核心游戏插件，处理Baba is You游戏的交互和渲染
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
            
            // 现在使用预生成的彩色文本图片，不再需要颜色配置
        }
        


        trial(display_element, trial) {
            // 保存trial参数
            this.currentTrial = trial;

            // 游戏开始时禁用页面滚动
            document.body.classList.add('baba-game-active');

            // 初始化游戏引擎
            this.gameEngine = new BabaGameEngine(trial.level_data, trial.time_limit);
            this.gameCompleted = false;
            this.gameWon = false;
            this.startTime = Date.now();
            this.moveCount = 0;
            this.undoCount = 0;
            this.pauseCount = 0;
            
            // 创建游戏界面
            this.createGameDisplay(display_element, trial);
            
            // 设置键盘监听
            this.setupKeyboardListeners();
            
            // 开始游戏循环
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
                        <!-- 游戏网格将在这里生成 -->
                    </div>
                    
                    <div id="game-status" style="color: white; font-size: 18px; margin-top: 20px;">
                        <!-- 游戏状态信息 -->
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
            
            // 计算最佳单元格大小以适应屏幕
            const cellSize = this.calculateOptimalCellSize(gridSize);
            
            // 创建网格元素
            const gridElement = document.createElement('div');
            gridElement.className = 'game-grid';
            gridElement.style.gridTemplateColumns = `repeat(${gridSize[0]}, ${cellSize}px)`;
            gridElement.style.gridTemplateRows = `repeat(${gridSize[1]}, ${cellSize}px)`;
            
            // 更新CSS变量以供其他地方使用
            document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
            
            // 创建所有网格单元格
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
            // 获取可用空间
            const availableWidth = window.innerWidth - 40; // 减去边距
            const availableHeight = window.innerHeight - 160; // 减去UI元素高度
            
            // 计算基于宽度和高度的最大单元格大小
            const maxCellSizeByWidth = Math.floor(availableWidth / gridSize[0]);
            const maxCellSizeByHeight = Math.floor(availableHeight / gridSize[1]);
            
            // 选择较小的那个，确保整个棋盘都能显示
            const optimalSize = Math.min(maxCellSizeByWidth, maxCellSizeByHeight);
            
            // 设置最小和最大限制
            const minCellSize = 30; // 最小30px，确保可读性
            const maxCellSize = 80; // 最大80px，避免过大
            
            return Math.max(minCellSize, Math.min(maxCellSize, optimalSize));
        }

        updateDisplay() {
            // 清空所有单元格
            for (let y = 0; y < this.gameEngine.gridSize[1]; y++) {
                for (let x = 0; x < this.gameEngine.gridSize[0]; x++) {
                    this.gridCells[y][x].innerHTML = '';
                }
            }
            
            // 按正确的层级顺序渲染对象
            // 1. 首先渲染所有非文本对象（实体对象）
            const nonTextObjects = this.gameEngine.objects.filter(obj => !obj.isText);
            for (const obj of nonTextObjects) {
                this.renderObject(obj);
            }
            
            // 2. 然后渲染所有文本对象（确保文字在上层）
            const textObjects = this.gameEngine.objects.filter(obj => obj.isText);
            for (const obj of textObjects) {
                this.renderObject(obj);
            }
            
            // 3. 最后重新渲染最近移动的对象，确保它们在最顶层
            for (const obj of this.gameEngine.recentlyMovedObjects) {
                // 先移除已存在的元素（避免重复）
                const [x, y] = obj.position;
                if (y >= 0 && y < this.gridCells.length && 
                    x >= 0 && x < this.gridCells[y].length) {
                    const cell = this.gridCells[y][x];
                    // 找到并移除这个对象的现有元素
                    const existingElements = Array.from(cell.children);
                    for (const elem of existingElements) {
                        const objectType = obj.type.toLowerCase().replace('text_', '');
                        if (elem.classList.contains(`object-${objectType}`)) {
                            elem.remove();
                            break;
                        }
                    }
                    // 重新渲染到顶层
                    this.renderObject(obj);
                }
            }
            
            // 更新时间和移动计数
            this.updateUI();
        }

        renderObject(obj) {
            const [x, y] = obj.position;
            if (y >= 0 && y < this.gridCells.length && 
                x >= 0 && x < this.gridCells[y].length) {
                
                const cell = this.gridCells[y][x];
                const objectElement = document.createElement('div');
                objectElement.className = 'game-object';
                
                // 添加对象类型类
                const objectType = obj.type.toLowerCase().replace('text_', '');
                objectElement.classList.add(`object-${objectType}`);
                
                // 区分文本对象和图像对象
                if (obj.isText) {
                    // 文本对象：使用预生成的文本图片
                    objectElement.classList.add('text-object');
                    objectElement.classList.add('text-image');
                    const textContent = obj.type.replace('TEXT_', '');
                    
                    // 使用预生成的文本图片
                    const imagePath = `text_images/${textContent.toLowerCase()}.png`;
                    console.log(`尝试加载文本图片: ${imagePath}, 文本内容: ${textContent}`); // 调试日志
                    
                    objectElement.style.backgroundImage = `url('${imagePath}')`;
                    objectElement.style.backgroundSize = 'contain';
                    objectElement.style.backgroundRepeat = 'no-repeat';
                    objectElement.style.backgroundPosition = 'center';
                    objectElement.style.backgroundColor = 'transparent';
                    objectElement.textContent = ''; // 隐藏文字，只显示图片
                    
                    // 调试：打印元素的类名和样式
                    console.log(`元素类名: ${objectElement.className}`);
                    console.log(`设置的背景图片: ${objectElement.style.backgroundImage}`);
                    
                    // 添加错误处理，如果图片加载失败则显示文字
                    const img = new Image();
                    img.onload = () => {
                        // 图片加载成功，保持图片显示
                        console.log(`✓ 文本图片加载成功: ${imagePath}, 图片尺寸: ${img.width}x${img.height}`);
                        
                        // 调试：检查计算后的样式
                        setTimeout(() => {
                            const computedStyle = window.getComputedStyle(objectElement);
                            console.log(`计算后的背景图片: ${computedStyle.backgroundImage}`);
                            console.log(`计算后的背景尺寸: ${computedStyle.backgroundSize}`);
                            console.log(`元素尺寸: ${objectElement.offsetWidth}x${objectElement.offsetHeight}`);
                        }, 100);
                    };
                    img.onerror = () => {
                        // 图片加载失败，回退到文字显示
                        console.warn(`✗ 文本图片加载失败: ${imagePath}`);
                        objectElement.style.backgroundImage = 'none';
                        objectElement.textContent = textContent;
                        objectElement.style.color = 'white';
                        objectElement.style.fontSize = '12px';
                        objectElement.style.fontWeight = 'bold';
                    };
                    img.src = imagePath;
                } else {
                    // 实体对象：使用图片显示
                    objectElement.classList.add('image-object');
                    // 不添加文本内容，让图片通过CSS背景显示
                }
                
                // 添加属性效果
                if (obj.isYou) objectElement.classList.add('property-you');
                if (obj.isWin) objectElement.classList.add('property-win');
                if (obj.isStop) objectElement.classList.add('property-stop');
                if (obj.isPush) objectElement.classList.add('property-push');
                if (obj.isDefeat) objectElement.classList.add('property-defeat');
                if (obj.isRed) objectElement.classList.add('property-red');
                
                // 添加最近移动对象的标识
                if (this.gameEngine.recentlyMovedObjects.has(obj)) {
                    objectElement.classList.add('recently-moved');
                }
                
                cell.appendChild(objectElement);
            }
        }
        
        // 已移除 applyTextColor 函数，因为现在使用预生成的彩色文本图片

        updateUI() {
            // 更新时间
            const timeRemaining = this.gameEngine.getRemainingTime();
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = Math.floor(timeRemaining % 60);
            const timeElement = document.getElementById('time-value');
            if (timeElement) {
                timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // 移动计数暂时不显示，因为HTML模板中没有对应元素
            // 如果需要显示移动计数，可以在HTML模板中添加相应的元素
            
            // 检查时间是否用完
            if (timeRemaining <= 0 && !this.gameCompleted) {
                this.endGame(false, 'timeout');
            }
        }

        setupKeyboardListeners() {
            this.keyHandler = (event) => {
                if (this.gameCompleted) return;
                
                const key = event.key;
                let direction = null;
                
                // 方向键移动
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
            
            // 确保重新开始时保持禁用滚动状态
            if (!document.body.classList.contains('baba-game-active')) {
                document.body.classList.add('baba-game-active');
            }
        }

        gameLoop() {
            if (!this.gameCompleted) {
                this.updateUI();
                
                // 检查游戏状态
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
            // 创建失败提示遮罩
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
                
                // 添加按键监听
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
            
            // 游戏结束时恢复页面滚动
            document.body.classList.remove('baba-game-active');
            
            // 清理事件监听器
            document.removeEventListener('keydown', this.keyHandler);
            
            // 收集数据
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
                operation_count: this.gameEngine.operationCount || 0
            };
            
            console.log('游戏数据收集:', trial_data); // 调试日志
            
            // 显示完成信息
            setTimeout(() => {
                this.showCompletionMessage(won, reason);
                
                // 延长胜利提示显示时间到1.5s
                setTimeout(() => {
                    this.jsPsych.finishTrial(trial_data);
                }, 1500); // 延长到1500ms（1.5秒）
            }, 200);
        }

        showCompletionMessage(won, reason) {
            // 立即隐藏游戏界面，避免闪屏
            const gameContainer = document.querySelector('.baba-game-container');
            if (gameContainer) {
                gameContainer.style.opacity = '0';
            }
            
            // 创建一个覆盖层显示完成信息
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
                        emoji = '⏰';
                        break;
                    case 'defeated':
                        message = 'Game Over!';
                        emoji = '💥';
                        break;
                    default:
                        message = 'Level Failed!';
                        emoji = '❌';
                }
                messageBox.innerHTML = `
                    <div style="color: #f44336; font-size: 48px; margin-bottom: 20px;">${emoji}</div>
                    <div style="color: #f44336;">${message}</div>
                    <div style="font-size: 18px; color: #ccc; margin-top: 10px;">Proceeding to rating...</div>
                `;
            }
            
            overlay.appendChild(messageBox);
            document.body.appendChild(overlay);
            
            // 添加样式动画
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
            
            // 自动清理（在进入评分后清理，避免闪屏）
            setTimeout(() => {
                if (overlay && overlay.parentNode) {
                    overlay.remove();
                }
                if (style && style.parentNode) {
                    style.remove();
                }
            }, 1600); // 在跳转后再清理，避免闪屏
        }

        // 已移除 extractImageMainColor 和 enhanceColorForVisibility 函数
        // 因为现在使用预生成的彩色文本图片，不再需要动态颜色处理
        
        // 已移除 formatTextWithLineBreaks 和 autoScaleMultiLineText 函数
        // 因为现在使用预生成的文本图片，不再需要动态文本处理
    }

    BabaGamePlugin.info = info;

    return BabaGamePlugin;

})(); 