FROM mcr.microsoft.com/devcontainers/node:20-bullseye

# Install common build tools and git
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
  && apt-get install -y --no-install-recommends curl ca-certificates git build-essential python3 make gnupg2 \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Ensure corepack is available and prepare pnpm
RUN corepack enable || true
RUN corepack prepare pnpm@8.15.5 --activate || npm i -g pnpm@8.15.5 || true

WORKDIR /workspace

CMD ["sleep", "infinity"]
FROM node:20-bullseye

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

WORKDIR /workspace

CMD ["/bin/bash"]
# ECONEURA-IA Development Container
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js and pnpm
ENV NODE_VERSION=20.10.0
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /workspaces

# Default shell
ENV SHELL=/bin/bash

# Keep container running
CMD ["sleep", "infinity"]
