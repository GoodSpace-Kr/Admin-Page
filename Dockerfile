# 1단계: 빌드 단계
FROM node:18 AS build

# 작업 디렉토리 설정
WORKDIR /app

# package.json, package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# .env.production → .env로 복사
COPY .env.production .env

# 전체 소스 복사 및 빌드
COPY . .
RUN npm run build

# 2단계: Nginx를 사용한 정적 파일 서빙
FROM nginx:alpine

# 기존 정적 파일 제거
RUN rm -rf /usr/share/nginx/html/*

# React 빌드 결과물을 복사
COPY --from=build /app/build /usr/share/nginx/html

# (선택) 커스텀 Nginx 설정이 있다면 여기에 복사
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
