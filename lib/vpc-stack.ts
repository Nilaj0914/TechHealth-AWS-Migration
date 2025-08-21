import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class VpcCdkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Defining a VPC with 2AZs, 0 NAT Gateways and 2 subnets (1 public and 1 private isolated subnet)

    this.vpc = new ec2.Vpc(this,'TechHealthVpc',{
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
      {
        name: 'Public',
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 24,

      },
    {
      name: 'Database',
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      cidrMask: 24
    },
   ]});
  }
}
