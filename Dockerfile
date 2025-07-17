# Multi-stage build for production
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ .
RUN npm run build

# Backend production image
FROM node:18-alpine AS backend

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .
COPY --from=frontend-builder /app/frontend/dist ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S sesliask -u 1001

# Set correct permissions
RUN chown -R sesliask:nodejs /app
USER sesliask

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

CMD ["npm", "start"]