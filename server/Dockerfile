FROM node:18-alpine AS base

# Install dependencies for Prisma and Docker client
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client specifically for Alpine
RUN npx prisma generate

# Copy source files
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript code
RUN npm run build

# Create temp directory for code execution
RUN mkdir -p tmp

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start server
CMD ["node", "build/src/server.js"]