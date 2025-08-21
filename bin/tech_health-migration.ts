#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcCdkStack } from '../lib/vpc-stack';
import { Ec2stack } from '../lib/ec2stack';

const app = new cdk.App();
const vpcStack = new VpcCdkStack(app, 'VpcCdkStack', {
  
});

new Ec2stack(app, "Ec2Stack",{
    vpc: vpcStack.vpc
})