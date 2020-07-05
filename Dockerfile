FROM node:12.18.2-stretch-slim

COPY . /opt/app
WORKDIR /opt/app

EXPOSE 8080

RUN npm install
RUN npm run build

CMD ["node", "/opt/app/dist/src/index.js"]