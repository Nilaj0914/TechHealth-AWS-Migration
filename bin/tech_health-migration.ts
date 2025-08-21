#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpcCdkStack } from '../lib/vpc-stack';

const app = new cdk.App();
const vpcStack = new VpcCdkStack(app, 'VpcCdkStack', {
  
});