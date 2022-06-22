FROM node:18-alpine

ARG CFSSL_VERSION='1.6.1'
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=1

ADD . /app

RUN cd /app \
  && npm install --production \
  && apk add --no-cache  curl chromium ca-certificates \
  && curl -Ls "https://github.com/cloudflare/cfssl/releases/download/v${CFSSL_VERSION}/cfssl_${CFSSL_VERSION}_linux_amd64" -o /usr/bin/cfssl \
  && curl -Ls "https://github.com/cloudflare/cfssl/releases/download/v${CFSSL_VERSION}/cfssljson_${CFSSL_VERSION}_linux_amd64" -o /usr/bin/cfssljson \
  && chmod +x /usr/bin/cfssl \
  && chmod +x /usr/bin/cfssljson
