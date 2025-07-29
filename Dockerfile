# 1단계: 빌드
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# 2단계: 정적 파일을 nginx에 복사
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Nginx 설정 덮어쓰기
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
