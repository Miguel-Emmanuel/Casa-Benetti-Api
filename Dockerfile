# Check out https://hub.docker.com/_/node to select a new base image
FROM node:20-bookworm AS app

# Create app directory (with user `node`)

WORKDIR /app

ARG UID=1000
ARG GID=1000

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential curl libpq-dev libfontconfig \
  && rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man \
  && apt-get clean \
  && groupmod -g "${GID}" node && usermod -u "${UID}" -g "${GID}" node \
  && mkdir -p /node_modules && chown node:node -R /node_modules /app

# Set to a non-root built-in user `node`
USER node

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY --chown=node package*.json  ./
COPY --chown=node .env  ./

RUN npm install --force && npm cache clean --force

# Bundle app source code
COPY --chown=node . .

RUN npm run build
RUN npm run migrate

EXPOSE 3000
CMD [ "npm","start" ]
