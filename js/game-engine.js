/**
 * Baba is You Game Engine - JavaScript Implementation
 */

class GameObject {
    constructor(type, position) {
        this.type = type;
        this.position = [...position]; // [x, y]
        this.isText = type.startsWith('TEXT_');
        
        // Properties
        this.isYou = false;
        this.isWin = false;
        this.isStop = false;
        this.isPush = false;
        this.isDefeat = false;
        this.isRed = false;
        this.permanentRed = false;
        this.isDestruct = false;
        this.isImpact = false;
        this.isShut = false;
        this.isOpen = false;
        
        // IF conditions
        this.ifConditions = [];
    }
    
    clone() {
        const newObj = new GameObject(this.type, this.position);
        newObj.isText = this.isText;
        newObj.isYou = this.isYou;
        newObj.isWin = this.isWin;
        newObj.isStop = this.isStop;
        newObj.isPush = this.isPush;
        newObj.isDefeat = this.isDefeat;
        newObj.isRed = this.isRed;
        newObj.permanentRed = this.permanentRed;
        newObj.isDestruct = this.isDestruct;
        newObj.isImpact = this.isImpact;
        newObj.isShut = this.isShut;
        newObj.isOpen = this.isOpen;
        newObj.ifConditions = [...this.ifConditions];
        return newObj;
    }
}

class Rule {
    constructor(subject, verb, predicate) {
        this.subject = subject;
        this.verb = verb;
        this.predicate = predicate;
        
        // IF condition support
        this.isConditional = false;
        this.conditionObj = null;
        this.conditionProp = null;
    }
    
    clone() {
        const newRule = new Rule(this.subject, this.verb, this.predicate);
        newRule.isConditional = this.isConditional;
        newRule.conditionObj = this.conditionObj;
        newRule.conditionProp = this.conditionProp;
        return newRule;
    }
}

class BabaGameEngine {
    constructor(levelData, timeLimit = 480) {
        
        if (!levelData) {
            console.error('levelData is null or undefined');
            throw new Error('levelData is required');
        }
        
        this.gridSize = levelData.grid_size || levelData.gridSize;
        if (!this.gridSize) {
            console.error('gridSize is missing from levelData:', levelData);
            throw new Error('gridSize is required in levelData');
        }
        
        this.objects = [];
        this.rules = [];
        this.initialRules = levelData.initial_rules || [];
        this.initialElements = levelData.elements || [];
        this.timeLimit = timeLimit;
        this.startTime = Date.now();
        this.operationCount = 0;
        this.errorAttempts = 0;
        this.dead = false;
        this.paused = false;
        this.pauseTime = 0;
        this.totalPauseTime = 0;
        
        // initialize missing variables
        this.savedStates = [];
        this.grid = [];
        this.playerPosition = null;
        this.levelId = levelData.level_id || 'unknown';
        
        // track recently moved objects
        this.recentlyMovedObjects = new Set();
        
        // Data collection for detailed analysis
        this.moveTimestamps = [];
        this.operationAnalyses = [];
        this.lastMoveTime = this.startTime;
        this.initRuleOperationStats();
        
        this.initializeObjects(levelData.elements);
        this.initializeRules();
        this.updateObjectProperties();
        this.parseRulesFromBoard();
    }
    
    initializeObjects(elementsData) {
        this.objects = [];
        for (const element of elementsData) {
            const obj = new GameObject(element.type, element.pos);
            
            // Apply initial properties if specified
            if (element.properties && Array.isArray(element.properties)) {
                for (const property of element.properties) {
                    this.applyProperty(obj, property.toUpperCase());
                }
            }
            
            this.objects.push(obj);
            
            // Handle range objects
            if (element.range_y_to) {
                for (let y = element.pos[1] + 1; y <= element.range_y_to; y++) {
                    const rangeObj = new GameObject(element.type, [element.pos[0], y]);
                    
                    // Apply initial properties to range objects too
                    if (element.properties && Array.isArray(element.properties)) {
                        for (const property of element.properties) {
                            this.applyProperty(rangeObj, property.toUpperCase());
                        }
                    }
                    
                    this.objects.push(rangeObj);
                }
            }
            if (element.range_x_to) {
                for (let x = element.pos[0] + 1; x <= element.range_x_to; x++) {
                    const rangeObj = new GameObject(element.type, [x, element.pos[1]]);
                    
                    // Apply initial properties to range objects too
                    if (element.properties && Array.isArray(element.properties)) {
                        for (const property of element.properties) {
                            this.applyProperty(rangeObj, property.toUpperCase());
                        }
                    }
                    
                    this.objects.push(rangeObj);
                }
            }
        }
    }
    
    initializeRules() {
        this.rules = [];
        
        // Add level specific rules
        for (const ruleData of this.initialRules) {
            if (ruleData.length === 3) {
                // Normal rule: ['subject', 'verb', 'predicate']
                this.rules.push(new Rule(ruleData[0], ruleData[1], ruleData[2]));
            } else if (ruleData.length === 4 && ruleData[1] === 'IF') {
                // IF condition rule: ['subject', 'IF', 'result_prop', 'condition_obj']
                const rule = new Rule(ruleData[0], 'IF', ruleData[2]);
                rule.isConditional = true;
                rule.conditionObj = ruleData[3];
                rule.conditionProp = ruleData[2];
                this.rules.push(rule);
            }
        }
        
        // Add text push rules
        this.addTextPushRules();
        this.updateObjectProperties();
    }
    
    addTextPushRules() {
        // Text objects are inherently pushable through their isText property
        // No need to add explicit PUSH rules for text objects
    }
    
