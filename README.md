# TechHealth AWS Migration
Note: This is a fictional case study for educational and portfolio purposes

## Scenario
You are a Cloud Engineer Consultant working with TechHealth Inc., a healthcare technology company that built their AWS infrastructure manually through the AWS Console 5 years ago. They have a patient portal web application that needs to be modernized and migrated to Infrastructure as Code.

This project uses the AWS Cloud Development Kit (CDK) to define and deploy the necessary cloud infrastructure for the TechHealth's Web application. The infrastructure is designed to be scalable, secure, and highly available, following AWS best practices.

It sets up a custom Virtual Private Cloud (VPC), deploys a fleet of EC2 instances behind an Application Load Balancer to serve the web application, and provisions a secure, multi-AZ RDS MySQL database for data persistence.

## Table of Contents
- [Project Intention](#project-intention)
- [Architecture Overview](#architecture-overview)
- [Key Features](#key-features)
  - [Custom VPC](#custom-vpc)
  - [High-Availability Web Tier](#high-availability-web-tier)
  - [Secure Database Tier](#secure-database-tier)
  - [Security](#security)
- [Prerequisites](#prerequisites)
- [Setup and Installation](#setup-and-installation)
- [Deployment](#deployment)
- [Useful CDK Commands](#useful-cdk-commands)

## Project Intention

The primary goal of this project is to automate the provisioning of a robust and scalable infrastructure on AWS for the TechHealth application all while ensuring that the application is secure from the ground up, preventing any unauthorised access and especially locking down the patient data present on the RDS Database. By using Infrastructure as Code (IaC) with the AWS CDK, we can ensure consistent, repeatable, and version-controlled deployments.

## Architecture Diagram
![Architecture Diagram](images/image1.png)

## Infrastructure Composition
The infrastructure is composed of three main stacks managed by the AWS CDK stack:

1.  **VPC Stack ([vpc-stack.ts](lib/vpc-stack.ts)):** Creates a foundational network environment with public and isolated subnets across two Availability Zones.
2.  **EC2 Stack ([ec2stack.ts](lib/ec2stack.ts)):** Provisions two EC2 instances in the public subnets to act as web servers. These instances are placed behind an Application Load Balancer (ALB) for traffic distribution and high availability.
3.  **RDS Stack ([rds-stack.ts](lib/rds-stack.ts)):** Deploys a MySQL RDS instance within the isolated subnets to ensure the database is not publicly accessible.

These stacks are interdependent: the EC2 and RDS stacks are deployed within the VPC created by the VPC stack, and security groups are configured to allow only the necessary communication between them.

## Key Features

### Custom VPC
-   **Multi-AZ:** The VPC spans two Availability Zones for high availability and fault tolerance.
-   **Subnet Segregation:**
    -   **Public Subnets:** For internet-facing resources like the Application Load Balancer and EC2 instances.
    -   **Private Isolated Subnets:** For backend resources like the RDS database, ensuring they are not directly accessible from the internet.
-   **Cost-Effective:** Configured with `natGateways: 0` to minimize costs, suitable for applications where instances in private subnets do not require outbound internet access.

### High-Availability Web Tier
-   **Application Load Balancer (ALB):** Distributes incoming HTTP traffic across the EC2 instances, improving scalability and reliability.
-   **Auto-Scaling Ready:** The setup with an ALB and multiple instances is ready to be integrated with an Auto Scaling group to automatically adjust capacity based on traffic.
-   **Automated Web Server Setup:** Each EC2 instance is provisioned with user data to automatically install and start an Apache web server (`httpd`). It also installs a MySQL client for database connectivity testing.

### Secure Database Tier
-   **RDS MySQL Instance:** A managed relational database instance running MySQL.
-   **Multi-AZ Deployment:** The database is configured with `multiAz: true`, which creates a standby replica in a different Availability Zone for high availability and automatic failover.
-   **Secure Credentials Management:** Database credentials are automatically generated and stored securely in AWS Secrets Manager.
-   **Network Isolation:** The RDS instance is placed in isolated subnets, accessible only from the EC2 instances via a specific security group rule.

### Security
-   **Security Groups:** Finely-tuned security groups restrict traffic between the different tiers:
    -   The ALB security group allows inbound HTTP traffic from anywhere (`0.0.0.0/0`).
    -   The Web Server security group allows inbound HTTP traffic only from the ALB and SSH traffic from a specified IP address for administrative access.

    ![ALB and EC2 Security groups](images/image2.png)
    -   The Database security group allows inbound MySQL traffic (port 3306) only from the Web Server security group.

    ![RDS Security groups](images/image3.png)
-   **SSH Access Control:** SSH access to the EC2 instances is restricted to a specific IP address provided during deployment (IP address of the device deploying the CDK code is attached using context).

## Prerequisites

Before you begin, ensure you have the following installed and configured:
-   **AWS Account and Credentials:** An AWS account and configured credentials (e.g., via `aws configure`).
-   **Node.js and npm:** Node.js (version 18.x or later) and npm.
-   **AWS CDK Toolkit:** `npm install -g aws-cdk`
-   **TypeScript:** `npm install -g typescript`

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/nilaj0914/techhealth-aws-migration.git](https://github.com/nilaj0914/techhealth-aws-migration.git)
    cd techhealth-aws-migration
    ```

2.  **Install project dependencies:**
    ```bash
    npm install
    ```

3.  **Bootstrap your AWS environment (if you haven't already):**
    This command provisions the initial resources needed by the CDK to deploy stacks.
    ```bash
    cdk bootstrap
    ```

## Deployment

To deploy the infrastructure, you need to provide your current public IP address as context for the CDK. This is used to create a security group rule that allows you to SSH into the EC2 instances.

Run the following command to deploy all the stacks:

```bash
cdk deploy --all --context myIP=$(curl ifconfig.me)
```

The `--all` flag deploys all stacks defined in the application. The deployment order will be automatically determined by the CDK based on stack dependencies (VPC -> EC2 -> RDS).

After a successful deployment, the CDK will output the DNS name of the Application Load Balancer and the ARN of the RDS secret.

Additionally, when you SSH into one of the EC2 instances, you can also run the following command to test out connection between EC2 instances and the RDS instance (running mysql) using the pre-installed MySQL client.

```bash
mysql -h Your-RDS-Endpoint -u Your-Username -p
```
You will be prompted to enter the password, which can be obtained from AWS Secrets Manager.
## Useful CDK Commands

-   `npm run build`: Compile typescript to javascript.
-   `npm run watch`: Watch for changes and compile.
-   `npm run test`: Perform the jest unit tests.
-   `cdk deploy`: Deploy this stack to your default AWS account/region.
-   `cdk diff`: Compare the deployed stack with the current state.
-   `cdk synth`: Emits the synthesized CloudFormation template.
-   `cdk destroy`: Destroys the deployed stacks.
