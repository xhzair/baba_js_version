/**
 * jsPsych Chapter Select Plugin
 * 章节和关卡选择界面
 */

var jsPsychChapterSelect = (function () {
    'use strict';

    const info = {
        name: 'chapter-select',
        version: '1.0.0',
        parameters: {
            selection_type: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Selection type',
                default: 'chapter',
                description: 'Type of selection: "chapter" or "level"'
            },
            chapters: {
                type: jsPsychModule.ParameterType.OBJECT,
                pretty_name: 'Chapters',
                default: [],
                description: 'Array of chapter objects'
            },
            levels: {
                type: jsPsychModule.ParameterType.OBJECT,
                pretty_name: 'Levels',
                default: [],
                description: 'Array of level objects for current chapter'
            },
            current_chapter: {
                type: jsPsychModule.ParameterType.STRING,
                pretty_name: 'Current chapter',
                default: '',
                description: 'Current chapter name'
            },
            unlocked_levels: {
                type: jsPsychModule.ParameterType.INT,
                pretty_name: 'Unlocked levels',
                default: 1,
                description: 'Number of unlocked levels'
            },
            completed_levels: {
                type: jsPsychModule.ParameterType.OBJECT,
                pretty_name: 'Completed levels',
                default: [],
                description: 'Array of completed level indices'
            }
        },
        data: {
            selection_type: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'Type of selection made (chapter, level, back_to_chapters)'
            },
            selected_chapter: {
                type: jsPsychModule.ParameterType.INT,
                description: 'Index of selected chapter (if applicable)'
            },
            selected_level: {
                type: jsPsychModule.ParameterType.INT,
                description: 'Index of selected level (if applicable)'
            },
            chapter_key: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'Key identifier for selected chapter'
            },
            chapter_name: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'Name of selected chapter'
            },
            level_name: {
                type: jsPsychModule.ParameterType.STRING,
                description: 'Name of selected level'
            },
            selection_time: {
                type: jsPsychModule.ParameterType.FLOAT,
                description: 'Time taken to make selection in seconds'
            },
            level_data: {
                type: jsPsychModule.ParameterType.OBJECT,
                description: 'Complete level data object (if level selected)'
            }
        }
    };

    class ChapterSelectPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            const startTime = Date.now();
            
            if (trial.selection_type === 'chapter') {
                this.createChapterSelection(display_element, trial);
            } else {
                this.createLevelSelection(display_element, trial);
            }
            
            this.setupClickHandlers(trial, startTime);
        }

        createChapterSelection(display_element, trial) {
            const html = `
                <div class="selection-container">
                    <h1 class="selection-title">Chapter Selection</h1>
                    <p class="selection-subtitle">Please click to select a chapter:</p>
                    
                    <div class="selection-grid">
                        ${trial.chapters.map((chapter, index) => 
                            this.createChapterItem(chapter, index)
                        ).join('')}
                    </div>
                    
                    <p style="color: #4caf50; margin-top: 40px; font-size: 18px;">
                        Green indicates completed chapters
                    </p>
                </div>
            `;
            
            display_element.innerHTML = html;
        }

        createLevelSelection(display_element, trial) {
            const html = `
                <div class="selection-container">
                    <h1 class="selection-title">Level Selection - ${trial.current_chapter}</h1>
                    <p class="selection-subtitle">Available levels: ${trial.unlocked_levels}/${trial.levels.length}</p>
                    
                    <div class="selection-grid">
                        ${trial.levels.map((level, index) => 
                            this.createLevelItem(level, index, trial)
                        ).join('')}
                    </div>
                    
                    <p style="color: #4caf50; margin-top: 40px; font-size: 18px;">
                        Green indicates completed levels
                    </p>
                    
                    <button id="back-to-chapters" class="baba-button" style="margin-top: 20px; background-color: #666;">
                        Back to Chapters
                    </button>
                </div>
            `;
            
            display_element.innerHTML = html;
        }

        createChapterItem(chapter, index) {
            const completed = this.isChapterCompleted(chapter, index);
            const locked = this.isChapterLocked(chapter, index);
            
            let className = 'selection-item';
            if (completed) className += ' completed';
            if (locked) className += ' locked';
            
            return `
                <div class="${className}" data-chapter-index="${index}">
                    <h3>${index + 1}. ${chapter.name}</h3>
                    <p>${this.getChapterDescription(chapter)}</p>
                    ${locked ? '<p style="color: #ccc; font-style: italic;">Locked</p>' : ''}
                </div>
            `;
        }

        createLevelItem(level, index, trial) {
            const completed = trial.completed_levels.includes(index);
            const locked = index >= trial.unlocked_levels;
            
            let className = 'selection-item';
            if (completed) className += ' completed';
            if (locked) className += ' locked';
            
            return `
                <div class="${className}" data-level-index="${index}">
                    <h3>${index + 1}. ${level.name}</h3>
                    ${locked ? '<p style="color: #ccc; font-style: italic;">Locked</p>' : ''}
                    ${completed ? '<p style="color: #4caf50; font-weight: bold;">✓ Completed</p>' : ''}
                </div>
            `;
        }

        setupClickHandlers(trial, startTime) {
            if (trial.selection_type === 'chapter') {
                // Chapter selection handlers
                document.querySelectorAll('[data-chapter-index]').forEach(element => {
                    element.addEventListener('click', () => {
                        const chapterIndex = parseInt(element.dataset.chapterIndex);
                        const chapter = trial.chapters[chapterIndex];
                        
                        if (!this.isChapterLocked(chapter, chapterIndex)) {
                            const endTime = Date.now();
                            const data = {
                                selection_type: 'chapter',
                                selected_chapter: chapterIndex,
                                chapter_key: chapter.key,
                                chapter_name: chapter.name,
                                selection_time: (endTime - startTime) / 1000
                            };
                            this.jsPsych.finishTrial(data);
                        }
                    });
                });
            } else {
                // Level selection handlers
                document.querySelectorAll('[data-level-index]').forEach(element => {
                    element.addEventListener('click', () => {
                        const levelIndex = parseInt(element.dataset.levelIndex);
                        const level = trial.levels[levelIndex];
                        
                        // Check if level is available (unlocked and not completed)
                        if (levelIndex < trial.unlocked_levels && 
                            !trial.completed_levels.includes(levelIndex)) {
                            const endTime = Date.now();
                            const data = {
                                selection_type: 'level',
                                selected_level: levelIndex,
                                level_data: level,
                                level_name: level.name,
                                selection_time: (endTime - startTime) / 1000
                            };
                            this.jsPsych.finishTrial(data);
                        }
                    });
                });

                // Back to chapters button
                const backButton = document.getElementById('back-to-chapters');
                if (backButton) {
                    backButton.addEventListener('click', () => {
                        const endTime = Date.now();
                        const data = {
                            selection_type: 'back_to_chapters',
                            selection_time: (endTime - startTime) / 1000
                        };
                        this.jsPsych.finishTrial(data);
                    });
                }
            }
        }

        getChapterDescription(chapter) {
            switch (chapter.key) {
                case 'tutorial':
                    return 'Learn the basic rules and mechanics';
                case 'journey':
                    return 'Advanced puzzles';
                default:
                    return 'Complete the puzzles in this chapter';
            }
        }

        isChapterCompleted(chapter, index) {
            // For demo purposes, assume first chapter can be completed
            // In real implementation, this would check actual completion status
            return false;
        }

        isChapterLocked(chapter, index) {
            // For demo purposes, only lock chapters after the first two
            return index > 1;
        }
    }

    ChapterSelectPlugin.info = info;

    return ChapterSelectPlugin;

})(); 