    updateObjectProperties() {
        const properties = new Set(['YOU', 'WIN', 'STOP', 'PUSH', 'DEFEAT', 'RED', 'DESTRUCT', 'IMPACT', 'SHUT', 'OPEN']);
        const connectors = new Set(['IS', 'IF']);
        const objectProperties = new Set(['YOU', 'WIN', 'STOP', 'PUSH', 'DEFEAT', 'RED', 'DESTRUCT', 'IMPACT', 'SHUT', 'OPEN']);
        
        // Reset all object properties (except permanent red)
        for (const obj of this.objects) {
            obj.isYou = false;
            obj.isWin = false;
            obj.isStop = false;
            obj.isPush = false;
            obj.isDefeat = false;
            // important: reset isRed but keep permanentRed
            if (!obj.permanentRed) {
                obj.isRed = false;
            }
            obj.isDestruct = false;
            obj.isImpact = false;
            obj.isShut = false;
            obj.isOpen = false;
            obj.ifConditions = [];
        }
        
        // FIRST: Apply object to object transformation rules (CHAIN IS ANCHOR, etc.)
        for (const rule of this.rules) {
            // Only apply transformation rules (not property rules, not connector rules)
            if (!objectProperties.has(rule.predicate) && 
                !connectors.has(rule.predicate) && 
                !objectProperties.has(rule.subject)) {
                
                for (const obj of this.objects) {
                    if (obj.type === rule.subject && !obj.isText) {
                        obj.type = rule.predicate;
                    }
                }
            }
        }
        
        // THEN: Apply property rules to the (possibly transformed) objects
        for (const rule of this.rules) {
            if (!rule.isConditional && !properties.has(rule.subject)) {
                for (const obj of this.objects) {
                    if (obj.type === rule.subject && !obj.isText) {
                        this.applyProperty(obj, rule.predicate);
                    }
                }
            }
        }
        
        // Apply IF condition rules
        for (const rule of this.rules) {
            if (rule.isConditional && !properties.has(rule.subject)) {
                for (const obj of this.objects) {
                    if (obj.type === rule.subject && !obj.isText) {
                        const conditionProp = `is${rule.conditionProp.toLowerCase().charAt(0).toUpperCase() + rule.conditionProp.toLowerCase().slice(1)}`;
                        if (obj[conditionProp]) {
                            this.applyProperty(obj, rule.predicate);
                        }
                    }
                }
            }
        }
        
        // Restore permanent red
        for (const obj of this.objects) {
            if (obj.permanentRed) {
                obj.isRed = true;
            }
        }
        
        // Update player position
        this.updatePlayerPosition();
    }
    
    updatePlayerPosition() {
        // Find the first YOU object to set as player position
        const youObjects = this.objects.filter(obj => obj.isYou);
        if (youObjects.length > 0) {
            this.playerPosition = {
                x: youObjects[0].position[0],
                y: youObjects[0].position[1]
            };
        } else {
            this.playerPosition = null;
        }
    }
    
    applyProperty(obj, property) {
        switch (property) {
            case 'YOU':
                obj.isYou = true;
                break;
            case 'WIN':
                obj.isWin = true;
                break;
            case 'STOP':
                obj.isStop = true;
                break;
            case 'PUSH':
                obj.isPush = true;
                break;
            case 'DEFEAT':
                obj.isDefeat = true;
                break;
            case 'RED':
                obj.isRed = true;
                obj.permanentRed = true;
                break;
            case 'DESTRUCT':
                obj.isDestruct = true;
                break;
            case 'IMPACT':
                obj.isImpact = true;
                obj.isDestruct = true;  // IMPACT has the same function as DESTRUCT
                break;
            case 'SHUT':
                obj.isShut = true;
                break;
            case 'OPEN':
                obj.isOpen = true;
                break;
        }
    }
    
    parseRulesFromBoard() {
        // Clear ALL current rules - only rules visible on the board should be active
        this.rules = [];
        
        // Add text push rules (these are implicit and don't need text on board)
        this.addTextPushRules();
        
        // Find horizontal rules
        this.findHorizontalRules();
        
        // Find vertical rules
        this.findVerticalRules();
        
        this.updateObjectProperties();
        
    }
    
    findHorizontalRules() {
        for (let y = 0; y < this.gridSize[1]; y++) {
            // First scan for 5-position IF rules: "OBJ IF PROP IS RESULT"
            for (let x = 0; x < this.gridSize[0] - 4; x++) {
                const positions = [[x, y], [x+1, y], [x+2, y], [x+3, y], [x+4, y]];
                const textTypes = positions.map(pos => this.getTextTypeAt(pos));
                
                if (textTypes[0] && (textTypes[1] === 'TEXT_IF' || textTypes[1] === 'TEXT_FEELING') && textTypes[2] && 
                    textTypes[3] === 'TEXT_IS' && textTypes[4]) {
                    
                    const subject = textTypes[0].replace('TEXT_', '');
                    const conditionProp = textTypes[2].replace('TEXT_', '');
                    const resultProp = textTypes[4].replace('TEXT_', '');
                    
                    const rule = new Rule(subject, 'IF', resultProp);
                    rule.isConditional = true;
                    rule.conditionObj = conditionProp;
                    rule.conditionProp = conditionProp;
                    
                    if (!this.ruleExists(subject, 'IF', resultProp)) {
                        this.rules.push(rule);
                    }
                }
            }
            
            // Then scan for 3-position IS rules: "OBJ IS PROP"
            for (let x = 0; x < this.gridSize[0] - 2; x++) {
                const pos1 = [x, y];
                const pos2 = [x + 1, y];
                const pos3 = [x + 2, y];
                
                const obj1 = this.getTextTypeAt(pos1);
                const obj2 = this.getTextTypeAt(pos2);
                const obj3 = this.getTextTypeAt(pos3);
                
                if (obj1 && obj2 === 'TEXT_IS' && obj3) {
                    const subject = obj1.replace('TEXT_', '');
                    const predicate = obj3.replace('TEXT_', '');
                    
                    if (!this.ruleExists(subject, 'IS', predicate)) {
                        this.rules.push(new Rule(subject, 'IS', predicate));
                    }
                }
            }
        }
    }
    
