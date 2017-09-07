#!/bin/bash
# The first argument must be set to "dev", "staging", or "prod"
set -e

API="https://api.fr.cloud.gov"
ORG="gsa-18f-checklistomania"
SPACE=$1

MANIFEST="manifests/manifest_$SPACE.yml"
if [ ! -f $MANIFEST ]; then
  echo "Unknown space: $SPACE"
  exit
fi

if [ -n "$CF_USERNAME" ] && [ -n "$CF_PASSWORD" ]; then
  cf login -a $API -u $CF_USERNAME -p $CF_PASSWORD
fi
cf target -o $ORG -s $SPACE

cf zero-downtime-push checklistomania -f $MANIFEST
