FROM node:18-alpine

WORKDIR /app

# Install dependencies required for Prisma and Docker client
RUN apk add --no-cache openssl docker

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client specifically for Alpine
RUN npx prisma generate

# Copy remaining application files
COPY . .

# Build TypeScript code
RUN npm run build

# Create temp directory for code execution
RUN mkdir -p tmp

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "build/src/server.js"]