    findVerticalRules() {
        for (let x = 0; x < this.gridSize[0]; x++) {
            // First scan for 5-position IF rules: "OBJ IF PROP IS RESULT"
            for (let y = 0; y < this.gridSize[1] - 4; y++) {
                const positions = [[x, y], [x, y+1], [x, y+2], [x, y+3], [x, y+4]];
                const textTypes = positions.map(pos => this.getTextTypeAt(pos));
                
                if (textTypes[0] && (textTypes[1] === 'TEXT_IF' || textTypes[1] === 'TEXT_FEELING') && textTypes[2] && 
                    textTypes[3] === 'TEXT_IS' && textTypes[4]) {
                    
                    const subject = textTypes[0].replace('TEXT_', '');
                    const conditionProp = textTypes[2].replace('TEXT_', '');
                    const resultProp = textTypes[4].replace('TEXT_', '');
                    
                    const rule = new Rule(subject, 'IF', resultProp);
                    rule.isConditional = true;
                    rule.conditionObj = conditionProp;
                    rule.conditionProp = conditionProp;
                    
                    if (!this.ruleExists(subject, 'IF', resultProp)) {
                        this.rules.push(rule);
                    }
                }
            }
            
            // Then scan for 3-position IS rules: "OBJ IS PROP"
            for (let y = 0; y < this.gridSize[1] - 2; y++) {
                const pos1 = [x, y];
                const pos2 = [x, y + 1];
                const pos3 = [x, y + 2];
                
                const obj1 = this.getTextTypeAt(pos1);
                const obj2 = this.getTextTypeAt(pos2);
                const obj3 = this.getTextTypeAt(pos3);
                
                if (obj1 && obj2 === 'TEXT_IS' && obj3) {
                    const subject = obj1.replace('TEXT_', '');
                    const predicate = obj3.replace('TEXT_', '');
                    
                    if (!this.ruleExists(subject, 'IS', predicate)) {
                        this.rules.push(new Rule(subject, 'IS', predicate));
                    }
                }
            }
        }
    }
    
    getTextTypeAt(position) {
        const obj = this.objects.find(o => 
            o.position[0] === position[0] && 
            o.position[1] === position[1] && 
            o.isText
        );
        return obj ? obj.type : null;
    }
    
    ruleExists(subject, verb, predicate) {
        if (verb === 'IF' || verb === 'FEELING') {
            // For IF/FEELING rules, also check the condition property
            return this.rules.some(rule => 
                rule.subject === subject && 
                rule.verb === verb && 
                rule.predicate === predicate &&
                rule.isConditional
            );
        } else {
            return this.rules.some(rule => 
                rule.subject === subject && 
                rule.verb === verb && 
                rule.predicate === predicate
            );
        }
    }
    
    moveObject(obj, direction) {
        // Check if object can be moved (only YOU, PUSH, or TEXT objects can be moved)
        if (!obj.isYou && !obj.isPush && !obj.isText) {
            return false;
        }
        
        // Get the push chain starting from this object
        const chain = this.getPushChain(obj, direction);
        if (chain === null) {
            return false; // Can't push
        }
        
        // Move all objects in the chain
        for (let i = chain.length - 1; i >= 0; i--) {
            const chainObj = chain[i];
            chainObj.position = [
                chainObj.position[0] + direction[0],
                chainObj.position[1] + direction[1]
            ];
            // Mark as recently moved object (only non-YOU objects)
            if (!chainObj.isYou) {
                this.recentlyMovedObjects.add(chainObj);
            }
        }
        
        return true;
    }
    
    getPushChain(startObj, direction) {
        const chain = [startObj];
        let curPos = [
            startObj.position[0] + direction[0],
            startObj.position[1] + direction[1]
        ];
        
        while (true) {
            // Check bounds
            if (curPos[0] < 0 || curPos[0] >= this.gridSize[0] ||
                curPos[1] < 0 || curPos[1] >= this.gridSize[1]) {
                return null; // Can't push
            }
            
            // Get all objects at current position
            const objectsAtPos = this.objects.filter(o =>
                o.position[0] === curPos[0] && o.position[1] === curPos[1]
            );
            
            if (objectsAtPos.length === 0) {
                return chain; // Empty space, can push
            }
            
            // Check for STOP objects
            const stopObjects = objectsAtPos.filter(o => o.isStop);
            if (stopObjects.length > 0) {
                return null; // Blocked
            }
            
            // DEFEAT objects do not block movement - they only trigger defeat when overlapping with YOU objects
            
            // Check for SHUT objects
            const shutObjects = objectsAtPos.filter(o => o.isShut);
            if (shutObjects.length > 0) {
                // Check if the moving chain contains any TEXT objects - text objects can pass through SHUT
                const hasTextInChain = chain.some(o => o.isText);
                // Check if any object in the current moving chain has OPEN property
                const hasOpenInChain = chain.some(o => o.isOpen);
                
                if (hasTextInChain || hasOpenInChain) {
                    // TEXT objects or OPEN objects can pass through SHUT
                    return chain;
                } else {
                    return null; // Blocked by SHUT
                }
            }
            
            // Check for pushable objects (PUSH or TEXT)
            const pushableObjects = objectsAtPos.filter(o => o.isPush || o.isText);
            if (pushableObjects.length > 0) {

                // Add all pushable objects to the chain
                chain.push(...pushableObjects);
                curPos = [curPos[0] + direction[0], curPos[1] + direction[1]];
                continue;
            }
            
            // Check for WIN objects - allow entering WIN object's position
            const winObjects = objectsAtPos.filter(o => o.isWin);
            if (winObjects.length > 0) {
                // Don't add WIN objects to the push chain - they should be treated as overlap
                // But we need to mark them as recently moved for overlap detection
                winObjects.forEach(obj => this.recentlyMovedObjects.add(obj));
                return chain;
            }
            
            // Other cases: allow entering other non-STOP object positions
            return chain;
        }
    }
    
