# AWS Account Setup for Seer

## Account Information

- **AWS Account ID**: `456783087661`
- **AWS Region**: `us-east-1` (default)
- **IAM User**: `terraform-access`

This is the same AWS account used for the SplitSafe project.

## Configuration Alignment

The Seer Terraform configuration has been aligned with the SplitSafe setup:

### SSM Parameter Store Paths

- **SplitSafe**: `/splitsafe/${environment}/*`
- **Seer**: `/seer/${environment}/*`

Both follow the pattern: `/project-name/${environment}/*`

### Resource Naming

All resources follow the pattern: `${environment}-seer-<resource-type>`

Examples:
- ECS Cluster: `production-seer-cluster`
- ECR Repositories: `production-seer-expressjs`, `production-seer-nextjs`
- IAM Roles: `production-seer-ecs-task-execution-role`, `production-seer-ecs-task-role`

### Tags

All resources are tagged with:
- `Name`: Resource name
- `Environment`: Environment (production, staging, etc.)
- `Project`: "Seer"

## AWS CLI Configuration

Verify your AWS credentials:

```bash
aws sts get-caller-identity
```

Expected output:
```json
{
    "UserId": "AIDAWUWTEZAW3D7QIYYB6",
    "Account": "456783087661",
    "Arn": "arn:aws:iam::456783087661:user/terraform-access"
}
```

## Required IAM Permissions

The `terraform-access` user needs permissions for:
- ECS (create clusters, services, task definitions)
- ECR (create repositories, push/pull images)
- VPC (create VPCs, subnets, security groups)
- IAM (create roles and policies)
- SSM Parameter Store (create/read parameters)
- CloudWatch (create log groups)
- Application Load Balancer (create ALB, target groups, listeners)
- EC2 (for VPC resources)

## Deployment

1. **Verify AWS Access**:
   ```bash
   aws sts get-caller-identity
   ```

2. **Configure Terraform Variables**:
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars
   ```

3. **Deploy**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

## Cost Considerations

Resources created:
- **ECS Fargate**: Pay per vCPU-hour and GB-hour
- **Application Load Balancer**: ~$20/month
- **NAT Gateway**: ~$32/month per gateway (2 gateways = ~$64/month)
- **ECR**: Storage costs (minimal)
- **CloudWatch Logs**: Based on ingestion and storage

Estimated monthly cost: ~$140-165/month (excluding data transfer)

## Shared Resources

Currently, Seer and SplitSafe use separate:
- VPCs
- ECS Clusters
- ECR Repositories
- Security Groups

They share:
- AWS Account
- IAM User
- Region (us-east-1)

## Troubleshooting

### Permission Errors

If you get permission errors, verify:
1. AWS credentials are configured correctly
2. IAM user has required permissions
3. Region is set to `us-east-1`

### Resource Conflicts

If resources already exist:
- Check if they're from a previous deployment
- Use `terraform import` to import existing resources
- Or destroy and recreate: `terraform destroy` (be careful!)

### SSM Parameter Access

To verify SSM parameters:
```bash
aws ssm get-parameter --name "/seer/production/openai_api_key" --with-decryption
```

## Next Steps

1. Deploy infrastructure: `terraform apply`
2. Build and push Docker images
3. Verify services are running
4. Set up monitoring and alerts
5. Configure custom domain (optional)

