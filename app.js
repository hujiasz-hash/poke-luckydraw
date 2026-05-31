/* 
   ==========================================================================
   宝可梦随机奖励抽签小游戏 - 核心业务逻辑
   作者: Antigravity
   ========================================================================== 
*/

// 全局运行时错误拦截与友好提示（开发与调试辅助）
window.onerror = function (message, source, lineno, colno, error) {
    const errorMsg = `神奇宝贝系统运行出错：\n${message}\n文件: ${source}\n行号: ${lineno}:${colno}\n堆栈: ${error ? error.stack : ''}`;
    console.error(errorMsg);
    if (typeof window !== 'undefined' && window.alert) {
        alert(errorMsg);
    }
    return false;
};

// --- 第一代 151 只宝可梦名字映射表 ---
const POKE_SPRITE_CDN = "https://fastly.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon";
const POKEMON_NAMES = [
    "妙蛙种子", "妙蛙草", "妙蛙花", "小火龙", "火恐龙", "喷火龙", "杰尼龟", "卡咪龟", "水箭龟", "绿毛虫",
    "铁甲蛹", "巴大蝶", "独角虫", "铁壳蛹", "大针蜂", "波波", "比比鸟", "大比鸟", "小拉达", "拉达",
    "烈雀", "大嘴雀", "阿柏蛇", "阿柏怪", "皮卡丘", "雷丘", "穿山鼠", "穿山王", "尼多兰", "尼多娜",
    "尼多后", "尼多朗", "尼多力诺", "尼多王", "皮皮", "皮可西", "六尾", "九尾", "胖丁", "胖可丁",
    "超音蝠", "大嘴蝠", "走路草", "臭臭花", "霸王花", "派拉斯", "派拉斯特", "毛球", "摩鲁蛾", "地鼠",
    "三地鼠", "喵喵", "猫老大", "可达鸭", "哥达鸭", "猴怪", "火暴猴", "卡蒂狗", "风速狗", "蚊香蝌蚪",
    "蚊香君", "蚊香泳士", "凯西", "勇基拉", "胡地", "腕力", "豪力", "怪力", "喇叭芽", "口呆花",
    "大食花", "玛瑙水母", "毒刺水母", "小拳石", "隆隆石", "隆隆岩", "小火马", "烈焰马", "呆呆兽", "呆壳兽",
    "小磁怪", "三合一磁怪", "大葱鸭", "嘟嘟", "嘟嘟利", "小海狮", "白海狮", "臭泥", "臭臭泥", "大舌贝",
    "刺甲贝", "鬼斯", "鬼斯通", "耿鬼", "大岩蛇", "催眠貘", "引梦貘人", "大钳蟹", "巨钳蟹", "雷电球",
    "顽皮雷弹", "蛋蛋", "椰蛋树", "卡拉卡拉", "嘎啦嘎啦", "飞腿郎", "快拳郎", "大舌头", "瓦斯弹", "双弹瓦斯",
    "独角犀牛", "钻角犀兽", "吉利蛋", "藤蔓怪", "袋兽", "墨海马", "海刺龙", "角金鱼", "金鱼王", "海星星",
    "宝石海星", "魔墙人偶", "飞天螳螂", "迷唇姐", "电击兽", "鸭嘴火兽", "凯罗斯", "肯泰罗", "鲤鱼王", "暴鲤龙",
    "拉普拉斯", "百变怪", "伊布", "水伊布", "雷伊布", "火伊布", "多边兽", "菊石兽", "多刺菊石兽", "化石盔",
    "镰刀盔", "化石翼龙", "卡比兽", "急冻鸟", "闪电鸟", "火焰鸟", "迷你龙", "哈克龙", "快龙", "超梦",
    "梦幻"
];

// --- 默认配置数据 ---
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

const DEFAULT_PIN = "1234";

// --- 著名宝可梦的专属中奖描述 ---
const POKEMON_FLAVORS = {
    25: "闪电般的幸运！皮卡丘高兴地对你使出了「十万伏特」的祝福！快去找爸爸妈妈兑换你的奖励吧！",
    1: "妙蛙种子在草丛中向你挥舞藤鞭！它把这枚充满生机与快乐的奖励送给了你！",
    4: "小火龙尾巴上的火焰欢快地跳跃着！它觉得你今天的表现超级棒，这份奖励实实至名归！",
    7: "杰尼龟向你喷出一股清凉的爱心水花！哇，今天的运气和水流一样畅快呢！",
    143: "卡比兽大饱一顿后满足地翻了个身，正好把压在肚子底下的超级大奖让给了你！",
    133: "可爱的伊布开心地围着你转圈蹦跳！它说你今天简直是世界上最优秀的训练家！",
    150: "传说中的超梦降临！它用精神强念锁定了你——今天你拥有支配好运的超能力！",
    9: "水箭龟拍了拍厚重的甲壳，用双口水炮为你鸣放了中奖的礼炮！",
    6: "喷火龙展开雄伟的双翼掠过天空，为你燃放了一场绚丽的幸运火焰！",
    3: "妙蛙花背上的巨大花朵绽放了，散发出迷人的香气，带给你一整天的好心情！",
    39: "胖丁拿着麦克风为你献唱了一首欢快的得奖之歌！千万别睡着哦，快去兑奖！",
    52: "喵喵跳起来摇了摇额头上的金币，叮当一声，好运财宝滚落到了你的怀里！",
};

// 自动生成话术的可选后缀
const POKEMON_ACTIONS = [
    "的庇护", "的神秘守护", "的幸运祝福", "的治愈之光", "的祈愿", 
    "的友情礼物", "的勇气鼓舞", "的超级召唤", "的星光闪耀", "的念力冲击",
    "的爱心闪光", "的阳光普照", "的深海洗礼", "的烈火洗礼", "的雷电活力"
];

// --- 全局状态变量 ---
let rewardPool = [];
let drawRecords = [];
let parentPin = DEFAULT_PIN;
let starWeights = { 1: 40, 2: 30, 3: 20, 4: 10, 5: 5 };

// 开发者后台：手动补发奖券时选中的宝可梦
let manualSelectedPokemon = { id: 25, name: "皮卡丘" };

// 待执行的安全敏感操作回调（输入密码成功后执行）
let pendingSecureAction = null; 

// 密码验证框状态
let currentPinInput = "";

// 可视化编辑状态变量
let editingRewards = [];
let activeEditingRowIndex = -1; // 正在编辑哪一行的宝可梦

// --- 页面元素加载 ---
document.addEventListener("DOMContentLoaded", () => {
    initData();
    setupEventListeners();
    setupCanvas();
});

// --- 更新云同步状态 UI ---
function updateSyncStatus(status) {
    const el = document.getElementById("cloud-sync-status");
    if (!el) return;
    
    // 清除原有状态类
    el.className = "cloud-sync-status";
    const icon = el.querySelector("i");
    const text = el.querySelector("span");
    
    if (status === "syncing") {
        el.classList.add("syncing");
        icon.className = "fa-solid fa-rotate";
        text.innerText = "云端同步中...";
    } else if (status === "synced") {
        el.classList.add("synced");
        icon.className = "fa-solid fa-cloud";
        text.innerText = "云端已同步";
    } else if (status === "offline") {
        el.classList.add("offline");
        icon.className = "fa-solid fa-cloud-slash";
        text.innerText = "离线缓存中";
    }
}

