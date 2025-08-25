#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcCdkStack } from '../lib/vpc-stack';
import { Ec2stack } from '../lib/ec2stack';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { RDSStack } from '../lib/rds-stack';

const app = new cdk.App();
const vpcStack = new VpcCdkStack(app, 'VpcCdkStack', {
  
});

const ec2stack = new Ec2stack(app, "Ec2Stack",{
    vpc: vpcStack.vpc
})

const rdsstack = new RDSStack(app, "RDSStack",{
    vpc: vpcStack.vpc,
    WebServerSG: ec2stack.WebServerSG})