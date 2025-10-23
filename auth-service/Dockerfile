FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies first (use package.json + package-lock.json if present)
COPY package*.json ./
RUN npm ci --only=production || npm install --only=production

# Copy source
COPY . .

# Expose service port
ENV PORT=4001
EXPOSE 4001

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1

CMD ["npm", "start"]