// --- 异步云端拉取数据 (SWR 缓存策略) ---
async function initData() {
    // 1. 优先使用本地缓存立即渲染，实现秒开首屏展示
    initLocalStorageFallback();
    
    // 渲染 UI
    renderRewardPoolStatus();
    renderRecords();
    renderProbabilitySettings();
    initPokeGrid();

    // 2. 异步向云端同步，进行静默校验和覆盖
    updateSyncStatus("syncing");
    
    try {
        const response = await fetch("/.netlify/functions/storage", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });
        
        if (!response.ok) {
            throw new Error(`Cloud storage error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 云端同步成功，更新全局状态变量并覆写本地缓存
        parentPin = data.pin;
        rewardPool = data.rewards;
        drawRecords = data.records;
        starWeights = data.weights || starWeights;
        
        localStorage.setItem("pokemon_pin", parentPin);
        localStorage.setItem("pokemon_rewards", JSON.stringify(rewardPool));
        localStorage.setItem("pokemon_records", JSON.stringify(drawRecords));
        localStorage.setItem("pokemon_weights", JSON.stringify(starWeights));
        
        // 预加载当前奖池的图片以备秒开
        preloadRewardImages();
        
        updateSyncStatus("synced");
        
        // 静默重绘 UI 确保数据最新一致
        renderRewardPoolStatus();
        renderRecords();
        if (document.getElementById("dev-modal").classList.contains("open")) {
            renderProbabilitySettings();
        }
    } catch (e) {
        console.warn("后台拉取云端数据同步失败，继续使用本地缓存展示：", e);
        updateSyncStatus("offline");
    }
}

// --- 同步数据到云端 (以云端为事实源的单向数据流) ---
async function syncToCloud(action, data) {
    updateSyncStatus("syncing");
    try {
        const payload = {
            action: action,
            pin: parentPin,
            data: data
        };

        const response = await fetch("/.netlify/functions/storage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 401) {
                const errData = await response.json();
                alert(errData.error || "操作验证失败：密码错误");
                updateSyncStatus("synced");
                return false;
            }
            throw new Error(`Cloud storage update error: ${response.status}`);
        }

        const latestData = await response.json();
        
        // 成功后，以服务器返回的最新的权威云端数据覆盖本地缓存和变量
        parentPin = latestData.pin;
        rewardPool = latestData.rewards;
        drawRecords = latestData.records;
        if (latestData.weights) {
            starWeights = latestData.weights;
            localStorage.setItem("pokemon_weights", JSON.stringify(starWeights));
        }
        
        localStorage.setItem("pokemon_pin", parentPin);
        localStorage.setItem("pokemon_rewards", JSON.stringify(rewardPool));
        localStorage.setItem("pokemon_records", JSON.stringify(drawRecords));

        updateSyncStatus("synced");

        // 重新渲染页面模块，保证状态一致
        renderRewardPoolStatus();
        renderRecords();
        if (document.getElementById("dev-modal").classList.contains("open")) {
            renderProbabilitySettings();
        }

        // 抽奖动作特殊处理，返回云端生成的中奖信息
        if (action === "draw") {
            return latestData.winReward;
        }

        return true;
    } catch (e) {
        console.warn("数据同步至云端失败：", e);
        updateSyncStatus("offline");
        return false;
    }
}

// --- 本地存储加载（离线兜底逻辑） ---
function initLocalStorageFallback() {
    // 1. 初始化密码
    if (!localStorage.getItem("pokemon_pin")) {
        localStorage.setItem("pokemon_pin", DEFAULT_PIN);
    }
    parentPin = localStorage.getItem("pokemon_pin");

    // 2. 初始化奖池并兼容老版本格式
    const rawRewards = localStorage.getItem("pokemon_rewards");
    if (!rawRewards) {
        // 第一次使用
        rewardPool = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
        localStorage.setItem("pokemon_rewards", JSON.stringify(rewardPool));
    } else {
        try {
            const parsed = JSON.parse(rawRewards);
            // 确保是数组，且里面的项是对象而不是纯字符串或 [object Object] 垃圾数据
            if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && parsed[0].text !== undefined && !parsed[0].text.includes('[object Object]')) {
                rewardPool = parsed;
            } else {
                throw new Error("Invalid rewards format");
            }
        } catch (e) {
            // 老版本文本数据或破损数据兼容迁移
            let lines = [];
            try {
                const parsed = JSON.parse(rawRewards);
                if (Array.isArray(parsed)) {
                    lines = parsed.map(item => (typeof item === 'object' && item !== null) ? (item.text || '') : String(item));
                }
            } catch (err) {
                lines = rawRewards.split("\n").map(r => r.trim());
            }
            
            // 过滤空行和可能存在的损坏字符串
            lines = lines.filter(l => l.length > 0 && !l.includes('[object Object]'));
            
            // 如果过滤后为空，回退到默认值
            if (lines.length === 0) {
                rewardPool = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
            } else {
                rewardPool = lines.map((text, index) => {
                    let matchedId = 25;
                    let matchedName = "皮卡丘";
                    for (let i = 0; i < POKEMON_NAMES.length; i++) {
                        const name = POKEMON_NAMES[i];
                        if (text.includes(name)) {
                            matchedId = i + 1;
                            matchedName = name;
                            break;
                        }
                    }
                    return {
                        id: Date.now() + index,
                        text: text,
                        star: 1, // 老数据默认一星
                        pokemonId: matchedId,
                        pokemonName: matchedName
                    };
                });
            }
            localStorage.setItem("pokemon_rewards", JSON.stringify(rewardPool));
        }
    }

    // 3. 初始化中奖记录并兼容老记录
    if (!localStorage.getItem("pokemon_records")) {
        localStorage.setItem("pokemon_records", JSON.stringify([]));
    }
    try {
        const records = JSON.parse(localStorage.getItem("pokemon_records"));
        if (Array.isArray(records)) {
            drawRecords = records.map(record => {
                // 兼容纯字符串格式的历史记录
                if (typeof record === 'string') {
                    record = {
                        id: Date.now() + Math.random(),
                        time: new Date().toLocaleString(),
                        reward: record
                    };
                }
                
                // 兼容缺失宝可梦ID和星级的对象
                if (record.pokemonId === undefined || record.star === undefined) {
                    let matchedId = 25;
                    let matchedName = "皮卡丘";
                    const rewardText = record.reward || '';
                    for (let i = 0; i < POKEMON_NAMES.length; i++) {
                        const name = POKEMON_NAMES[i];
                        if (rewardText.includes(name)) {
                            matchedId = i + 1;
                            matchedName = name;
                            break;
                        }
                    }
                    record.pokemonId = matchedId;
                    record.pokemonName = matchedName;
                    record.star = 1;
                }
                return record;
            });
            localStorage.setItem("pokemon_records", JSON.stringify(drawRecords));
        } else {
            drawRecords = [];
            localStorage.setItem("pokemon_records", JSON.stringify([]));
        }
    } catch (e) {
        drawRecords = [];
        localStorage.setItem("pokemon_records", JSON.stringify([]));
    }

    // 4. 初始化抽签概率权重缓存
    const rawWeights = localStorage.getItem("pokemon_weights");
    if (rawWeights) {
        try {
            starWeights = JSON.parse(rawWeights);
        } catch (e) {
            starWeights = { 1: 40, 2: 30, 3: 20, 4: 10, 5: 5 };
        }
    } else {
        localStorage.setItem("pokemon_weights", JSON.stringify(starWeights));
    }

    // 预加载本地缓存中的奖池图片
    preloadRewardImages();
}

// --- 渲染奖池状态（主界面提示） ---
function renderRewardPoolStatus() {
    const statusText = document.getElementById("pool-status-text");
    const count = rewardPool.length;
    if (count === 0) {
        statusText.innerHTML = `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> 奖池空空如也，请点击右上角锁头配置奖励！</span>`;
    } else {
        statusText.innerHTML = `<i class="fa-solid fa-ticket"></i> 当前奖池共有 <strong>${count}</strong> 个奖励等待召唤`;
    }
}

// --- 渲染中奖记录列表 ---
function renderRecords() {
    const listContainer = document.getElementById("records-list");
    const badge = document.getElementById("record-count");
    const actionsBar = document.getElementById("list-actions-bar");
    
    // 更新未核销条数
    const unredeemedCount = drawRecords.length;
    badge.innerText = `${unredeemedCount} 条未核销`;

    // 控制导出按钮启用/禁用状态
    const exportBtn = document.getElementById("export-records-btn");
    if (exportBtn) {
        if (unredeemedCount === 0) {
            exportBtn.disabled = true;
            exportBtn.style.opacity = "0.5";
        } else {
            exportBtn.disabled = false;
            exportBtn.style.opacity = "1";
        }
    }

    if (unredeemedCount === 0) {
        actionsBar.style.display = "none";
        listContainer.innerHTML = `
            <div class="empty-state">
                <img src="${POKE_SPRITE_CDN}/other/official-artwork/25.png" alt="Pikachu" class="empty-img">
                <p>还没有中奖记录哦，快去完成任务抽奖吧！</p>
            </div>
        `;
        return;
    }

    // 显示操作栏
    actionsBar.style.display = "flex";
    updateSelectedCount();

    // 渲染每一条记录 (点击整行展示精美卡牌详情，点击 label 勾选框阻止冒泡用于核销)
    listContainer.innerHTML = drawRecords.map(record => {
        const spriteUrl = record.pokemonId ? `${POKE_SPRITE_CDN}/${record.pokemonId}.png` : '';
        const starsHtml = record.star ? `<span class="star-rating">${'★'.repeat(record.star)}</span>` : '';
        return `
            <div class="record-item" data-id="${record.id}" onclick="showRecordCard('${record.id}')">
                <label class="checkbox-container" onclick="event.stopPropagation()">
                    <input type="checkbox" value="${record.id}" onchange="onCheckboxChange(this)">
                    <span class="checkmark"></span>
                </label>
                ${spriteUrl ? `<img src="${spriteUrl}" class="record-poke-avatar" onerror="this.style.display='none'">` : ''}
                <div class="record-info">
                    <span class="record-time">
                        <i class="fa-regular fa-clock"></i> ${record.time}
                        ${starsHtml}
                    </span>
                    <span class="record-reward">${escapeHTML(record.reward)}</span>
                </div>
            </div>
        `;
    }).join("");
}

// 点击记录显示相应的卡片弹窗
function showRecordCard(recordId) {
    const record = drawRecords.find(r => String(r.id) === String(recordId));
    if (!record) return;
    
    // 拼装成符合 showResultModal 输入的结构
    const rewardObj = {
        text: record.reward,
        pokemonId: record.pokemonId,
        pokemonName: record.pokemonName,
        star: record.star
    };
    
    showResultModal(rewardObj, true);
}

// HTML 转义防注入
function escapeHTML(str) {
    if (!str || typeof str !== 'string') return "";
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// --- 勾选逻辑 ---
function toggleRecordSelect(rowElement) {
    const checkbox = rowElement.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    onCheckboxChange(checkbox);
}

function onCheckboxChange(checkbox) {
    const row = checkbox.closest(".record-item");
    if (checkbox.checked) {
        row.classList.add("checked");
    } else {
        row.classList.remove("checked");
    }
    updateSelectedCount();
}

function updateSelectedCount() {
    const selected = document.querySelectorAll('#records-list input[type="checkbox"]:checked');
    document.getElementById("selected-count").innerText = selected.length;
}

// 全选
function selectAllRecords() {
    const checkboxes = document.querySelectorAll('#records-list input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = true;
        cb.closest(".record-item").classList.add("checked");
    });
    updateSelectedCount();
}

// 取消全选
function deselectAllRecords() {
    const checkboxes = document.querySelectorAll('#records-list input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.closest(".record-item").classList.remove("checked");
    });
    updateSelectedCount();
}

// --- 核心安全认证逻辑 (密码锁) ---
function openAuthModal(onSuccessCallback) {
    pendingSecureAction = onSuccessCallback;
    currentPinInput = "";
    updatePinDisplay();
    
    // 打开弹窗
    document.getElementById("auth-modal").classList.add("open");
}

function closeAuthModal() {
    document.getElementById("auth-modal").classList.remove("open");
    currentPinInput = "";
    pendingSecureAction = null;
}

function handleKeypadPress(val) {
    // 限制最大输入长度
    if (currentPinInput.length >= 10) return;
    
    currentPinInput += val;
    updatePinDisplay();

    // 如果输入的长度达到了正确密码的长度，自动比对
    if (currentPinInput.length === parentPin.length) {
        setTimeout(verifyPin, 200);
    }
}

function clearPinInput() {
    currentPinInput = "";
    updatePinDisplay();
}

function updatePinDisplay() {
    const dots = document.querySelectorAll(".pin-dot");
    dots.forEach((dot, index) => {
        if (index < currentPinInput.length) {
            dot.classList.add("filled");
        } else {
            dot.classList.remove("filled");
        }
    });
}

function verifyPin() {
    if (currentPinInput === parentPin) {
        // 密码正确，关闭弹窗，执行回调
        const callback = pendingSecureAction;
        closeAuthModal();
        if (callback) callback();
    } else {
        // 密码错误，闪烁红色效果
        const dotsContainer = document.querySelector(".pin-display");
        dotsContainer.style.animation = "shake-ball 0.3s ease";
        
        const dots = document.querySelectorAll(".pin-dot");
        dots.forEach(dot => dot.style.backgroundColor = "var(--danger-color)");

        setTimeout(() => {
            dotsContainer.style.animation = "";
            dots.forEach(dot => {
                dot.style.backgroundColor = "";
                dot.classList.remove("filled");
            });
            currentPinInput = "";
        }, 500);
    }
}

// --- 核销记录逻辑 (以云端为事实源的单向数据流) ---
function batchRedeem() {
    const checkedBoxes = document.querySelectorAll('#records-list input[type="checkbox"]:checked');
    if (checkedBoxes.length === 0) return;

    // 调起家长密码锁
    openAuthModal(() => {
        // 密码验证成功后执行：
        const idsToRemove = Array.from(checkedBoxes).map(cb => String(cb.value));
        const targetRecords = drawRecords.filter(record => !idsToRemove.includes(String(record.id)));
        
        // 播放滑动淡出动画
        checkedBoxes.forEach(cb => {
            const row = cb.closest(".record-item");
            if (row) row.classList.add("removing");
        });

        // 动画播放完后向云端发起核销申请
        setTimeout(async () => {
            const success = await syncToCloud("redeem_records", targetRecords);
            
            if (success) {
                // 粒子特效祝贺核销成功
                triggerCelebration(20);
            } else {
                alert("核销同步到云端失败，请检查网络连接！");
                // 同步失败，恢复移除动画状态，让记录重新显示并重绘
                checkedBoxes.forEach(cb => {
                    const row = cb.closest(".record-item");
                    if (row) row.classList.remove("removing");
                });
                renderRecords();
            }
        }, 400);
    });
}

// --- 抽签主逻辑 (由后端进行随机权重抽奖决策) ---
function triggerLuckyDraw() {
    if (rewardPool.length === 0) {
        alert("奖励池中还没有任何奖励哦，请先在开发者面板中添加！");
        openAuthModal(() => {
            openDevModal();
        });
        return;
    }

    const drawBtn = document.getElementById("draw-btn");
    const pokeball = document.getElementById("pokeball");
    
    // 禁用抽奖按钮
    drawBtn.disabled = true;
    
    // 1. 精灵球开始抖动，按钮红光闪烁
    pokeball.classList.add("shaking");
    
    // 2. 2.4秒后（抖动动画结束），球裂开并消失
    setTimeout(() => {
        pokeball.classList.remove("shaking");
        pokeball.classList.add("opening");
        
        // 播放粒子放射效果
        triggerCelebration(80);
    }, 2400);

    // 3. 2.8秒后，弹出中奖卡牌结果
    setTimeout(async () => {
        // 向云端发起免密抽奖申请，并等待云端计算结果及返回
        const winReward = await syncToCloud("draw");
        
        if (!winReward) {
            alert("抽奖失败，请检查网络连接！");
            pokeball.classList.remove("opening");
            drawBtn.disabled = false;
            return;
        }
        
        // 显示中奖弹窗 (同步成功后最新记录列表已在 syncToCloud 内部被自动渲染)
        showResultModal(winReward);
        
        // 重置精灵球状态以便下次使用
        setTimeout(() => {
            pokeball.classList.remove("opening");
            drawBtn.disabled = false;
        }, 600);
        
    }, 2800);
}

function padZero(num) {
    return num.toString().padStart(2, '0');
}

// --- 弹出中奖结果模态框 ---
function showResultModal(winReward, isViewing = false) {
    const resultModal = document.getElementById("result-modal");
    const rewardVal = document.getElementById("reward-result-value");
    const pokeImg = document.getElementById("reward-poke-img");
    const loader = resultModal.querySelector(".image-loader");
    const flavorText = document.getElementById("pokemon-flavor-desc");
    
    // 动态调整卡片底部的按钮文字，如果是查看历史卡片则显示"关闭"，如果是抽中新奖励则显示"放入背包"
    const closeBtn = document.getElementById("close-result-btn");
    if (closeBtn) {
        closeBtn.innerText = isViewing ? "关闭" : "太棒了，收入背包！";
    }
    
    // 立即清除并隐藏上一张图片的 src，显示加载动画，防止连抽时短暂显示旧图片
    if (pokeImg) {
        pokeImg.onload = null;
        pokeImg.onerror = null;
        pokeImg.style.display = "none";
        pokeImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }
    if (loader) {
        loader.style.display = "block";
    }

    const rewardText = winReward.text;
    const pokeId = winReward.pokemonId || 25;
    const pokeName = winReward.pokemonName || "皮卡丘";
    const star = winReward.star || 1;
    
    rewardVal.innerText = rewardText;
    
    // 更新卡片上的宝可梦名字和星级
    document.getElementById("card-poke-name").innerHTML = `<i class="fa-solid fa-circle-dot"></i> ${pokeName}`;
    
    const rarityEl = document.getElementById("card-poke-rarity");
    rarityEl.className = `card-hp star-badge rarity-${star}`;
    rarityEl.innerHTML = `<i class="fa-solid fa-star"></i> ${star}星级`;
    
    // 备用多重 CDN 域名列表，自动降级切换
    const cdnList = [
        "https://gcore.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon",
        "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon",
        "https://fastly.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon",
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon"
    ];
    let cdnIndex = 0;

    const tryLoadImage = () => {
        const baseCdn = cdnList[cdnIndex];
        pokeImg.src = `${baseCdn}/other/official-artwork/${pokeId}.png`;
    };
    
    pokeImg.onload = () => {
        loader.style.display = "none";
        pokeImg.style.display = "block";
        // 成功后解绑，释放内存
        pokeImg.onload = null;
        pokeImg.onerror = null;
    };
    
    pokeImg.onerror = () => {
        cdnIndex++;
        if (cdnIndex < cdnList.length) {
            console.warn(`宝可梦图片主线路加载失败，正在尝试备用线路 ${cdnIndex + 1}...`);
            tryLoadImage();
        } else {
            // 所有 CDN 失败，使用纯本地 Base64 绘制的拟真精灵球兜底，100% 成功显示，彻底防卡死
            console.error("所有宝可梦大图 CDN 线路加载失败，使用本地 SVG 兜底！");
            loader.style.display = "none";
            pokeImg.onload = null;
            pokeImg.onerror = null;
            
            // Base64 精英球 SVG
            pokeImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23f5f5f5' stroke='%23333' stroke-width='8'/><path d='M5 50 h90' stroke='%23333' stroke-width='8'/><circle cx='50' cy='50' r='15' fill='%23fff' stroke='%23333' stroke-width='8'/><circle cx='50' cy='50' r='6' fill='%23333'/><path d='M5 50 A45 45 0 0 1 95 50' fill='%23ff1c1c'/></svg>";
            pokeImg.style.display = "block";
        }
    };

    // 开启拉取
    tryLoadImage();
    
    // 填充宝可梦对话描述
    let desc = POKEMON_FLAVORS[pokeId];
    if (!desc) {
        desc = `一只神奇的「${pokeName}」被你的努力召唤了出来！它高高兴兴地为你送上了这份幸运奖励！快找爸爸妈妈兑换吧！`;
    }
    flavorText.innerText = desc;
    
    // 开启模态框
    resultModal.classList.add("open");
    
    // 持续燃放烟花粒子
    let fireworksTimer = setInterval(() => {
        if (!resultModal.classList.contains("open")) {
            clearInterval(fireworksTimer);
            return;
        }
        triggerCelebration(5);
    }, 300);
}

function closeResultModal() {
    document.getElementById("result-modal").classList.remove("open");
    // 等待淡出动画（300ms）结束后清空图片，防止淡出时突然变白，同时确保下一次弹窗没有缓存残留
    setTimeout(() => {
        const pokeImg = document.getElementById("reward-poke-img");
        if (pokeImg) {
            pokeImg.onload = null;
            pokeImg.onerror = null;
            pokeImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            pokeImg.style.display = "none";
        }
    }, 300);
}

// --- 开发者后台模态框 ---
function openDevModal() {
    // 深拷贝当前的奖池用于临时编辑，防止未点击“保存”就生效
    editingRewards = JSON.parse(JSON.stringify(rewardPool));
    renderRewardsEditor();
    
    // 渲染概率滑块数值与对应的百分比
    renderProbabilitySettings();
    
    // 填充密码输入框
    document.getElementById("password-input").value = "";
    document.getElementById("password-confirm-input").value = "";

    // 渲染手动管理记录的下拉选项
    const selectEl = document.getElementById("manual-reward-select");
    if (selectEl) {
        selectEl.innerHTML = '<option value="">-- 手动输入奖励内容 --</option>' + 
            rewardPool.map(r => `<option value="${r.id}">${r.text} (${r.star}星级)</option>`).join("");
    }
    // 重置手动添加表单的状态
    const manualInput = document.getElementById("manual-reward-text");
    if (manualInput) manualInput.value = "";
    manualSelectedPokemon = { id: 25, name: "皮卡丘" };
    const manualPokeName = document.getElementById("manual-poke-name");
    if (manualPokeName) manualPokeName.innerText = "皮卡丘";
    const manualPokeImg = document.getElementById("manual-poke-img");
    if (manualPokeImg) manualPokeImg.src = `${POKE_SPRITE_CDN}/25.png`;

    // 渲染后台记录管理列表
    renderRecordsManager();
    
    // 默认展示第一个 Tab
    switchTab("tab-rewards");
    
    document.getElementById("dev-modal").classList.add("open");
}

function closeDevModal() {
    document.getElementById("dev-modal").classList.remove("open");
}

function switchTab(tabId) {
    // 切换按钮状态
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabId) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });
    
    // 切换内容展示
    const contents = document.querySelectorAll(".tab-content");
    contents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add("active");
        } else {
            content.classList.remove("active");
        }
    });
}

// --- 渲染奖项可视化配置编辑器 ---
function renderRewardsEditor() {
    const container = document.getElementById("rewards-list-editor");
    if (!container) return;
    
    container.innerHTML = editingRewards.map((reward, index) => {
        const pokeSprite = `${POKE_SPRITE_CDN}/${reward.pokemonId}.png`;
        return `
            <div class="editor-row" data-index="${index}">
                <div class="col-text">
                    <input type="text" class="reward-input-text" value="${escapeHTML(reward.text)}" 
                        placeholder="请输入奖励内容..." oninput="updateEditingRewardText(${index}, this.value)">
                </div>
                <div class="col-star">
                    <select class="reward-input-star" onchange="updateEditingRewardStar(${index}, this.value)">
                        <option value="1" ${reward.star == 1 ? 'selected' : ''}>★ 1星</option>
                        <option value="2" ${reward.star == 2 ? 'selected' : ''}>★★ 2星</option>
                        <option value="3" ${reward.star == 3 ? 'selected' : ''}>★★★ 3星</option>
                        <option value="4" ${reward.star == 4 ? 'selected' : ''}>★★★★ 4星</option>
                        <option value="5" ${reward.star == 5 ? 'selected' : ''}>★★★★★ 5星</option>
                    </select>
                </div>
                <div class="col-poke">
                    <button class="btn btn-outline btn-sm reward-input-poke" onclick="openPokePicker(${index})">
                        <img src="${pokeSprite}" class="poke-mini-icon" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><circle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23ff1c1c\' stroke=\'%23333\' stroke-width=\'8\'/><path d=\'M5 50 h90\' stroke=\'%23333\' stroke-width=\'8\'/><circle cx=\'50\' cy=\'50\' r=\'15\' fill=\'%23fff\' stroke=\'%23333\' stroke-width=\'8\'/><circle cx=\'50\' cy=\'50\' r=\'6\' fill=\'%23333\'/></svg>'">
                        <span>${reward.pokemonName}</span>
                    </button>
                </div>
                <div class="col-action">
                    <button class="delete-row-btn" onclick="deleteEditingReward(${index})" title="删除">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function updateEditingRewardText(index, val) {
    if (editingRewards[index]) {
        editingRewards[index].text = val;
    }
}

function updateEditingRewardStar(index, val) {
    if (editingRewards[index]) {
        editingRewards[index].star = parseInt(val);
    }
}

function deleteEditingReward(index) {
    editingRewards.splice(index, 1);
    renderRewardsEditor();
}

function addEditingReward() {
    const randomAction = POKEMON_ACTIONS[Math.floor(Math.random() * POKEMON_ACTIONS.length)];
    editingRewards.push({
        id: Date.now(),
        text: `皮卡丘${randomAction}：`,
        star: 1,
        pokemonId: 25,
        pokemonName: "皮卡丘"
    });
    renderRewardsEditor();
    
    // 自动滚动到编辑器最底部
    const container = document.getElementById("rewards-list-editor");
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
}

// --- 宝可梦图鉴选择器逻辑 ---
function initPokeGrid() {
    const grid = document.getElementById("poke-grid");
    if (!grid) return;
    
    grid.innerHTML = POKEMON_NAMES.map((name, index) => {
        const id = index + 1;
        const spriteUrl = `${POKE_SPRITE_CDN}/${id}.png`;
        return `
            <div class="poke-picker-item" data-id="${id}" data-name="${name}" onclick="selectPokemonForActiveRow(${id}, '${name}')">
                <span class="poke-num">#${id.toString().padStart(3, '0')}</span>
                <img src="${spriteUrl}" alt="${name}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><circle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23fcd705\' stroke=\'%23333\' stroke-width=\'8\'/><path d=\'M5 50 h90\' stroke=\'%23333\' stroke-width=\'8\'/><circle cx=\'50\' cy=\'50\' r=\'15\' fill=\'%23fff\' stroke=\'%23333\' stroke-width=\'8\'/><circle cx=\'50\' cy=\'50\' r=\'6\' fill=\'%23333\'/></svg>'">
                <span class="poke-name">${name}</span>
            </div>
        `;
    }).join("");
    
    setupPokeSearch();
}

function openPokePicker(index) {
    activeEditingRowIndex = index;
    
    let currentPokeId = 25; // 默认皮卡丘
    if (index === "manual") {
        currentPokeId = manualSelectedPokemon.id;
    } else if (index !== -1 && editingRewards[index]) {
        currentPokeId = editingRewards[index].pokemonId;
    }
    
    // 清除原有选中，高亮当前已选中的宝可梦
    const items = document.querySelectorAll(".poke-picker-item");
    let activeItem = null;
    items.forEach(item => {
        if (parseInt(item.dataset.id) === currentPokeId) {
            item.classList.add("selected");
            activeItem = item;
        } else {
            item.classList.remove("selected");
        }
        // 重置显示
        item.style.display = "flex";
    });
    
    // 重置搜索框
    document.getElementById("poke-search-input").value = "";
    
    // 打开弹窗
    document.getElementById("poke-picker-modal").classList.add("open");
    
    // 自动滚动到选中的宝可梦位置
    if (activeItem) {
        setTimeout(() => {
            activeItem.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 100);
    }
}

function closePokePicker() {
    document.getElementById("poke-picker-modal").classList.remove("open");
    activeEditingRowIndex = -1;
}

function selectPokemonForActiveRow(id, name) {
    if (activeEditingRowIndex === "manual") {
        manualSelectedPokemon = { id, name };
        const manualPokeName = document.getElementById("manual-poke-name");
        if (manualPokeName) manualPokeName.innerText = name;
        const manualPokeImg = document.getElementById("manual-poke-img");
        if (manualPokeImg) manualPokeImg.src = `${POKE_SPRITE_CDN}/${id}.png`;
    } else if (activeEditingRowIndex !== -1 && editingRewards[activeEditingRowIndex]) {
        editingRewards[activeEditingRowIndex].pokemonId = id;
        editingRewards[activeEditingRowIndex].pokemonName = name;
        
        // 如果文本为空，或者只包含宝可梦的默认前缀话术，我们就用新宝可梦名字和随机话术替换它
        const currentText = editingRewards[activeEditingRowIndex].text.trim();
        const isDefaultTemplate = currentText === "" || currentText.endsWith("：") || POKEMON_ACTIONS.some(act => currentText.includes(act));
        
        if (isDefaultTemplate) {
            const randomAction = POKEMON_ACTIONS[Math.floor(Math.random() * POKEMON_ACTIONS.length)];
            editingRewards[activeEditingRowIndex].text = `${name}${randomAction}：`;
        }
        
        renderRewardsEditor();
    }
    closePokePicker();
}

// 唤起宝可梦选择器给后台手动记录补发使用
window.openPokePickerForManual = function() {
    openPokePicker("manual");
};

function setupPokeSearch() {
    const searchInput = document.getElementById("poke-search-input");
    if (!searchInput) return;
    
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim().toLowerCase();
        const items = document.querySelectorAll(".poke-picker-item");
        items.forEach(item => {
            const name = item.dataset.name;
            const id = item.dataset.id;
            if (name.includes(query) || id === query) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        });
    });
}

// 保存奖池
function saveRewardPool() {
    // 校验是否有空项
    const hasEmpty = editingRewards.some(r => !r.text.trim());
    if (hasEmpty) {
        alert("奖励池中存在内容为空的奖项，请输入奖励内容或将其删除！");
        return;
    }
    
    if (editingRewards.length === 0) {
        alert("奖励池不能为空！请至少配置一个奖励项。");
        return;
    }
    
    closeDevModal();
    updateSyncStatus("syncing");
    
    // 直接向云端同步，同步成功后会自动用返回值更新本地全局变量、LocalStorage 及 UI
    syncToCloud("save_rewards", editingRewards).then(success => {
        if (success) {
            alert("奖励池配置已成功保存并同步至云端！");
        } else {
            alert("同步配置至云端失败，请检查网络连接！");
        }
        preloadRewardImages();
    });
}

// 重置默认奖池
function resetRewardPool() {
    if (confirm("确定要恢复默认奖池吗？这将会覆盖当前所有编辑的内容。")) {
        editingRewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
        renderRewardsEditor();
        alert("已在编辑器中加载默认奖池，请点击「保存并生效」进行应用。");
    }
}

// 导入 JSON 配置文件到编辑器
function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const rawData = event.target.result.trim();
            const parsed = JSON.parse(rawData);
            
            if (!Array.isArray(parsed)) {
                throw new Error("配置数据格式不正确，必须是一个包含奖券对象的 JSON 数组！");
            }
            
            // 校验格式并填充缺失的属性
            const validated = parsed.map((item, index) => {
                if (typeof item !== "object" || item === null) {
                    throw new Error(`第 ${index + 1} 项数据格式无效！`);
                }
                if (!item.text || typeof item.text !== "string" || !item.text.trim()) {
                    throw new Error(`第 ${index + 1} 项的奖励内容 (text) 不能为空！`);
                }
                
                const star = parseInt(item.star) || 1;
                if (star < 1 || star > 5) {
                    throw new Error(`第 ${index + 1} 项的稀有星级 (star) 必须在 1-5 之间！`);
                }
                
                let pokemonId = parseInt(item.pokemonId) || 25;
                let pokemonName = item.pokemonName || POKEMON_NAMES[pokemonId - 1] || "皮卡丘";
                
                return {
                    id: item.id || (Date.now() + index),
                    text: item.text.trim(),
                    star: star,
                    pokemonId: pokemonId,
                    pokemonName: pokemonName
                };
            });
            
            if (confirm(`成功解析了 ${validated.length} 个奖项配置！\n是否要将它们导入到当前编辑器中？\n\n（注意：这会覆盖你目前在编辑器里编辑的临时配置。请在导入后点击下方的“保存并生效”进行保存并同步云端）`)) {
                editingRewards = validated;
                renderRewardsEditor();
                
                // 自动滚动到编辑区顶部
                const container = document.getElementById("rewards-list-editor");
                if (container) container.scrollTop = 0;
            }
            
        } catch (err) {
            alert(`导入失败：${err.message}\n请确保上传的是本系统支持的标准 JSON 配置文件！`);
        } finally {
            // 清空 value 使得同一文件可以多次导入触发 change 事件
            e.target.value = "";
        }
    };
    reader.readAsText(file);
}

