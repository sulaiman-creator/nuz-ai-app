#!/bin/bash

# Deployment script for Nuz AI Backend to Google Cloud Run
# Project: cprnd-496814

echo "Starting deployment for Nuz AI..."

# Ensure we are using the correct project
gcloud config set project cprnd-496814

# Build and submit the Docker image to Google Container Registry (or Artifact Registry)
gcloud builds submit --tag gcr.io/cprnd-496814/nuz-ai-backend

# Deploy the image to Cloud Run
gcloud run deploy nuz-ai-backend \
  --image gcr.io/cprnd-496814/nuz-ai-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --project cprnd-496814

echo "Deployment complete! Your backend is now live."