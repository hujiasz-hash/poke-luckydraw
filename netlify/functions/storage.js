import { getStore } from "@netlify/blobs";

const DEFAULT_PIN = "1234";
const DEFAULT_REWARDS = [
    { id: 1, text: "皮卡丘的电气活力：免做家务一次", star: 1, pokemonId: 25, pokemonName: "皮卡丘" },
    { id: 2, text: "杰尼龟的水枪降温：喝一杯冰爽饮料/吃个冰淇淋", star: 1, pokemonId: 7, pokemonName: "杰尼龟" },
    { id: 3, text: "妙蛙种子的阳光普照：多玩30分钟电子游戏", star: 2, pokemonId: 1, pokemonName: "妙蛙种子" },
    { id: 4, text: "小火龙的火焰热情：去吃一次麦当劳/肯德基", star: 2, pokemonId: 4, pokemonName: "小火龙" },
    { id: 5, text: "卡比兽的深度睡眠：周末可以睡懒觉/晚起1小时", star: 3, pokemonId: 143, pokemonName: "卡比兽" },
    { id: 6, text: "伊布的多重进化：自选一个小玩具（50元以内）", star: 4, pokemonId: 133, pokemonName: "伊布" },
    { id: 7, text: "胖丁的催眠金曲：今晚免去阅读，听故事直接睡觉", star: 1, pokemonId: 39, pokemonName: "胖丁" },
    { id: 8, text: "喵喵的聚宝功：获得零花钱5元", star: 1, pokemonId: 52, pokemonName: "喵喵" }
];
const DEFAULT_WEIGHTS = { "1": 40, "2": 30, "3": 20, "4": 10, "5": 5 };