// 修改安全密码
function saveNewPassword() {
    const pin = document.getElementById("password-input").value.trim();
    const confirmPin = document.getElementById("password-confirm-input").value.trim();
    
    if (pin.length < 4) {
        alert("密码长度不能少于4位！");
        return;
    }
    
    if (pin !== confirmPin) {
        alert("两次输入的密码不一致，请重新输入！");
        return;
    }
    
    // 异步同步云端
    syncToCloud("change_pin", pin).then(success => {
        if (success) {
            alert("密码修改成功并已同步至云端！请记住您的新密码。");
        } else {
            alert("修改密码失败：云端同步连接失败，请检查网络后重试。");
        }
    });
    
    document.getElementById("password-input").value = "";
    document.getElementById("password-confirm-input").value = "";
}

// --- 事件监听器设置 ---
function setupEventListeners() {
    // 1. 抽奖
    document.getElementById("draw-btn").addEventListener("click", triggerLuckyDraw);
    document.getElementById("close-result-btn").addEventListener("click", closeResultModal);
    
    // 导出中奖记录
    const exportBtn = document.getElementById("export-records-btn");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportDrawRecords);
    }
    
    // 导入中奖记录
    const importRecordsBtn = document.getElementById("import-records-btn");
    const importRecordsInput = document.getElementById("import-records-input");
    if (importRecordsBtn && importRecordsInput) {
        importRecordsBtn.addEventListener("click", () => {
            openAuthModal(() => {
                importRecordsInput.click();
            });
        });
        importRecordsInput.addEventListener("change", handleRecordsImport);
    }
    
    // 2. 开发者后台入口
    document.getElementById("dev-mode-btn").addEventListener("click", () => {
        openAuthModal(openDevModal);
    });
    document.getElementById("close-dev-modal").addEventListener("click", closeDevModal);
    
    // 3. Tab 切换
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            switchTab(e.target.dataset.tab);
        });
    });
    
    // 4. 开发者面板操作
    document.getElementById("save-pool-btn").addEventListener("click", saveRewardPool);
    document.getElementById("reset-pool-btn").addEventListener("click", resetRewardPool);
    document.getElementById("save-password-btn").addEventListener("click", saveNewPassword);
    
    // 导入 JSON 配置文件
    const importBtn = document.getElementById("import-file-btn");
    const importInput = document.getElementById("import-file-input");
    if (importBtn && importInput) {
        importBtn.addEventListener("click", () => {
            importInput.click();
        });
        importInput.addEventListener("change", handleFileImport);
    }

    // 后台手动补发确认按钮
    const addManualBtn = document.getElementById("add-manual-record-btn");
    if (addManualBtn) {
        addManualBtn.addEventListener("click", addManualRecord);
    }
    
    // 5. 奖励可视化编辑器新增按钮
    document.getElementById("add-reward-btn").addEventListener("click", addEditingReward);
    
    // 6. 宝可梦选择弹窗关闭按钮
    document.getElementById("close-poke-picker-btn").addEventListener("click", closePokePicker);
    
    // 7. 抽签概率权重保存
    document.getElementById("save-weights-btn").addEventListener("click", saveWeights);
    
    // 8. 记录选择与核销
    document.getElementById("select-all-btn").addEventListener("click", selectAllRecords);
    document.getElementById("deselect-all-btn").addEventListener("click", deselectAllRecords);
    document.getElementById("batch-redeem-btn").addEventListener("click", batchRedeem);
    
    // 9. 数字键盘按键
    document.querySelectorAll(".keypad .key-btn[data-val]").forEach(btn => {
        btn.addEventListener("click", () => {
            handleKeypadPress(btn.dataset.val);
        });
    });
    document.getElementById("key-clear").addEventListener("click", clearPinInput);
    document.getElementById("key-close").addEventListener("click", closeAuthModal);

    // 10. 全局物理键盘输入监听器（仅在弹窗打开时生效）
    document.addEventListener("keydown", (e) => {
        const authModal = document.getElementById("auth-modal");
        if (authModal && authModal.classList.contains("open")) {
            // 如果输入的是 0-9 的数字
            if (e.key >= "0" && e.key <= "9") {
                handleKeypadPress(e.key);
            }
            // Backspace/Delete 退格回退一位
            else if (e.key === "Backspace" || e.key === "Delete") {
                if (currentPinInput.length > 0) {
                    currentPinInput = currentPinInput.slice(0, -1);
                    updatePinDisplay();
                }
            }
            // Escape 键关闭弹窗
            else if (e.key === "Escape") {
                closeAuthModal();
            }
        }
    });
}