    processMove(direction) {
        if (this.dead || this.paused) return false;
        
        // Clear previous recently moved object tracking
        this.recentlyMovedObjects.clear();
        
        // Find YOU objects
        const youObjects = this.objects.filter(obj => obj.isYou);
        if (youObjects.length === 0) {
            this.dead = true;
            this.logMove(direction, false);
            return false;
        }
        
        // Save state BEFORE any movement attempt
        // This ensures we can undo even if the move fails
        this.saveState();
        
        // Move all YOU objects
        let anyMoved = false;
        for (const youObj of youObjects) {
            if (this.moveObject(youObj, direction)) {
                anyMoved = true;
            }
        }
        
        let moveLogged = false;
        let allMovedObjects = [];
        let overlapObjects = [];
        
        if (anyMoved) {
            
            // First parse rules and update properties
            this.parseRulesFromBoard(); // This already includes the call to updateObjectProperties()
            
            // Update operationState AFTER rule parsing to capture the new rules
            this.operationState = {
                objects: this.extractObjectsState(),
                current_rules: this.extractRulesState(),
                is_win: this.checkWinCondition(),
                is_dead: this.dead,
                has_control: this.hasPlayerControl(),
                has_overlap: this.checkForObjectOverlaps(),
                grid_size: this.gridSize,
                level_id: this.levelId
            };
            
            // Immediately handle DESTRUCT and collision (after property update, before marking handled)
            this.processDestruct();
            this.processOpenShutCollision();
            
            // Filter out recently-moved objects that have been deleted
            const validRecentlyMoved = new Set();
            for (const obj of this.recentlyMovedObjects) {
                if (this.objects.includes(obj)) {
                    validRecentlyMoved.add(obj);
                }
            }
            this.recentlyMovedObjects = validRecentlyMoved;
            
            // Save all moved objects information before clearing recentlyMovedObjects
            allMovedObjects = Array.from(this.recentlyMovedObjects);
            
            // Find overlap objects: objects that are at the same position as YOU objects
            // These are typically WIN, DEFEAT, or other non-pushable objects that the player moved into
            const youObjects = this.objects.filter(obj => obj.isYou);
            overlapObjects = [];
            
            for (const youObj of youObjects) {
                // Find all objects at the same position as this YOU object
                const objectsAtSamePosition = this.objects.filter(obj => 
                    !obj.isYou && 
                    obj.position[0] === youObj.position[0] && 
                    obj.position[1] === youObj.position[1]
                );
                
                // Add these objects to overlap list
                overlapObjects.push(...objectsAtSamePosition);
            }
            
            // Remove duplicates (in case multiple YOU objects are at the same position)
            overlapObjects = overlapObjects.filter((obj, index, self) => 
                index === self.findIndex(o => o === obj)
            );
            
            // Clear previous recently moved object tracking
            this.recentlyMovedObjects.clear();
            
            if (this.checkDefeat()) {
                this.dead = true;
                this.logMove(direction, false, allMovedObjects, overlapObjects);
                moveLogged = true;
                return false;
            }
            
            const winCondition = this.checkWinCondition();
            
            if (winCondition) {
                // Force the operation type to be overlap_win when win condition is detected
                this.logMove(direction, true, allMovedObjects, overlapObjects, 'overlap_win');
                moveLogged = true;
                return 'win';
            }
        }
        
        // Log the move operation (only if not already logged for win/defeat condition)
        if (!moveLogged) {
            this.logMove(direction, anyMoved, allMovedObjects, overlapObjects);
        }
        
        return anyMoved;
    }
    
    processDestruct() {
        /**
        * Handle DESTRUCT/IMPACT interaction:
        * If a position has destruct or impact object and that position still has other objects,
        * then remove all objects at that position (including destruct/impact object and other objects)
         */
        const objectsByPosition = {};
        
        // First group objects by position
        for (const obj of this.objects) {
            const key = `${obj.position[0]},${obj.position[1]}`;
            if (!objectsByPosition[key]) {
                objectsByPosition[key] = [];
            }
            objectsByPosition[key].push({
                obj: obj,
                index: this.objects.indexOf(obj)
            });
        }
        
        // Find objects to remove
        const toRemove = [];
        
        for (const key in objectsByPosition) {
            const objGroup = objectsByPosition[key];
            
            // Separate destruct/impact objects and other objects
            const destructObjects = objGroup.filter(item => item.obj.isDestruct || item.obj.isImpact);
            const nonDestructObjects = objGroup.filter(item => !item.obj.isDestruct && !item.obj.isImpact);
            
            // If the position has both destruct/impact objects and other objects
            if (destructObjects.length > 0 && nonDestructObjects.length > 0) {
                // Mark all objects for removal
                objGroup.forEach(item => toRemove.push(item.index));
            }
        }
        
        // Remove objects from high index to low index to avoid index issues
        toRemove.sort((a, b) => b - a).forEach(index => {
            this.objects.splice(index, 1);
        });
    }
    
