/**
 * jsPsych Rating Scale Plugin
 * 用于收集关卡完成后的评分数据
 */

var jsPsychRatingScale = (function () {
    'use strict';

    const info = {
        name: 'rating-scale',
        version: '1.0.0',
        parameters: {
            rating_type: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Rating type',
                default: 'difficulty',
                description: 'Type of rating: difficulty, creativity, or overall_performance'
            },
            question: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Question',
                default: '',
                description: 'The question to ask'
            },
            scale_min: {
                type: jsPsychModule.ParameterType.INT,
                pretty_name: 'Scale minimum',
                default: 0,
                description: 'Minimum value of the rating scale'
            },
            scale_max: {
                type: jsPsychModule.ParameterType.INT,
                pretty_name: 'Scale maximum',
                default: 10,
                description: 'Maximum value of the rating scale'
            },
            scale_labels: {
                type: jsPsychModule.ParameterType.OBJECT,
                pretty_name: 'Scale labels',
                default: {},
                description: 'Labels for scale endpoints'
            },
            required: {
                type: jsPsychModule.ParameterType.BOOL,
                pretty_name: 'Required',
                default: true,
                description: 'Whether a response is required'
            },
            level_name: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Level name',
                default: '',
                description: 'Name of the completed level'
            }
        },
        data: {
            rating_type: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'Type of rating collected (difficulty, creativity, overall_performance)'
            },
            rating_value: {
                type: jsPsychModule.ParameterType.INT,
                description: 'The rating value selected by the participant'
            },
            level_name: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'Name of the level being rated'
            },
            question: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'The question text displayed to the participant'
            },
            scale_min: {
                type: jsPsychModule.ParameterType.INT,
                description: 'Minimum value of the rating scale'
            },
            scale_max: {
                type: jsPsychModule.ParameterType.INT,
                description: 'Maximum value of the rating scale'
            },
            response_time: {
                type: jsPsychModule.ParameterType.FLOAT,
                description: 'Time taken to make the rating in seconds'
            }
        }
    };

    class RatingScalePlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            const startTime = Date.now();
            this.selectedRating = null;
            
            // 根据评分类型设置默认问题和标签
            this.setupRatingContent(trial);
            
            // 创建评分界面
            this.createRatingDisplay(display_element, trial);
            
            // 设置事件监听
            this.setupEventListeners(trial, startTime);
        }

        setupRatingContent(trial) {
            if (!trial.question) {
                switch (trial.rating_type) {
                    case 'difficulty':
                        trial.question = `According to your experience, how difficult was last level?`;
                        trial.scale_labels = {
                            [trial.scale_min]: 'Very Easy',
                            [trial.scale_max]: 'Very Difficult'
                        };
                        break;
                    case 'creativity':
                        trial.question = `According to your experience, how creative do you think you were in last level?`;
                        trial.scale_labels = {
                            [trial.scale_min]: 'Not Creative',
                            [trial.scale_max]: 'Very Creative'
                        };
                        break;
                    case 'overall_performance':
                        trial.question = 'Compared with people like your age, how would you rate your overall performance in this experiment?';
                        trial.scale_labels = {
                            [trial.scale_min]: 'Very Poor',
                            [trial.scale_max]: 'Excellent'
                        };
                        break;
                    default:
                        trial.question = 'Please rate your experience:';
                        trial.scale_labels = {
                            [trial.scale_min]: 'Low',
                            [trial.scale_max]: 'High'
                        };
                }
            }
        }

        createRatingDisplay(display_element, trial) {
            // 计算评分按钮的总宽度：按钮数量 * 按钮宽度 + 间距
            const numButtons = trial.scale_max - trial.scale_min + 1;
            const buttonWidth = 50; // 与CSS rating-option的宽度一致
            const gapWidth = 10; // 与CSS rating-scale的gap一致
            const totalWidth = numButtons * buttonWidth + (numButtons - 1) * gapWidth;
            
            const html = `
                <div class="rating-container">
                    <h2 style="color: white; margin-bottom: 30px; font-size: 36px;">${this.getRatingTitle(trial.rating_type)}</h2>
                    
                    <div style="margin-bottom: 40px;">
                        <h3 style="color: white; font-size: 28px; margin-bottom: 24px;">${trial.question}</h3>
                    </div>
                    
                    <div class="rating-scale" style="margin-bottom: 10px;">
                        ${this.createScaleOptions(trial)}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; width: ${totalWidth}px; margin-left: auto; margin-right: auto;">
                        <span style="color: white; font-size: 20px; text-align: center; width: ${buttonWidth}px;">${trial.scale_labels[trial.scale_min] || trial.scale_min}</span>
                        <span style="color: white; font-size: 20px; text-align: center; width: ${buttonWidth}px;">${trial.scale_labels[trial.scale_max] || trial.scale_max}</span>
                    </div>
                    
                    <button id="continue-btn" class="baba-button" style="margin-top: 20px;" disabled>Continue</button>
                    
                    ${trial.required ? '<p style="color: #ccc; margin-top: 20px; font-size: 20px;">Please select a rating to continue.</p>' : ''}
                </div>
            `;
            
            display_element.innerHTML = html;
        }

        createScaleOptions(trial) {
            let html = '';
            for (let i = trial.scale_min; i <= trial.scale_max; i++) {
                html += `
                    <div class="rating-option" data-value="${i}">
                        ${i}
                    </div>
                `;
            }
            return html;
        }

        getRatingTitle(ratingType) {
            switch (ratingType) {
                case 'difficulty':
                    return 'Difficulty Rating';
                case 'creativity':
                    return 'Creativity Rating';
                case 'overall_performance':
                    return 'Overall Performance Rating';
                default:
                    return 'Rating';
            }
        }

        setupEventListeners(trial, startTime) {
            // Rating option click handlers
            document.querySelectorAll('.rating-option').forEach(option => {
                option.addEventListener('click', () => {
                    // Remove previous selection
                    document.querySelectorAll('.rating-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // Add selection to clicked option
                    option.classList.add('selected');
                    this.selectedRating = parseInt(option.dataset.value);
                    
                    // Enable continue button
                    document.getElementById('continue-btn').disabled = false;
                });
            });

            // Continue button handler
            document.getElementById('continue-btn').addEventListener('click', () => {
                if (trial.required && this.selectedRating === null) {
                    return;
                }
                
                const endTime = Date.now();
                const data = {
                    rating_type: trial.rating_type,
                    rating_value: this.selectedRating,
                    level_name: trial.level_name,
                    question: trial.question,
                    scale_min: trial.scale_min,
                    scale_max: trial.scale_max,
                    response_time: (endTime - startTime) / 1000
                };
                
                this.jsPsych.finishTrial(data);
            });

            // Keyboard shortcuts for rating (1-9)
            const keyHandler = (event) => {
                const key = event.key;
                if (key >= '1' && key <= '9') {
                    const value = parseInt(key);
                    if (value >= trial.scale_min && value <= trial.scale_max) {
                        const option = document.querySelector(`[data-value="${value}"]`);
                        if (option) {
                            option.click();
                        }
                    }
                } else if (key === 'Enter' && this.selectedRating !== null) {
                    document.getElementById('continue-btn').click();
                }
            };
            
            document.addEventListener('keydown', keyHandler);
            
            // Cleanup
            this.jsPsych.pluginAPI.setTimeout(() => {
                document.removeEventListener('keydown', keyHandler);
            }, 0);
        }
    }

    RatingScalePlugin.info = info;

    return RatingScalePlugin;

})(); 
