#!/bin/bash
PROJECT_ID="triple-kingdom-417021"
SERVICE_NAME="scamguard-my-adk"
REGION="asia-southeast1"

gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com aiplatform.googleapis.com logging.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
gcloud artifacts repositories create adk-repo --repository-format=docker --location=$REGION --description="Docker repository for ScamGuard ADK Agent" || true
gcloud run deploy $SERVICE_NAME --source . --region $REGION --allow-unauthenticated --set-env-vars PROJECT_ID=$PROJECT_ID,LOCATION=$REGION
echo "--- DEPLOYMENT COMPLETE ---"
