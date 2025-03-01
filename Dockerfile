# 使用 node:18-alpine 镜像构建前端
FROM docker.1ms.run/node:18-alpine AS build

WORKDIR /app

# 复制 package.json 和 package-lock.json 文件
COPY package*.json ./
RUN npm ci

# 复制项目其他文件
COPY . .

# 打包项目
RUN npm run build

# 使用 nginx 镜像托管构建后的文件
FROM nginx:alpine

# 删除默认的 nginx 静态文件
RUN rm -rf /usr/share/nginx/html/*

# 将构建的 dist 文件夹复制到 nginx 的静态文件目录
COPY --from=build /app/dist /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
