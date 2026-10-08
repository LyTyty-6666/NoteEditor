# ==============================================================================
# Production Dockerfile for NoteEditor Web
# Supports Node 20 LTS, Turso Database, and Cross-Platform Tools Downloads
# ==============================================================================

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies (utilizes Docker layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code & binary assets
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose web port
EXPOSE 3000

# Start secure Express application
CMD ["node", "local-server.js"]
