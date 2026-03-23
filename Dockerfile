# Step 1: Build
FROM node:20-alpine AS build
WORKDIR /app
# Build-stage heap needs enough room for Vite's transform + bundling phase
ENV NODE_OPTIONS="--max-old-space-size=1024"
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --progress=false
COPY . .
RUN npm run build

# Step 2: Serve
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
