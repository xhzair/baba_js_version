/**
 * Baba is You - 实验条件定义文件
 * 
 * 本文件定义了实验中使用的不同条件，特别是操控游戏元素与玩家日常生活经验的匹配程度：
 * - high-prior: 游戏元素与现实生活经验高度相关
 * - low-prior: 游戏元素与现实生活经验相关度较低
 */

const EXPERIMENTAL_CONDITIONS = {
    /**
     * 默认条件映射
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
     * 核心互动: 理解环境中障碍物的阻挡作用，找到通向目标的路径
     * 关键元素: 围成封闭空间的对象 (POOL 或 BALLOON)
     */
    journey_environment: {
        // 与先验经验高度相关的设置 - 使用水池围成封闭空间
        "high-prior": {
            you_obj: "PUMPKIN",   // 可控制对象
            win_obj: "SUN",       // 胜利目标
            stop_obj: "DICE",     // 这里stop_obj用于障碍物，而不是围成封闭空间的元素
            boundary_obj: "POOL"  // 使用水池围成封闭空间，更符合不可穿越的直觉
        },
        // 与先验经验相关度较低的设置 - 使用气球围成封闭空间
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            stop_obj: "DICE",     
            boundary_obj: "BALLOON" // 气球作为围栏与先验经验相关度较低
        }
    },

    /**
     * Journey: Bridge Building (journey_understandproperty)
     * 
     * 核心互动: 理解DESTRUCT/IMPACT属性的交互，构建通路
     * 关键属性: DESTRUCT/IMPACT（接触消失）
     */
    journey_understandproperty: {
        // 与先验经验高度相关的设置
        "high-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            push_obj: "DICE",      // 骰子可以推动符合直觉
            destruct_obj: "BOMB",  // 炸弹会破坏接触到的物体符合直觉
            destruct_property: "DESTRUCT" // 属性名：炸弹破坏物体
        },
        // 与先验经验相关度较低的设置
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            push_obj: "TREE",      // 树通常不可移动
            destruct_obj: "BOMB",  // 保持炸弹作为对象
            destruct_property: "IMPACT" // 属性名：炸弹"撞击"物体与先验经验相关度较低
        }
    },

    /**
     * Journey: Locked In (journey_switchidentity)
     * 
     * 核心互动: 需要变换物体身份
     */
    journey_switchidentity: {
        // 与先验经验高度相关的设置
        "high-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            shut_obj: "CHAIN",    // 链条有锁住功能符合直觉
            red_obj: "ANCHOR",    // 锚与链条在现实中有很强关联，常常一起使用
        },
        // 与先验经验相关度较低的设置
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            shut_obj: "CHAIN",    // 保持锁住功能
            red_obj: "FAN",       // 风扇与链条关联性较低，不易建立概念联系
        }
    },

    /**
     * Journey: Combination (journey_combination)
     * 
     * 核心互动: 理解SHUT和OPEN属性的组合使用
     * 关键属性: SHUT（锁住）, OPEN（开启）
     */
    journey_combination: {
        // 与先验经验高度相关的设置
        "high-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            shut_obj: "DOOR",    // 门可以锁住符合直觉
            open_obj: "KEY",     // 钥匙可以开门符合直觉
        },
        // 与先验经验相关度较低的设置
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            shut_obj: "TREE",    // 树不是用来锁住的
            open_obj: "ROSE",    // 玫瑰不能开启事物
        }
    },

    /**
     * Journey: Breaking Rules (journey_break)
     * 
     * 核心互动: 理解如何通过操作规则文本来改变游戏规则
     * 关键属性: 变动规则
     */
    journey_break: {
        // 与先验经验高度相关的设置
        "high-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            defeat_obj: "BOMB",   // 炸弹会击败你符合直觉
        },
        // 与先验经验相关度较低的设置
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            defeat_obj: "CANDLE",  // 蜡烛击败你与先验经验相关度较低
        }
    },

    /**
     * Journey: Grammar Rules (journey_grammar)
     * 
     * 核心互动: 理解游戏的语法规则，组合不同的语句
     * 关键属性: 多种规则组合
     */
    journey_grammar: {
        // 与先验经验高度相关的设置
        "high-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            if_property: "IF"     // 使用常见的条件语句IF
        },
        // 与先验经验相关度较低的设置
        "low-prior": {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            feeling_property: "FEELING"  // 使用不直观的FEELING替代IF
        }
    }
};

/**
 * 获取指定关卡和条件的对象映射
 * @param {string} levelId - 关卡ID
 * @param {string} conditionType - 条件类型 ('high-prior'或'low-prior')
 * @returns {Object} 对象映射
 */
function getExperimentalCondition(levelId, conditionType = 'high-prior') {
    // 提取关卡基本ID（移除journey_前缀）
    const baseId = levelId.startsWith('journey_') ? levelId : null;
    
    // 如果找到关卡特定条件配置
    if (baseId && EXPERIMENTAL_CONDITIONS[baseId] && EXPERIMENTAL_CONDITIONS[baseId][conditionType]) {
        // 合并默认条件和特定条件
        return {
            ...EXPERIMENTAL_CONDITIONS.default,
            ...EXPERIMENTAL_CONDITIONS[baseId][conditionType]
        };
    }
    
    // 如果没有找到特定配置，返回默认配置
    return EXPERIMENTAL_CONDITIONS.default;
}

/**
 * 获取可用的条件类型
 * @returns {string[]} 条件类型列表
 */
function getConditionTypes() {
    return ['high-prior', 'low-prior'];
}

/**
 * 获取所有关卡的条件设置
 * @returns {Object} 包含所有关卡条件的对象
 */
function getAllConditions() {
    return EXPERIMENTAL_CONDITIONS;
}

// 导出函数和条件
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