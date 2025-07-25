/**
 * Baba is You Level Data - JavaScript Implementation
 * 从原版levels.json转换而来的关卡数据
 */

const LEVEL_DATA = {
    tutorial: [
        {
            level_id: "tutorial_1",
            name: "Who are you?",
            grid_size: [13, 9],
            elements: [
                {type: "TEXT_PUMPKIN", pos: [2, 1], properties: ["text"]},
                {type: "TEXT_IS", pos: [3, 1], properties: ["text"]},
                {type: "TEXT_YOU", pos: [4, 1], properties: ["text"]},
                
                {type: "TEXT_CLOUD", pos: [9, 1], properties: ["text"]},
                {type: "TEXT_IS", pos: [10, 1], properties: ["text"]},
                {type: "TEXT_STOP", pos: [11, 1], properties: ["text"]},
                
                {type: "TEXT_DICE", pos: [2, 7], properties: ["text"]},
                {type: "TEXT_IS", pos: [3, 7], properties: ["text"]},
                {type: "TEXT_PUSH", pos: [4, 7], properties: ["text"]},
                
                {type: "TEXT_SUN", pos: [9, 7], properties: ["text"]},
                {type: "TEXT_IS", pos: [10, 7], properties: ["text"]},
                {type: "TEXT_WIN", pos: [11, 7], properties: ["text"]},
                
                {type: "PUMPKIN", pos: [3, 4], properties: ["you"]},
                {type: "SUN", pos: [9, 4], properties: ["win"]},
                {type: "DICE", pos: [6, 3], properties: ["push"]},
                {type: "DICE", pos: [6, 4], properties: ["push"]},
                {type: "DICE", pos: [6, 5], properties: ["push"]},
                
                {type: "CLOUD", pos: [2, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [3, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [4, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [5, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [6, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [7, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [8, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [9, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [10, 2], properties: ["stop"]},
                
                {type: "CLOUD", pos: [2, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [3, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [4, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [5, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [6, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [7, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [8, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [9, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [10, 6], properties: ["stop"]}
            ]
        },
        {
            level_id: "tutorial_2",
            name: "Rule Maker",
            grid_size: [13, 9],
            elements: [
                {type: "TEXT_PUMPKIN", pos: [2, 1], properties: ["text"]},
                {type: "TEXT_IS", pos: [3, 1], properties: ["text"]},
                {type: "TEXT_YOU", pos: [4, 1], properties: ["text"]},
                
                {type: "TEXT_CLOUD", pos: [9, 1], properties: ["text"]},
                {type: "TEXT_IS", pos: [10, 1], properties: ["text"]},
                {type: "TEXT_STOP", pos: [11, 1], properties: ["text"]},
                
                {type: "TEXT_DICE", pos: [3, 7], properties: ["text"]},
                {type: "TEXT_IS", pos: [6, 7], properties: ["text"]},
                {type: "TEXT_WIN", pos: [8, 7], properties: ["text"]},
                
                {type: "TEXT_SUN", pos: [10, 7], properties: ["text"]},
                
                {type: "PUMPKIN", pos: [4, 4], properties: ["you"]},
                {type: "DICE", pos: [7, 3], properties: []},
                {type: "DICE", pos: [7, 4], properties: []},
                {type: "DICE", pos: [7, 5], properties: []},
                {type: "SUN", pos: [10, 4], properties: []},
                
                {type: "CLOUD", pos: [2, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [3, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [4, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [5, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [6, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [7, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [8, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [9, 2], properties: ["stop"]},
                {type: "CLOUD", pos: [10, 2], properties: ["stop"]},
                
                {type: "CLOUD", pos: [2, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [3, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [4, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [5, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [6, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [7, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [8, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [9, 6], properties: ["stop"]},
                {type: "CLOUD", pos: [10, 6], properties: ["stop"]}
            ]
        }
    ],
    
    journey_templates: [
        {
            level_id: "journey_environment",
            name: "Grass Yard",
            grid_size: [14, 12],
            required_objects: ["you_obj", "win_obj", "stop_obj"],
            elements: [
                {type: "TEXT_${you_obj}", pos: [0, 0], properties: ["text"]}, 
                {type: "TEXT_IS", pos: [1, 0], properties: ["text"]}, 
                {type: "TEXT_YOU", pos: [2, 0], properties: ["text"]},
                
                {type: "TEXT_${stop_obj}", pos: [0, 1], properties: ["text"]},
                {type: "TEXT_IS", pos: [1, 1], properties: ["text"]},
                {type: "TEXT_STOP", pos: [2, 1], properties: ["text"]},

                {type: "TEXT_${win_obj}", pos: [6, 7], properties: ["text"]},
                {type: "TEXT_IS", pos: [8, 10], properties: ["text"]},
                {type: "TEXT_WIN", pos: [9, 7], properties: ["text"]},

                {type: "POOL", pos: [2, 2]},
                {type: "POOL", pos: [2, 3]},
                {type: "POOL", pos: [2, 4]},
                {type: "POOL", pos: [2, 5]},
                {type: "POOL", pos: [2, 6]},
                {type: "POOL", pos: [2, 7]},
                {type: "POOL", pos: [2, 8]},
                {type: "POOL", pos: [2, 9]},
          
                {type: "POOL", pos: [3, 2]},
                {type: "POOL", pos: [4, 2]},
                {type: "POOL", pos: [5, 2]},
                {type: "POOL", pos: [6, 2]},
                {type: "POOL", pos: [7, 2]},
                {type: "POOL", pos: [8, 2]},
                {type: "POOL", pos: [9, 2]},
                {type: "POOL", pos: [10, 2]},
                
                {type: "POOL", pos: [11, 2]},
                {type: "POOL", pos: [11, 3]},
                {type: "POOL", pos: [11, 4]},
                {type: "POOL", pos: [11, 5]},
                {type: "POOL", pos: [11, 6]},
                {type: "POOL", pos: [11, 7]},
                {type: "POOL", pos: [11, 8]},
                {type: "POOL", pos: [11, 9]},

                {type: "POOL", pos: [3, 9]},
                {type: "POOL", pos: [4, 9]},
                {type: "POOL", pos: [5, 9]},
                {type: "POOL", pos: [6, 9]},
                {type: "POOL", pos: [7, 9]},
                {type: "POOL", pos: [8, 9]},
                {type: "POOL", pos: [9, 9]},
                {type: "POOL", pos: [10, 9]},
                
                {type: "${you_obj}", pos: [3, 7], properties: ["you"]},
                {type: "${win_obj}", pos: [9, 4], properties: []},

                {type: "${stop_obj}", pos: [3, 3], properties: ["stop"]},
                {type: "${stop_obj}", pos: [3, 8], properties: ["stop"]},
                {type: "${stop_obj}", pos: [5, 8], properties: ["stop"]},
                {type: "${stop_obj}", pos: [6, 6], properties: ["stop"]},
                {type: "${stop_obj}", pos: [7, 5], properties: ["stop"]},
                {type: "${stop_obj}", pos: [8, 8], properties: ["stop"]},
                {type: "${stop_obj}", pos: [9, 5], properties: ["stop"]},
                {type: "${stop_obj}", pos: [10, 7], properties: ["stop"]}
            ]
        },
        {
            level_id: "journey_understandproperty",
            name: "Bridge Building",
            grid_size: [14, 12],
            required_objects: ["you_obj", "win_obj", "push_obj", "destruct_obj"],
            elements: [
                {type: "TEXT_${you_obj}", pos: [0, 0], properties: ["text"]}, 
                {type: "TEXT_IS", pos: [1, 0], properties: ["text"]}, 
                {type: "TEXT_YOU", pos: [2, 0], properties: ["text"]},

                {type: "TEXT_${win_obj}", pos: [0, 1], properties: ["text"]},
                {type: "TEXT_IS", pos: [1, 1], properties: ["text"]},
                {type: "TEXT_WIN", pos: [2, 1], properties: ["text"]},

                {type: "TEXT_${destruct_obj}", pos: [0, 2], properties: ["text"]},
                {type: "TEXT_IS", pos: [1, 2], properties: ["text"]},
                {type: "TEXT_${destruct_property}", pos: [2, 2], properties: ["text"]},

                {type: "TEXT_${push_obj}", pos: [3, 8], properties: ["text"]},
                {type: "TEXT_IS", pos: [4, 8], properties: ["text"]},
                {type: "TEXT_PUSH", pos: [5, 8], properties: ["text"]},

                {type: "${you_obj}", pos: [3, 5], properties: ["you"]},

                {type: "${win_obj}", pos: [11, 5], properties: ["win"]},

                {type: "${push_obj}", pos: [5, 4], properties: ["push"]},
                {type: "${push_obj}", pos: [5, 6], properties: ["push"]},

                {type: "${destruct_obj}", pos: [0, 3], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [1, 3], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [2, 3], properties: ["destruct"]},

                {type: "${destruct_obj}", pos: [8, 0], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [8, 1], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [8, 2], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [8, 3], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [8, 4], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [8, 5], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [8, 6], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [8, 7], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [8, 8], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [8, 9], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [8, 10], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [8, 11], properties: ["destruct"]},

                {type: "${destruct_obj}", pos: [9, 0], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [9, 1], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [9, 2], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [9, 3], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [9, 4], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [9, 5], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [9, 6], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [9, 7], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [9, 8], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [9, 9], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [9, 10], properties: ["destruct"]},
                {type: "${destruct_obj}", pos: [9, 11], properties: ["destruct"]}
            ]
        },
        {
            level_id: "journey_switchidentity",
            name: "Locked in",
            grid_size: [14, 12],
            required_objects: ["you_obj", "win_obj", "shut_obj", "red_obj"],
            elements: [
                {type: "TEXT_${you_obj}", pos: [0, 0], properties: ["text"]}, 
                {type: "TEXT_IS", pos: [1, 0], properties: ["text"]}, 
                {type: "TEXT_YOU", pos: [2, 0], properties: ["text"]},

                {type: "TEXT_${win_obj}", pos: [0, 1], properties: ["text"]},
                {type: "TEXT_IS", pos: [1, 1], properties: ["text"]},
                {type: "TEXT_WIN", pos: [2, 1], properties: ["text"]},

                {type: "TEXT_${shut_obj}", pos: [0, 2], properties: ["text"]},
                {type: "TEXT_IS", pos: [1, 2], properties: ["text"]},
                {type: "TEXT_SHUT", pos: [2, 2], properties: ["text"]},

                {type: "TEXT_${shut_obj}", pos: [9, 4], properties: ["text"]},
                {type: "TEXT_IS", pos: [9, 5], properties: ["text"]},

                {type: "TEXT_${red_obj}", pos: [6, 8], properties: ["text"]},
                {type: "TEXT_IS", pos: [7, 8], properties: ["text"]},
                {type: "TEXT_RED", pos: [8, 8], properties: ["text"]},

                {type: "${you_obj}", pos: [5, 3], properties: ["you"]},

                {type: "${win_obj}", pos: [2, 6], properties: ["win"]},

                {type: "${red_obj}", pos: [5, 4], properties: ["red"]},
                {type: "${red_obj}", pos: [6, 4], properties: ["red"]},
                {type: "${red_obj}", pos: [6, 3], properties: ["red"]},

                {type: "${shut_obj}", pos: [4, 1], properties: ["shut"]},
                {type: "${shut_obj}", pos: [4, 2], properties: ["shut"]},
                {type: "${shut_obj}", pos: [4, 3], properties: ["shut"]},
                {type: "${shut_obj}", pos: [4, 4], properties: ["shut"]},
                {type: "${shut_obj}", pos: [4, 5], properties: ["shut"]},
                {type: "${shut_obj}", pos: [4, 6], properties: ["shut"]},
                {type: "${shut_obj}", pos: [4, 7], properties: ["shut"]},
                {type: "${shut_obj}", pos: [4, 8], properties: ["shut"]},
                {type: "${shut_obj}", pos: [4, 9], properties: ["shut"]},

                {type: "${shut_obj}", pos: [5, 1], properties: ["shut"]},
                {type: "${shut_obj}", pos: [6, 1], properties: ["shut"]},
                {type: "${shut_obj}", pos: [7, 1], properties: ["shut"]},
                {type: "${shut_obj}", pos: [8, 1], properties: ["shut"]},
                {type: "${shut_obj}", pos: [9, 1], properties: ["shut"]},
                {type: "${shut_obj}", pos: [10, 1], properties: ["shut"]},
                {type: "${shut_obj}", pos: [11, 1], properties: ["shut"]},

                {type: "${shut_obj}", pos: [5, 9], properties: ["shut"]},
                {type: "${shut_obj}", pos: [6, 9], properties: ["shut"]},
                {type: "${shut_obj}", pos: [7, 9], properties: ["shut"]},
                {type: "${shut_obj}", pos: [8, 9], properties: ["shut"]},
                {type: "${shut_obj}", pos: [9, 9], properties: ["shut"]},
                {type: "${shut_obj}", pos: [10, 9], properties: ["shut"]},
                {type: "${shut_obj}", pos: [11, 9], properties: ["shut"]},

                {type: "${shut_obj}", pos: [12, 1], properties: ["shut"]},
                {type: "${shut_obj}", pos: [12, 2], properties: ["shut"]},
                {type: "${shut_obj}", pos: [12, 3], properties: ["shut"]},
                {type: "${shut_obj}", pos: [12, 4], properties: ["shut"]},
                {type: "${shut_obj}", pos: [12, 5], properties: ["shut"]},
                {type: "${shut_obj}", pos: [12, 6], properties: ["shut"]},
                {type: "${shut_obj}", pos: [12, 7], properties: ["shut"]},
                {type: "${shut_obj}", pos: [12, 8], properties: ["shut"]},
                {type: "${shut_obj}", pos: [12, 9], properties: ["shut"]}
            ]
        },
        {
            level_id: "journey_break",
            name: "Out of Reach",
            grid_size: [20, 14],
            required_objects: ["you_obj", "win_obj", "defeat_obj", "push_obj"],
            elements: [
                {type: "TEXT_${you_obj}", pos: [0, 1], properties: ["text"]}, 
                {type: "TEXT_IS", pos: [1, 1], properties: ["text"]}, 
                {type: "TEXT_YOU", pos: [2, 1], properties: ["text"]},

                {type: "TEXT_${win_obj}", pos: [0, 0], properties: ["text"]},
                {type: "TEXT_IS", pos: [1, 0], properties: ["text"]},
                {type: "TEXT_WIN", pos: [2, 0], properties: ["text"]},

                {type: "TEXT_${defeat_obj}", pos: [15, 5], properties: ["text"]},
                {type: "TEXT_IS", pos: [15, 6], properties: ["text"]},
                {type: "TEXT_DEFEAT", pos: [15, 7], properties: ["text"]},

                {type: "TEXT_${push_obj}", pos: [2, 5], properties: ["text"]},
                {type: "TEXT_IS", pos: [3, 5], properties: ["text"]},
                {type: "TEXT_PUSH", pos: [4, 5], properties: ["text"]},

                {type: "${you_obj}", pos: [6, 12], properties: ["you"]},

                {type: "${win_obj}", pos: [14, 9], properties: ["win"]},

                {type: "${push_obj}", pos: [6, 8], properties: ["push"]},
                {type: "${push_obj}", pos: [6, 9], properties: ["push"]},
                {type: "${push_obj}", pos: [6, 10], properties: ["push"]},

                {type: "${defeat_obj}", pos: [3, 9], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [3, 10], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [3, 11], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [3, 12], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [3, 13], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [4, 9], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [5, 7], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [5, 8], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [5, 9], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [7, 7], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [7, 8], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [7, 9], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [8, 9], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [9, 9], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [9, 10], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [9, 11], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [9, 12], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [9, 13], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 4], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 5], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 6], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 7], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 8], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 9], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 10], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 11], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [17, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [17, 4], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [17, 5], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [17, 6], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [17, 7], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [17, 8], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [17, 9], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [17, 10], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [17, 11], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [14, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [15, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [16, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [14, 11], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [15, 11], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [16, 11], properties: ["defeat"]}
            ]
        },
        {
            level_id: "journey_grammar",
            name: "Feeling Dangerous",
            grid_size: [14, 12],
            required_objects: ["you_obj", "win_obj", "defeat_obj", "stop_obj", "if_property", "feeling_property"],
            elements: [
                {type: "TEXT_${you_obj}", pos: [8, 9], properties: ["text"]}, 
                {type: "TEXT_IS", pos: [9, 9], properties: ["text"]}, 
                {type: "TEXT_YOU", pos: [10, 9], properties: ["text"]},

                {type: "TEXT_${win_obj}", pos: [8, 7], properties: ["text"]},
                {type: "TEXT_IS", pos: [9, 7], properties: ["text"]},
                {type: "TEXT_WIN", pos: [10, 7], properties: ["text"]},

                {type: "TEXT_${win_obj}", pos: [7, 2], properties: ["text"]},
                {type: "TEXT_${if_property}", pos: [8, 2], properties: ["text"]},
                {type: "TEXT_WIN", pos: [9, 2], properties: ["text"]},
                {type: "TEXT_IS", pos: [10, 2], properties: ["text"]},
                {type: "TEXT_DEFEAT", pos: [11, 2], properties: ["text"]},

                {type: "TEXT_${stop_obj}", pos: [0, 0], properties: ["text"]},
                {type: "TEXT_IS", pos: [1, 0], properties: ["text"]},
                {type: "TEXT_STOP", pos: [2, 0], properties: ["text"]},

                {type: "${you_obj}", pos: [8, 5], properties: ["you"]},

                {type: "${win_obj}", pos: [10, 5], properties: ["win"]},

                {type: "${stop_obj}", pos: [0, 1], properties: ["stop"]},
                {type: "${stop_obj}", pos: [1, 1], properties: ["stop"]},
                {type: "${stop_obj}", pos: [2, 1], properties: ["stop"]},

                {type: "${stop_obj}", pos: [6, 1], properties: ["stop"]},
                {type: "${stop_obj}", pos: [6, 2], properties: ["stop"]},
                {type: "${stop_obj}", pos: [6, 3], properties: ["stop"]},

                {type: "${stop_obj}", pos: [7, 1], properties: ["stop"]},
                {type: "${stop_obj}", pos: [8, 1], properties: ["stop"]},
                {type: "${stop_obj}", pos: [9, 1], properties: ["stop"]},
                {type: "${stop_obj}", pos: [10, 1], properties: ["stop"]},
                {type: "${stop_obj}", pos: [11, 1], properties: ["stop"]},
                
                {type: "${stop_obj}", pos: [7, 3], properties: ["stop"]},
                {type: "${stop_obj}", pos: [8, 3], properties: ["stop"]},
                {type: "${stop_obj}", pos: [9, 3], properties: ["stop"]},
                {type: "${stop_obj}", pos: [10, 3], properties: ["stop"]},
                {type: "${stop_obj}", pos: [11, 3], properties: ["stop"]},

                {type: "${stop_obj}", pos: [12, 1], properties: ["stop"]},
                {type: "${stop_obj}", pos: [12, 2], properties: ["stop"]},
                {type: "${stop_obj}", pos: [12, 3], properties: ["stop"]}
            ]
        },
        {
            level_id: "journey_combination",
            name: "Novice Locksmith",
            grid_size: [15, 14],
            required_objects: ["you_obj", "win_obj", "defeat_obj", "shut_obj", "open_obj"],
            elements: [
                {type: "TEXT_${you_obj}", pos: [3, 0], properties: ["text"]}, 
                {type: "TEXT_IS", pos: [4, 0], properties: ["text"]}, 
                {type: "TEXT_YOU", pos: [5, 0], properties: ["text"]},

                {type: "TEXT_${win_obj}", pos: [3, 1], properties: ["text"]},
                {type: "TEXT_IS", pos: [4, 1], properties: ["text"]},
                {type: "TEXT_WIN", pos: [5, 1], properties: ["text"]},

                {type: "TEXT_${defeat_obj}", pos: [3, 2], properties: ["text"]},
                {type: "TEXT_IS", pos: [4, 2], properties: ["text"]},
                {type: "TEXT_DEFEAT", pos: [5, 2], properties: ["text"]},

                {type: "TEXT_${open_obj}", pos: [3, 6], properties: ["text"]},
                {type: "TEXT_IS", pos: [4, 6], properties: ["text"]},
                {type: "TEXT_OPEN", pos: [5, 6], properties: ["text"]},

                {type: "TEXT_${open_obj}", pos: [3, 8], properties: ["text"]},
                {type: "TEXT_IS", pos: [5, 10], properties: ["text"]},
                {type: "TEXT_PUSH", pos: [5, 8], properties: ["text"]},

                {type: "TEXT_${shut_obj}", pos: [9, 9], properties: ["text"]},
                {type: "TEXT_IS", pos: [10, 9], properties: ["text"]},
                {type: "TEXT_SHUT", pos: [11, 9], properties: ["text"]},

                {type: "${you_obj}", pos: [4, 11], properties: ["you"]},

                {type: "${win_obj}", pos: [10, 12], properties: ["win"]},

                {type: "${open_obj}", pos: [3, 10], properties: ["open"]},

                {type: "${shut_obj}", pos: [7, 9], properties: ["shut"]},
                {type: "${shut_obj}", pos: [10, 11], properties: ["shut"]},

                {type: "${defeat_obj}", pos: [1, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [1, 4], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [1, 5], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [1, 6], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [1, 7], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [1, 8], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [1, 9], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [1, 10], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [1, 11], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [1, 12], properties: ["defeat"]},

                {type: "${defeat_obj}", pos: [2, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [3, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [4, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [5, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [6, 3], properties: ["defeat"]},

                {type: "${defeat_obj}", pos: [2, 12], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [3, 12], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [4, 12], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [5, 12], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [6, 12], properties: ["defeat"]},

                {type: "${defeat_obj}", pos: [7, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [7, 4], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [7, 5], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [7, 6], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [7, 7], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [7, 8], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [7, 10], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [7, 11], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [7, 12], properties: ["defeat"]},

                {type: "${defeat_obj}", pos: [8, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [9, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [10, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [11, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [12, 3], properties: ["defeat"]},

                {type: "${defeat_obj}", pos: [8, 11], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [9, 11], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [11, 11], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [12, 11], properties: ["defeat"]},

                {type: "${defeat_obj}", pos: [13, 3], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 4], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 5], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 6], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 7], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 8], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 9], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 10], properties: ["defeat"]},
                {type: "${defeat_obj}", pos: [13, 11], properties: ["defeat"]}
            ]
        }
    ],
    
    experimental_conditions: {
        default: {
            you_obj: "PUMPKIN",
            win_obj: "SUN",
            push_obj: "CLOUD",
            destruct_obj: "BOMB"
        }
    }
};

/**
 * generate level with specific condition
 * @param {string} templateId - template ID
 * @param {string} conditionType - experimental condition type ('high-prior' or 'low-prior')
 * @returns {Object} generated level data
 */
function generateLevel(templateId, conditionType = 'high-prior') {
    // First check if it's a tutorial level
    let template = LEVEL_DATA.tutorial.find(t => t.level_id === templateId);
    let isTutorial = false;
    
    if (template) {
        isTutorial = true;
    } else {
        // If not tutorial, check journey templates
        template = LEVEL_DATA.journey_templates.find(t => t.level_id === templateId);
        if (!template) {
            console.error(`Template not found for level: ${templateId}`);
            return null;
        }
    }
    
    // For tutorial levels, use default condition mapping
    // For journey levels, use experimental condition system
    let objMapping;
    if (isTutorial) {
        objMapping = LEVEL_DATA.experimental_conditions.default;
    } else {
        objMapping = (typeof window !== 'undefined' && window.getExperimentalCondition) ? 
                     window.getExperimentalCondition(templateId, conditionType) :
                     LEVEL_DATA.experimental_conditions.default;
    }
    
    // deep copy template
    const level = JSON.parse(JSON.stringify(template));
    
    if (isTutorial) {
        // For tutorial levels, no placeholder replacement needed
    } else {
        // For journey levels, replace placeholders
        level.elements = level.elements.map(element => {
            let newElement = {...element};
            
            // replace placeholder in type
            newElement.type = newElement.type.replace(/\$\{(\w+)\}/g, (match, key) => {
                return objMapping[key] || match;
            });
            
            // special handling for TEXT_${destruct_property} -> TEXT_IMPACT or TEXT_DESTRUCT
            if (newElement.type === 'TEXT_${destruct_property}' && objMapping.destruct_property) {
                newElement.type = `TEXT_${objMapping.destruct_property}`;
            }
            
            // special handling for boundary objects in journey_environment level
            if (templateId === 'journey_environment' && newElement.type === 'POOL' && objMapping.boundary_obj) {
                newElement.type = objMapping.boundary_obj;
            }
            
            // if DESTRUCT property, use DESTRUCT or IMPACT based on experimental condition
            if (newElement.properties && newElement.properties.includes("destruct") && objMapping.destruct_property) {
                const index = newElement.properties.indexOf("destruct");
                newElement.properties[index] = objMapping.destruct_property.toLowerCase();
            }
            
            return newElement;
        });
    }
    
    // generate initial rules
    const initialRules = [];
    const ruleDefinitions = {};
    
    // generate rules from elements
    for (const elem of level.elements) {
        const elemType = elem.type;
        if (!elemType || elemType.startsWith('TEXT_')) continue;
        
        const properties = elem.properties || [];
        if (properties.length === 0) continue;
        
        const baseType = elemType.replace('TEXT_', '');
        if (!ruleDefinitions[baseType]) {
            ruleDefinitions[baseType] = [];
        }
        
        for (const prop of properties) {
            const upperProp = prop.toUpperCase();
            // add IMPACT to valid property list
            if (['YOU', 'WIN', 'STOP', 'PUSH', 'DEFEAT', 'RED', 'DESTRUCT', 'IMPACT', 'SHUT', 'OPEN'].includes(upperProp)) {
                if (!ruleDefinitions[baseType].includes(upperProp)) {
                    ruleDefinitions[baseType].push(upperProp);
                }
            }
        }
    }
    
    // convert to rule array
    for (const [objType, props] of Object.entries(ruleDefinitions)) {
        for (const prop of props) {
            initialRules.push([objType, 'IS', prop]);
        }
    }
    
    // set level data format
    level.level_id = templateId;
    level.initial_objects = level.elements.map(elem => ({
        type: elem.type,
        pos: elem.pos
    }));
    level.initial_rules = initialRules;
    level.grid_size = level.grid_size;
    level.condition = conditionType; // record used condition type
    
    return level;
}

/**
 * get all available levels
 * @returns {Object} object containing tutorial and journey levels
 */
function getAllLevels() {
    const levels = {
        tutorial: [],
        journey: []
    };
    
    // Generate tutorial levels
    for (const template of LEVEL_DATA.tutorial) {
        const level = generateLevel(template.level_id, 'default');
        if (level) {
            levels.tutorial.push(level);
        }
    }
    
    // Generate journey levels, using default condition
    for (const template of LEVEL_DATA.journey_templates) {
        const level = generateLevel(template.level_id, 'default');
        if (level) {
            levels.journey.push(level);
        }
    }
    
    return levels;
}

/**
 * get specific level
 * @param {string} chapterKey - chapter key ('tutorial' or 'journey')
 * @param {number} levelIndex - level index
 * @returns {Object|null} level data or null
 */
function getLevel(chapterKey, levelIndex) {
    const allLevels = getAllLevels();
    if (!allLevels[chapterKey] || levelIndex >= allLevels[chapterKey].length) {
        return null;
    }
    return allLevels[chapterKey][levelIndex];
}

/**
 * get chapter information
 * @returns {Array} chapter list
 */
function getChapters() {
    return [
        {name: 'Tutorial', key: 'tutorial'},
        {name: 'Journey', key: 'journey'}
    ];
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LEVEL_DATA,
        generateLevel,
        getAllLevels,
        getLevel,
        getChapters
    };
} else {
    window.LEVEL_DATA = LEVEL_DATA;
    window.generateLevel = generateLevel;
    window.getAllLevels = getAllLevels;
    window.getLevel = getLevel;
    window.getChapters = getChapters;
} 