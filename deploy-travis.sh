#!/bin/bash

# DEPLOY_ENV must be set to "dev", "staging", or "prod"

# CF_DEV_USER, CF_STAGING_USER, CF_PROD_USER, and the associated
# CF_DEV_PASSWORD, CF_STAGING_PASSWORD, and CF_PROD_PASSWORD
# are defined as private Environment Variables
# in the Travis web UI: https://travis-ci.org/18F/checklistomania/settings

set -e

if [[ "$DEPLOY_ENV" = "dev" ]]; then
  DEPLOY_USER="$CF_DEV_USER"
  DEPLOY_PASS="$CF_DEV_PASSWORD"
elif [[ "$DEPLOY_ENV" = "staging" ]]; then
  DEPLOY_USER="$CF_STAGING_USER"
  DEPLOY_PASS="$CF_STAGING_PASSWORD"
elif [[ "$DEPLOY_ENV" = "prod" ]]; then
  DEPLOY_USER="$CF_PROD_USER"
  DEPLOY_PASS="$CF_PROD_PASSWORD"
else
  echo "Unrecognized or missing DEPLOY_ENV. Exiting."
  exit 1
fi

API="https://api.fr.cloud.gov"
ORG="gsa-18f-checklistomania"

SPACE="$DEPLOY_ENV"
APP_NAME="checklistomania"
MANIFEST="manifests/manifest_$DEPLOY_ENV.yml"

echo "Deploying to $DEPLOY_ENV space."

cf login -a $API -u $DEPLOY_USER -p $DEPLOY_PASS -o $ORG -s $SPACE

cf zero-downtime-push $APP_NAME -f $MANIFEST
