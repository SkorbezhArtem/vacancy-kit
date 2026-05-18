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
RUN pnpm install --frozen-lockfile --filter @vacancy-kit/api...

FROM deps AS runtime
WORKDIR /repo
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @vacancy-kit/api typecheck

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000
USER node
WORKDIR /repo/apps/api
CMD ["pnpm", "start"]
