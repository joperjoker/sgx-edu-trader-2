# =============================================================================
# SGX Edu-Trader 2.0/3.0 — 1-Click Google Cloud Run + Firebase Hosting Deploy
# Usage: .\scripts\deploy-google-cloud.ps1 -ProjectId "your-gcp-project-id"
# =============================================================================
param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "sgx-edu-trader-sg",
    [Parameter(Mandatory=$false)]
    [string]$Region = "asia-southeast1",
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "sgx-edu-trader"
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " SGX Edu-Trader — Google Cloud Run & Firebase Hosting Deployer" -ForegroundColor Cyan
Write-Host " Target Project: $ProjectId | Region: $Region (Singapore)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

Write-Host "`n[1/5] Running Pre-Deploy TypeScript & Lint Checks..." -ForegroundColor Yellow
npm run typecheck
npm run lint

Write-Host "`n[2/5] Setting Active Google Cloud Project ($ProjectId)..." -ForegroundColor Yellow
gcloud config set project $ProjectId

Write-Host "`n[3/5] Enabling Required Google Cloud APIs (Cloud Run, Firestore, Cloud Build, Artifact Registry)..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com firestore.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

Write-Host "`n[4/5] Building & Deploying Container to Google Cloud Run ($Region)..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
  --source . `
  --region $Region `
  --platform managed `
  --allow-unauthenticated `
  --memory 1Gi

Write-Host "`n[5/5] Deploying Firestore Security Rules, Indexes & Firebase Hosting..." -ForegroundColor Yellow
npx firebase-tools deploy --only firestore,hosting --project $ProjectId

Write-Host "`n✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "Your live Google Sites Embed URL is ready at: https://$ProjectId.web.app" -ForegroundColor Green
