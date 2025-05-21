# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.13.1
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Vite"

WORKDIR /app

ENV NODE_ENV="production"

FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY package-lock.json package.json ./
RUN npm ci --include=dev

COPY . .

RUN npm run build

RUN npm prune --omit=dev

FROM nginx

FROM nginx

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD [ "/usr/sbin/nginx", "-g", "daemon off;" ]