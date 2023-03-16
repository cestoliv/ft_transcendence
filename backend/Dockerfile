FROM node:alpine as build

# Install dependencies
RUN apk add --no-cache python3 make g++ pkgconfig pixman pixman-dev cairo-dev pango-dev
# Copy streaks sources
WORKDIR /transcendence
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

# Install npm dependencies
RUN npm i

COPY src src

RUN npm run build

FROM node:alpine as main

# Install dependencies
RUN apk add --no-cache python3 make g++ pkgconfig pixman pixman-dev cairo-dev pango-dev
# Copy sources and builded sources
WORKDIR /transcendence
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

# Install only production
RUN npm install --omit=dev

COPY --from=build /transcendence/dist ./dist

EXPOSE 3000
ENV PORT=3000
CMD [ "npm", "run", "start:prod" ]
