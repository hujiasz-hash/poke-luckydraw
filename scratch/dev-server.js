const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8888;
const DATA_FILE = path.join(__dirname, 'blobs_mock.json');
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

// 初始化模拟数据库
function getMockDb() {
    if (!fs.existsSync(DATA_FILE)) {
        const initData = {
            pin: DEFAULT_PIN,
            rewards: DEFAULT_REWARDS,
            records: [],
            weights: DEFAULT_WEIGHTS
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initData, null, 2));
        return initData;
    }
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        // 补充可能没有的 weights 字段
        if (!data.weights) {
            data.weights = DEFAULT_WEIGHTS;
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        }
        return data;
    } catch (e) {
        return {
            pin: DEFAULT_PIN,
            rewards: DEFAULT_REWARDS,
            records: [],
            weights: DEFAULT_WEIGHTS
        };
    }
}

function saveMockDb(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
    // 跨域 Header 允许
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // 模拟 Netlify Functions 接口
    if (pathname === '/.netlify/functions/storage') {
        const db = getMockDb();

        if (req.method === 'GET') {
            res.writeHead(200, corsHeaders);
            res.end(JSON.stringify(db));
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const { action, pin, data } = JSON.parse(body);

                    // 鉴权敏感操作
                    if (['save_rewards', 'redeem_records', 'change_pin', 'save_weights'].includes(action)) {
                        if (pin !== db.pin) {
                            res.writeHead(401, corsHeaders);
                            res.end(JSON.stringify({ error: '家长身份验证失败：密码错误！' }));
                            return;
                        }
                    }

                    if (action === 'save_rewards') {
                        db.rewards = data;
                    } else if (action === 'redeem_records') {
                        db.records = data;
                    } else if (action === 'change_pin') {
                        db.pin = data;
                    } else if (action === 'save_weights') {
                        db.weights = data;
                    } else if (action === 'add_record') {
                        db.records.unshift(data);
                    } else {
                        res.writeHead(400, corsHeaders);
                        res.end(JSON.stringify({ error: '未知操作' }));
                        return;
                    }

                    saveMockDb(db);
                    res.writeHead(200, corsHeaders);
                    res.end(JSON.stringify(db));
                } catch (e) {
                    res.writeHead(500, corsHeaders);
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        }
    }

    // 托管静态文件
    const publicDir = path.join(__dirname, '..');
    let filePath = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);

    // 简单防越界安全检查
    if (!filePath.startsWith(publicDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
        case '.ico': contentType = 'image/x-icon'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 File Not Found');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`宝可梦抽签本地云模拟服务器已启动！`);
    console.log(`请在浏览器中打开: http://localhost:${PORT}`);
    console.log(`模拟数据库文件保存在: ${DATA_FILE}`);
    console.log(`====================================================`);
});
