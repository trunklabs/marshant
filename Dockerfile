FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_OUTPUT_MODE="standalone"
ENV CI="true"
RUN corepack enable

FROM base AS build-web
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install -w -F @marshant/web... --frozen-lockfile && \
    pnpm exec turbo @marshant/web#build

FROM node:24-alpine AS web
WORKDIR /prod/web
ENV NODE_ENV=production
COPY --from=build-web /usr/src/app/services/web/.next/standalone ./
COPY --from=build-web /usr/src/app/services/web/.next/static ./services/web/.next/static
COPY --from=build-web /usr/src/app/services/web/public ./services/web/public
CMD ["node", "services/web/server.js"]
