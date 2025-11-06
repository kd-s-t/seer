# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-seer-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = var.environment
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "expressjs" {
  name              = "/ecs/${var.environment}-seer-expressjs"
  retention_in_days = 7

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "nextjs" {
  name              = "/ecs/${var.environment}-seer-nextjs"
  retention_in_days = 7

  tags = {
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-seer-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Environment = var.environment
  }
}

# Target Group for Express.js
resource "aws_lb_target_group" "expressjs" {
  name        = "${var.environment}-seer-expressjs-tg"
  port        = 3016
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  tags = {
    Environment = var.environment
    Service     = "expressjs"
  }
}

# Target Group for Next.js
resource "aws_lb_target_group" "nextjs" {
  name        = "${var.environment}-seer-nextjs-tg"
  port        = 3015
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200"
  }

  tags = {
    Environment = var.environment
    Service     = "nextjs"
  }
}

# ALB Listener for HTTP
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ALB Listener for HTTPS (if certificate is provided)
resource "aws_lb_listener" "https" {
  count             = var.certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn  = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nextjs.arn
  }
}

# ALB Listener Rule for API routes (Express.js)
resource "aws_lb_listener_rule" "api" {
  count        = var.certificate_arn != "" ? 1 : 0
  listener_arn = aws_lb_listener.https[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.expressjs.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# ALB Listener Rule for API routes (HTTP fallback)
resource "aws_lb_listener_rule" "api_http" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.expressjs.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# ECS Task Definition for Express.js
resource "aws_ecs_task_definition" "expressjs" {
  family                   = "${var.environment}-seer-expressjs"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.expressjs_cpu
  memory                   = var.expressjs_memory
  execution_role_arn       = var.task_execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name  = "expressjs"
      image = "${var.expressjs_repository_url}:latest"

      portMappings = [
        {
          containerPort = 3016
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = "3016"
        },
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "NETWORK"
          value = var.network
        },
        {
          name  = "BNB_TESTNET_RPC"
          value = var.bnb_testnet_rpc
        },
        {
          name  = "BNB_MAINNET_RPC"
          value = var.bnb_mainnet_rpc
        },
        {
          name  = "CONTRACT_ADDRESS"
          value = var.contract_address
        }
      ]

      secrets = [
        {
          name      = "OPENAI_API_KEY"
          valueFrom = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/seer/${var.environment}/openai_api_key"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.expressjs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Environment = var.environment
    Service     = "expressjs"
  }
}

# ECS Task Definition for Next.js
resource "aws_ecs_task_definition" "nextjs" {
  family                   = "${var.environment}-seer-nextjs"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.nextjs_cpu
  memory                   = var.nextjs_memory
  execution_role_arn       = var.task_execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name  = "nextjs"
      image = "${var.nextjs_repository_url}:latest"

      portMappings = [
        {
          containerPort = 3015
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = "3015"
        },
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "NEXT_PUBLIC_API_URL"
          value = var.certificate_arn != "" ? "https://${var.domain_name}/api" : "http://${aws_lb.main.dns_name}/api"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.nextjs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Environment = var.environment
    Service     = "nextjs"
  }
}

# ECS Service for Express.js
resource "aws_ecs_service" "expressjs" {
  name            = "${var.environment}-seer-expressjs"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.expressjs.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.expressjs.arn
    container_name   = "expressjs"
    container_port   = 3016
  }

  depends_on = [
    aws_lb_listener.http,
    aws_lb_target_group.expressjs
  ]

  tags = {
    Environment = var.environment
    Service     = "expressjs"
  }
}

# ECS Service for Next.js
resource "aws_ecs_service" "nextjs" {
  name            = "${var.environment}-seer-nextjs"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.nextjs.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.nextjs.arn
    container_name   = "nextjs"
    container_port   = 3015
  }

  depends_on = [
    aws_lb_listener.http,
    aws_lb_target_group.nextjs
  ]

  tags = {
    Environment = var.environment
    Service     = "nextjs"
  }
}

# Data source for account ID
data "aws_caller_identity" "current" {}

# SSM Parameter for OpenAI API Key
resource "aws_ssm_parameter" "openai_api_key" {
  name        = "/seer/${var.environment}/openai_api_key"
  description = "OpenAI API key for Seer"
  type        = "SecureString"
  value       = var.openai_api_key

  tags = {
    Environment = var.environment
    Project     = "Seer"
  }
}

