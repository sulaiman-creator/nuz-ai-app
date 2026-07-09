# ── Stage 1: Build Frontend ────────────────────────────────────
FROM node:20 AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production Runtime ────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy root/backend package files (server.js is at root)
COPY package*.json ./
RUN npm install --omit=dev

# Copy backend source
COPY server.js firebase.js ./

# Copy built frontend assets from build stage
COPY --from=build-frontend /app/backend/dist ./dist

EXPOSE 8080
ENV PORT=8080
CMD ["npm", "start"]