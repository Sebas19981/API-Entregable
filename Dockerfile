FROM node:22-alpine AS build

WORKDIR /app

COPY node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
RUN node ./node_modules/typescript/bin/tsc

FROM node:22-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node public ./public
COPY --chown=node:node postman.md ./postman.md

USER node
EXPOSE 3000

CMD ["node", "dist/servidor.js"]
