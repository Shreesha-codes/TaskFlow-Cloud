# Production Backend Multi-Stage Dockerfile
# Stage 1: Dependencies and Build
FROM node:20-alpine AS dependencies
WORKDIR /app

# Install build dependencies if needed
COPY package.json package-lock.json ./
# Install only production dependencies
RUN npm ci --only=production

# Stage 2: Final Secure Minimal Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Security: Set production environment
ENV NODE_ENV=production
ENV PORT=8000

# Security: Don't run as root - use the built-in non-privileged node user
USER node

# Copy production node_modules from builder
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src/ ./src/

# Container metadata
EXPOSE 8000

# Docker healthcheck aligned with Kubernetes liveness probe
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

CMD ["node", "src/server.js"]
