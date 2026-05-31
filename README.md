# 宝可梦主题随机奖励抽签系统 🎁✨

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com)
![Technology Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20VanillaJS-blue.svg)
![Backend](https://img.shields.io/badge/Backend-Netlify%20Functions%20%7C%20Blobs-teal.svg)

高颜值、流畅交互的**宝可梦主题随机奖励抽签小游戏**。专为家长激励孩子完成日常任务（如做家务、写作业、早睡等）而设计。系统引入了 **Netlify Blobs 强一致性云端存储** 架构，彻底告别本地缓存清除导致的数据丢失，实现多端数据秒级无缝同步。

---

## 🌟 核心特性

- **🎮 精灵球 3D 召唤台**：点击掷出精灵球，享受递增振幅的拟真物理抖动与红光呼吸闪烁，召唤神兽。
- **🃏 TCG 彩虹偏光卡牌**：开奖结果采用 3D Holographic 彩虹偏光偏转效果，展现高分辨率的神奇宝贝高清大图与契合世界观的对话。
- **🏆 中奖荣誉榜与批量核销**：孩子抽中的奖券集中在荣誉榜展示，支持点击奖券随时翻阅卡片。家长可一键输入密码安全核销。
- **🔐 家长控制后台**：
  - **奖励池自定义配置**：可视化编辑奖励，支持绑定 1-151 只初代的宝可梦。
  - **话术智能联动**：在更改绑定宝可梦时，自动填充 15 种符合宝可梦世界观设定的随机后缀话术（带有自定义防覆盖保护）。
  - **抽签概率精准调节**：自由调节 1-5 星级奖励的出现权重，百分比动态折算。
  - **中奖历史补发与单条核销**：家长可克隆奖池或手写奖券手动补发至孩子背包，或使用垃圾桶图标一键单条核销。
  - **一键导入奖池 JSON**：支持直接上传配好的配置文件，快速导入。

---

## 🛠️ 技术架构

系统基于 **“云端强一致主存 + 本地 LocalStorage 缓存”** 的单向数据流进行重构，彻底杜绝数据在刷新页面或多设备时的回滚和偏置。
- **前端**：Vanilla JS + Vanilla CSS3 纯原生轻量化开发，无重度脚手架依赖，动画表现细腻流畅。
- **后端 API**：Netlify Functions Serverless 函数，执行强安全后端权重概率抽签决策及敏感操作鉴权。
- **数据库**：Netlify Blobs (开启 `consistency: "strong"` 强一致性读写)，保障数据在边缘节点实时可见。
- **同步策略**：SWR (Stale-While-Revalidate) 缓存加载，优先加载本地快速响应，后台静默请求权威云端校准覆写，极速与数据一致性兼得。

---

## 📦 快速开始

### 1. 本地运行与调试
为了方便在未部署或离线环境下进行开发，项目在 `scratch/` 目录下内置了模拟服务器和本地 JSON 数据库。

1. **安装依赖**：
   ```bash
   npm install
   ```
2. **启动本地调试服务器**：
   ```bash
   node scratch/dev-server.js
   ```
3. **打开浏览器**：
   访问 `http://localhost:8888` 即可启动游戏。
   - 调试数据会自动保存在本地的 `scratch/blobs_mock.json` 文件中。
   - 本地模拟服务器高度还原了 Netlify Blobs 的密码鉴权和读写一致性逻辑。

### 2. 部署到 Netlify 云端
1. **安装 Netlify CLI**：
   ```bash
   npm install -n -g netlify-cli
   ```
2. **本地登录并关联项目**：
   ```bash
   netlify login
   netlify init
   ```
3. **部署测试**：
   ```bash
   netlify dev # 模拟运行 Netlify Edge 环境
   netlify deploy --prod # 生产构建并推送上线
   ```

---

## 🗂️ 奖池导入配置规范 (Import Spec)

在开发者后台中，点击“导入配置”可以上传包含奖券列表的 `.json` 文件。标准的导入 JSON 结构应为一个对象数组，示例如下：

```json
[
  {
    "text": "皮卡丘的雷电活力：免做家务一次",
    "star": 1,
    "pokemonId": 25,
    "pokemonName": "皮卡丘"
  },
  {
    "text": "卡比兽的深度睡眠：周末可以晚起1小时",
    "star": 3,
    "pokemonId": 143,
    "pokemonName": "卡比兽"
  },
  {
    "text": "超梦的精神强念：获得自选百元小玩具一个",
    "star": 5,
    "pokemonId": 150
  }
]
```

### 字段定义说明：
| 字段名 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| **`text`** | *string* | **是** | - | 奖励内容的文字描述，不能为空且不能少于2个字。 |
| **`star`** | *number* | 否 | `1` | 稀有星级（`1` - `5`），控制该奖项被抽中的基础概率。 |
| **`pokemonId`** | *number* | 否 | `25` | 绑定的宝可梦 ID（`1` - `151` 对应初代图鉴），决定展现的卡牌形象。 |
| **`pokemonName`** | *string* | 否 | - | 宝可梦中文名。若不填，导入时系统会根据 `pokemonId` 自动补全。 |

---

## 📄 项目规格与需求文档 (PRD)

关于项目的详细产品规划设计、同步机制泳道图、历史 Bug 修复日志（Bug & Fix Log）以及具体的 API 设计规范，请查阅根目录下的 [prd.md](file:///Users/hujia/Desktop/cla/pokemon-luckydraw/prd.md)。