// --- Canvas 烟花碎屑动画 ---
let ctx, canvas, particles = [];

function setupCanvas() {
    const container = document.getElementById("canvas-container");
    canvas = document.createElement("canvas");
    container.appendChild(canvas);
    ctx = canvas.getContext("2d");
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    // 动画循环
    requestAnimationFrame(updateParticles);
}

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

class ConfettiParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4;
        
        // 随机彩虹色及皮卡丘黄/精灵球红
        const colors = ["#ff1c1c", "#fcd705", "#4caf50", "#00bcd4", "#e91e63", "#9c27b0", "#ffffff"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // 初始速度
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 2; // 微弱向上的初始推力
        
        this.gravity = 0.15;
        this.opacity = 1;
        this.decay = Math.random() * 0.02 + 0.015;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.opacity -= this.decay;
        this.rotation += this.rotationSpeed;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        
        // 绘制方形碎屑
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

function triggerCelebration(count) {
    if (!canvas) return;
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    for (let i = 0; i < count; i++) {
        particles.push(new ConfettiParticle(x, y));
    }
}

function updateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.opacity <= 0) {
            particles.splice(i, 1);
        } else {
            p.draw();
        }
    }
    
    requestAnimationFrame(updateParticles);
}

// --- 渲染并自动计算概率百分比 ---
function renderProbabilitySettings() {
    const total = Object.values(starWeights).reduce((sum, w) => sum + w, 0);
    
    for (let star = 1; star <= 5; star++) {
        const weight = starWeights[star];
        const slider = document.getElementById(`weight-slider-${star}`);
        const numInput = document.getElementById(`weight-num-${star}`);
        const percentSpan = document.getElementById(`prob-percent-${star}`);
        
        if (slider) slider.value = weight;
        if (numInput) numInput.value = weight;
        
        const percent = total > 0 ? ((weight / total) * 100).toFixed(1) : 0;
        if (percentSpan) percentSpan.innerText = `${percent}%`;
    }
}

