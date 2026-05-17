# syntax=docker/dockerfile:1.7
# Build the @vacancy-kit/api workspace from the monorepo root.
# Build with: docker build -f apps/api/Dockerfile .

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

FROM base AS deps
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter @vacancy-kit/api... --prod=false

FROM deps AS build
WORKDIR /repo
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @vacancy-kit/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000

COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/packages/shared ./node_modules/@vacancy-kit/shared
COPY --from=build /repo/node_modules ./node_modules

EXPOSE 8000
USER node
CMD ["node", "dist/index.js"]
