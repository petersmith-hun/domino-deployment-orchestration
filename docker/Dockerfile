FROM debian:latest

RUN    apt-get update \
    && apt-get install -y curl \
    && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y build-essential \
    && apt-get install -y nodejs \
    && apt-get install -y openjdk-11-jre \
    && apt-get install -y htop \
    && apt-get install -y nano \
    && npm install pm2 -g \
    && echo "Installed Node.js version is `node -v`" \
    && echo "Installed npm version is `npm -v`" \
    && echo "Installed JRE version is `java -version`"

RUN    mkdir -p /opt/domino/src/config \
    && mkdir -p /opt/domino/config \
    && mkdir -p /opt/domino/storage \
    && mkdir -p /opt/domino/logs \
    && mkdir -p /opt/apps/logs

ADD src /opt/domino/src/
ADD docker/config /opt/domino/config/
ADD package.json /opt/domino
ADD package-lock.json /opt/domino

# Docker container fix for DI config
RUN mv /opt/domino/config/di_config.json /opt/domino/src/config/di_config.json

RUN    addgroup --system --gid 990 leaflet \
    && adduser --system --no-create-home --gid 990 --uid 990 leaflet \
    && useradd --system domino \
    && chown -R leaflet:leaflet /opt/apps \
    && chown -R domino:domino /opt/domino \
    && chmod -R 755 /opt/apps \
    && chmod -R 755 /opt/domino

EXPOSE      9987
EXPOSE      7099
WORKDIR     /opt/domino
ENTRYPOINT  npm install && pm2-runtime start src/ecosystem.config.js