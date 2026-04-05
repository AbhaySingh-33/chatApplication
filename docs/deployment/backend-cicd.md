# Backend CI/CD (Railway + Docker Hub)

This project now includes an automated backend deployment pipeline:

- Runs backend CI checks on pull requests to main
- Builds and pushes backend Docker image on pushes to main
- Deploys backend to Railway after a successful image push

## Folder Structure

```text
.github/
  workflows/
    backend-railway-cicd.yml
backend/
  Dockerfile
docs/
  deployment/
    backend-cicd.md
```

## Workflow Trigger Rules

The workflow runs for backend-related changes only:

- `backend/**`
- `.github/workflows/backend-railway-cicd.yml`

## Required GitHub Repository Secrets

Add these in: GitHub Repository -> Settings -> Secrets and variables -> Actions.

### Docker Hub

- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

### Railway

- `RAILWAY_TOKEN`: Railway project token
- `RAILWAY_SERVICE`: Railway service name or service ID for backend
- `RAILWAY_ENVIRONMENT` (optional): Railway environment name (defaults to `production`)

## What Happens in CI/CD

1. `backend-ci`
- Installs backend dependencies
- Runs lint if available
- Runs tests if available
- Builds backend Docker image locally for validation

2. `build-and-push-image` (main branch pushes only)
- Builds and pushes image to Docker Hub
- Pushes these tags:
  - `latest`
  - `sha-<commit-sha>`
  - `03`

3. `deploy-backend-railway` (main branch pushes only)
- Uses Railway CLI with `RAILWAY_TOKEN`
- Deploys backend from `backend/` directory to your Railway service

## First-Time Setup Steps

1. Commit and push workflow files.
2. Add all required GitHub Actions secrets.
3. Push a small backend change to `main`.
4. Verify workflow runs in GitHub Actions.
5. Confirm new deployment in Railway dashboard logs.

## Notes

- Railway environment variables for runtime (`MONGODB_URI`, `JWT_SECRET`, `REDIS_URL`, etc.) should be configured in Railway service settings.
- The pipeline is backend-scoped and will not run for frontend-only changes.