// 绑定全局事件响应滑动条拖动 (双向同步)
window.onWeightSliderChange = function(star, val) {
    const numVal = parseInt(val) || 0;
    const numInput = document.getElementById(`weight-num-${star}`);
    if (numInput) numInput.value = numVal;
    
    starWeights[star] = numVal;
    renderProbabilitySettings();
};

window.onWeightNumChange = function(star, val) {
    let numVal = parseInt(val) || 0;
    if (numVal < 0) numVal = 0;
    if (numVal > 999) numVal = 999; // 设定限制防溢出
    
    const slider = document.getElementById(`weight-slider-${star}`);
    if (slider) slider.value = Math.min(numVal, 100);
    
    starWeights[star] = numVal;
    renderProbabilitySettings();
};

// 保存概率并双写同步到云端
function saveWeights() {
    closeDevModal();
    updateSyncStatus("syncing");
    
    syncToCloud("save_weights", starWeights).then(success => {
        if (success) {
            alert("抽签概率配置已成功保存并同步至云端！");
        } else {
            alert("同步配置至云端失败，请检查网络连接！");
        }
    });
}

// --- 预加载奖池宝可梦图片，实现 0 毫秒秒开 ---
let preloadedImages = {};
function preloadRewardImages() {
    if (!rewardPool || rewardPool.length === 0) return;
    
    rewardPool.forEach(item => {
        const pokeId = item.pokemonId || 25;
        
        // 1. 预载高清原画
        if (!preloadedImages[pokeId]) {
            const img = new Image();
            img.src = `${POKE_SPRITE_CDN}/other/official-artwork/${pokeId}.png`;
            preloadedImages[pokeId] = img;
        }
        
        // 2. 预载微缩头像
        const avatarKey = `avatar-${pokeId}`;
        if (!preloadedImages[avatarKey]) {
            const avatarImg = new Image();
            avatarImg.src = `${POKE_SPRITE_CDN}/${pokeId}.png`;
            preloadedImages[avatarKey] = avatarImg;
        }
    });
}

