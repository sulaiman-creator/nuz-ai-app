# Build frontend
FROM node:20 as build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Ensure the output directory exists
RUN mkdir -p ../backend/dist
RUN npm run build

# Build backend
FROM node:20
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./
# Copy built frontend from the build stage
COPY --from=build-frontend /app/backend/dist ./dist

EXPOSE 8080
ENV PORT=8080
CMD ["npm", "start"]
