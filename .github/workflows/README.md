# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Workflows

### 1. CI (`ci.yml`)
**Triggers:** Push/PR to `main` or `develop`

Runs tests and builds for all components:
- ✅ Express.js backend tests
- ✅ Next.js frontend lint & build
- ✅ Smart contract compilation & tests
- ✅ Docker image builds (validation)

### 2. Terraform Validation (`terraform.yml`)
**Triggers:** Changes to `terraform/**` directory

Validates Terraform configurations:
- ✅ Format checking
- ✅ Syntax validation
- ✅ Plan generation (on PRs)

### 3. Docker Build & Push (`docker-build.yml`)
**Triggers:** Push to `main` (when Express.js/Next.js changes) or manual

Builds and pushes Docker images to AWS ECR:
- ✅ Express.js image
- ✅ Next.js image
- ✅ Tagged with `latest` and commit SHA

**Required Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### 4. Deploy Free Tier (`deploy-free-tier.yml`)
**Triggers:** Manual workflow dispatch

Deploys to AWS EC2 free tier:
- ✅ Terraform plan/apply/destroy
- ✅ Environment selection (dev/staging)
- ✅ Automated deployment

**Required Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `OPENAI_API_KEY`
- `CONTRACT_ADDRESS`
- `EC2_KEY_NAME` (EC2 Key Pair name)

## Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Add the following secrets:

### For Docker Build:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### For Free Tier Deployment:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `OPENAI_API_KEY`
- `CONTRACT_ADDRESS`
- `EC2_KEY_NAME`

### Optional (for tests):
- `OPENAI_API_KEY` (for running tests that require it)

## Usage

### Automatic CI
Workflows run automatically on push/PR. Check the **Actions** tab to see results.

### Manual Deployment
1. Go to **Actions** tab
2. Select **Deploy to Free Tier EC2**
3. Click **Run workflow**
4. Choose:
   - Environment: `dev` or `staging`
   - Action: `plan`, `apply`, or `destroy`
5. Click **Run workflow**

## Workflow Status Badges

Add to your README.md:

```markdown
![CI](https://github.com/your-username/seer/workflows/CI/badge.svg)
![Terraform](https://github.com/your-username/seer/workflows/Terraform%20Validation/badge.svg)
```

## Troubleshooting

### Workflow Fails
- Check the **Actions** tab for error logs
- Verify all required secrets are set
- Ensure AWS credentials have proper permissions

### Terraform Fails
- Check AWS credentials
- Verify Terraform state backend (if configured)
- Review Terraform plan output

### Docker Build Fails
- Verify ECR repositories exist
- Check AWS credentials have ECR permissions
- Review Dockerfile syntax

