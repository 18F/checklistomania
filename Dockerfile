FROM node:6

RUN npm install -g bower --silent

# Based on guidance at http://jdlm.info/articles/2016/03/06/lessons-building-node-app-docker.html
RUN useradd --user-group --create-home app

ENV HOME=/home/app

COPY package.json bower.json $HOME/checklistomania/
RUN chown -R app:app $HOME/*

USER app
WORKDIR $HOME/checklistomania