export default async (req, context) => {
    // 实例化一个专属于宝可梦抽签的 store，并开启强一致性，解决边缘网络最终一致性缓存导致的数据丢失和状态回滚问题
    const store = getStore({
        name: "pokemon-luckydraw-store",
        consistency: "strong"
    });
    const method = req.method;

    // 辅助方法：统一读取并合并当前状态
    const loadAllData = async () => {
        let pin = await store.get("pin");
        let rewardsRaw = await store.get("rewards");
        let recordsRaw = await store.get("records");
        let weightsRaw = await store.get("weights");

        // 首次进入没有数据时的自动初始化
        if (pin === null) {
            pin = DEFAULT_PIN;
            await store.set("pin", DEFAULT_PIN);
        }
        
        let rewards = DEFAULT_REWARDS;
        if (rewardsRaw !== null) {
            try {
                rewards = JSON.parse(rewardsRaw);
            } catch (e) {
                rewards = DEFAULT_REWARDS;
            }
        } else {
            await store.set("rewards", JSON.stringify(DEFAULT_REWARDS));
        }

        let records = [];
        if (recordsRaw !== null) {
            try {
                records = JSON.parse(recordsRaw);
            } catch (e) {
                records = [];
            }
        } else {
            await store.set("records", JSON.stringify([]));
        }

        let weights = DEFAULT_WEIGHTS;
        if (weightsRaw !== null) {
            try {
                weights = JSON.parse(weightsRaw);
            } catch (e) {
                weights = DEFAULT_WEIGHTS;
            }
        } else {
            await store.set("weights", JSON.stringify(DEFAULT_WEIGHTS));
        }

        return { pin, rewards, records, weights };
    };

    // 跨域支持 (CORS) 头部配置
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json"
    };

    // 处理跨域 OPTIONS 预检请求
    if (method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    // 1. GET 请求：拉取全部数据
    if (method === "GET") {
        try {
            const data = await loadAllData();
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: corsHeaders
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }

    // 2. POST 请求：敏感操作和新增中奖记录
    if (method === "POST") {
        try {
            const body = await req.json();
            const { action, pin, data } = body;

            // 首先拉取当前最新的云端状态
            const currentData = await loadAllData();

            // 鉴权逻辑：敏感操作（修改奖池、删除核销、更改密码、修改权重）必须校对密码
            if (["save_rewards", "redeem_records", "change_pin", "save_weights"].includes(action)) {
                if (!pin || pin !== currentData.pin) {
                    return new Response(JSON.stringify({ error: "家长身份验证失败：密码错误！" }), {
                        status: 401,
                        headers: corsHeaders
                    });
                }
            }

            // 执行对应业务的更新
            if (action === "save_rewards") {
                if (!Array.isArray(data)) {
                    return new Response(JSON.stringify({ error: "无效的奖励池数据格式" }), { status: 400, headers: corsHeaders });
                }
                await store.set("rewards", JSON.stringify(data));
                currentData.rewards = data;
            } 
            else if (action === "redeem_records") {
                if (!Array.isArray(data)) {
                    return new Response(JSON.stringify({ error: "无效的核销数据格式" }), { status: 400, headers: corsHeaders });
                }
                await store.set("records", JSON.stringify(data));
                currentData.records = data;
            } 
            else if (action === "change_pin") {
                if (typeof data !== "string" || data.length < 4) {
                    return new Response(JSON.stringify({ error: "密码必须为不小于4位的数字" }), { status: 400, headers: corsHeaders });
                }
                await store.set("pin", data);
                currentData.pin = data;
            } 
            else if (action === "save_weights") {
                if (typeof data !== "object" || data === null) {
                    return new Response(JSON.stringify({ error: "无效的权重数据格式" }), { status: 400, headers: corsHeaders });
                }
                await store.set("weights", JSON.stringify(data));
                currentData.weights = data;
            }
            else if (action === "add_record") {
                // 孩子端掷精灵球产生新的中奖记录，允许免密写入（追加到记录最前端）
                if (!data || typeof data !== "object" || !data.reward) {
                    return new Response(JSON.stringify({ error: "无效的记录数据格式" }), { status: 400, headers: corsHeaders });
                }
                const updatedRecords = [data, ...currentData.records];
                await store.set("records", JSON.stringify(updatedRecords));
                currentData.records = updatedRecords;
            } 
            else if (action === "draw") {
                // 后端免密进行抽奖
                if (!currentData.rewards || currentData.rewards.length === 0) {
                    return new Response(JSON.stringify({ error: "奖励池为空，请先在开发者面板中添加！" }), { status: 400, headers: corsHeaders });
                }
                
                const winReward = getWeightedRandomReward(currentData.rewards, currentData.weights);
                if (!winReward) {
                    return new Response(JSON.stringify({ error: "抽奖逻辑计算失败，无有效结果！" }), { status: 500, headers: corsHeaders });
                }

                const dateStr = getBeijingTimeStr();
                const newRecord = {
                    id: Date.now(),
                    time: dateStr,
                    reward: winReward.text,
                    pokemonId: winReward.pokemonId,
                    pokemonName: winReward.pokemonName,
                    star: winReward.star
                };

                const updatedRecords = [newRecord, ...currentData.records];
                await store.set("records", JSON.stringify(updatedRecords));
                
                // 将最新数据更新到内存，同时附加当前的中奖信息供前端播放动画
                currentData.records = updatedRecords;
                currentData.winReward = winReward;
            }
            else {
                return new Response(JSON.stringify({ error: "未知的 action 操作类型" }), { status: 400, headers: corsHeaders });
            }

            // 写入成功后，不再重新读取，而是直接返回内存中已更新合并的数据，确保前端数据一致，避免云端最终一致性延迟导致的状态回滚
            return new Response(JSON.stringify(currentData), {
                status: 200,
                headers: corsHeaders
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }

    return new Response(JSON.stringify({ error: "不支持的 HTTP 方法" }), {
        status: 405,
        headers: corsHeaders
    });
};

// 辅助方法：东八区（北京时间）格式化函数
function getBeijingTimeStr() {
    const d = new Date();
    // 抹平时区差，计算北京时间
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const bjDate = new Date(utc + (3600000 * 8));
    
    const pad = num => num.toString().padStart(2, '0');
    return `${bjDate.getFullYear()}年${pad(bjDate.getMonth()+1)}月${pad(bjDate.getDate())}日 ${pad(bjDate.getHours())}:${pad(bjDate.getMinutes())}`;
}

// 辅助方法：后端随机概率权重匹配函数
function getWeightedRandomReward(rewardPool, starWeights) {
    let totalWeight = 0;
    rewardPool.forEach(item => {
        const weight = starWeights[item.star] || 40;
        totalWeight += weight;
    });
    
    if (totalWeight === 0) return null;
    
    let randomVal = Math.random() * totalWeight;
    for (const item of rewardPool) {
        const weight = starWeights[item.star] || 40;
        if (randomVal < weight) {
            return item;
        }
        randomVal -= weight;
    }
    return rewardPool[rewardPool.length - 1]; // 兜底
}
