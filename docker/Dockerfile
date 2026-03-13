# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build

# ── Stage 2: Production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Chromium + Playwright dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    fontconfig

# Tell Playwright to use the system Chromium instead of downloading its own
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy only what's needed at runtime
COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/node_modules  ./node_modules
COPY package*.json ./

EXPOSE 3000

# Run as non-root for security
USER node

CMD ["node", "dist/main"]
