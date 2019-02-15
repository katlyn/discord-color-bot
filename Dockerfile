FROM node:10-alpine

RUN apk add git

RUN mkdir /usr/web
WORKDIR /usr/web

COPY package.json /usr/web
COPY yarn.lock /usr/web

RUN yarn

COPY ./src /usr/web/src
COPY ./tsconfig.json /usr/web

RUN yarn build

CMD [node, dist/index.js]

