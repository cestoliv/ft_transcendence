FROM node:alpine as build

ARG REACT_APP_API_URL
ARG REACT_APP_SOCKET_URL
ARG REACT_APP_COOKIE_DOMAIN

ENV DISABLE_ESLINT_PLUGIN=true

# Copy streaks sources
WORKDIR /transcendence
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json
COPY public public
COPY src src
RUN echo hello mgl
RUN echo $REACT_APP_API_URL
RUN echo $DISABLE_ESLINT_PLUGIN
# Install npm dependencies and build
RUN npm i
RUN npm run build

FROM node:alpine as main

# Copy sources and builded sources
WORKDIR /transcendence
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json
COPY --from=build /transcendence/public ./public
COPY --from=build /transcendence/build ./build
# Install only production
RUN npm install --omit=dev

# Install serve
RUN npm install -g serve

EXPOSE 3000
ENV PORT=3000
CMD [ "serve", "-s", "build", "-l", "3000" ]
