# Step 1: Build
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Build-stage heap needs enough room for Vite's transform + bundling phase
ENV NODE_OPTIONS="--max-old-space-size=1024"
# Reduce npm parallel jobs to prevent memory spikes
ENV npm_config_jobs=1

# Accept the API URL build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --no-fund --progress=false
COPY . .
RUN npm run build

# Step 2: Serve
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
