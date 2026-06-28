# Production Dockerfile for the Payload + Next.js app.
# Important: Docker Compose runtime environment variables are not available while
# the image is being built, so the builder stage uses safe placeholder values and
# Next's compile-only build mode. Real values are injected by compose at runtime.

FROM node:22-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    PAYLOAD_SECRET=build-time-placeholder-secret \
    AUTOSHARE_WEBHOOK_SECRET=build-time-placeholder-secret \
    DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/payload \
    PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000 \
    NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
    FRONTEND_ORIGIN=http://localhost:5173
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN apk add --no-cache libc6-compat \
  && addgroup -S nodejs \
  && adduser -S nextjs -G nodejs

COPY --from=builder /app ./
RUN npm prune --omit=dev \
  && mkdir -p /app/media \
  && chown -R nextjs:nodejs /app/media /app/.next

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
