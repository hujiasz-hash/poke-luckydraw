FROM node:18-alpine

WORKDIR /app

# 复制依赖定义并安装
COPY package*.json ./
RUN npm install --production

# 复制其余的项目代码
COPY . .

# 暴露本地开发服务器的默认端口
EXPOSE 8888

# 启动服务器（它兼备静态文件托管与本地 JSON 数据读写接口）
CMD ["node", "scratch/dev-server.js"]
