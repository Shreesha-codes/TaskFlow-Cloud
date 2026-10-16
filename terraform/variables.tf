variable "aws_region" {
  description = "The AWS region to deploy the infrastructure to"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "production"
}

variable "cluster_name" {
  description = "Name of the AWS EKS Cluster"
  type        = string
  default     = "taskboard-eks"
}

variable "vpc_cidr" {
  description = "CIDR block for the AWS VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets hosting EKS worker nodes"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS managed node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  description = "Desired number of worker nodes in EKS managed node group"
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum number of worker nodes in EKS managed node group"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker nodes in EKS managed node group"
  type        = number
  default     = 4
}

variable "availability_zones" {
  description = "List of availability zones in the region"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
}