// --- 开发者后台：手动管理中奖记录列表渲染 ---
function renderRecordsManager() {
    const container = document.getElementById("records-list-manager");
    if (!container) return;
    
    if (drawRecords.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.4); font-size: 0.85rem;">
                当前暂无中奖记录。
            </div>
        `;
        return;
    }
    
    container.innerHTML = drawRecords.map(record => {
        const spriteUrl = record.pokemonId ? `${POKE_SPRITE_CDN}/${record.pokemonId}.png` : '';
        const starsHtml = record.star ? `<span style="color: var(--secondary-color); font-size: 0.75rem;">${'★'.repeat(record.star)}</span>` : '';
        return `
            <div class="editor-row" style="padding: 6px 12px; border-radius: 10px;">
                <span style="flex: 1.2; font-size: 0.75rem; color: rgba(255,255,255,0.5); overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${record.time}</span>
                <span style="flex: 2; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: bold;" title="${escapeHTML(record.reward)}">${escapeHTML(record.reward)}</span>
                <span style="flex: 1; display: flex; align-items: center;">${starsHtml}</span>
                <span style="flex: 1.2; display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: rgba(255,255,255,0.85);">
                    ${spriteUrl ? `<img src="${spriteUrl}" style="width: 20px; height: 20px; object-fit: contain;">` : ''}
                    <span>${record.pokemonName}</span>
                </span>
                <span style="flex: 0.6; display: flex; justify-content: center; align-items: center;">
                    <button class="delete-row-btn" onclick="deleteSingleRecord('${record.id}')" title="删除/核销该奖券" style="padding: 4px;">
                        <i class="fa-solid fa-trash-can" style="font-size: 0.9rem;"></i>
                    </button>
                </span>
            </div>
        `;
    }).join("");
}

// 联动填充选择的常备奖励
window.onManualRewardSelectChange = function(rewardId) {
    const textInput = document.getElementById("manual-reward-text");
    const starSelect = document.getElementById("manual-reward-star");
    
    if (!rewardId) {
        textInput.value = "";
        return;
    }
    
    const reward = rewardPool.find(r => String(r.id) === String(rewardId));
    if (reward) {
        textInput.value = reward.text;
        starSelect.value = reward.star;
        
        // 联动宝可梦选择
        manualSelectedPokemon = { id: reward.pokemonId, name: reward.pokemonName };
        const manualPokeName = document.getElementById("manual-poke-name");
        if (manualPokeName) manualPokeName.innerText = reward.pokemonName;
        const manualPokeImg = document.getElementById("manual-poke-img");
        if (manualPokeImg) manualPokeImg.src = `${POKE_SPRITE_CDN}/${reward.pokemonId}.png`;
    }
};

// 确认手动补发奖券
function addManualRecord() {
    const text = document.getElementById("manual-reward-text").value.trim();
    const star = parseInt(document.getElementById("manual-reward-star").value) || 1;
    
    if (!text) {
        alert("请输入或选择奖励内容！");
        return;
    }
    
    const dateStr = getBeijingTimeStrLocal();
    const newRecord = {
        id: Date.now(),
        time: dateStr,
        reward: text,
        pokemonId: manualSelectedPokemon.id,
        pokemonName: manualSelectedPokemon.name,
        star: star
    };
    
    // 追加至荣誉榜最前端
    drawRecords.unshift(newRecord);
    
    // 重置输入表单
    document.getElementById("manual-reward-text").value = "";
    document.getElementById("manual-reward-select").value = "";
    
    // 重新渲染相关页面模块
    renderRecordsManager();
    
    // 强一致性同步至云端
    syncToCloud("redeem_records", drawRecords).then(success => {
        if (success) {
            alert("已成功手动补发中奖记录并同步至云端！");
        } else {
            alert("本地补发成功，但同步至云端失败，请检查网络！");
        }
    });
}

// 开发者后台单条删除中奖记录
window.deleteSingleRecord = function(recordId) {
    if (confirm("确定要永久删除这一条中奖奖券记录吗？该操作将直接核销此券。")) {
        drawRecords = drawRecords.filter(r => String(r.id) !== String(recordId));
        renderRecordsManager();
        
        // 强一致性同步至云端
        syncToCloud("redeem_records", drawRecords).then(success => {
            if (success) {
                alert("已成功核销删除该中奖记录并同步至云端！");
            } else {
                alert("本地删除成功，但同步至云端失败，请检查网络！");
            }
        });
    }
};

// 前端本地东八区时间格式化
function getBeijingTimeStrLocal() {
    const d = new Date();
    // 抹平时区差，计算北京时间
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const bjDate = new Date(utc + (3600000 * 8));
    
    const pad = num => num.toString().padStart(2, '0');
    return `${bjDate.getFullYear()}年${pad(bjDate.getMonth()+1)}月${pad(bjDate.getDate())}日 ${pad(bjDate.getHours())}:${pad(bjDate.getMinutes())}`;
}

// 导出中奖荣誉榜记录到本地文本文件
function exportDrawRecords() {
    if (!drawRecords || drawRecords.length === 0) {
        alert("当前暂无中奖记录，无法导出！");
        return;
    }
    
    // 生成格式化的文本排版
    let textContent = `=========================================\n`;
    textContent += `       宝可梦中奖荣誉榜历史记录\n`;
    textContent += `=========================================\n`;
    textContent += `导出时间: ${getBeijingTimeStrLocal()}\n`;
    textContent += `记录总数: ${drawRecords.length} 条\n\n`;
    
    drawRecords.forEach((r, index) => {
        textContent += `${index + 1}. [${r.time}] 获得奖励: 【${r.reward}】 (${r.star}星级 - 宝可梦: ${r.pokemonName})\n`;
    });
    
    // 触发浏览器下载文本文件
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    a.href = url;
    a.download = `宝可梦中奖记录_${dateStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 导入中奖荣誉榜记录追加到当前的记录列表中
function handleRecordsImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const rawData = event.target.result.trim();
            let importedRecords = [];
            
            // 1. 如果导入的是 .json 格式的数据
            if (file.name.endsWith('.json')) {
                const parsed = JSON.parse(rawData);
                if (!Array.isArray(parsed)) {
                    throw new Error("配置数据格式不正确，必须是一个包含中奖记录对象的 JSON 数组！");
                }
                importedRecords = parsed.map(item => {
                    return {
                        id: item.id || Date.now() + Math.random(),
                        time: item.time || getBeijingTimeStrLocal(),
                        reward: item.reward || item.text || "未知奖励",
                        pokemonId: parseInt(item.pokemonId) || 25,
                        pokemonName: item.pokemonName || "皮卡丘",
                        star: parseInt(item.star) || 1
                    };
                });
            } 
            // 2. 如果导入的是 .txt 格式的可读文本，则使用正则表达式进行按行提取解析
            else {
                const lines = rawData.split('\n');
                // 正则模式匹配: 1. [时间] 获得奖励: 【内容】 (星级 - 宝可梦: 名字)
                const regex = /\d+\.\s*\[(.*?)\]\s*获得奖励:\s*【(.*?)】\s*\((.*?)\s*星级\s*-\s*宝可梦:\s*(.*?)\)/;
                
                lines.forEach((line, index) => {
                    const match = line.match(regex);
                    if (match) {
                        const time = match[1].trim();
                        const reward = match[2].trim();
                        const star = parseInt(match[3]) || 1;
                        const pokemonName = match[4].trim();
                        
                        // 从宝可梦名称反查对应的宝可梦 ID
                        let pokemonId = POKEMON_NAMES.indexOf(pokemonName) + 1;
                        if (pokemonId <= 0) pokemonId = 25; // 默认皮卡丘
                        
                        importedRecords.push({
                            id: Date.now() + index + Math.floor(Math.random() * 1000),
                            time: time,
                            reward: reward,
                            pokemonId: pokemonId,
                            pokemonName: pokemonName,
                            star: star
                        });
                    }
                });
            }
            
            if (importedRecords.length === 0) {
                throw new Error("未能识别出任何中奖记录！请确保文件由本系统导出且格式正确。");
            }
            
            if (confirm(`成功解析了 ${importedRecords.length} 条历史中奖记录！\n是否要将它们追加到当前的荣誉榜中？`)) {
                // 将导入的记录合并追加到现有记录的最前方 (按照时间顺序)
                drawRecords = importedRecords.concat(drawRecords);
                
                // 重新渲染列表及状态
                renderRecords();
                
                // 自动同步至云端/本地存储
                updateSyncStatus("syncing");
                const success = await syncToCloud("redeem_records", drawRecords);
                if (success) {
                    alert("中奖记录已成功导入并同步至云端！");
                } else {
                    alert("本地导入成功，但云端数据同步失败，请检查您的网络连接！");
                }
            }
            
        } catch (err) {
            alert(`导入失败：${err.message}\n请选择正确的导出文件进行恢复。`);
        } finally {
            e.target.value = "";
        }
    };
    reader.readAsText(file);
}
