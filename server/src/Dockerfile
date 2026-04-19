# -------- Stage 1: Build --------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Debug to confirm dist exists
RUN ls -la dist

RUN npm prune --omit=dev && npm cache clean --force


# -------- Stage 2: Runtime --------
FROM gcr.io/distroless/nodejs22-debian12:latest

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json .

EXPOSE 3000

CMD ["dist/server.js"]
