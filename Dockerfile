# Railway build for the API service.
#
# Lives at the repo root on purpose: Railway always builds with a Dockerfile
# when it finds one, which sidesteps the deprecated railway.json builder
# detection (nixpacks/railpack) that failed with "No start command could be
# found". Same commands the local pipeline runs:
#   pnpm install -> prisma generate -> nest build -> node dist/src/main
FROM node:20-bookworm

# pnpm via corepack; the exact version is pinned by "packageManager" in
# package.json (pnpm@9.15.0).
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# The root "prepare" script runs husky; there is no .git inside the image.
ENV HUSKY=0

WORKDIR /app

# Workspace manifests first so dependency installation stays cached until the
# lockfile changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/design-system/package.json packages/design-system/package.json
COPY packages/motion/package.json packages/motion/package.json
RUN pnpm install --frozen-lockfile --prod=false

# Full sources, then the exact production build chain.
COPY . .
RUN pnpm --filter api exec prisma generate && pnpm --filter api run build

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "apps/api/dist/src/main"]
