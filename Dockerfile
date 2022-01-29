FROM node:16.13.2-alpine as base

WORKDIR /app
COPY package.json /app/
COPY package-lock.json /app/

RUN npm i
COPY . .

ENV PORT 4000
EXPOSE $PORT

FROM base as production
ENV NODE_PATH=./build
RUN npm run build