    processOpenShutCollision() {
        // Handle OPEN and SHUT interactions
        const openObjects = this.objects.filter(obj => obj.isOpen);
        const shutObjects = this.objects.filter(obj => obj.isShut);
        const toRemove = new Set();
        
        for (const openObj of openObjects) {
            for (const shutObj of shutObjects) {
                if (openObj.position[0] === shutObj.position[0] &&
                    openObj.position[1] === shutObj.position[1]) {
                    // Mark both objects for removal
                    toRemove.add(openObj);
                    toRemove.add(shutObj);
                }
            }
        }
        
        // Remove objects after collecting all to avoid index issues
        if (toRemove.size > 0) {
            this.objects = this.objects.filter(obj => !toRemove.has(obj));
        }
    }
    
    checkDefeat() {
        const youObjects = this.objects.filter(obj => obj.isYou);
        const defeatObjects = this.objects.filter(obj => obj.isDefeat);
        
        for (const youObj of youObjects) {
            for (const defeatObj of defeatObjects) {
                if (youObj.position[0] === defeatObj.position[0] &&
                    youObj.position[1] === defeatObj.position[1] &&
                    youObj !== defeatObj) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    checkWinCondition() {
        // if already defeated, can't win
        if (this.dead) {
            return false;
        }
        
        const youObjects = this.objects.filter(obj => obj.isYou);
        const winObjects = this.objects.filter(obj => obj.isWin);
        
        if (winObjects.length === 0) return false;
        
        for (const youObj of youObjects) {
            for (const winObj of winObjects) {
                if (youObj.position[0] === winObj.position[0] &&
                    youObj.position[1] === winObj.position[1]) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    hasYouRule() {
        return this.objects.some(obj => obj.isYou);
    }
    
    saveState() {
        // Save current game state
        this.savedStates.push({
            objects: JSON.parse(JSON.stringify(this.objects)),
            rules: JSON.parse(JSON.stringify(this.rules)),
            playerPosition: this.playerPosition ? {...this.playerPosition} : null
        });
        
        // Save the previous operation state before updating it
        this.previousOperationState = this.operationState ? JSON.parse(JSON.stringify(this.operationState)) : null;

        // Add complete game state analysis
        this.operationState = {
            objects: this.extractObjectsState(),
            current_rules: this.extractRulesState(),
            is_win: this.checkWinCondition(),
            is_dead: this.dead,
            has_control: this.hasPlayerControl(),
            has_overlap: this.checkForObjectOverlaps(),
            grid_size: this.gridSize,
            level_id: this.levelId
        };
        
        this.operationCount++;
    }
    
    extractObjectsState() {
        // Extract all game object states
        const objects = [];
        for (const obj of this.objects) {
            objects.push({
                type: obj.type,
                position: obj.position,
                is_text: obj.isText,
                properties: this.getObjectProperties(obj)
            });
        }
        return objects;
    }
    
    extractRulesState() {
        // Extract current all rules
        return this.rules.map(rule => [rule.subject, rule.verb, rule.predicate]);
    }
    
    getObjectProperties(obj) {
        // Get all object properties
        const properties = [];
        if (obj.isYou) properties.push("YOU");
        if (obj.isStop) properties.push("STOP");
        if (obj.isPush) properties.push("PUSH");
        if (obj.isWin) properties.push("WIN");
        if (obj.isDefeat) properties.push("DEFEAT");
        if (obj.isDestruct) properties.push("DESTRUCT");
        if (obj.isImpact) properties.push("IMPACT");
        if (obj.isShut) properties.push("SHUT");
        if (obj.isOpen) properties.push("OPEN");
        // Add more possible properties
        return properties;
    }
    
    checkForObjectOverlaps() {
        // Check if there are object overlaps
        const positionMap = {};
        for (const obj of this.objects) {
            const key = `${obj.position[0]},${obj.position[1]}`;
            if (!positionMap[key]) {
                positionMap[key] = [];
            }
            positionMap[key].push(obj);
        }
        
        // Check if there are positions containing multiple objects
        for (const key in positionMap) {
            if (positionMap[key].length > 2) {
                return true;
            }
        }
        return false;
    }
    
    hasPlayerControl() {
        // Check if player has control
        return Boolean(this.playerPosition);
    }
    
    logMove(direction, success, allMovedObjects = [], overlapObjects = [], forcedOperationType = null) {
        const currentTime = Date.now();
        const timeSinceStart = currentTime - this.startTime;
        const timeSinceLastMove = currentTime - this.lastMoveTime;
        
        // Record move timestamp
        const moveTimestamp = {
            move_number: this.operationCount,
            time_since_start_ms: timeSinceStart,
            time_since_last_move_ms: timeSinceLastMove,
            is_meta_operation: false,
            meta_type: null,
            direction: direction,
            was_successful: success
        };
        this.moveTimestamps.push(moveTimestamp);
        
        // Record move operation
        this.logOperation(direction, success, allMovedObjects, overlapObjects, forcedOperationType, currentTime);
    }
    
    logOperation(direction, success, allMovedObjects = [], overlapObjects = [], forcedOperationType = null, currentTime = null) {
        if (!currentTime) {
            currentTime = Date.now();
        }
        
        // record move operation
        const lastState = this.previousOperationState;
        
        // if it's the first move, we still want to record the operation but with no rule changes
        if (!lastState) {
            // for first move, create a basic operation analysis without rule changes
            const operationAnalysis = {
                content_type: "move_only",
                text_count: 0,
                text_types: [],
                object_count: 0,
                object_types: [],
                objects_involved: [],
                rules_affected: { effect: "none", rules_added: [], rules_removed: [] },
                move_number: this.operationCount,
                timestamp: currentTime
            };
            
            this.operationAnalyses.push(operationAnalysis);
            this.lastOperationAnalysis = operationAnalysis;
            this.lastMoveTime = currentTime;
            return;
        }
        
        // Analyze moved objects
        let movedObjects = [];
        if (success && this.playerPosition) {
            const px = this.playerPosition.x;
            const py = this.playerPosition.y;
            const tx = px + direction[0];
            const ty = py + direction[1];
            
            // Find pushed objects (objects that were actually moved, not overlapped)
            movedObjects = this.findMovedObjects(px, py, direction, allMovedObjects, overlapObjects);
        }
        
        
        
        const ruleEffect = this.analyzeRuleChanges(lastState.current_rules, this.operationState.current_rules);
        
        // create operation analysis
        const operationType = forcedOperationType || this.classifyOperationType(movedObjects, overlapObjects);
        
        
        const operationAnalysis = {
            content_type: operationType,
            text_count: movedObjects.filter(obj => obj.is_text).length,
            text_types: movedObjects.filter(obj => obj.is_text).map(obj => obj.type),
            object_count: movedObjects.filter(obj => !obj.is_text).length,
            object_types: movedObjects.filter(obj => !obj.is_text).map(obj => obj.type),
            objects_involved: movedObjects,
            rules_affected: ruleEffect,
            move_number: this.operationCount,
            timestamp: currentTime
        };
        
        // Store operation analysis (only for regular moves, not meta operations)
        if (!forcedOperationType || !["undo", "pause", "resume", "restart"].includes(forcedOperationType)) {
            this.operationAnalyses.push(operationAnalysis);
            this.lastOperationAnalysis = operationAnalysis;
            
            // Update rule operation stats
            this.updateRuleOperationStats(ruleEffect);
        }
        
        // Update last move time
        this.lastMoveTime = currentTime;
    }
    
    findMovedObjects(playerX, playerY, direction, allMovedObjects = [], overlapObjects = []) {
        // Find objects that were actually moved by the player (not overlapped)
        const movedObjects = [];
        
        // Include all non-YOU objects that were moved (including those that might be overlapping)
        // This ensures that pushed objects are recorded even if they end up overlapping
        allMovedObjects.forEach(obj => {
            // Skip the player object itself
            if (!obj.isYou) {
                movedObjects.push({
                    type: obj.type,
                    position: obj.position,
                    is_text: obj.isText,
                    properties: this.getObjectProperties(obj)
                });
            }
        });
        
        return movedObjects;
    }
    
    analyzeRuleChanges(oldRules, newRules) {
        if (!oldRules || !newRules) {
            return { effect: "none", rules_added: [], rules_removed: [] };
        }
        
        // Convert rule arrays to strings for comparison
        const oldRuleSet = new Set(oldRules.map(r => JSON.stringify(r)));
        const newRuleSet = new Set(newRules.map(r => JSON.stringify(r)));
        // Find added and removed rules
        const added = [];
        const removed = [];
        
        newRules.forEach(rule => {
            const ruleStr = JSON.stringify(rule);
            if (!oldRuleSet.has(ruleStr)) {
                added.push(rule);
            }
        });
        
        oldRules.forEach(rule => {
            const ruleStr = JSON.stringify(rule);
            if (!newRuleSet.has(ruleStr)) {
                removed.push(rule);
            }
        });
        
        // determine rule change type
        let effect = "none";
        if (added.length > 0 && removed.length > 0) {
            effect = "modified";
        } else if (added.length > 0) {
            effect = "created";
        } else if (removed.length > 0) {
            effect = "destroyed";
        }
        
        const result = {
            effect,
            rules_added: added,
            rules_removed: removed
        };
        
        return result;
    }
    
    classifyOperationType(movedObjects, overlapObjects = [], operationType = null) {
        // 如果指定了操作类型（如元操作），直接返回
        if (operationType) {
            return operationType;
        }
        
        // 添加调试信息
        console.log('=== classifyOperationType DEBUG ===');
        console.log('movedObjects:', movedObjects.map(obj => ({
            type: obj.type,
            isText: obj.isText,
            is_text: obj.is_text,
            position: obj.position
        })));
        
        // additional debug: check if any overlap objects actually have WIN property
        if (overlapObjects && overlapObjects.length > 0) {
            const winObjectsInOverlap = overlapObjects.filter(obj => 
                obj.isWin || (obj.properties && obj.properties.includes("WIN"))
            );
            console.log('classifyOperationType - win objects in overlap:', winObjectsInOverlap.map(obj => ({
                type: obj.type,
                isWin: obj.isWin,
                properties: obj.properties,
                position: obj.position
            })));
        }
        
        // classify operation type based on moved objects
        if (!movedObjects || movedObjects.length === 0) {
            // Check for overlap cases
            if (overlapObjects.length > 0) {
                // Determine overlap type based on object properties
                const winObjects = overlapObjects.filter(obj => 
                    obj.isWin || (obj.properties && obj.properties.includes("WIN"))
                );
                const defeatObjects = overlapObjects.filter(obj => 
                    obj.isDefeat || (obj.properties && obj.properties.includes("DEFEAT"))
                );
                
                if (winObjects.length > 0) {
                    return "overlap_win";
                } else if (defeatObjects.length > 0) {
                    return "overlap_defeat";
                } else {
                    return "overlap_object";
                }
            }
            return "move_only";
        }
        
        // check if only text objects were pushed
        const textObjects = movedObjects.filter(obj => obj.is_text);
        const nonTextObjects = movedObjects.filter(obj => !obj.is_text);
        
        console.log('textObjects count:', textObjects.length);
        console.log('nonTextObjects count:', nonTextObjects.length);
        console.log('textObjects:', textObjects.map(obj => obj.type));
        console.log('nonTextObjects:', nonTextObjects.map(obj => obj.type));
        
        if (textObjects.length > 0 && nonTextObjects.length === 0) {
            console.log('Returning: push_text');
            return "push_text";
        } else if (nonTextObjects.length > 0) {
            console.log('Returning: push_object');
            return "push_object";
        }
        
        console.log('Returning: move_only');
        return "move_only";
    }
    
    initRuleOperationStats() {
        // initialize rule operation stats
        this.ruleOperationStats = {
            total_rule_operations: 0,
            rule_creation_count: 0,
            rule_destruction_count: 0,
            rule_modification_count: 0,
            rule_types: {
                movement_rules: 0,
                transformation_rules: 0,
                property_rules: 0,
                win_condition_rules: 0
            }
        };
    }
    
    updateRuleOperationStats(ruleEffect) {
        // ensure stats object is initialized
        if (!this.ruleOperationStats) {
            this.initRuleOperationStats();
        }
        
        // only update stats when there are rule changes
        if (ruleEffect.effect === "none") return;
        
        this.ruleOperationStats.total_rule_operations++;
        
        // update rule change type count
        if (ruleEffect.effect === "created") {
            this.ruleOperationStats.rule_creation_count++;
        } else if (ruleEffect.effect === "destroyed") {
            this.ruleOperationStats.rule_destruction_count++;
        } else if (ruleEffect.effect === "modified") {
            this.ruleOperationStats.rule_modification_count++;
        }
        
        // analyze rule type
        const allRules = [...ruleEffect.rules_added, ...ruleEffect.rules_removed];
        allRules.forEach(rule => {
            if (!rule || rule.length < 3) return;
            
            const object = rule[2].toLowerCase();
            
            // classify rule type based on actual game elements and properties
            if (object === "you") {
                this.ruleOperationStats.rule_types.movement_rules++;
            } else if (["pumpkin", "cloud", "dice", "sun", "pool", "bomb", "chain", "key", "anchor"].includes(object)) {
                this.ruleOperationStats.rule_types.transformation_rules++;
            } else if (["push", "stop", "defeat", "red", "destruct", "impact", "shut", "open"].includes(object)) {
                this.ruleOperationStats.rule_types.property_rules++;
            } else if (object === "win") {
                this.ruleOperationStats.rule_types.win_condition_rules++;
            }
        });
    }
    
    getRuleOperationStats() {
        // get rule operation stats
        return this.ruleOperationStats || this.initRuleOperationStats();
    }
    
    undo() {
        if (this.savedStates.length > 0) {
            const currentTime = Date.now();
            const timeSinceStart = currentTime - this.startTime;
            const timeSinceLastMove = currentTime - this.lastMoveTime;
            
            // Record undo operation timestamp
            const moveTimestamp = {
                move_number: this.operationCount,
                time_since_start_ms: timeSinceStart,
                time_since_last_move_ms: timeSinceLastMove,
                is_meta_operation: true,
                meta_type: "undo",
                direction: [0, 0],
                was_successful: true
            };
            this.moveTimestamps.push(moveTimestamp);
            
            // Save current state before undoing for analysis
            const currentState = {
                objects: this.extractObjectsState(),
                current_rules: this.extractRulesState()
            };
            
            const lastState = this.savedStates.pop();
            this.objects = lastState.objects;
            this.rules = lastState.rules;
            this.operationCount--;
            this.dead = false;
            // remove recently moved objects
            this.recentlyMovedObjects.clear();
            
            // Parse rules after restoring state
            this.parseRulesFromBoard();
            
            // Update object properties after restoring state
            this.updateObjectProperties();
            
            // Update operation state after undo
            this.operationState = {
                objects: this.extractObjectsState(),
                current_rules: this.extractRulesState(),
                is_win: this.checkWinCondition(),
                is_dead: this.dead,
                has_control: this.hasPlayerControl(),
                has_overlap: this.checkForObjectOverlaps(),
                grid_size: this.gridSize,
                level_id: this.levelId
            };
            
            // Analyze what was undone
            const ruleEffect = this.analyzeRuleChanges(currentState.current_rules, this.operationState.current_rules);
            
            // Create undo operation analysis
            const undoAnalysis = {
                content_type: "undo",
                text_count: 0,
                text_types: [],
                object_count: 0,
                object_types: [],
                objects_involved: [],
                rules_affected: ruleEffect,
                move_number: this.operationCount,
                timestamp: currentTime,
                undo_details: {
                    previous_operation_count: this.operationCount + 1,
                    restored_objects_count: this.objects.length,
                    restored_rules_count: this.rules.length
                }
            };
            
            // Store undo operation analysis
            this.operationAnalyses.push(undoAnalysis);
            this.lastOperationAnalysis = undoAnalysis;
            
            // Update rule operation stats
            this.updateRuleOperationStats(ruleEffect);
            
            // Log the undo operation
            this.logOperation([0, 0], true, [], [], "undo", currentTime);
            
            this.lastMoveTime = currentTime;
        }
    }
    
    getRemainingTime() {
        if (this.paused) return this.timeLimit;
        
        const elapsed = (Date.now() - this.startTime - this.totalPauseTime) / 1000;
        return Math.max(0, this.timeLimit - elapsed);
    }
    
    pause() {
        if (!this.paused) {
            const currentTime = Date.now();
            const timeSinceStart = currentTime - this.startTime;
            const timeSinceLastMove = currentTime - this.lastMoveTime;
            
            // Record pause operation timestamp
            const moveTimestamp = {
                move_number: this.operationCount,
                time_since_start_ms: timeSinceStart,
                time_since_last_move_ms: timeSinceLastMove,
                is_meta_operation: true,
                meta_type: "pause",
                direction: [0, 0],
                was_successful: true
            };
            this.moveTimestamps.push(moveTimestamp);
            
            // Create pause operation analysis
            const pauseAnalysis = {
                content_type: "pause",
                text_count: 0,
                text_types: [],
                object_count: 0,
                object_types: [],
                objects_involved: [],
                rules_affected: { effect: "none", rules_added: [], rules_removed: [] },
                move_number: this.operationCount,
                timestamp: currentTime,
                pause_details: {
                    remaining_time: this.getRemainingTime(),
                    total_pause_time: this.totalPauseTime
                }
            };
            
            // Store pause operation analysis
            this.operationAnalyses.push(pauseAnalysis);
            this.lastOperationAnalysis = pauseAnalysis;
            
            // Log the pause operation
            this.logOperation([0, 0], true, [], [], "pause", currentTime);
            
            this.paused = true;
            this.pauseTime = Date.now();
            this.lastMoveTime = currentTime;
        }
    }
    
    resume() {
        if (this.paused) {
            const currentTime = Date.now();
            const timeSinceStart = currentTime - this.startTime;
            const timeSinceLastMove = currentTime - this.lastMoveTime;
            
            // Record resume operation timestamp
            const moveTimestamp = {
                move_number: this.operationCount,
                time_since_start_ms: timeSinceStart,
                time_since_last_move_ms: timeSinceLastMove,
                is_meta_operation: true,
                meta_type: "resume",
                direction: [0, 0],
                was_successful: true
            };
            this.moveTimestamps.push(moveTimestamp);
            
            // Create resume operation analysis
            const resumeAnalysis = {
                content_type: "resume",
                text_count: 0,
                text_types: [],
                object_count: 0,
                object_types: [],
                objects_involved: [],
                rules_affected: { effect: "none", rules_added: [], rules_removed: [] },
                move_number: this.operationCount,
                timestamp: currentTime,
                resume_details: {
                    pause_duration: currentTime - this.pauseTime,
                    total_pause_time: this.totalPauseTime + (currentTime - this.pauseTime),
                    remaining_time: this.getRemainingTime()
                }
            };
            
            // Store resume operation analysis
            this.operationAnalyses.push(resumeAnalysis);
            this.lastOperationAnalysis = resumeAnalysis;
            
            // Log the resume operation
            this.logOperation([0, 0], true, [], [], "resume", currentTime);
            
            this.paused = false;
            this.totalPauseTime += currentTime - this.pauseTime;
            this.pauseTime = 0;
            this.lastMoveTime = currentTime;
        }
    }
    
    restart() {
        const currentTime = Date.now();
        const timeSinceStart = currentTime - this.startTime;
        const timeSinceLastMove = currentTime - this.lastMoveTime;
        
        // Record restart operation timestamp
        const moveTimestamp = {
            move_number: this.operationCount,
            time_since_start_ms: timeSinceStart,
            time_since_last_move_ms: timeSinceLastMove,
            is_meta_operation: true,
            meta_type: "reset",
            direction: [0, 0],
            was_successful: true
        };
        this.moveTimestamps.push(moveTimestamp);
        
        // Create restart operation analysis
        const restartAnalysis = {
            content_type: "restart",
            text_count: 0,
            text_types: [],
            object_count: 0,
            object_types: [],
            objects_involved: [],
            rules_affected: { effect: "none", rules_added: [], rules_removed: [] },
            move_number: this.operationCount,
            timestamp: currentTime,
            restart_details: {
                previous_operation_count: this.operationCount,
                elapsed_time: timeSinceStart / 1000,
                remaining_time: this.getRemainingTime()
            }
        };
        
        // Store restart operation analysis
        this.operationAnalyses.push(restartAnalysis);
        this.lastOperationAnalysis = restartAnalysis;
        
        // Log the restart operation
        this.logOperation([0, 0], true, [], [], "restart", currentTime);
        
        // Reset to initial state (but keep the original start time)
        this.dead = false;
        this.paused = false;
        // do not reset start time, keep the original 8 minutes limit
        // this.startTime = Date.now();  
        // this.totalPauseTime = 0;      
        this.operationCount = 0;
        this.errorAttempts = 0;
        this.savedStates = [];
        
        // remove recently moved objects
        this.recentlyMovedObjects.clear();
        
        // Reset data collection
        this.moveTimestamps = [];
        this.operationAnalyses = [];
        this.lastMoveTime = this.startTime;
        this.initRuleOperationStats();
        
        // Reload level
        this.initializeObjects(this.initialElements || []);
        this.initializeRules();
        this.updateObjectProperties();
        this.parseRulesFromBoard();
    }
    
    getGameState() {
        return {
            gridSize: this.gridSize,
            objects: this.objects,
            rules: this.rules,
            dead: this.dead,
            paused: this.paused,
            remainingTime: this.getRemainingTime(),
            operationCount: this.operationCount,
            hasYou: this.hasYouRule(),
            won: this.checkWinCondition()
        };
    }
    
    getFinalState() {
        return {
            objects: this.objects.map(obj => ({
                type: obj.type,
                position: obj.position,
                isText: obj.isText,
                properties: this.getObjectProperties(obj)
            })),
            current_rules: this.rules.map(rule => [rule.subject, rule.verb, rule.predicate]),
            is_win: this.checkWinCondition(),
            is_dead: this.dead,
            has_control: this.hasPlayerControl(),
            has_overlap: this.checkForObjectOverlaps(),
            grid_size: this.gridSize,
            level_id: this.levelId
        };
    }
    
    getDetailedData() {
        return {
            move_timestamps: this.moveTimestamps,
            operation_analyses: this.operationAnalyses,
            rule_operation_stats: this.getRuleOperationStats(),
            final_state: this.getFinalState()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BabaGameEngine, GameObject, Rule };
} else {
    window.BabaGameEngine = BabaGameEngine;
    window.GameObject = GameObject;
    window.Rule = Rule;
} 