FROM node:12.18.2-stretch-slim

RUN apt-get update -y \
    && apt-get upgrade -y \
    && apt-get install -y mysql-client

COPY . /opt/app
WORKDIR /opt/app

EXPOSE 8080

RUN npm install
RUN npm run build

RUN ls /opt/app

RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh", "${MYSQL_ROOT_PASSWORD}"]