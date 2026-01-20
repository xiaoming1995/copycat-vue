# Build stage
FROM node:18-alpine AS build-stage

WORKDIR /app

# 使用国内 npm 镜像加速
RUN npm config set registry https://registry.npmmirror.com

# Copy dependency files first (利用 Docker 层缓存)
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
