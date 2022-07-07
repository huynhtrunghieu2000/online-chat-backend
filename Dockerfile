FROM ubuntu
# WORKDIR /Users/hieuhuynht./SupremeTech/Self-learn Project/video-conference-backend
RUN apt-get update && \
  apt-get install -y build-essential pip net-tools iputils-ping iproute2 curl

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs
RUN npm install -g watchify

EXPOSE 3333
EXPOSE 2000-2020
EXPOSE 40000-40100

COPY package.json package.json
RUN npm install

COPY . .
RUN CMD ["npm","start"]
# stage 1 building the code
# FROM node as builder
# WORKDIR /usr/src/video-conference
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm start

# # stage 2
# FROM node
# WORKDIR /usr/src/video-conference
# COPY package*.json ./
# RUN npm install --production

# # COPY --from=builder /usr/app/dist ./dist

# # COPY ormconfig.docker.json ./ormconfig.json
# # COPY .env .

# EXPOSE 3333
# CMD node dist/src/index.js