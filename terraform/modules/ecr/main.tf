# ECR Repository for Express.js
resource "aws_ecr_repository" "expressjs" {
  name                 = "${var.environment}-seer-expressjs"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.environment}-seer-expressjs"
    Environment = var.environment
    Project     = "Seer"
    Service     = "expressjs"
  }
}

# ECR Repository for Next.js
resource "aws_ecr_repository" "nextjs" {
  name                 = "${var.environment}-seer-nextjs"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.environment}-seer-nextjs"
    Environment = var.environment
    Project     = "Seer"
    Service     = "nextjs"
  }
}

# Lifecycle policy for Express.js repository
resource "aws_ecr_lifecycle_policy" "expressjs" {
  repository = aws_ecr_repository.expressjs.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Lifecycle policy for Next.js repository
resource "aws_ecr_lifecycle_policy" "nextjs" {
  repository = aws_ecr_repository.nextjs.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

