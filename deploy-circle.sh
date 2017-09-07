#!/bin/bash
# Grab the necessary libs and then deploy from CircleCI
set -e

export PATH=$HOME:$PATH
curl -L "https://cli.run.pivotal.io/stable?release=linux64-binary&source=github&version=6.22.2" | tar -zx
wget "https://github.com/contraband/autopilot/releases/download/0.0.3/autopilot-linux"
chmod a+x autopilot-linux
mv cf $HOME
mv autopilot-linux $HOME
cf install-plugin -f ~/autopilot-linux
./deploy.sh $1

