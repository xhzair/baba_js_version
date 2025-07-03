/**
 * Baba is You - Experimental Conditions Definition File
 * 
 * This file defines different conditions used in the experiment, especially the match between game elements and players' daily life experience:
 * - high-prior: Game elements are highly related to real life experience
 * - low-prior: Game elements are less related to real life experience
 */

const EXPERIMENTAL_CONDITIONS = {
    /**
     * Default Condition Mapping
     */
    default: {
        you_obj: "PUMPKIN",
        win_obj: "SUN",
        push_obj: "CLOUD",
        stop_obj: "DICE",
        destruct_obj: "BOMB",
        destruct_property: "DESTRUCT",
        shut_obj: "CHAIN",
        red_obj: "ANCHOR",
        defeat_obj: "BOMB",
        open_obj: "KEY",
        if_property: "IF",
        feeling_property: "FEELING"
    },

    /**
     * Journey: Grass Yard (journey_environment)
     * 
     * Core Interaction: Understand the blocking effect of obstacles in the environment, find the path to the target
     * Key Element: Objects forming a closed space (POOL or BALLOON)
     */
    journey_environment: {
        // High-prior setting - Use pool to form a closed space
        "high-prior": {
            you_obj: "PUMPKIN",   // Controllable object
            win_obj: "SUN",       // Victory target
            stop_obj: "DICE",     // Here stop_obj is used for obstacles, not for forming a closed space
            boundary_obj: "POOL"  // Use pool to form a closed space, more in line with the intuition of being uncrossable
        },
        // Low-prior setting - Use balloon to form a closed space
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            stop_obj: "DICE",     
            boundary_obj: "BALLOON" // Balloon as a fence, less related to prior experience
        }
    },

    /**
     * Journey: Bridge Building (journey_understandproperty)
     * 
     * Core Interaction: Understand the interaction of DESTRUCT/IMPACT attributes, build a path
     * Key Attribute: DESTRUCT/IMPACT (contact disappears)
     */
    journey_understandproperty: {
        // High-prior setting
        "high-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            push_obj: "DICE",      // Dice can be pushed, in line with intuition
            destruct_obj: "BOMB",  // Bomb will destroy the object it contacts, in line with intuition
            destruct_property: "DESTRUCT" // Attribute name: Bomb destroys object
        },
        // Low-prior setting
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            push_obj: "DICE",      // Dice can be pushed, in line with intuition
            destruct_obj: "BOMB",  // Keep the bomb as an object
            destruct_property: "IMPACT" // property name: bomb "impact" object, less related to prior experience
        }
    },

    /**
     * Journey: Locked In (journey_switchidentity)
     * 
     * Core Interaction: Need to switch object identity
     */
    journey_switchidentity: {
        // High-prior setting
        "high-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            shut_obj: "CHAIN",    // Chain has locking function, in line with intuition
            red_obj: "ANCHOR",    // Anchor and chain are strongly associated in reality, often used together
        },
        // Low-prior setting
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            shut_obj: "CHAIN",    // Keep locking function
            red_obj: "FAN",       // Fan is less related to the concept of locking, difficult to establish a concept connection
        }
    },

    /**
     * Journey: Combination (journey_combination)
     * 
     * Core Interaction: Understand the combination use of SHUT and OPEN attributes
     * Key Attribute: SHUT (lock), OPEN (open)
     */
    journey_combination: {
        // High-prior setting
        "high-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            shut_obj: "DOOR",    // Door can lock, in line with intuition
            open_obj: "KEY",     // Key can open door, in line with intuition
        },
        // Low-prior setting
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            shut_obj: "TREE",    // Tree is not used for locking
            open_obj: "ROSE",    // Rose cannot open things
        }
    },

    /**
     * Journey: Breaking Rules (journey_break)
     * 
     * Core Interaction: Understand how to change game rules by manipulating text rules
     * Key Attribute: Change rules
     */
    journey_break: {
        // High-prior setting
        "high-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            defeat_obj: "BOMB",   // Bomb will defeat you, in line with intuition
        },
        // Low-prior setting
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            defeat_obj: "CANDLE",  // Candle defeats you, less related to prior experience
        }
    },

    /**
     * Journey: Grammar Rules (journey_grammar)
     * 
     * Core Interaction: Understand the grammar rules of the game, combine different sentences
     * Key Attribute: Multiple rule combinations
     */
    journey_grammar: {
        // High-prior setting
        "high-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            if_property: "IF"     // Use common IF statement
        },
        // Low-prior setting
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            if_property: "FEELING"  // Use non-intuitive FEELING instead of IF
        }
    }
};

/**
 * Get Object Mapping for a Specific Level and Condition
 * @param {string} levelId - Level ID
 * @param {string} conditionType - Condition type ('high-prior' or 'low-prior')
 * @returns {Object} Object mapping
 */
function getExperimentalCondition(levelId, conditionType = 'high-prior') {
    // Extract basic ID of the level (remove journey_ prefix)
    const baseId = levelId.startsWith('journey_') ? levelId : null;
    
    // If specific level condition configuration is found
    if (baseId && EXPERIMENTAL_CONDITIONS[baseId] && EXPERIMENTAL_CONDITIONS[baseId][conditionType]) {
        // Merge default condition and specific condition
        return {
            ...EXPERIMENTAL_CONDITIONS.default,
            ...EXPERIMENTAL_CONDITIONS[baseId][conditionType]
        };
    }
    
    // If no specific configuration is found, return default configuration
    return EXPERIMENTAL_CONDITIONS.default;
}

/**
 * Get Available Condition Types
 * @returns {string[]} List of condition types
 */
function getConditionTypes() {
    return ['high-prior', 'low-prior'];
}

/**
 * Get Condition Settings for All Levels
 * @returns {Object} Object containing conditions for all levels
 */
function getAllConditions() {
    return EXPERIMENTAL_CONDITIONS;
}

// Export functions and conditions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EXPERIMENTAL_CONDITIONS,
        getExperimentalCondition,
        getConditionTypes,
        getAllConditions
    };
} else {
    window.EXPERIMENTAL_CONDITIONS = EXPERIMENTAL_CONDITIONS;
    window.getExperimentalCondition = getExperimentalCondition;
    window.getConditionTypes = getConditionTypes;
    window.getAllConditions = getAllConditions;
} 