# Quick Start Guide

## Prerequisites Checklist

- [ ] AWS account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Terraform >= 1.0 installed
- [ ] Docker installed
- [ ] Deployed smart contract address on BNB Chain

## 5-Minute Deployment

### Step 1: Configure Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Create Infrastructure

```bash
terraform plan   # Review what will be created
terraform apply  # Type 'yes' to confirm
```

This creates:
- ECR repositories (you'll need these URLs for pushing images)
- VPC, subnets, security groups
- ECS cluster
- Load balancer

### Step 4: Build and Push Images

After `terraform apply`, get your ECR repository URLs:

```bash
terraform output expressjs_repository_url
terraform output nextjs_repository_url
```

Then build and push:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# Build and push Express.js
cd ../expressjs
docker build -t expressjs:latest .
docker tag expressjs:latest <EXPRESSJS_REPO_URL>:latest
docker push <EXPRESSJS_REPO_URL>:latest

# Build and push Next.js
cd ../nextjs
docker build -t nextjs:latest .
docker tag nextjs:latest <NEXTJS_REPO_URL>:latest
docker push <NEXTJS_REPO_URL>:latest
```

Or use the provided script:

```bash
cd terraform
./scripts/build-and-push-images.sh production us-east-1
```

### Step 5: Access Your Application

```bash
terraform output alb_dns_name
```

Visit `http://<alb_dns_name>` in your browser!

## Common Issues

**Images not found**: Make sure you've pushed images to ECR before ECS tries to start tasks.

**Services not starting**: Check CloudWatch logs:
```bash
aws logs tail /ecs/production-seer-expressjs --follow
```

**Cannot access**: Check security groups allow HTTP traffic from your IP.

## Next Steps

- Set up HTTPS with ACM certificate
- Configure custom domain
- Set up monitoring alerts
- Scale services as needed

See `README.md` for detailed documentation.

