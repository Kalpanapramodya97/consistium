# Stage 1: Install dependencies
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Run as non-root user
USER node

# Copy dependencies from builder
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
# Copy source files
COPY --chown=node:node . .

EXPOSE 5000

CMD ["node", "server.js"]
